'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const MAX_POLLS = 15; // about 60s of waiting for feedback to be generated

function scoreClass(score) {
  if (score >= 8) return 'bg-emerald-300';
  if (score >= 5) return 'bg-yellow-300';
  return 'bg-rose-300';
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
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="rounded-xl border-2 border-zinc-900 bg-rose-200 px-3 py-2 text-sm font-medium">
          {error}
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-violet-600 hover:underline">
          Back to my runs
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-sm text-zinc-600">Loading...</p>
      </main>
    );
  }

  const { session, transcript, feedback } = data;

  let waitingText = null;
  if (!feedback) {
    if (session.status === 'in_progress') {
      waitingText =
        polls >= MAX_POLLS
          ? 'This one ended early, so there is no report.'
          : 'Wrapping things up...';
    } else if (polls >= MAX_POLLS) {
      waitingText = "Report isn't ready yet. Try refreshing in a bit.";
    } else {
      waitingText = 'Alex is scribbling notes...';
    }
  }
  const stillWorking = waitingText && polls < MAX_POLLS;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/dashboard" className="text-sm font-semibold text-zinc-700 hover:text-violet-600">
        ← All runs
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold capitalize tracking-tight">
        {session.interview_type} interview
      </h1>
      <p className="text-sm text-zinc-600">
        {session.started_at ? new Date(session.started_at).toLocaleString() : ''}
      </p>

      <section className="mt-6 rounded-2xl border-2 border-zinc-900 bg-white p-6 shadow-[4px_4px_0_0_#18181b]">
        <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-600">Your report card</h2>

        {feedback ? (
          <div className="mt-4">
            <div className="flex items-center gap-4">
              <span className={`${scoreClass(feedback.score)} rounded-2xl border-2 border-zinc-900 px-4 py-2 text-3xl font-extrabold`}>
                {feedback.score}/10
              </span>
              <p className="text-sm text-zinc-700">{feedback.summary}</p>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border-2 border-zinc-900 bg-emerald-200 p-4">
                <h3 className="font-bold">What you nailed</h3>
                <p className="mt-1 text-sm">{feedback.strengths}</p>
              </div>
              <div className="rounded-xl border-2 border-zinc-900 bg-yellow-200 p-4">
                <h3 className="font-bold">Work on this</h3>
                <p className="mt-1 text-sm">{feedback.weaknesses}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className={`mt-4 text-sm font-medium text-zinc-700 ${stillWorking ? 'animate-pulse' : ''}`}>
            {waitingText}
          </p>
        )}
      </section>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-zinc-600">The full convo</h2>
      <div className="mt-3 space-y-3">
        {transcript.length === 0 && (
          <p className="text-sm text-zinc-500">No transcript saved for this one.</p>
        )}
        {transcript.map((t, i) => {
          const isAi = t.role === 'ai';
          return (
            <div key={i} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[85%] rounded-2xl border-2 border-zinc-900 px-4 py-2 text-sm ${
                  isAi ? 'bg-sky-200 text-zinc-900' : 'bg-violet-500 text-white'
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