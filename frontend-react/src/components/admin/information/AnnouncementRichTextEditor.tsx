"use client";

import { useEffect, useRef } from "react";

import { CKEditor } from "@ckeditor/ckeditor5-react";

import {
  AutoLink,
  Bold,
  ClassicEditor,
  type Editor,
  Essentials,
  Heading,
  Italic,
  Link,
  List,
  ListProperties,
  Paragraph,
  type EditorConfig,
} from "ckeditor5";

import "ckeditor5/ckeditor5.css";

const ANNOUNCEMENT_EDITOR_CONFIG: EditorConfig = {
  licenseKey: "GPL",
  plugins: [
    Essentials,
    Paragraph,
    Heading,
    Bold,
    Italic,
    Link,
    AutoLink,
    List,
    ListProperties,
  ],
  toolbar: [
    "heading",
    "|",
    "bold",
    "italic",
    "|",
    "link",
    "|",
    "bulletedList",
    "numberedList",
    "|",
    "undo",
    "redo",
  ],
  heading: {
    options: [
      {
        model: "paragraph",
        title: "Paragraph",
        class: "ck-heading_paragraph",
      },
      {
        model: "heading2",
        view: "h2",
        title: "Heading 2",
        class: "ck-heading_heading2",
      },
      {
        model: "heading3",
        view: "h3",
        title: "Heading 3",
        class: "ck-heading_heading3",
      },
    ],
  },
  placeholder: "Tulis detail pengumuman yang akan ditampilkan.",
  link: {
    addTargetToExternalLinks: true,
    defaultProtocol: "https://",
    decorators: {
      openInNewTab: {
        mode: "automatic",
        callback: (url: string | null) =>
          typeof url === "string" && /^(https?:)?\/\//.test(url),
        attributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      },
    },
  },
  list: {
    properties: {
      styles: true,
      startIndex: true,
      reversed: true,
    },
  },
};

export default function AnnouncementRichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) return;

    const currentData = editor.getData();
    if (currentData === value) return;

    editor.setData(value);
  }, [value]);

  return (
    <div className="announcement-rich-text-editor rounded-md border border-sky-300 bg-sky-50/60 shadow-sm">
      <CKEditor
        editor={ClassicEditor}
        disabled={disabled}
        config={{
          ...ANNOUNCEMENT_EDITOR_CONFIG,
          placeholder: placeholder ?? ANNOUNCEMENT_EDITOR_CONFIG.placeholder,
        }}
        data={value}
        onReady={(editor) => {
          editorRef.current = editor;
        }}
        onChange={(_, editor) => onChange(editor.getData())}
        onAfterDestroy={() => {
          editorRef.current = null;
        }}
      />
    </div>
  );
}
