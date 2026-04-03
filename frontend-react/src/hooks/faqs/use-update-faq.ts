"use client";

import { useState } from "react";

import { API_IMAGES, API_IMAGE_DETAIL } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { buildFaqUrl, FAQS_ENDPOINT } from "@/hooks/faqs/utils";
import type { Faq } from "@/hooks/faqs/use-faqs";
import { extractApiErrorMessage } from "@/lib/api-error";

type UpdateFaqPayload = {
  question: string;
  answer: string;
  imageId?: string | number | null;
  imageFile?: File | null;
  removeImage?: boolean;
};

function parseFaqError(data: unknown, fallback = "Gagal memperbarui FAQ.") {
  return extractApiErrorMessage(data, fallback, [
    "question",
    "answer",
    "image",
  ]);
}

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await authFetch(API_IMAGES, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = "Gagal mengunggah gambar.";
    try {
      const data = (await response.json()) as unknown;
      message = parseFaqError(data, message);
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  const data = (await response.json()) as { id?: string | number };
  if (!data?.id) {
    throw new Error("Response gambar tidak valid.");
  }

  return data.id;
}

export function useUpdateFaq() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateFaq = async (
    id: string | number,
    payload: UpdateFaqPayload,
  ) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      let nextImageId = payload.removeImage ? null : (payload.imageId ?? null);
      if (payload.imageFile) {
        nextImageId = await uploadImage(payload.imageFile);
      }

      const response = await authFetch(buildFaqUrl(FAQS_ENDPOINT, id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: payload.question,
          answer: payload.answer,
          image: nextImageId,
        }),
      });

      if (!response.ok) {
        const payloadData = await response.json().catch(() => ({}));
        const message = parseFaqError(payloadData, "Gagal memperbarui FAQ.");
        setErrorMessage(message);
        return { ok: false as const, message };
      }

      const data = (await response.json().catch(() => null)) as Faq | null;

      if (
        payload.imageId &&
        (payload.removeImage || (payload.imageFile && nextImageId && String(payload.imageId) !== String(nextImageId)))
      ) {
        try {
          await authFetch(API_IMAGE_DETAIL(payload.imageId), { method: "DELETE" });
        } catch {
          // ignore cleanup errors
        }
      }

      return { ok: true as const, data };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memperbarui FAQ.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { updateFaq, isSubmitting, errorMessage, setErrorMessage };
}

export default useUpdateFaq;
