import Link from 'next/link';

const steps = [
  {
    n: '01',
    title: 'Start the call',
    text: 'Alex, a voice AI interviewer, opens with a behavioral question. Just talk, right in your browser.',
  },
  {
    n: '02',
    title: 'Answer out loud',
    text: 'Vague answers get follow-ups. Specific ones move the conversation forward, like a real interview.',
  },
  {
    n: '03',
    title: 'Review the report',
    text: 'A score out of 10, your strengths, what to work on, and the full transcript to look back on.',
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-20">
      <section className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">AI mock interviews</p>
        <h1 className="mx-auto mt-5 max-w-2xl font-semibold text-5xl leading-[1.05] tracking-tight sm:text-6xl">
          Practice the interview before it counts.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
          Have a real spoken conversation with an AI interviewer, then get an honest,
          scored breakdown of how you did.
        </p>
        <div className="mt-9 flex items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Start practicing
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-medium transition hover:bg-slate-100"
          >
            Log in
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-[0_24px_60px_-24px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sample session</p>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Live
          </span>
        </div>
        <div className="mt-5 space-y-3 text-sm">
          <div className="max-w-[80%] rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
            Tell me about a time you disagreed with a teammate. What happened?
          </div>
          <div className="ml-auto max-w-[80%] rounded-2xl bg-ink px-4 py-2.5 text-white">
            We disagreed on how to structure the API, so I put together a quick comparison of both options.
          </div>
          <div className="max-w-[80%] rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
            What was the outcome, and what would you do differently?
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">Report after every call</p>
          <p className="font-semibold text-3xl leading-none">
            7<span className="text-lg text-slate-400">/10</span>
          </p>
        </div>
      </section>

      <section className="mt-20 grid gap-10 sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="border-t border-slate-300 pt-5">
            <p className="font-mono text-sm text-accent">{s.n}</p>
            <h3 className="mt-2 font-medium">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
          </div>
        ))}
      </section>

      <footer className="mt-24 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
        Built with Next.js, Vapi, Gemini and Supabase.
      </footer>
    </main>
  );
}