'use client';
import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline, 
  Heading1, Heading2, List, 
  AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';

interface Props {
  editor: Editor | null;
}

export default function EditorToolbar({ editor }: Props) {
  if (!editor) return null;

  // FIX: We split the logic to satisfy TypeScript
  const isActive = (type: string | object, attrs?: any) => {
    if (typeof type === 'string') {
      return editor.isActive(type, attrs);
    }
    return editor.isActive(type);
  };

  const btnClass = (active: boolean) => 
    `p-2 rounded-md transition-colors ${
      active 
        ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
    }`;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
      
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(isActive('bold'))} title="Bold">
        <Bold size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(isActive('italic'))} title="Italic">
        <Italic size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(isActive('underline'))} title="Underline">
        <Underline size={18} />
      </button>

      <div className="w-px h-5 bg-border mx-2" />

      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(isActive('heading', { level: 1 }))} title="Heading 1">
        <Heading1 size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(isActive('heading', { level: 2 }))} title="Heading 2">
        <Heading2 size={18} />
      </button>

      <div className="w-px h-5 bg-border mx-2" />

      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(isActive('bulletList'))} title="Bullet List">
        <List size={18} />
      </button>
      
      {/* Alignment Buttons Fixed */}
      <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btnClass(isActive({ textAlign: 'left' }))} title="Align Left">
        <AlignLeft size={18} />
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btnClass(isActive({ textAlign: 'center' }))} title="Align Center">
        <AlignCenter size={18} />
      </button>
    </div>
  );
}