'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Undo,
  Redo,
  Code,
} from 'lucide-react';

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function TiptapEditor({ value, onChange, placeholder = 'Rédigez votre contenu...', error }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    const normalizedValue = value || '';
    if (editor.getHTML() !== normalizedValue) {
      editor.commands.setContent(normalizedValue || '<p></p>', { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const toggleBtn = (active: boolean, onClick: () => void, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`p-1.5 rounded transition-colors ${
        active ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {icon}
    </button>
  );

  return (
    <div className={`border rounded-lg overflow-hidden ${error ? 'border-red-300' : 'border-gray-200'}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b">
        {toggleBtn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <Bold className="w-4 h-4" />, 'Gras')}
        {toggleBtn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <Italic className="w-4 h-4" />, 'Italique')}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        {toggleBtn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 className="w-4 h-4" />, 'Titre')}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        {toggleBtn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <List className="w-4 h-4" />, 'Liste')}
        {toggleBtn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered className="w-4 h-4" />, 'Liste numérotée')}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        {toggleBtn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), <Quote className="w-4 h-4" />, 'Citation')}
        {toggleBtn(editor.isActive('code'), () => editor.chain().focus().toggleCode().run(), <Code className="w-4 h-4" />, 'Code')}
        <div className="flex-1" />
        {toggleBtn(false, () => editor.chain().focus().undo().run(), <Undo className="w-4 h-4" />, 'Annuler')}
        {toggleBtn(false, () => editor.chain().focus().redo().run(), <Redo className="w-4 h-4" />, 'Rétablir')}
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="rich-text-editor p-4 min-h-[200px] focus:outline-none [&_.ProseMirror]:min-h-[168px] [&_.ProseMirror]:outline-none [&_.ProseMirror-focused]:ring-0 [&_.ProseMirror-focused]:border-0 [&_.ProseMirror-focused]:shadow-none [&_.ProseMirror::placeholder]:text-gray-400 [&_.ProseMirror>p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror>p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror>p.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror>p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror>p.is-editor-empty:first-child::before]:h-0"
      />
    </div>
  );
}
