'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const MAX_POLLS = 15; // about 60s of waiting for feedback to be generated

export default function SessionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    let timer;
    let cancelled = false;

    const load = async (attempt) => {
      try {
        const res = await fetch(`/api/sessions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Could not load session');
        if (cancelled) return;
        setData(json);
        setPolls(attempt);

        const waitingForFeedback = !json.feedback;
        if (waitingForFeedback && attempt < MAX_POLLS) {
          timer = setTimeout(() => load(attempt + 1), 4000);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    };

    load(0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id, router]);

  if (error) {
    return (
      <div style={wrap}>
        <p style={{ color: 'red' }}>{error}</p>
        <Link href="/dashboard">Back to dashboard</Link>
      </div>
    );
  }
  if (!data) return <div style={wrap}><p>Loading...</p></div>;

  const { session, transcript, feedback } = data;

  return (
    <div style={wrap}>
      <Link href="/dashboard">← Back</Link>
      <h1>Interview #{session.id}</h1>
      <p style={{ color: '#888' }}>
        {session.interview_type} · {session.started_at ? new Date(session.started_at).toLocaleString() : ''}
      </p>

      <h2>Feedback</h2>
      {feedback ? (
        <div>
          <p style={{ fontSize: 28 }}><strong>{feedback.score}/10</strong></p>
          <p><strong>Summary:</strong> {feedback.summary}</p>
          <p><strong>Strengths:</strong> {feedback.strengths}</p>
          <p><strong>To improve:</strong> {feedback.weaknesses}</p>
        </div>
      ) : session.status === 'in_progress' ? (
        polls >= MAX_POLLS ? (
          <p style={{ color: '#888' }}>
            This interview never finished, so there's no report.
          </p>
        ) : (
          <p style={{ color: '#888' }}>Wrapping up your interview...</p>
        )
      ) : polls >= MAX_POLLS ? (
        <p style={{ color: '#888' }}>
          Feedback isn't ready. Refresh in a bit, and if it still doesn't show up, check the server logs.
        </p>
      ) : (
        <p style={{ color: '#888' }}>Generating your feedback...</p>
      )}

      <h2 style={{ marginTop: 30 }}>Transcript</h2>
      {transcript.length === 0 && <p style={{ color: '#888' }}>No transcript saved for this session.</p>}
      {transcript.map((t, i) => (
        <p key={i}>
          <strong>{t.role === 'ai' ? 'Interviewer' : 'You'}:</strong> {t.message}
        </p>
      ))}
    </div>
  );
}

const wrap = { maxWidth: 700, margin: '40px auto', padding: 20, fontFamily: 'sans-serif' };