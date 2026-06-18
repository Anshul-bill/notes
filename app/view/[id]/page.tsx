'use client';
import { use, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Lock, Loader2, Eye } from 'lucide-react';

// Read-only share view. Renders through TipTap (editable: false) so stored HTML is
// parsed into TipTap's safe schema — no raw dangerouslySetInnerHTML, no XSS.
export default function ViewNote({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [state, setState] = useState<'loading' | 'notfound' | 'locked' | 'ready'>('loading');
  const [title, setTitle] = useState('');

  const editor = useEditor({
    editable: false,
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none',
        style: 'color: var(--foreground)',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    fetch(`/api/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) { setState('notfound'); return; }
        setTitle(json.data.title || '');
        if (json.data.isEncrypted) { setState('locked'); return; }
        editor.commands.setContent(json.data.content || '');
        setState('ready');
      })
      .catch(() => setState('notfound'));
  }, [id, editor]);

  if (state === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400 gap-2">
        <Loader2 className="animate-spin" /> Loading…
      </div>
    );
  }

  if (state === 'notfound') {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">Note not found</div>
    );
  }

  if (state === 'locked') {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center text-muted">
        <Lock size={32} className="mb-4 text-accent-strong" />
        <h2 className="text-xl font-bold text-foreground mb-1">{title || 'Encrypted note'}</h2>
        <p className="text-sm">This note is encrypted and can&rsquo;t be viewed read-only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto w-full px-6 pt-16 md:pt-10 pb-10">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted mb-6">
          <Eye size={14} /> Read-only
        </div>
        <h1 className="font-sans text-5xl font-bold tracking-tight mb-6 leading-tight" style={{ color: 'var(--foreground)' }}>
          {title || 'Untitled Note'}
        </h1>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
