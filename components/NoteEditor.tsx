'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import EditorToolbar from './EditorToolbar';
import { useEffect } from 'react';

interface Props {
  title: string;
  content: string;
  onChange: (data: { title: string; content: string }) => void;
}

export default function NoteEditor({ title, content, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
    ],
    content: content,
    immediatelyRender: false, 
    editorProps: {
      attributes: {
        // We use the CSS variable for color to ensure it matches your theme perfectly
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[60vh] px-4',
        style: 'color: var(--foreground)', 
      },
    },
    onUpdate: ({ editor }) => {
      onChange({ title, content: editor.getHTML() });
    },
  });

  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
       editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="flex flex-col w-full mx-auto min-h-screen bg-background pb-20">
      
      {/* TOOLBAR */}
      <EditorToolbar editor={editor} />
      
      <div className="max-w-4xl mx-auto w-full mt-6">
         {/* TITLE INPUT */}
        <input 
          type="text"
          value={title}
          onChange={(e) => onChange({ title: e.target.value, content: editor?.getHTML() || '' })}
          placeholder="Untitled Note"
          // NUCLEAR OPTION: We force the color using the CSS variable from your globals.css
          style={{ color: 'var(--foreground)' }}
          className="w-full bg-transparent px-4 py-4 text-5xl font-extrabold outline-none border-none 
          placeholder-gray-400 h-auto mb-4 leading-normal"
        />
        
        {/* EDITOR AREA */}
        {/* We also force the color here to ensure the text body is visible */}
        <div style={{ color: 'var(--foreground)' }}>
            <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}