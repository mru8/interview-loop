'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/sessions', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load sessions');
        setSessions(data.sessions);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 20, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Your interviews</h1>
        <Link href="/interview" style={btnStyle}>New interview</Link>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && sessions.length === 0 && (
        <p style={{ color: '#888' }}>No interviews yet. Start your first one.</p>
      )}

      {sessions.map((s) => (
        <Link
          key={s.id}
          href={`/dashboard/${s.id}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '14px 16px',
            marginTop: 10,
            border: '1px solid #ddd',
            borderRadius: 6,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <span>
            <strong>#{s.id}</strong> {s.interview_type} ·{' '}
            {s.started_at ? new Date(s.started_at).toLocaleString() : ''}
          </span>
          <span>
            {s.score != null ? `${s.score}/10` : s.status === 'completed' ? 'processing' : s.status}
          </span>
        </Link>
      ))}
    </div>
  );
}

const btnStyle = {
  padding: '10px 20px',
  fontSize: 16,
  background: '#1976d2',
  color: 'white',
  borderRadius: 6,
  textDecoration: 'none',
};