import { Pool } from 'pg';
import { NextResponse } from 'next/server';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// tries the first model, then falls back to the others if Google is busy
const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini(prompt) {
  let last = null;
  for (let attempt = 0; attempt < 5; attempt++) {
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

    if (message.type === 'end-of-call-report') {
      if (!Number.isNaN(sessionId)) {
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

        // pull full conversation from the artifact, skip the system prompt
        const fullMessages = message.artifact?.messages || [];
        const conversation = fullMessages
          .filter((m) => m.role === 'bot' || m.role === 'user')
          .map((m) => `${m.role === 'bot' ? 'Interviewer' : 'Candidate'}: ${m.message}`)
          .join('\n');

        // also save each turn into transcripts table for record-keeping
        for (const m of fullMessages) {
          if (m.role === 'bot' || m.role === 'user') {
            const role = m.role === 'bot' ? 'ai' : 'candidate';
            await pool.query(
              `INSERT INTO transcripts (session_id, role, message) VALUES ($1, $2, $3)`,
              [sessionId, role, m.message]
            );
          }
        }

        if (conversation.trim().length > 0) {
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

            if (ok) {
              let raw = geminiData.candidates[0].content.parts[0].text.trim();
              raw = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
              const feedback = JSON.parse(raw);

              await pool.query(
                `INSERT INTO feedback (session_id, summary, strengths, weaknesses, score)
                 VALUES ($1, $2, $3, $4, $5)`,
                [sessionId, feedback.summary, feedback.strengths, feedback.weaknesses, feedback.score]
              );
            } else {
              console.error('Gemini feedback generation failed after retries:', geminiData);
            }
          } catch (feedbackErr) {
            console.error('FEEDBACK GENERATION ERROR:', feedbackErr.message, feedbackErr.stack);
          }
        } else {
          console.error('CONVERSATION EMPTY, artifact messages:', JSON.stringify(fullMessages));
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ received: true });
  }
}