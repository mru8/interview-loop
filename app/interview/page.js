'use client';

import { useState, useRef, useEffect } from 'react';
import Vapi from '@vapi-ai/web';

export default function InterviewPage() {
  const [status, setStatus] = useState('idle'); // idle | connecting | active | ended
  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState('');
  const vapiRef = useRef(null);
  const sessionIdRef = useRef(null);

  const startInterview = async () => {
    // unlock audio playback immediately on click, before any async gap
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state == 'suspended') {
        await audioCtx.resume();
      }
    } catch (e) {
      console.log('Audio unlock faileed (non-critical):', e);
    }
    
    setError('');
    setStatus('connecting');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You need to log in first.');
        setStatus('idle');
        return;
      }

      // 2. Hit your start-session API
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

      // 3. Initialize Vapi client
      const vapi = new Vapi(publicKey);
      vapiRef.current = vapi;

      // 4. Set up event listeners
      vapi.on('call-start', () => {
        setStatus('active');
      });

      vapi.on('call-end', () => {
        setStatus('ended');
      });

      vapi.on('message', (message) => {
        if (message.type === 'transcript' && message.transcriptType === 'final') {
          setTranscript((prev) => [
            ...prev,
            { role: message.role, text: message.transcript },
          ]);
        }
      });

      vapi.on('error', (e) => {
        console.error('Vapi error:', e);
        setError('Voice call error: ' + (e?.message || 'unknown'));
        setStatus('idle');
      });

      // 5. Start the call
      await vapi.start(assistantId);
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

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Behavioral Interview</h1>

      {status === 'idle' && (
        <button onClick={startInterview} style={btnStyle}>
          Start Interview
        </button>
      )}

      {status === 'connecting' && <p>Connecting to your interviewer...</p>}

      {status === 'active' && (
        <div>
          <p style={{ color: 'green' }}>🔴 Live — interview in progress</p>
          <button onClick={endInterview} style={{ ...btnStyle, background: '#d32f2f' }}>
            End Interview
          </button>
        </div>
      )}

      {status === 'ended' && (
        <div>
          <p>Interview ended. Thanks!</p>
          <p>Session ID: {sessionIdRef.current}</p>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginTop: 30 }}>
        <h3>Live Transcript</h3>
        {transcript.length === 0 && <p style={{ color: '#888' }}>No transcript yet.</p>}
        {transcript.map((t, i) => (
          <p key={i}>
            <strong>{t.role === 'assistant' ? 'Interviewer' : 'You'}:</strong> {t.text}
          </p>
        ))}
      </div>
    </div>
  );
}

const btnStyle = {
  padding: '10px 20px',
  fontSize: 16,
  cursor: 'pointer',
  background: '#1976d2',
  color: 'white',
  border: 'none',
  borderRadius: 6,
};