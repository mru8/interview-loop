'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Vapi from '@vapi-ai/web';

const btnBase =
  'rounded-xl border-2 border-zinc-900 px-5 py-2.5 text-sm font-semibold shadow-[3px_3px_0_0_#18181b] transition hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_#18181b]';
const primaryBtn = `${btnBase} bg-violet-500 text-white`;
const dangerBtn = `${btnBase} bg-rose-500 text-white`;

export default function InterviewPage() {
  const [status, setStatus] = useState('idle'); // idle | connecting | active | ended
  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState('');
  const vapiRef = useRef(null);
  const sessionIdRef = useRef(null);
  const callStartedRef = useRef(false);
  const bottomRef = useRef(null);

  // move from connecting to active, but never undo an ended call
  const markActive = () => {
    callStartedRef.current = true;
    setStatus((s) => (s === 'connecting' ? 'active' : s));
  };

  const startInterview = async () => {
    // unlock audio playback immediately on click, before any async gap
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state == 'suspended') {
        await audioCtx.resume();
      }
    } catch (e) {
      console.log('Audio unlock failed (non-critical):', e);
    }

    setError('');
    setTranscript([]);
    callStartedRef.current = false;
    setStatus('connecting');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You need to log in first.');
        setStatus('idle');
        return;
      }

      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to start session');
      }

      const data = await res.json();
      const { sessionId, assistantId, publicKey } = data;
      sessionIdRef.current = sessionId;

      const vapi = new Vapi(publicKey);
      vapiRef.current = vapi;

      vapi.on('call-start', markActive);
      vapi.on('speech-start', markActive);

      vapi.on('call-end', () => {
        setStatus('ended');
      });

      vapi.on('message', (message) => {
        if (message.type === 'transcript') {
          markActive();
        }
        if (message.type === 'transcript' && message.transcriptType === 'final') {
          setTranscript((prev) => [
            ...prev,
            { role: message.role, text: message.transcript },
          ]);
        }
      });

      vapi.on('error', (e) => {
        console.error('Vapi error:', e);
        const msg = e?.message || e?.errorMsg || e?.error?.message || '';
        // a live call that ends reports an "ejection / meeting has ended" error.
        // that's a normal end, not a failure, so show the ended screen
        if (callStartedRef.current && (!msg || /eject|meeting has ended|ended/i.test(msg))) {
          setStatus('ended');
          return;
        }
        setError('Voice call error: ' + (msg || 'unknown'));
        setStatus('idle');
      });

      await vapi.start(assistantId);
      // start() resolved, so the call is connected
      markActive();
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStatus('idle');
    }
  };

  const endInterview = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
  };

  // cleanup if user navigates away mid-call
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, []);

  // keep the newest line in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Behavioral interview</h1>
      <p className="mt-1 text-sm text-zinc-600">
        You'll chat with Alex out loud. Allow your mic when the browser asks. Calls cap at 15 minutes.
      </p>

      <div className="mt-6 rounded-2xl border-2 border-zinc-900 bg-white p-6 shadow-[4px_4px_0_0_#18181b]">
        {status === 'idle' && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-zinc-700">Take a breath. Hit start when you're ready.</p>
            <button onClick={startInterview} className={primaryBtn}>
              Start
            </button>
          </div>
        )}

        {status === 'connecting' && (
          <div className="flex items-center justify-between gap-4">
            <p className="animate-pulse text-sm font-medium text-zinc-700">Calling Alex...</p>
            <button onClick={endInterview} className={dangerBtn}>
              Hang up
            </button>
          </div>
        )}

        {status === 'active' && (
          <div className="flex items-center justify-between gap-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
              <span className="h-3 w-3 animate-pulse rounded-full border-2 border-zinc-900 bg-rose-500" />
              Live. Alex is listening.
            </p>
            <button onClick={endInterview} className={dangerBtn}>
              End interview
            </button>
          </div>
        )}

        {status === 'ended' && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-zinc-800">That's a wrap! Nice one. 🎉</p>
            <Link href={`/dashboard/${sessionIdRef.current}`} className={primaryBtn}>
              See how you did
            </Link>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl border-2 border-zinc-900 bg-rose-200 px-3 py-2 text-sm font-medium">
            {error}
          </p>
        )}
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-zinc-600">
        Live transcript
      </h2>
      <div className="mt-3 space-y-3">
        {transcript.length === 0 && (
          <p className="text-sm text-zinc-500">Your conversation will show up here.</p>
        )}
        {transcript.map((t, i) => {
          const isAi = t.role === 'assistant';
          return (
            <div key={i} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[85%] rounded-2xl border-2 border-zinc-900 px-4 py-2 text-sm ${
                  isAi ? 'bg-sky-200 text-zinc-900' : 'bg-violet-500 text-white'
                }`}
              >
                {t.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </main>
  );
}