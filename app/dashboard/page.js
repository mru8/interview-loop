'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function scoreClass(score) {
  if (score >= 8) return 'bg-emerald-300';
  if (score >= 5) return 'bg-yellow-300';
  return 'bg-rose-300';
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
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">Your practice runs</h1>
        <Link
          href="/interview"
          className="rounded-xl border-2 border-zinc-900 bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-[3px_3px_0_0_#18181b] transition hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_#18181b]"
        >
          New interview
        </Link>
      </div>

      {loading && <p className="mt-8 text-sm text-zinc-600">Loading...</p>}
      {error && (
        <p className="mt-6 rounded-xl border-2 border-zinc-900 bg-rose-200 px-3 py-2 text-sm font-medium">
          {error}
        </p>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-zinc-900 bg-white p-10 text-center">
          <p className="text-lg font-semibold">Nothing here yet.</p>
          <p className="mt-1 text-sm text-zinc-600">Your first practice run is waiting.</p>
          <Link
            href="/interview"
            className="mt-4 inline-block rounded-xl border-2 border-zinc-900 bg-yellow-300 px-4 py-2 text-sm font-semibold shadow-[3px_3px_0_0_#18181b]"
          >
            Start one
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {sessions.map((s) => (
          <Link
            key={s.id}
            href={`/dashboard/${s.id}`}
            className="flex items-center justify-between gap-4 rounded-2xl border-2 border-zinc-900 bg-white px-5 py-4 shadow-[4px_4px_0_0_#18181b] transition hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_0_#18181b]"
          >
            <div>
              <p className="font-bold capitalize">{s.interview_type} interview</p>
              <p className="text-sm text-zinc-600">
                {s.started_at ? new Date(s.started_at).toLocaleString() : ''}
              </p>
            </div>
            {s.score != null ? (
              <span className={`${scoreClass(s.score)} rounded-full border-2 border-zinc-900 px-3 py-1 text-sm font-bold`}>
                {s.score}/10
              </span>
            ) : (
              <span className="rounded-full border-2 border-zinc-900 bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">
                {s.status === 'completed' ? 'Crunching...' : 'Bailed early'}
              </span>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}