'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
    } catch (error) {
      alert('Failed to create note');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      {/* Glow Effect behind the text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      <h1 className="text-6xl font-extrabold mb-6 tracking-tight relative z-10">
        Share<span className="text-accent">Notes</span>
      </h1>
      <p className="text-gray-400 mb-10 text-xl max-w-lg relative z-10">
        Capture ideas, auto-save instantly, and share with a secure link.
      </p>
      
      <button 
        onClick={createNote}
        disabled={loading}
        className="relative z-10 px-8 py-4 bg-accent text-white text-lg font-semibold rounded-full hover:bg-accent-hover transition-all transform hover:scale-105 shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-3"
      >
        {loading ? (
          'Creating...'
        ) : (
          <>
            + Create New Note
          </>
        )}
      </button>
    </div>
  );
}