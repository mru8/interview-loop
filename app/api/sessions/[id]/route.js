import { Pool } from 'pg';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request, { params }) {
  const { id } = await params;

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let userId;
  try {
    const token = authHeader.replace('Bearer ', '');
    userId = jwt.verify(token, process.env.JWT_SECRET).userId;
  } catch (e) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const sessionId = parseInt(id, 10);
  if (Number.isNaN(sessionId)) {
    return NextResponse.json({ error: 'Bad session id' }, { status: 400 });
  }

  try {
    // user_id check makes sure you can only open your own sessions
    const sessionRes = await pool.query(
      `SELECT id, interview_type, status, started_at, ended_at
       FROM sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );
    if (sessionRes.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const transcriptRes = await pool.query(
      `SELECT role, message FROM transcripts WHERE session_id = $1 ORDER BY id ASC`,
      [sessionId]
    );

    const feedbackRes = await pool.query(
      `SELECT summary, strengths, weaknesses, score
       FROM feedback WHERE session_id = $1 ORDER BY id DESC LIMIT 1`,
      [sessionId]
    );

    return NextResponse.json({
      session: sessionRes.rows[0],
      transcript: transcriptRes.rows,
      feedback: feedbackRes.rows[0] || null,
    });
  } catch (err) {
    console.error('Get session error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}