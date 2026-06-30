import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400}
            );
        }

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status:401 });
        }

        const passwordMatches = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatches) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        // create JWT token
        const token = jwt.sign(
            {userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                job_role: user.job_role,
                experience_level: user.experience_level,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}