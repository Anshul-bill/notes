'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  Plus, Search, Pin, Trash2, Lock, 
  Moon, Sun, LayoutPanelLeft 
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { encryptNote, decryptNote } from '@/lib/crypto'; // Import helpers

function getMyNotes() {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('my-notes');
  return saved ? JSON.parse(saved) : [];
}

export default function Sidebar() {
  const router = useRouter();
  const params = useParams();
  const { theme, setTheme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
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

  // --- NEW: HANDLE LOCKING ---
  const handleLock = async (e: React.MouseEvent, note: any) => {
    e.preventDefault(); e.stopPropagation();

    // 1. IF NOTE IS ALREADY ENCRYPTED (Unlock it)
    if (note.isEncrypted) {
      const password = prompt("Enter password to unlock (decrypt) this note:");
      if (!password) return;

      // We need to fetch the ACTUAL content from DB to decrypt it
      // (Sidebar usually doesn't have the full content body for performance)
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
      
      // Update UI
      const updatedNotes = notes.map(n => n.id === note.id ? { ...n, isEncrypted: false } : n);
      setNotes(updatedNotes);
      localStorage.setItem('my-notes', JSON.stringify(updatedNotes));
      window.dispatchEvent(new Event('storage'));
      // Reload page to show content
      if (params?.id === note.id) window.location.reload();

    } else {
      // 2. IF NOTE IS OPEN (Lock it)
      const password = prompt("Set a password for this note:");
      if (!password) return;

      // Fetch current content to encrypt
      const res = await fetch(`/api/${note.id}`);
      const json = await res.json();

      const encrypted = encryptNote(json.data.content || "", password);

      // Save encrypted version
      await fetch(`/api/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: encrypted, isEncrypted: true }),
      });

      // Update UI
      const updatedNotes = notes.map(n => n.id === note.id ? { ...n, isEncrypted: true } : n);
      setNotes(updatedNotes);
      localStorage.setItem('my-notes', JSON.stringify(updatedNotes));
      window.dispatchEvent(new Event('storage'));
      // Reload page to hide content
      if (params?.id === note.id) window.location.reload();
    }
  };
  // ---------------------------

  const filteredNotes = notes
    .filter((n) => n.title?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));

  if (!mounted) return null;

  return (
    <aside className="w-64 h-screen flex flex-col transition-all duration-300 border-r border-border bg-sidebar/80 backdrop-blur-xl">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <LayoutPanelLeft className="w-5 h-5 text-blue-500" /> QuickNote
        </h2>
      </div>

      <div className="p-4 space-y-3">
        <button onClick={handleCreate} className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-2.5 px-4 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"><Plus size={18} /> New Note</button>
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4 group-focus-within:text-accent transition-colors" />
          <input type="text" placeholder="Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full text-sm py-2 pl-9 pr-3 rounded-md transition-all duration-200 outline-none border border-transparent focus:border-accent !bg-gray-100 !text-black placeholder:text-gray-500 dark:!bg-slate-800 dark:!text-white dark:placeholder:text-gray-400 focus:!bg-white dark:focus:!bg-slate-900 shadow-sm" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {filteredNotes.length === 0 ? (
          <p className="text-center text-gray-500 text-sm mt-10">No notes found</p>
        ) : (
          filteredNotes.map((note) => {
            const isActive = params?.id === note.id;
            return (
              <div key={note.id} className={`group relative flex items-center p-2 rounded-md transition mb-1 cursor-pointer ${isActive ? 'bg-accent shadow-md shadow-blue-500/20' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}>
                <Link href={`/${note.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                     <div className="font-bold truncate pr-6 flex-1" style={{ color: isActive ? '#ffffff' : 'var(--foreground)' }}>
                      {/* If Encrypted, maybe hide Title or show lock symbol? For now, we keep title visible */}
                      {note.isEncrypted ? "🔒 " + (note.title || 'Encrypted') : (note.title || 'Untitled Note')}
                    </div>
                    {note.isPinned && <Pin size={12} className={isActive ? "text-white fill-white" : "text-blue-500 fill-blue-500"} />}
                  </div>
                  <div className={`text-xs font-medium ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                     {new Date(note.date).toLocaleDateString()}
                  </div>
                </Link>
                
                <div className={`hidden group-hover:flex items-center gap-1 absolute right-2 pl-2 rounded shadow-sm ${isActive ? 'bg-accent' : 'bg-gray-100 dark:bg-slate-800'}`}>
                  
                  <button onClick={(e) => togglePin(e, note.id, note.isPinned)} title={note.isPinned ? "Unpin" : "Pin"} className={`p-1.5 transition ${isActive ? 'text-white hover:text-white/80' : note.isPinned ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}>
                    <Pin size={14} className={note.isPinned ? "fill-current" : ""} />
                  </button>

                  {/* LOCK BUTTON */}
                  <button 
                    onClick={(e) => handleLock(e, note)}
                    title={note.isEncrypted ? "Unlock Note" : "Encrypt Note"} 
                    className={`p-1.5 transition ${
                        isActive ? 'text-white hover:text-white/80' : 'text-gray-500 hover:text-yellow-500'
                    }`}
                  >
                    {/* If Encrypted: Show Locked Icon (Filled or Active Color). If not: Open Lock */}
                    <Lock size={14} className={note.isEncrypted ? "text-yellow-500 fill-yellow-500" : ""} />
                  </button>
                  
                  <button onClick={(e) => deleteNote(e, note.id)} title="Delete" className={`p-1.5 transition ${isActive ? 'text-white hover:text-red-200' : 'text-gray-500 hover:text-red-500'}`}>
                    <Trash2 size={14} />
                  </button>

                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="p-4 border-t border-border/50 flex justify-between items-center">
        <span className="text-xs text-gray-500">v2.0.0</span>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition" style={{ color: 'var(--foreground)' }}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
      </div>
    </aside>
  );
}