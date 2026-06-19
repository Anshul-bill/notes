'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Search, Pin, Trash2, Lock, Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { encryptNote, decryptNote } from '@/lib/crypto'; // Import helpers
import Logo from './Logo';

interface NoteItem {
  id: string;
  title: string;
  date: string | Date;
  isPinned: boolean;
  isEncrypted: boolean;
  tags?: string[];
  text?: string; // plaintext snippet for content search (omitted for encrypted notes)
}

function getMyNotes(): NoteItem[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('my-notes');
  return saved ? JSON.parse(saved) : [];
}

export default function Sidebar() {
  const router = useRouter();
  const params = useParams();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [open, setOpen] = useState(false); // mobile drawer

  useEffect(() => {
    // Hydration guard: localStorage and theme are client-only, so we read them
    // after mount to avoid SSR/client mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setNotes(getMyNotes());
    const handleStorageChange = () => setNotes(getMyNotes());
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleCreate = async () => {
    const res = await fetch('/api/create', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      const newHistory = [{ id: data.urlId, title: 'Untitled Note', date: new Date(), isPinned: false, isEncrypted: false }, ...notes];
      localStorage.setItem('my-notes', JSON.stringify(newHistory));
      setNotes(newHistory);
      setSearch('');
      setOpen(false);
      router.push(`/${data.urlId}`);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const deleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm('Are you sure you want to delete this note?')) return;
    await fetch(`/api/${noteId}`, { method: 'DELETE' });
    const updatedNotes = notes.filter((n) => n.id !== noteId);
    setNotes(updatedNotes);
    localStorage.setItem('my-notes', JSON.stringify(updatedNotes));
    window.dispatchEvent(new Event('storage'));
    if (params?.id === noteId) router.push('/');
  };

  const togglePin = async (e: React.MouseEvent, noteId: string, currentStatus: boolean) => {
    e.preventDefault(); e.stopPropagation();
    const updatedNotes = notes.map(n => n.id === noteId ? { ...n, isPinned: !currentStatus } : n);
    setNotes(updatedNotes);
    localStorage.setItem('my-notes', JSON.stringify(updatedNotes));
    window.dispatchEvent(new Event('storage'));
    await fetch(`/api/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned: !currentStatus }),
    });
  };

  // --- HANDLE LOCKING ---
  const handleLock = async (e: React.MouseEvent, note: NoteItem) => {
    e.preventDefault(); e.stopPropagation();

    // 1. IF NOTE IS ALREADY ENCRYPTED (Unlock it)
    if (note.isEncrypted) {
      const password = prompt("Enter password to unlock (decrypt) this note:");
      if (!password) return;

      // We need to fetch the ACTUAL content from DB to decrypt it
      const res = await fetch(`/api/${note.id}`);
      const json = await res.json();

      const decrypted = decryptNote(json.data.content, password);

      if (!decrypted && decrypted !== "") {
        alert("Wrong password!");
        return;
      }

      // Save unlocked version
      await fetch(`/api/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: decrypted, isEncrypted: false }),
      });

      const updatedNotes = notes.map(n => n.id === note.id ? { ...n, isEncrypted: false } : n);
      setNotes(updatedNotes);
      localStorage.setItem('my-notes', JSON.stringify(updatedNotes));
      window.dispatchEvent(new Event('storage'));
      if (params?.id === note.id) window.location.reload();

    } else {
      // 2. IF NOTE IS OPEN (Lock it)
      const password = prompt("Set a password for this note:");
      if (!password) return;

      const res = await fetch(`/api/${note.id}`);
      const json = await res.json();

      const encrypted = encryptNote(json.data.content || "", password);

      await fetch(`/api/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: encrypted, isEncrypted: true }),
      });

      const updatedNotes = notes.map(n => n.id === note.id ? { ...n, isEncrypted: true } : n);
      setNotes(updatedNotes);
      localStorage.setItem('my-notes', JSON.stringify(updatedNotes));
      window.dispatchEvent(new Event('storage'));
      if (params?.id === note.id) window.location.reload();
    }
  };

  const allTags = [...new Set(notes.flatMap((n) => n.tags || []))];

  const filteredNotes = notes
    .filter((n) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q || n.title?.toLowerCase().includes(q) || n.text?.toLowerCase().includes(q);
      const matchesTag = !activeTag || (n.tags || []).includes(activeTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));

  if (!mounted) return null;

  // base: bigger tap target; on desktop start muted, color appears on hover.
  // on mobile (no hover) each button keeps its semantic color always.
  const actBtn = 'p-2 md:p-1.5 rounded transition-colors md:text-muted';

  return (
    <>
      {/* Mobile hamburger (hidden once the drawer is open / on desktop) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="fixed top-3 left-3 z-30 md:hidden rounded-md border border-border bg-sidebar/90 backdrop-blur p-2 text-foreground"
        >
          <Menu size={18} />
        </button>
      )}

      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-72 flex flex-col border-r border-border bg-sidebar backdrop-blur-xl transition-transform duration-300 md:static md:z-auto md:w-64 md:translate-x-0 md:bg-sidebar/85 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      {/* Wordmark */}
      <div className="px-4 py-4 border-b border-border/70 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-sans text-xl font-extrabold tracking-tight text-foreground">
          <Logo size={22} className="text-foreground" />
          ShareNotes
        </h2>
        <button onClick={() => setOpen(false)} aria-label="Close menu" className="md:hidden p-1 text-muted hover:text-foreground">
          <X size={18} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        <button
          onClick={handleCreate}
          className="w-full rounded-md bg-accent hover:bg-accent-hover text-accent-ink text-sm font-semibold py-2.5 px-4 flex items-center justify-center gap-2 transition-[transform,background-color] duration-150 active:scale-[0.98]"
        >
          <Plus size={16} /> New note
        </button>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-accent-strong transition-colors" />
          <input
            type="text"
            placeholder="Search title & text…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm py-2 pl-9 pr-3 rounded-md outline-none bg-background/60 text-foreground border border-border focus:border-accent placeholder:text-muted transition-colors"
          />
        </div>

        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-sm border transition-colors ${
                  activeTag === tag
                    ? 'bg-accent text-accent-ink border-accent'
                    : 'text-muted border-border hover:border-accent hover:text-accent-strong'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {filteredNotes.length === 0 ? (
          <p className="text-center font-mono text-xs text-muted mt-10">No notes yet</p>
        ) : (
          filteredNotes.map((note) => {
            const isActive = params?.id === note.id;
            return (
              <div
                key={note.id}
                className={`group relative rounded-md px-3 py-2 mb-0.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-accent/12 dark:bg-accent/15'
                    : 'hover:bg-foreground/[0.04]'
                }`}
              >
                <Link href={`/${note.id}`} onClick={() => setOpen(false)} className="block min-w-0 pr-20 md:pr-0">
                  <div className="flex items-center gap-1.5">
                    {note.isEncrypted && <Lock size={12} className="shrink-0 text-accent-strong" />}
                    <span className="font-sans font-semibold text-sm truncate text-foreground pr-6">
                      {note.title || (note.isEncrypted ? 'Encrypted note' : 'Untitled note')}
                    </span>
                    {note.isPinned && <Pin size={11} className="shrink-0 text-accent-strong fill-accent-strong ml-auto" />}
                  </div>

                  <div className="font-mono text-[10px] uppercase tracking-wide text-muted mt-0.5">
                    {new Date(note.date).toLocaleDateString()}
                  </div>

                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {note.tags.slice(0, 3).map((tag: string, i: number) => (
                        <span key={i} className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-foreground/[0.06] text-muted">
                          #{tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="font-mono text-[10px] text-muted">+{note.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </Link>

                <div className="flex md:hidden md:group-hover:flex items-center gap-0.5 absolute right-1.5 top-1.5 rounded-md border border-border bg-sidebar/95 backdrop-blur px-0.5 shadow-sm">
                  <button onClick={(e) => togglePin(e, note.id, note.isPinned)} title={note.isPinned ? 'Unpin' : 'Pin'} className={`${actBtn} text-green-500 md:hover:text-green-500`}>
                    <Pin size={14} className={note.isPinned ? 'fill-current' : ''} />
                  </button>
                  <button onClick={(e) => handleLock(e, note)} title={note.isEncrypted ? 'Unlock note' : 'Encrypt note'} className={`${actBtn} text-yellow-600 md:hover:text-yellow-600`}>
                    <Lock size={14} className={note.isEncrypted ? 'fill-current' : ''} />
                  </button>
                  <button onClick={(e) => deleteNote(e, note.id)} title="Delete" className={`${actBtn} text-red-500 md:hover:text-red-500`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-4 py-3 border-t border-border/70 flex justify-between items-center">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">v2.0</span>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
          className="p-2 rounded-md text-muted hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
      </aside>
    </>
  );
}
