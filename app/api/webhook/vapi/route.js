import { Pool } from 'pg';
import { NextResponse, after } from 'next/server';

export const maxDuration = 60;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

// tries the first model, then falls back to the others if Google is busy
const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini(prompt) {
  let last = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const model = GEMINI_MODELS[attempt % GEMINI_MODELS.length];
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
          // don't let one slow attempt eat the whole function time
          signal: AbortSignal.timeout(15000),
        }
      );
      const data = await res.json();
      if (res.ok) return { ok: true, data };

      last = data;
      console.error(`Gemini ${model} attempt ${attempt + 1} failed:`, data?.error?.message);
      // only retry on "model gone" or "busy" type errors
      if (![404, 429, 500, 503].includes(res.status)) break;
    } catch (e) {
      last = { error: { message: e.message } };
      console.error(`Gemini ${model} attempt ${attempt + 1} threw:`, e.message);
    }
    await sleep(1000 * (attempt + 1));
  }
  return { ok: false, data: last };
}

async function generateFeedback(sessionId, conversation) {
  try {
    const feedbackPrompt = `You are reviewing a behavioral job interview transcript. Based on the conversation below, provide structured feedback.

Return ONLY valid JSON, no markdown, no code fences, in this exact shape:
{
  "summary": "2-3 sentence overall summary of how the candidate performed",
  "strengths": "1-2 sentences on what the candidate did well",
  "weaknesses": "1-2 sentences on what the candidate could improve",
  "score": <integer 1-10, overall interview performance>
}

Transcript:
${conversation}`;

    const { ok, data: geminiData } = await callGemini(feedbackPrompt);

    if (!ok) {
      console.error('Gemini feedback generation failed after retries:', geminiData);
      return;
    }

    let raw = geminiData.candidates[0].content.parts[0].text.trim();
    raw = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const feedback = JSON.parse(raw);

    await pool.query(
      `INSERT INTO feedback (session_id, summary, strengths, weaknesses, score)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, feedback.summary, feedback.strengths, feedback.weaknesses, feedback.score]
    );
  } catch (err) {
    console.error('FEEDBACK GENERATION ERROR:', err.message, err.stack);
  }
}

export async function POST(request) {
  // only Vapi knows this secret, so random requests get rejected here
  const secret = request.headers.get('x-vapi-secret');
  if (!process.env.WEBHOOK_SECRET || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const message = body.message;

    if (!message) {
      return NextResponse.json({ received: true });
    }

    const sessionId = parseInt(new URL(request.url).searchParams.get('sessionId'), 10);

    if (message.type === 'end-of-call-report' && !Number.isNaN(sessionId)) {
      // only the first end-of-call report for a session gets processed
      const updated = await pool.query(
        `UPDATE sessions SET status = 'completed', ended_at = NOW()
         WHERE id = $1 AND status IS DISTINCT FROM 'completed'
         RETURNING id`,
        [sessionId]
      );
      if (updated.rowCount === 0) {
        return NextResponse.json({ received: true });
      }

      const turns = (message.artifact?.messages || []).filter(
        (m) => (m.role === 'bot' || m.role === 'user') && m.message
      );

      // save the whole transcript in one query instead of one per line
      if (turns.length > 0) {
        await pool.query(
          `INSERT INTO transcripts (session_id, role, message)
           SELECT $1, t.role, t.message
           FROM unnest($2::text[], $3::text[]) AS t(role, message)`,
          [
            sessionId,
            turns.map((m) => (m.role === 'bot' ? 'ai' : 'candidate')),
            turns.map((m) => m.message),
          ]
        );
      }

      const conversation = turns
        .map((m) => `${m.role === 'bot' ? 'Interviewer' : 'Candidate'}: ${m.message}`)
        .join('\n');
      const candidateSpoke = turns.some((m) => m.role === 'user');

      if (!candidateSpoke) {
        console.error('No candidate answers in session', sessionId, '- skipping feedback');
      } else {
        // reply to Vapi right away, build the report after the response is sent
        after(() => generateFeedback(sessionId, conversation));
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ received: true });
  }
}