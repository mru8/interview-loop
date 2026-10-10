'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

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

  const link = 'text-sm text-slate-600 transition hover:text-ink';
  const pill =
    'rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700';

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-paper/80 backdrop-blur">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="text-lg font-semibold leading-none tracking-tight">InterviewLoop</span>
        </Link>
        <div className="flex items-center gap-6">
          {loggedIn ? (
            <>
              <Link href="/dashboard" className={link}>History</Link>
              <button onClick={logout} className={link}>Log out</button>
              <Link href="/interview" className={pill}>New interview</Link>
            </>
          ) : (
            <>
              <Link href="/login" className={link}>Log in</Link>
              <Link href="/signup" className={pill}>Get started</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}