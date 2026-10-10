'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const btn =
  'rounded-xl border-2 border-zinc-900 bg-violet-500 px-3 py-1.5 text-sm font-semibold text-white shadow-[3px_3px_0_0_#18181b] transition hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_#18181b]';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('token'));
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem('token');
    setLoggedIn(false);
    router.push('/login');
  };

  const link = 'text-sm font-medium text-zinc-700 hover:text-violet-600';

  return (
    <header className="border-b-2 border-zinc-900 bg-amber-200">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-zinc-900">
          🎙️ InterviewLoop
        </Link>
        <div className="flex items-center gap-5">
          {loggedIn ? (
            <>
              <Link href="/dashboard" className={link}>My runs</Link>
              <Link href="/interview" className={btn}>New interview</Link>
              <button onClick={logout} className={link}>Log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className={link}>Log in</Link>
              <Link href="/signup" className={btn}>Sign up</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}