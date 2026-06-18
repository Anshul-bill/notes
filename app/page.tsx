'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CursorFX from '@/components/CursorFX';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const createNote = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/create', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        router.push(`/${data.urlId}`);
      }
    } catch {
      alert('Could not create a note. Check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <CursorFX />
      <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-[-0.03em] leading-[0.95] max-w-4xl text-balance">
        Write it{' '}
        {/* Signature: highlighter-marker swipe that draws in on load */}
        <span className="relative inline-block">
          <span
            aria-hidden
            className="absolute inset-x-[-0.1em] top-[0.16em] bottom-[0.12em] z-0 -rotate-2 rounded-[3px] bg-accent motion-safe:[animation:marker-draw_0.6s_cubic-bezier(0.22,1,0.36,1)_0.25s_both]"
          />
          <span className="relative z-[1] text-accent-ink">down.</span>
        </span>
        <br />
        Share the link.
      </h1>

      <p className="text-lg sm:text-xl text-muted mt-8 max-w-md leading-relaxed">
        An open page that saves as you type, locks behind a password when you
        need it, and travels as a single link.
      </p>

      <button
        onClick={createNote}
        disabled={loading}
        className="group mt-11 inline-flex items-center gap-2.5 rounded-md bg-accent px-8 py-4 text-lg font-bold text-accent-ink transition-[transform,background-color] duration-150 hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? 'Creating…' : 'Start a new note'}
        <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
      </button>

      <p className="font-mono text-[11px] uppercase tracking-wider text-muted mt-5">
        No sign-up · Opens instantly
      </p>
    </div>
  );
}
