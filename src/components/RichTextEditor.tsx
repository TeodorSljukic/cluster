"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Underline from "@tiptap/extension-underline";
import { useCallback } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        // Disable link from StarterKit since we're adding it separately
        link: false,
        // Disable underline from StarterKit since we're adding it separately
        underline: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      TextStyle,
      Color,
      Underline,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose-editor",
        "data-placeholder": placeholder || "Enter content...",
      },
    },
  });

  // Update editor content when value prop changes
  if (editor && editor.getHTML() !== value) {
    editor.commands.setContent(value || "");
  }

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;

    const url = window.prompt("Image URL");

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div style={{ marginBottom: "1rem" }}>
      {/* Toolbar */}
      <div
        style={{
          border: "1px solid #ccc",
          borderBottom: "none",
          background: "#fafafa",
          padding: "8px",
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          borderRadius: "4px 4px 0 0",
        }}
      >
        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          style={{
            padding: "6px 10px",
            border: "1px solid #ddd",
            background: editor.isActive("bold") ? "#2271b1" : "white",
            color: editor.isActive("bold") ? "white" : "#333",
            cursor: "pointer",
            borderRadius: "3px",
            fontSize: "13px",
          }}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          style={{
            padding: "6px 10px",
            border: "1px solid #ddd",
            background: editor.isActive("italic") ? "#2271b1" : "white",
            color: editor.isActive("italic") ? "white" : "#333",
            cursor: "pointer",
            borderRadius: "3px",
            fontSize: "13px",
            fontStyle: "italic",
          }}
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          style={{
            padding: "6px 10px",
            border: "1px solid #ddd",
            background: editor.isActive("underline") ? "#2271b1" : "white",
            color: editor.isActive("underline") ? "white" : "#333",
            cursor: "pointer",
            borderRadius: "3px",
            fontSize: "13px",
            textDecoration: "underline",
          }}
          title="Underline"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          style={{
            padding: "6px 10px",
            border: "1px solid #ddd",
            background: editor.isActive("strike") ? "#2271b1" : "white",
            color: editor.isActive("strike") ? "white" : "#333",
            cursor: "pointer",
            borderRadius: "3px",
            fontSize: "13px",
            textDecoration: "line-through",
          }}
          title="Strikethrough"
        >
          S
        </button>

        <div style={{ width: "1px", background: "#ddd", margin: "0 4px" }} />

        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          style={{
            padding: "6px 10px",
            border: "1px solid #ddd",
            background: editor.isActive("heading", { level: 1 }) ? "#2271b1" : "white",
            color: editor.isActive("heading", { level: 1 }) ? "white" : "#333",
            cursor: "pointer",
            borderRadius: "3px",
            fontSize: "13px",
            fontWeight: "bold",
          }}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          style={{
            padding: "6px 10px",
            border: "1px solid #ddd",
            background: editor.isActive("heading", { level: 2 }) ? "#2271b1" : "white",
            color: editor.isActive("heading", { level: 2 }) ? "white" : "#333",
            cursor: "pointer",
            borderRadius: "3px",
            fontSize: "13px",
            fontWeight: "bold",
          }}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          style={{
            padding: "6px 10px",
            border: "1px solid #ddd",
            background: editor.isActive("heading", { level: 3 }) ? "#2271b1" : "white",
            color: editor.isActive("heading", { level: 3 }) ? "white" : "#333",
            cursor: "pointer",
            borderRadius: "3px",
            fontSize: "13px",
            fontWeight: "bold",
          }}
          title="Heading 3"
        >
          H3
        </button>

        <div style={{ width: "1px", background: "#ddd", margin: "0 4px" }} />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={{
            padding: "6px 10px",
            border: "1px solid #ddd",
            background: editor.isActive("bulletList") ? "#2271b1" : "white",
            color: editor.isActive("bulletList") ? "white" : "#333",
            cursor: "pointer",
            borderRadius: "3px",
            fontSize: "13px",
          }}
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          style={{
            padding: "6px 10px",
            border: "1px solid #ddd",
            background: editor.isActive("orderedList") ? "#2271b1" : "white",
            color: editor.isActive("orderedList") ? "white" : "#333",
            cursor: "pointer",
            borderRadius: "3px",
            fontSize: "13px",
          }}
          title="Numbered List"
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          style={{
            padding: "6px 10px",
            border: "1px solid #ddd",
            background: editor.isActive("blockquote") ? "#2271b1" : "white",
            color: editor.isActive("blockquote") ? "white" : "#333",
            cursor: "pointer",
            borderRadius: "3px",
            fontSize: "13px",
          }}
          title="Quote"
        >
          "
        </button>

        <div style={{ width: "1px", background: "#ddd", margin: "0 4px" }} />

        {/* Links and Images */}
        <button
          type="button"
          onClick={setLink}
          style={{
            padding: "6px 10px",
            border: "1px solid #ddd",
            background: editor.isActive("link") ? "#2271b1" : "white",
            color: editor.isActive("link") ? "white" : "#333",
            cursor: "pointer",
            borderRadius: "3px",
            fontSize: "13px",
          }}
          title="Link"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={addImage}
          style={{
            padding: "6px 10px",
            border: "1px solid #ddd",
            background: "white",
            color: "#333",
            cursor: "pointer",
            borderRadius: "3px",
            fontSize: "13px",
          }}
          title="Image"
        >
          🖼️
        </button>

        <div style={{ width: "1px", background: "#ddd", margin: "0 4px" }} />

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          style={{
            padding: "6px 10px",
            border: "1px solid #ddd",
            background: "white",
            color: "#333",
            cursor: "pointer",
            borderRadius: "3px",
            fontSize: "13px",
          }}
          title="Undo"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          style={{
            padding: "6px 10px",
            border: "1px solid #ddd",
            background: "white",
            color: "#333",
            cursor: "pointer",
            borderRadius: "3px",
            fontSize: "13px",
          }}
          title="Redo"
        >
          ↷
        </button>
      </div>

      {/* Editor Content */}
      <div
        style={{
          border: "1px solid #ccc",
          borderTop: "none",
          background: "white",
          minHeight: "300px",
          borderRadius: "0 0 4px 4px",
        }}
      >
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .ProseMirror {
          outline: none;
          min-height: 300px;
          padding: 12px;
          font-size: 15px;
          line-height: 1.6;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #ccc;
          padding-left: 1em;
          margin: 0.5em 0;
          font-style: italic;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          margin: 0.5em 0;
        }
        .ProseMirror a {
          color: #2271b1;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
