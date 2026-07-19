import { Pool } from 'pg';
import { NextResponse } from 'next/server';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body.message;

    if (!message) {
      return NextResponse.json({ received: true });
    }

    const sessionId = request.headers.get('x-vapi-secret');

    if (message.type === 'end-of-call-report') {
      if (sessionId) {
        await pool.query(
          `UPDATE sessions SET status = 'completed', ended_at = NOW() WHERE id = $1`,
          [sessionId]
        );

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

            const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: feedbackPrompt }],
                temperature: 0.4,
              }),
            });

            const openaiData = await openaiRes.json();

            if (openaiRes.ok) {
              let raw = openaiData.choices[0].message.content.trim();
              raw = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
              const feedback = JSON.parse(raw);

              await pool.query(
                `INSERT INTO feedback (session_id, summary, strengths, weaknesses, score)
                 VALUES ($1, $2, $3, $4, $5)`,
                [sessionId, feedback.summary, feedback.strengths, feedback.weaknesses, feedback.score]
              );
            } else {
              console.error('OpenAI feedback generation failed:', openaiData);
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