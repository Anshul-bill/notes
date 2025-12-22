'use client';
import { useState } from 'react';
import { X, Sparkles, Tag, Languages, CheckCircle, Bot } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

export default function AIAssistant({ isOpen, onClose, content }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  
  // State
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  // Glossary state removed
  const [translation, setTranslation] = useState('');
  const [grammar, setGrammar] = useState<{issues: any[]} | null>(null);
  const [targetLang, setTargetLang] = useState('Spanish');

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      const plainText = content.replace(/<[^>]*>?/gm, ''); 
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, text: plainText, language: targetLang }),
      });
      const json = await res.json();
      
      if (json.success) {
        if (action === 'summary') setSummary(json.data);
        if (action === 'tags') setTags(json.data);
        // Glossary action logic removed
        if (action === 'translate') setTranslation(json.data);
        if (action === 'grammar') setGrammar(json.data);
      }
    } catch (e) {
      console.error(e);
      alert('AI Request failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <div className={`
          fixed right-0 top-0 h-full w-96 
          transform transition-transform duration-300 z-50 overflow-y-auto
          border-l border-gray-200 dark:border-slate-700 shadow-2xl
          /* LIGHT MODE: Darker Gray BG so white cards pop */
          bg-slate-100 
          /* DARK MODE: Deep Blue/Slate */
          dark:bg-slate-900 
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        
        {/* Header (Sticky & Blurred) */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center 
          sticky top-0 z-10 backdrop-blur-md
          bg-white/80 dark:bg-slate-900/80">
          <h2 className="font-bold text-lg flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Bot size={24} /> AI Assistant
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          
          {/* 1. SUMMARY CARD */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                  <Sparkles size={16}/>
                </div>
                Summary
              </h3>
              <button 
                onClick={() => handleAction('summary')}
                disabled={loading === 'summary'}
                className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-1.5 rounded-full font-medium transition"
              >
                {loading === 'summary' ? 'Writing...' : 'Generate'}
              </button>
            </div>
            {summary && <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed animate-in fade-in slide-in-from-bottom-2">{summary}</p>}
          </div>

          {/* 2. TAGS CARD */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                  <Tag size={16}/>
                </div>
                Tags
              </h3>
              <button 
                 onClick={() => handleAction('tags')}
                 disabled={loading === 'tags'}
                 className="text-xs bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 px-3 py-1.5 rounded-full font-medium transition"
              >
                {loading === 'tags' ? 'Finding...' : 'Generate'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, i) => (
                <span key={i} className="text-xs font-medium bg-gray-100 dark:bg-slate-700 px-2.5 py-1 rounded-md text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 animate-in zoom-in duration-300">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* GLOSSARY CARD REMOVED HERE */}

          {/* 3. TRANSLATION CARD (Formerly 4) */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex justify-between items-center mb-3">
               <h3 className="font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                  <Languages size={16}/>
                </div>
                Translate
              </h3>
            </div>
            <div className="flex gap-2 mb-3">
              <select 
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="
                  flex-1 text-xs p-2 rounded-lg outline-none
                  border border-gray-200 dark:border-slate-600 
                  bg-gray-50 dark:bg-slate-900 
                  focus:ring-2 focus:ring-orange-500/20
                  
                  /* FORCE TEXT COLORS */
                  text-gray-900 dark:text-gray-100
                "
              >
                {/* We explicitly style options to prevent the 'invisible text' bug */}
                <option value="Spanish" className="text-black bg-white dark:text-white dark:bg-slate-900">Spanish</option>
                <option value="French" className="text-black bg-white dark:text-white dark:bg-slate-900">French</option>
                <option value="German" className="text-black bg-white dark:text-white dark:bg-slate-900">German</option>
                <option value="Japanese" className="text-black bg-white dark:text-white dark:bg-slate-900">Japanese</option>
                <option value="Hindi" className="text-black bg-white dark:text-white dark:bg-slate-900">Hindi</option>
              </select>
              <button 
                 onClick={() => handleAction('translate')}
                 disabled={loading === 'translate'}
                 className="text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300 px-4 py-2 rounded-lg font-medium transition"
              >
                Go
              </button>
            </div>
            {translation && (
              <div className="p-3 bg-orange-50 dark:bg-slate-900/50 rounded-lg border border-orange-100 dark:border-slate-700 text-sm italic text-gray-700 dark:text-gray-300 animate-in fade-in">
                "{translation}"
              </div>
            )}
          </div>

          {/* 4. GRAMMAR CARD (Formerly 5) */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-shadow hover:shadow-md mb-20">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                  <CheckCircle size={16}/>
                </div>
                Grammar
              </h3>
              <button 
                 onClick={() => handleAction('grammar')}
                 disabled={loading === 'grammar'}
                 className="text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 px-3 py-1.5 rounded-full font-medium transition"
              >
                Check
              </button>
            </div>
            <div className="space-y-3">
              {grammar?.issues.map((issue, i) => (
                 <div key={i} className="text-sm flex flex-col gap-1 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30 animate-in fade-in">
                    <div className="text-red-500 line-through text-xs opacity-70">{issue.original}</div>
                    <div className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                      <span className="text-xs">➜</span> {issue.suggestion}
                    </div>
                 </div>
              ))}
              {grammar?.issues.length === 0 && <p className="text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded text-xs text-center border border-green-100 dark:border-green-900/30">Everything looks correct! 🎉</p>}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}