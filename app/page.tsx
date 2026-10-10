import Link from 'next/link';

const steps = [
  {
    emoji: '👋',
    title: 'Hit start',
    text: "Alex says hi and throws you a question. No prep, no pressure.",
    color: 'bg-pink-200',
  },
  {
    emoji: '🗣️',
    title: 'Ramble, then refine',
    text: 'Give real examples. Vague answers get follow-ups, just like the real thing.',
    color: 'bg-sky-200',
  },
  {
    emoji: '📝',
    title: 'Get the verdict',
    text: 'A score out of 10, what went well, and what to fix next time.',
    color: 'bg-emerald-200',
  },
];

const primary =
  'rounded-xl border-2 border-zinc-900 bg-violet-500 px-6 py-3 font-semibold text-white shadow-[4px_4px_0_0_#18181b] transition hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_0_#18181b]';
const secondary =
  'rounded-xl border-2 border-zinc-900 bg-white px-6 py-3 font-semibold text-zinc-900 shadow-[4px_4px_0_0_#18181b] transition hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_0_#18181b]';

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
        Sweat in private,
        <br />
        <span className="rounded-lg bg-yellow-300 px-2">not in the real interview.</span>
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-700">
        Chat out loud with Alex, an AI interviewer who actually listens (and pokes at
        your vague answers). Walk away with a score and honest notes.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link href="/signup" className={primary}>Let's go</Link>
        <Link href="/login" className={secondary}>I have an account</Link>
      </div>

      <div className="mt-16 grid gap-5 text-left sm:grid-cols-3">
        {steps.map((s) => (
          <div
            key={s.title}
            className={`${s.color} rounded-2xl border-2 border-zinc-900 p-5 shadow-[4px_4px_0_0_#18181b]`}
          >
            <div className="text-3xl">{s.emoji}</div>
            <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
            <p className="mt-1 text-sm text-zinc-800">{s.text}</p>
          </div>
        ))}
      </div>
    </main>
  );
}