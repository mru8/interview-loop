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

    // sessionId is passed via serverUrlSecret when we created the assistant
    const sessionId = request.headers.get('x-vapi-secret');

    // we only care about transcript messages (final, not partial)
    if (message.type === 'transcript' && message.transcriptType === 'final') {
      const role = message.role === 'assistant' ? 'ai' : 'candidate';
      const text = message.transcript;

      if (sessionId && text) {
        await pool.query(
          `INSERT INTO transcripts (session_id, role, message) VALUES ($1, $2, $3)`,
          [sessionId, role, text]
        );
      }
    }

    // when call ends, mark session as completed
    if (message.type === 'end-of-call-report') {
      if (sessionId) {
        await pool.query(
          `UPDATE sessions SET status = 'completed', ended_at = NOW() WHERE id = $1`,
          [sessionId]
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ received: true }); // always 200 so Vapi doesn't retry endlessly
  }
}