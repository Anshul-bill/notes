'use client';
import { useState, useEffect, useRef, use } from 'react';
import NoteEditor from '@/components/NoteEditor';
import { Lock, Unlock, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { decryptNote, encryptNote } from '@/lib/crypto';
import AIAssistant from '@/components/AIAssistant';

export default function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); 
  
  // State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // 👇 NEW: Tags State
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState('Loading...');
  
  // AI Sidebar State
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Encryption State
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const sessionPassword = useRef<string | null>(null);

  // REFS for Auto-Save (Include tags here)
  const noteData = useRef({ title: '', content: '', tags: [] as string[] });
  const isDirty = useRef(false);
  // Mirror isEncrypted so the unmount flush re-encrypts correctly (avoids stale closure)
  const isEncryptedRef = useRef(isEncrypted);
  useEffect(() => { isEncryptedRef.current = isEncrypted; }, [isEncrypted]);

  // Helper: Update Sidebar (Now includes Tags!)
  type SidebarNote = { id: string; title?: string; tags?: string[]; date?: string | Date; text?: string; isPinned?: boolean; isEncrypted?: boolean };
  // Upsert this note into the sidebar list: update if present, otherwise add it
  // (so any note you OPEN — incl. a shared link — shows up). `enc` overrides the
  // encrypted flag for newly added entries (state isn't settled yet on first load).
  const updateSidebarImmediate = (newTitle: string, newTags: string[], newContent?: string, enc?: boolean) => {
    const encrypted = enc ?? isEncrypted;
    const existingNotes: SidebarNote[] = JSON.parse(localStorage.getItem('my-notes') || '[]');
    // Plaintext snippet for sidebar content search — never stored for encrypted notes.
    const snippet = (!encrypted && newContent != null)
      ? newContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500)
      : undefined;
    const has = existingNotes.some((n) => n.id === id);
    const updatedNotes = has
      ? existingNotes.map((note) =>
          note.id === id
            ? { ...note, title: newTitle || 'Untitled Note', tags: newTags, date: new Date(), ...(snippet !== undefined ? { text: snippet } : {}) }
            : note
        )
      : [
          { id, title: newTitle || 'Untitled Note', tags: newTags, date: new Date(), isPinned: false, isEncrypted: encrypted, ...(snippet !== undefined ? { text: snippet } : {}) },
          ...existingNotes,
        ];
    localStorage.setItem('my-notes', JSON.stringify(updatedNotes));
    window.dispatchEvent(new Event('storage'));
  };

  // Helper: Save to DB
  const saveToDb = async (data: { title: string, content: string, tags: string[] }, force = false) => {
    try {
      let finalContent = data.content;
      if (isEncryptedRef.current && sessionPassword.current) {
         finalContent = encryptNote(data.content, sessionPassword.current);
      }

      await fetch(`/api/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            title: data.title, 
            content: finalContent,
            tags: data.tags // 👈 Send tags to API
        }),
        keepalive: true, 
      });
      if (!force) setStatus('Saved');
    } catch (e) {
      console.error("Save failed", e);
      if (!force) setStatus('Error');
    }
  };

  // 1. Fetch Note on Load
  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await fetch(`/api/${id}`);
        if (res.ok) {
          const json = await res.json();
          
          if (json.data.isEncrypted) {
            setIsEncrypted(true);
            setIsLocked(true); 
            setTitle(json.data.title);
            // We can load tags even if locked, usually safe, or hide them if you prefer
            setTags(json.data.tags || []); 
            noteData.current = {
                title: json.data.title,
                content: json.data.content,
                tags: json.data.tags || []
            };
            setStatus('Locked');
            // Register a shared/opened encrypted note in the sidebar (no content snippet).
            updateSidebarImmediate(json.data.title || '', json.data.tags || [], undefined, true);
          } else {
            const loadedTitle = json.data.title || '';
            const loadedContent = json.data.content || '';
            const loadedTags = json.data.tags || [];

            setTitle(loadedTitle);
            setContent(loadedContent);
            setTags(loadedTags);

            noteData.current = { title: loadedTitle, content: loadedContent, tags: loadedTags };
            setStatus('Saved');
            updateSidebarImmediate(loadedTitle, loadedTags, loadedContent);
          }
        } else {
          setStatus('Note not found');
        }
      } catch {
        setStatus('Error loading');
      }
    };
    fetchNote();
  }, [id]);

  // 2. Auto-Save Logic (debounced — save 1s after the last edit)
  useEffect(() => {
    if (status === 'Loading...' || status === 'Locked') return;

    noteData.current = { title, content, tags };
    isDirty.current = true;
    setStatus('Saving...');

    const timeoutId = setTimeout(() => {
      saveToDb(noteData.current);
      updateSidebarImmediate(title, tags, content); // refresh sidebar title/tags/search-snippet
      isDirty.current = false;
    }, 1000);

    // Only clear the timer here — flushing on every keystroke defeated the debounce.
    return () => clearTimeout(timeoutId);
  }, [title, content, tags, id]); // 👈 Added tags dependency

  // Flush any pending edit when leaving the page (covers navigating away mid-debounce)
  useEffect(() => {
    return () => {
      if (isDirty.current) saveToDb(noteData.current, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle AI Tags Generation
  const handleTagsGenerated = (newTags: string[]) => {
    setTags(newTags);
    // Immediate update to UI and Sidebar
    updateSidebarImmediate(title, newTags, content);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const decrypted = decryptNote(noteData.current.content, passwordInput);

    if (decrypted || decrypted === "") {
        setContent(decrypted);
        sessionPassword.current = passwordInput;
        setIsLocked(false);
        setStatus('Saved');
    } else {
        alert("Incorrect password!");
        setPasswordInput('');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Edit link copied!');
  };

  const copyViewLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/view/${id}`);
    alert('View-only link copied!');
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground transition-colors duration-300 overflow-hidden relative">
      
      {/* Navbar */}
      <nav data-no-print className="px-5 py-3 border-b border-border flex justify-between items-center bg-background/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${status === 'Saved' ? 'bg-muted' : 'bg-accent animate-pulse'}`} />
            {status}
            {isEncrypted && <Lock size={12} className="text-accent-strong" />}
          </div>
          {tags.length > 0 && (
            <div className="hidden sm:flex gap-1.5 min-w-0 overflow-hidden">
              {tags.map(t => (
                <span key={t} className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-foreground/[0.06] text-muted whitespace-nowrap">#{t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyViewLink}
            className="rounded-md border border-border hover:border-accent hover:text-accent-strong text-foreground px-3.5 py-1.5 text-sm font-medium transition-colors"
            title="Anyone with this link can view but not edit"
          >
            View-only
          </button>
          <button
            onClick={copyLink}
            className="rounded-md bg-accent hover:bg-accent-hover text-accent-ink px-3.5 py-1.5 text-sm font-semibold transition-[transform,background-color] duration-150 active:scale-[0.97]"
          >
            Share link
          </button>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto relative z-10 flex flex-col">
         
         {/* LOADING STATE */}
         {status === 'Loading...' && !isLocked && (
            <div className="flex-1 flex items-center justify-center text-gray-400 gap-2">
                <Loader2 className="animate-spin" /> Loading Note...
            </div>
         )}

         {/* LOCK SCREEN */}
         {isLocked ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="!bg-sidebar !text-foreground p-8 rounded-xl shadow-xl max-w-sm w-full border border-border">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 text-accent-strong">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Note locked</h2>
                    <p className="text-muted mb-6 text-sm">
                        This note is encrypted. Enter the password to view and edit.
                    </p>
                    
                    <form onSubmit={handleUnlock} className="space-y-4">
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                autoFocus
                                placeholder="Enter Password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="w-full px-4 py-3 pr-10 rounded-md outline-none transition
                                border border-border focus:border-accent focus:ring-2 focus:ring-accent/30
                                bg-background text-foreground"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-accent hover:bg-accent-hover text-accent-ink font-medium py-3 rounded-md transition-colors flex items-center justify-center gap-2"
                        >
                            <Unlock size={18} /> Unlock note
                        </button>
                    </form>
                </div>
            </div>
         ) : (
            status !== 'Loading...' && (
            <NoteEditor 
                title={title}
                content={content} 
                onChange={(data) => {
                    setTitle(data.title);
                    setContent(data.content);
                    // Pass current tags so they don't get lost on title change
                    if (data.title !== title) updateSidebarImmediate(data.title, tags, data.content);
                }} 
            />
            )
         )}
      </div>

      {/* --- AI ASSISTANT BUTTON --- */}
      {!isLocked && status !== 'Loading...' && (
        <button
          data-no-print
          onClick={() => setIsAIOpen(true)}
          className="fixed bottom-8 right-8 bg-accent hover:bg-accent-hover text-accent-ink p-4 rounded-full shadow-2xl z-30 transition-all hover:scale-110 flex items-center justify-center group"
          title="Ask AI"
        >
           <Sparkles size={24} className="group-hover:animate-pulse" />
           
           <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
             Ask AI
           </span>
        </button>
      )}

      {/* Sidebar Component */}
      <AIAssistant
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        content={content}
        // 👇 The magic link: Catch tags from AI and save them
        onTagsGenerated={handleTagsGenerated}
        onTitleGenerated={(t) => { setTitle(t); updateSidebarImmediate(t, tags, content); }}
        onContentChange={(html) => setContent(html)}
      />
      
    </div>
  );
}