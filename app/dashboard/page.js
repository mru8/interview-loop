'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function scoreColor(score) {
  if (score >= 8) return 'text-emerald-700';
  if (score >= 5) return 'text-amber-700';
  return 'text-rose-700';
}

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
    <main className="mx-auto w-full max-w-2xl px-5 py-12">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-accent">History</p>
        <h1 className="mt-2 font-semibold text-4xl tracking-tight">Your interviews</h1>
      </div>
      {loading && <p className="mt-10 text-sm text-slate-500">Loading...</p>}
      {error && (
        <p className="mt-8 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <p className="font-semibold text-2xl">No interviews yet</p>
          <p className="mt-1 text-sm text-slate-500">Your first one is a few clicks away.</p>
          <Link
            href="/interview"
            className="mt-5 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Start your first interview
          </Link>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {sessions.map((s) => (
          <Link
            key={s.id}
            href={`/dashboard/${s.id}`}
            className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 transition hover:border-slate-400 hover:shadow-sm"
          >
            <div>
              <p className="font-medium capitalize">{s.interview_type} interview</p>
              <p className="mt-0.5 text-sm text-slate-500">
                {s.started_at ? new Date(s.started_at).toLocaleString() : ''}
              </p>
            </div>
            {s.score != null ? (
              <p className={`font-semibold text-3xl leading-none ${scoreColor(s.score)}`}>
                {s.score}
                <span className="text-base text-slate-400">/10</span>
              </p>
            ) : (
              <span className="text-sm text-slate-500">
                {s.processing ? 'Processing...' : s.live ? 'In progress' : 'No report'}
              </span>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}