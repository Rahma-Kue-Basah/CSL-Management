"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CircleHelp } from "lucide-react";

import { USER_MODAL_WIDTH_CLASS } from "@/components/admin/user-management/user-management-fields";
import AdminDetailActions from "@/components/shared/admin-detail-actions";
import AdminDetailDialogShell from "@/components/shared/admin-detail-dialog-shell";
import InlineErrorAlert from "@/components/shared/inline-error-alert";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type FaqFormState = {
  question: string;
  answer: string;
};

export type FaqDetailMode = "view" | "edit";

function FaqDetailField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-700">{label}</p>
      <div
        className={`rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 ${
          multiline ? "min-h-36 whitespace-pre-wrap break-words" : ""
        }`}
      >
        {value || "-"}
      </div>
    </div>
  );
}

type FaqFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  readOnlyTitle?: string;
  readOnlyDescription?: string;
  initialMode?: FaqDetailMode;
  onCancelEdit?: () => void;
  onDeleteRequest?: () => void;
  form: FaqFormState;
  onChange: (field: keyof FaqFormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  error: string;
  trigger?: ReactNode;
  useDetailHeader?: boolean;
  readOnly?: boolean;
};

export default function FaqFormDialog({
  open,
  onOpenChange,
  title,
  description,
  readOnlyTitle,
  readOnlyDescription,
  initialMode = "edit",
  onCancelEdit,
  onDeleteRequest,
  form,
  onChange,
  onSubmit,
  isSubmitting,
  error,
  trigger,
  useDetailHeader = false,
  readOnly = false,
}: FaqFormDialogProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const openedInEditMode = initialMode === "edit";

  useEffect(() => {
    if (!open) return;
    setIsEditing(initialMode === "edit" && !readOnly);
  }, [initialMode, open, readOnly]);

  const isReadOnly = readOnly || !isEditing;
  const shellTitle = isReadOnly ? (readOnlyTitle ?? title) : title;
  const shellDescription =
    isReadOnly ? (readOnlyDescription ?? description) : description;

  return (
    <AdminDetailDialogShell
      open={open}
      onOpenChange={onOpenChange}
      onCloseReset={() => setIsEditing(false)}
      title={shellTitle}
      description={shellDescription}
      icon={<CircleHelp className="h-5 w-5" />}
      trigger={trigger}
      contentClassName={`${USER_MODAL_WIDTH_CLASS} gap-0 p-0 [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6]`}
      showCloseButton={!useDetailHeader}
    >
      {!useDetailHeader ? (
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        ) : null}

        <form
          ref={formRef}
          className={`space-y-4 ${useDetailHeader ? "px-5 py-4 sm:px-6" : "px-6 pb-6"}`}
          onSubmit={onSubmit}
        >
          {isReadOnly ? (
            <>
              <FaqDetailField label="Pertanyaan" value={form.question} />
              <FaqDetailField label="Jawaban" value={form.answer} multiline />
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">
                  Pertanyaan
                </label>
                <Input
                  value={form.question}
                  onChange={(event) => onChange("question", event.target.value)}
                  placeholder="Masukkan pertanyaan yang sering diajukan"
                  className="h-11 border-sky-300 bg-sky-50/60 shadow-sm focus-visible:border-sky-600 focus-visible:ring-sky-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">
                  Jawaban
                </label>
                <Textarea
                  value={form.answer}
                  onChange={(event) => onChange("answer", event.target.value)}
                  placeholder="Masukkan jawaban FAQ"
                  className="min-h-36 resize-y border-sky-300 bg-sky-50/60 shadow-sm focus-visible:border-sky-600 focus-visible:ring-sky-200"
                />
              </div>
            </>
          )}

          {error ? <InlineErrorAlert>{error}</InlineErrorAlert> : null}

          <AdminDetailActions
            isEditing={!isReadOnly}
            isSubmitting={isSubmitting}
            showDeleteAction={Boolean(onDeleteRequest)}
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
            onSave={() => {
              formRef.current?.requestSubmit();
            }}
            onDelete={onDeleteRequest}
          />
        </form>
    </AdminDetailDialogShell>
  );
}
