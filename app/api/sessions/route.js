import { Pool } from 'pg';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request) {
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

  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.interview_type, s.status, s.started_at, s.ended_at,
              (SELECT score FROM feedback WHERE session_id = s.id ORDER BY id DESC LIMIT 1) AS score
       FROM sessions s
       WHERE s.user_id = $1
       ORDER BY s.started_at DESC`,
      [userId]
    );
    return NextResponse.json({ sessions: rows });
  } catch (err) {
    console.error('List sessions error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}