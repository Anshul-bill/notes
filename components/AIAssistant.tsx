'use client';
import { useState } from 'react';
import { X, Sparkles, Tag, Languages, CheckCircle, Bot, Type, Wand2, PenLine, MessageCircle } from 'lucide-react';

interface GrammarIssue {
  original: string;
  suggestion: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onTagsGenerated?: (tags: string[]) => void;
  onTitleGenerated?: (title: string) => void;
  onContentChange?: (html: string) => void;
}

// Wrap plain AI text as HTML so it slots into the TipTap editor (blank lines -> paragraphs).
const textToHtml = (t: string) =>
  '<p>' + t.trim().replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';

// Shared styles (Inkwell: ink + single red-pen accent, mono labels)
const card = 'rounded-lg border border-border bg-background p-4';
const cardTitle = 'flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-foreground';
const chip = 'flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent-strong';
const ghostBtn = 'rounded-md border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent-strong disabled:opacity-50';
const fillBtn = 'rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-ink transition-colors hover:bg-accent-hover';
const result = 'font-sans text-sm leading-relaxed text-foreground/90';

export default function AIAssistant({ isOpen, onClose, content, onTagsGenerated, onTitleGenerated, onContentChange }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  // State
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [translation, setTranslation] = useState('');
  const [grammar, setGrammar] = useState<{ issues: GrammarIssue[] } | null>(null);
  const [targetLang, setTargetLang] = useState('Spanish');
  const [genTitle, setGenTitle] = useState('');
  const [improved, setImproved] = useState('');
  const [continuation, setContinuation] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      const plainText = content.replace(/<[^>]*>?/gm, '');
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, text: plainText, language: targetLang, question }),
      });
      const json = await res.json();

      if (json.success) {
        if (action === 'summary') setSummary(json.data);
        if (action === 'tags') {
          const newTags = Array.isArray(json.data) ? json.data : [];
          setTags(newTags);
          onTagsGenerated?.(newTags); // bubble up so the note saves them
        }
        if (action === 'translate') setTranslation(json.data);
        if (action === 'grammar') setGrammar(json.data);
        if (action === 'title') { setGenTitle(json.data); onTitleGenerated?.(json.data); }
        if (action === 'improve') setImproved(json.data);
        if (action === 'continue') setContinuation(json.data);
        if (action === 'ask') setAnswer(json.data);
      } else if (json.error) {
        alert(json.error);
      }
    } catch (e) {
      console.error(e);
      alert('AI request failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div data-no-print onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" />
      )}

      {/* Sidebar Panel */}
      <div
        data-no-print
        className={`fixed right-0 top-0 h-full w-full sm:w-96 z-50 overflow-y-auto border-l border-border bg-sidebar shadow-2xl transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-sidebar/90 px-4 py-3 backdrop-blur-md">
          <h2 className="flex items-center gap-2 font-sans text-base font-bold text-foreground">
            <Bot size={20} className="text-accent-strong" /> AI assistant
          </h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted transition-colors hover:text-foreground hover:bg-foreground/[0.06]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {/* Summary */}
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={cardTitle}><span className={chip}><Sparkles size={15} /></span> Summary</h3>
              <button onClick={() => handleAction('summary')} disabled={loading === 'summary'} className={ghostBtn}>
                {loading === 'summary' ? 'Writing…' : 'Generate'}
              </button>
            </div>
            {summary && <p className={result}>{summary}</p>}
          </div>

          {/* Tags */}
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={cardTitle}><span className={chip}><Tag size={15} /></span> Tags</h3>
              <button onClick={() => handleAction('tags')} disabled={loading === 'tags'} className={ghostBtn}>
                {loading === 'tags' ? 'Finding…' : 'Generate'}
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                  <span key={i} className="font-mono text-[11px] px-2 py-0.5 rounded-sm bg-foreground/[0.06] text-muted">#{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={cardTitle}><span className={chip}><Type size={15} /></span> Title</h3>
              <button onClick={() => handleAction('title')} disabled={loading === 'title'} className={ghostBtn}>
                {loading === 'title' ? 'Thinking…' : 'Generate'}
              </button>
            </div>
            {genTitle && <p className={result}>Applied: <span className="font-sans font-semibold">{genTitle}</span></p>}
          </div>

          {/* Improve */}
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={cardTitle}><span className={chip}><Wand2 size={15} /></span> Improve writing</h3>
              <button onClick={() => handleAction('improve')} disabled={loading === 'improve'} className={ghostBtn}>
                {loading === 'improve' ? 'Improving…' : 'Improve'}
              </button>
            </div>
            {improved && (
              <div className="space-y-2">
                <p className={`${result} max-h-40 overflow-y-auto whitespace-pre-wrap`}>{improved}</p>
                <button onClick={() => { onContentChange?.(textToHtml(improved)); setImproved(''); }} className={fillBtn}>
                  Replace note with this
                </button>
              </div>
            )}
          </div>

          {/* Continue */}
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={cardTitle}><span className={chip}><PenLine size={15} /></span> Continue writing</h3>
              <button onClick={() => handleAction('continue')} disabled={loading === 'continue'} className={ghostBtn}>
                {loading === 'continue' ? 'Writing…' : 'Continue'}
              </button>
            </div>
            {continuation && (
              <div className="space-y-2">
                <p className={`${result} max-h-40 overflow-y-auto whitespace-pre-wrap`}>{continuation}</p>
                <button onClick={() => { onContentChange?.(content + textToHtml(continuation)); setContinuation(''); }} className={fillBtn}>
                  Append to note
                </button>
              </div>
            )}
          </div>

          {/* Ask */}
          <div className={card}>
            <div className="mb-3">
              <h3 className={cardTitle}><span className={chip}><MessageCircle size={15} /></span> Ask about this note</h3>
            </div>
            <div className="flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAction('ask'); }}
                placeholder="Ask a question…"
                className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
              />
              <button onClick={() => handleAction('ask')} disabled={loading === 'ask'} className={fillBtn}>
                {loading === 'ask' ? '…' : 'Ask'}
              </button>
            </div>
            {answer && <p className={`${result} mt-3`}>{answer}</p>}
          </div>

          {/* Translate */}
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={cardTitle}><span className={chip}><Languages size={15} /></span> Translate</h3>
            </div>
            <div className="flex gap-2">
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent"
              >
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Japanese">Japanese</option>
                <option value="Hindi">Hindi</option>
              </select>
              <button onClick={() => handleAction('translate')} disabled={loading === 'translate'} className={fillBtn}>
                {loading === 'translate' ? '…' : 'Go'}
              </button>
            </div>
            {translation && (
              <p className="mt-3 rounded-md border border-border bg-foreground/[0.03] p-3 font-sans text-sm italic text-foreground/90">
                &ldquo;{translation}&rdquo;
              </p>
            )}
          </div>

          {/* Grammar */}
          <div className={`${card} mb-20`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={cardTitle}><span className={chip}><CheckCircle size={15} /></span> Grammar</h3>
              <button onClick={() => handleAction('grammar')} disabled={loading === 'grammar'} className={ghostBtn}>
                {loading === 'grammar' ? 'Checking…' : 'Check'}
              </button>
            </div>
            <div className="space-y-2">
              {grammar?.issues.map((issue, i) => (
                <div key={i} className="rounded-md border border-border bg-foreground/[0.03] p-2.5 text-sm">
                  <div className="font-sans text-muted line-through">{issue.original}</div>
                  <div className="mt-0.5 flex items-start gap-1 font-sans text-foreground">
                    <span className="text-accent-strong">➜</span> {issue.suggestion}
                  </div>
                </div>
              ))}
              {grammar?.issues.length === 0 && (
                <p className="font-mono text-xs text-muted">No issues found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
