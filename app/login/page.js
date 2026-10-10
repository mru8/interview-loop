'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const input =
  'mt-1 w-full rounded-xl border-2 border-zinc-900 bg-white px-3 py-2.5 text-sm outline-none focus:bg-yellow-50';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);
      router.push('/interview');
    } catch (err) {
      setError('Could not reach the server. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-2xl border-2 border-zinc-900 bg-pink-200 p-7 shadow-[4px_4px_0_0_#18181b]">
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome back 👋</h1>
        <p className="mt-1 text-sm text-zinc-800">Log in and get back to practicing.</p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={input}
              placeholder="you@example.com"
            />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
              placeholder="Your password"
            />
          </label>

          {error && (
            <p className="rounded-xl border-2 border-zinc-900 bg-rose-300 px-3 py-2 text-sm font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border-2 border-zinc-900 bg-violet-500 px-5 py-2.5 font-semibold text-white shadow-[3px_3px_0_0_#18181b] transition hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_#18181b] disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-zinc-700">
        New here?{' '}
        <Link href="/signup" className="font-semibold text-violet-600 hover:underline">
          Make an account
        </Link>
      </p>
    </main>
  );
}