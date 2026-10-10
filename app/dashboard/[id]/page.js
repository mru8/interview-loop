'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const MAX_POLLS = 15; // about 60s of waiting for feedback to be generated

function scoreColor(score) {
  if (score >= 8) return 'text-emerald-700';
  if (score >= 5) return 'text-amber-700';
  return 'text-rose-700';
}

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
      <main className="mx-auto max-w-2xl px-5 py-12">
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm text-slate-600 hover:text-ink">
          ← Back to history
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-12">
        <p className="text-sm text-slate-500">Loading...</p>
      </main>
    );
  }

  const { session, transcript, feedback } = data;

  let waitingText = null;
  if (!feedback) {
    if (session.status === 'in_progress') {
      waitingText =
        polls >= MAX_POLLS
          ? 'This interview ended early, so there is no report.'
          : 'Wrapping up your interview...';
    } else if (polls >= MAX_POLLS) {
      waitingText = "The report isn't ready yet. Try refreshing in a moment.";
    } else {
      waitingText = 'Writing your report...';
    }
  }
  const stillWorking = waitingText && polls < MAX_POLLS;

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/dashboard" className="text-sm text-slate-600 hover:text-ink">
        ← All interviews
      </Link>
      <p className="mt-6 text-xs uppercase tracking-[0.2em] text-accent">Report</p>
      <h1 className="mt-2 font-semibold text-4xl capitalize tracking-tight">
        {session.interview_type} interview
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {session.started_at ? new Date(session.started_at).toLocaleString() : ''}
      </p>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        {feedback ? (
          <div>
            <div className="flex items-end justify-between gap-6">
              <p className={`font-semibold text-6xl leading-none ${scoreColor(feedback.score)}`}>
                {feedback.score}
                <span className="text-2xl text-slate-400">/10</span>
              </p>
              <div className="mb-2 h-1.5 w-40 rounded-full bg-slate-100">
                <div
                  className="h-1.5 rounded-full bg-accent"
                  style={{ width: `${Math.min(feedback.score, 10) * 10}%` }}
                />
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-slate-700">{feedback.summary}</p>

            <div className="mt-6 grid gap-6 border-t border-slate-100 pt-6 sm:grid-cols-2">
              <div className="border-l-2 border-emerald-600 pl-4">
                <h3 className="text-xs uppercase tracking-[0.16em] text-slate-500">Strengths</h3>
                <p className="mt-2 text-sm leading-relaxed">{feedback.strengths}</p>
              </div>
              <div className="border-l-2 border-amber-500 pl-4">
                <h3 className="text-xs uppercase tracking-[0.16em] text-slate-500">To improve</h3>
                <p className="mt-2 text-sm leading-relaxed">{feedback.weaknesses}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className={`text-sm text-slate-600 ${stillWorking ? 'animate-pulse' : ''}`}>
            {waitingText}
          </p>
        )}
      </section>

      <h2 className="mt-10 text-xs uppercase tracking-[0.18em] text-slate-500">Transcript</h2>
      <div className="mt-4 space-y-3">
        {transcript.length === 0 && (
          <p className="text-sm text-slate-400">No transcript saved for this session.</p>
        )}
        {transcript.map((t, i) => {
          const isAi = t.role === 'ai';
          return (
            <div key={i} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isAi ? 'border border-slate-200 bg-white' : 'bg-ink text-white'
                }`}
              >
                {t.message}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}