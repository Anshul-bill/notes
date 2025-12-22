'use client';
import { useState, useEffect, useRef, use } from 'react';
import NoteEditor from '@/components/NoteEditor';
import { Lock, Unlock, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'; // <--- Changed Bot to Sparkles
import { decryptNote, encryptNote } from '@/lib/crypto';
import AIAssistant from '@/components/AIAssistant';

export default function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); 
  
  // State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('Loading...');
  
  // AI Sidebar State
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Encryption State
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const sessionPassword = useRef<string | null>(null);

  // REFS for Auto-Save
  const noteData = useRef({ title: '', content: '' });
  const isDirty = useRef(false); 

  // Helper: Update Sidebar
  const updateSidebarImmediate = (newTitle: string) => {
    const existingNotes = JSON.parse(localStorage.getItem('my-notes') || '[]');
    const updatedNotes = existingNotes.map((note: any) => {
      if (note.id === id) {
        return { ...note, title: newTitle || 'Untitled Note', date: new Date() };
      }
      return note;
    });
    localStorage.setItem('my-notes', JSON.stringify(updatedNotes));
    window.dispatchEvent(new Event('storage'));
  };

  // Helper: Save to DB
  const saveToDb = async (data: { title: string, content: string }, force = false) => {
    try {
      let finalContent = data.content;
      if (isEncrypted && sessionPassword.current) {
         finalContent = encryptNote(data.content, sessionPassword.current);
      }

      await fetch(`/api/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            title: data.title, 
            content: finalContent 
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
            noteData.current = { title: json.data.title, content: json.data.content };
            setStatus('Locked');
          } else {
            const loadedTitle = json.data.title || '';
            const loadedContent = json.data.content || '';
            setTitle(loadedTitle);
            setContent(loadedContent);
            noteData.current = { title: loadedTitle, content: loadedContent };
            setStatus('Saved');
            updateSidebarImmediate(loadedTitle);
          }
        } else {
          setStatus('Note not found');
        }
      } catch (e) {
        setStatus('Error loading');
      }
    };
    fetchNote();
  }, [id]);

  // 2. Auto-Save Logic
  useEffect(() => {
    if (status === 'Loading...' || status === 'Locked') return;

    noteData.current = { title, content };
    isDirty.current = true;
    setStatus('Saving...');

    const timeoutId = setTimeout(() => {
      saveToDb(noteData.current);
      isDirty.current = false;
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (isDirty.current) {
        saveToDb(noteData.current, true);
      }
    };
  }, [title, content, id]);

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
    alert('Link copied!');
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground transition-colors duration-300 overflow-hidden relative">
      
      {/* Navbar */}
      <nav className="p-4 border-b border-border flex justify-between items-center bg-background/80 backdrop-blur-md z-20">
        <div className="text-sm font-semibold text-gray-500 flex items-center gap-2">
           Status: <span className={status === 'Saved' ? 'text-green-500' : 'text-orange-400'}>{status}</span>
           {isEncrypted && <Lock size={14} className="text-yellow-500"/>}
        </div>
        <button 
          onClick={copyLink}
          className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-full text-sm font-medium transition shadow-lg shadow-blue-500/20"
        >
          Share Link
        </button>
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
                <div className="
                    !bg-white dark:!bg-slate-800 
                    !text-black dark:!text-white
                    p-8 rounded-2xl shadow-xl max-w-sm w-full 
                    border border-gray-200 dark:border-slate-700
                ">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Note Locked</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
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
                                className="w-full px-4 py-3 pr-10 rounded-lg outline-none transition-all
                                border border-gray-300 dark:border-slate-700 
                                focus:ring-2 focus:ring-blue-500 
                                !bg-gray-50 !text-black
                                dark:!bg-slate-900 dark:!text-white"
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
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Unlock size={18} /> Unlock Note
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
                if (data.title !== title) updateSidebarImmediate(data.title);
                }} 
            />
            )
         )}
      </div>

      {/* --- AI ASSISTANT BUTTON (Updated Icon) --- */}
      {!isLocked && status !== 'Loading...' && (
        <button
          onClick={() => setIsAIOpen(true)}
          className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl z-30 transition-all hover:scale-110 flex items-center justify-center group"
          title="Ask AI"
        >
           {/* REPLACED BOT WITH SPARKLES */}
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
      />
      
    </div>
  );
}