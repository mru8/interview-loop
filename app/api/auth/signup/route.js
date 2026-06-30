import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function POST(request) {
    try {
        const { name, email, password, job_role, experience_level } = await request.json();
        
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Name, email, and password are required' },
                { status: 400}
            );
        }

        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return NextResponse.json(
                { error: 'An account with this email already exists'},
                { status: 409}
            );  
        }

        // hash the password before storing
        const password_hash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, job_role, experience_level)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, email, job_role, experience_level`,
            [name, email, password_hash, job_role || null, experience_level || null]
        );

        return NextResponse.json({user: result.rows[0] }, {status: 201 });
    } catch (err) {
        console.error('Signup error:', err);
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}