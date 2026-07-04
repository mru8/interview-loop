'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async () => {
        setError('');
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.join();

        if (!res.ok) {
            setError(data.error || 'Login failed');
            return;
        }

        localStorage.setItem('token', data.token);
        router.push('/interview');
    };
    
    return (
        <div style={{ macWidth: 400, margin: '80px auto', fontFamily: 'sans-serif'}}>
            <h2>Login</h2>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputstyle}
            />
            <button onClick={handleLogin} style={btnStyle}>Login</button>
            {error && <p style={{ color: 'red' }}>error</p>}
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