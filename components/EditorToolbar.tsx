'use client';
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline,
  Heading1, Heading2, List,
  AlignLeft, AlignCenter,
  Copy, Download, Printer
} from 'lucide-react';
import { copyMarkdown, downloadMarkdown, exportPdf } from '@/lib/export';

interface Props {
  editor: Editor | null;
  title?: string;
}

export default function EditorToolbar({ editor, title }: Props) {
  if (!editor) return null;

  const exportBtn = 'p-2 rounded-md transition-colors text-muted hover:bg-foreground/[0.06] hover:text-accent-strong';

  const btnClass = (active: boolean) =>
    `p-2 rounded-md transition-colors ${
      active
        ? 'bg-accent/15 text-accent-strong'
        : 'text-muted hover:bg-foreground/[0.06] hover:text-foreground'
    }`;

  return (
    <div data-no-print className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
      
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Bold">
        <Bold size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italic">
        <Italic size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Underline">
        <Underline size={18} />
      </button>

      <div className="w-px h-5 bg-border mx-2" />

      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))} title="Heading 1">
        <Heading1 size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Heading 2">
        <Heading2 size={18} />
      </button>

      <div className="w-px h-5 bg-border mx-2" />

      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Bullet List">
        <List size={18} />
      </button>
      
      {/* Alignment Buttons Fixed */}
      <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btnClass(editor.isActive({ textAlign: 'left' }))} title="Align Left">
        <AlignLeft size={18} />
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btnClass(editor.isActive({ textAlign: 'center' }))} title="Align Center">
        <AlignCenter size={18} />
      </button>

      {/* Export actions, pushed to the right */}
      <div className="ml-auto flex items-center gap-1">
        <button onClick={() => copyMarkdown(editor.getHTML())} className={exportBtn} title="Copy as Markdown">
          <Copy size={18} />
        </button>
        <button onClick={() => downloadMarkdown(editor.getHTML(), title)} className={exportBtn} title="Download .md">
          <Download size={18} />
        </button>
        <button onClick={exportPdf} className={exportBtn} title="Export PDF / Print">
          <Printer size={18} />
        </button>
      </div>
    </div>
  );
}