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
  ImageBlock,
  ImageCaption,
  ImageInsert,
  ImageResize,
  ImageStyle,
  ImageTextAlternative,
  ImageToolbar,
  ImageUpload,
  Italic,
  Link,
  List,
  ListProperties,
  Paragraph,
  type EditorConfig,
} from "ckeditor5";

import "ckeditor5/ckeditor5.css";

import { uploadAnnouncementImage } from "@/lib/information/announcement-images";

type EditorWithUploadAdapter = Editor & {
  plugins: {
    get: (name: "FileRepository") => {
      createUploadAdapter?: (
        loader: AnnouncementImageLoader,
      ) => AnnouncementImageUploadAdapter;
    };
  };
};

type AnnouncementImageLoader = {
  file?: Promise<File | null>;
};

class AnnouncementImageUploadAdapter {
  private loader: AnnouncementImageLoader;
  private aborted = false;

  constructor(loader: AnnouncementImageLoader) {
    this.loader = loader;
  }

  async upload() {
    const file = await this.loader.file;

    if (!file || this.aborted) {
      throw new Error("Unggah gambar dibatalkan.");
    }

    const { url } = await uploadAnnouncementImage(file);

    if (this.aborted) {
      throw new Error("Unggah gambar dibatalkan.");
    }

    return { default: url };
  }

  abort() {
    this.aborted = true;
  }
}

function announcementImageUploadPlugin(editor: Editor) {
  const fileRepository = (editor as EditorWithUploadAdapter).plugins.get(
    "FileRepository",
  );

  fileRepository.createUploadAdapter = (loader) =>
    new AnnouncementImageUploadAdapter(loader);
}

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
    ImageBlock,
    ImageCaption,
    ImageInsert,
    ImageResize,
    ImageStyle,
    ImageTextAlternative,
    ImageToolbar,
    ImageUpload,
  ],
  extraPlugins: [announcementImageUploadPlugin],
  toolbar: [
    "heading",
    "|",
    "bold",
    "italic",
    "|",
    "link",
    "|",
    "uploadImage",
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
  image: {
    toolbar: [
      "imageTextAlternative",
      "|",
      "toggleImageCaption",
      "|",
      "imageStyle:block",
      "imageStyle:inline",
    ],
    resizeOptions: [
      {
        name: "resizeImage:original",
        value: null,
        label: "Asli",
      },
      {
        name: "resizeImage:50",
        value: "50",
        label: "50%",
      },
      {
        name: "resizeImage:75",
        value: "75",
        label: "75%",
      },
    ],
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
