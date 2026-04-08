"use client";


import { useEffect, useRef, useState, type FormEvent } from "react";

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

import { Megaphone } from "lucide-react";

import "ckeditor5/ckeditor5.css";

import { AdminDetailDialogShell, AdminDetailActions, InlineErrorAlert } from "@/components/shared";

import { USER_MODAL_WIDTH_CLASS } from "@/components/admin/user-management";

import { Button, DialogFooter, Input } from "@/components/ui";

import { stripHtmlTags } from "@/lib/text";

const DIALOG_WIDTH_CLASS = `${USER_MODAL_WIDTH_CLASS} gap-0 p-0 [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6]`;

function shouldKeepAnnouncementDialogOpen(
  target: EventTarget | null,
  originalEvent: Event | null,
) {
  const targetElement =
    target instanceof HTMLElement
      ? target
      : target instanceof SVGElement
        ? target
        : null;

  if (
    targetElement?.closest(
      ".ck.ck-balloon-panel, .ck-body-wrapper, .ck.ck-powered-by-balloon",
    )
  ) {
    return true;
  }

  if (!(originalEvent instanceof Event)) return false;

  return originalEvent.composedPath().some((node) => {
    if (!(node instanceof HTMLElement) && !(node instanceof SVGElement)) {
      return false;
    }

    return Boolean(
      node.closest(
        ".ck.ck-balloon-panel, .ck-body-wrapper, .ck.ck-powered-by-balloon",
      ),
    );
  });
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

function AnnouncementRichTextEditor({
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
          placeholder:
            placeholder ?? ANNOUNCEMENT_EDITOR_CONFIG.placeholder,
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

export type AnnouncementDetailMode = "view" | "edit";

type CreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleValue: string;
  contentValue: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  error?: string;
};

export function AnnouncementCreateDialog({
  open,
  onOpenChange,
  titleValue,
  contentValue,
  onTitleChange,
  onContentChange,
  onSubmit,
  isSubmitting,
  error,
}: CreateDialogProps) {
  return (
    <AdminDetailDialogShell
      open={open}
      onOpenChange={onOpenChange}
      dialogProps={{ modal: false }}
      contentProps={{
        onInteractOutside: (event) => {
          if (
            shouldKeepAnnouncementDialogOpen(
              event.target,
              event.detail.originalEvent,
            )
          ) {
            event.preventDefault();
          }
        },
        onPointerDownOutside: (event) => {
          if (
            shouldKeepAnnouncementDialogOpen(
              event.target,
              event.detail.originalEvent,
            )
          ) {
            event.preventDefault();
          }
        },
        onFocusOutside: (event) => {
          if (
            shouldKeepAnnouncementDialogOpen(
              event.target,
              event.detail.originalEvent,
            )
          ) {
            event.preventDefault();
          }
        },
      }}
      title="Tambah Pengumuman"
      description="Buat pengumuman baru untuk ditampilkan kepada pengguna."
      icon={<Megaphone className="h-5 w-5" />}
      contentClassName={DIALOG_WIDTH_CLASS}
    >
      <form className="space-y-4 px-5 py-4 sm:px-6" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Judul</label>
            <Input
              name="title"
              value={titleValue}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Contoh: Maintenance jaringan Jumat"
              className="border-sky-300 bg-sky-50/60 shadow-sm focus-visible:border-sky-600 focus-visible:ring-sky-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Isi Pengumuman
            </label>
            <AnnouncementRichTextEditor
              value={contentValue}
              onChange={onContentChange}
            />
          </div>
          {error ? (
            <InlineErrorAlert>{error}</InlineErrorAlert>
          ) : null}
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0052C7] text-white hover:bg-[#0048B4]"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Pengumuman"}
            </Button>
          </DialogFooter>
      </form>
    </AdminDetailDialogShell>
  );
}

type EditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: AnnouncementDetailMode;
  onCancelEdit?: () => void;
  onDeleteRequest?: () => void;
  titleValue: string;
  contentValue: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  error?: string;
};

export function AnnouncementEditDialog({
  open,
  onOpenChange,
  initialMode = "edit",
  onCancelEdit,
  onDeleteRequest,
  titleValue,
  contentValue,
  onTitleChange,
  onContentChange,
  onSubmit,
  isSubmitting,
  error,
}: EditDialogProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const openedInEditMode = initialMode === "edit";

  useEffect(() => {
    if (!open) return;
    setIsEditing(initialMode === "edit");
  }, [initialMode, open]);

  const readOnly = !isEditing;

  return (
    <AdminDetailDialogShell
      open={open}
      onOpenChange={onOpenChange}
      onCloseReset={() => setIsEditing(false)}
      dialogProps={{ modal: false }}
      contentProps={{
        onInteractOutside: (event) => {
          if (
            shouldKeepAnnouncementDialogOpen(
              event.target,
              event.detail.originalEvent,
            )
          ) {
            event.preventDefault();
          }
        },
        onPointerDownOutside: (event) => {
          if (
            shouldKeepAnnouncementDialogOpen(
              event.target,
              event.detail.originalEvent,
            )
          ) {
            event.preventDefault();
          }
        },
        onFocusOutside: (event) => {
          if (
            shouldKeepAnnouncementDialogOpen(
              event.target,
              event.detail.originalEvent,
            )
          ) {
            event.preventDefault();
          }
        },
      }}
      title={readOnly ? "Detail Pengumuman" : "Edit Pengumuman"}
      description={
        readOnly
          ? "Tinjau judul dan isi pengumuman."
          : "Perbarui judul dan isi pengumuman yang akan tampil kepada pengguna."
      }
      icon={<Megaphone className="h-5 w-5" />}
      contentClassName={DIALOG_WIDTH_CLASS}
    >
      <form ref={formRef} className="space-y-4 px-6 pb-6" onSubmit={onSubmit}>
          {readOnly ? (
            <>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-700">Judul</p>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {titleValue || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-700">Isi Pengumuman</p>
                <div className="min-h-36 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {stripHtmlTags(contentValue) ? (
                    <div
                      className="announcement-rich-text-content break-words text-sm text-slate-700"
                      dangerouslySetInnerHTML={{ __html: contentValue }}
                    />
                  ) : (
                    "-"
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Judul</label>
                <Input
                  name="title"
                  value={titleValue}
                  onChange={(event) => onTitleChange(event.target.value)}
                  placeholder="Judul pengumuman"
                  className="border-sky-300 bg-sky-50/60 shadow-sm focus-visible:border-sky-600 focus-visible:ring-sky-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Isi Pengumuman
                </label>
                <AnnouncementRichTextEditor
                  value={contentValue}
                  onChange={onContentChange}
                  placeholder="Tulis detail pengumuman"
                />
              </div>
            </>
          )}
          {error ? (
            <InlineErrorAlert>{error}</InlineErrorAlert>
          ) : null}
          <AdminDetailActions
            isEditing={!readOnly}
            isSubmitting={isSubmitting}
            showDeleteAction={Boolean(onDeleteRequest)}
            deleteLabel="Hapus"
            saveLabel="Simpan Perubahan"
            onEdit={() => setIsEditing(true)}
            onCancelEdit={() => {
              setIsEditing(false);
              if (openedInEditMode) {
                onOpenChange(false);
                return;
              }
              if (onCancelEdit) {
                onCancelEdit();
                return;
              }
              onOpenChange(false);
            }}
            onSave={() => formRef.current?.requestSubmit()}
            onDelete={onDeleteRequest}
          />
      </form>
    </AdminDetailDialogShell>
  );
}
