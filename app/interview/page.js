'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Vapi from '@vapi-ai/web';

const pill =
  'rounded-full px-5 py-2.5 text-sm font-medium text-white transition';
const primaryBtn = `${pill} bg-ink hover:bg-slate-700`;
const dangerBtn = `${pill} bg-red-700 hover:bg-red-800`;

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
    <main className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-accent">Behavioral</p>
      <h1 className="mt-2 font-semibold text-4xl tracking-tight">Mock interview</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        You'll talk with Alex out loud. Allow your microphone when the browser asks.
        Calls are capped at 15 minutes.
      </p>

      <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {status === 'idle' && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">Find a quiet spot, then start when you're ready.</p>
            <button onClick={startInterview} className={primaryBtn}>
              Start interview
            </button>
          </div>
        )}

        {status === 'connecting' && (
          <div className="flex items-center justify-between gap-4">
            <p className="animate-pulse text-sm text-slate-600">Connecting to your interviewer...</p>
            <button onClick={endInterview} className={dangerBtn}>
              Cancel
            </button>
          </div>
        )}

        {status === 'active' && (
          <div className="flex items-center justify-between gap-4">
            <p className="flex items-center gap-2.5 text-sm font-medium">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
              Live. Alex is listening.
            </p>
            <button onClick={endInterview} className={dangerBtn}>
              End interview
            </button>
          </div>
        )}

        {status === 'ended' && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">Interview complete. Nice work.</p>
            <Link href={`/dashboard/${sessionIdRef.current}`} className={primaryBtn}>
              View your report
            </Link>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
      </div>

      <h2 className="mt-10 text-xs uppercase tracking-[0.18em] text-slate-500">Live transcript</h2>
      <div className="mt-4 space-y-3">
        {transcript.length === 0 && (
          <p className="text-sm text-slate-400">The conversation will appear here.</p>
        )}
        {transcript.map((t, i) => {
          const isAi = t.role === 'assistant';
          return (
            <div key={i} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isAi ? 'border border-slate-200 bg-white' : 'bg-ink text-white'
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