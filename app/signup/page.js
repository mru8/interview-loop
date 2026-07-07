'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSignup = async () => {
        setError('');
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }), 
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error || 'Singup failed');
            return;
        }

        router.push('/login');
    };

    return (
        <div style={{ maxWidth: 400, margin: '80px auto', fontFamily: 'sans-serif' }}>
            <h2>Sign Up</h2>
            <input
                type='text'
                placeholder='Name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
            />
            <input
                type='email'
                placeholder='Email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
            />
            <input
                type='password'
                placeholder='Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
            />
            <button onClick={handleSignup} style={btnStyle}>Sign Up</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

const inputStyle = {
    display: 'block', width: '100%', padding: 10,
    marginBottom: 12, fontSize: 15, boxSizing: 'border-box', 
};

const btnStyle = {
    padding: '10px 20px', fontSize: 15, cursor: 'pointer',
    background: '#1976d2', color: 'white', border: 'none', borderRadius: 6,
};