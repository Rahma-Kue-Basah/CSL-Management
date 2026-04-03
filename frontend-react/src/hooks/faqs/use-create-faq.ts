"use client";

import { useState } from "react";

import { API_IMAGES } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { FAQS_ENDPOINT } from "@/hooks/faqs/utils";
import type { Faq } from "@/hooks/faqs/use-faqs";
import { extractApiErrorMessage } from "@/lib/api-error";

type CreateFaqPayload = {
  question: string;
  answer: string;
  imageFile?: File | null;
};

function parseFaqError(data: unknown, fallback = "Gagal membuat FAQ.") {
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

export function useCreateFaq() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createFaq = async (payload: CreateFaqPayload) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      let imageId: string | number | null = null;
      if (payload.imageFile) {
        imageId = await uploadImage(payload.imageFile);
      }

      const response = await authFetch(FAQS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: payload.question,
          answer: payload.answer,
          image: imageId,
        }),
      });

      if (!response.ok) {
        const payloadData = await response.json().catch(() => ({}));
        const message = parseFaqError(payloadData, "Gagal membuat FAQ.");
        setErrorMessage(message);
        return { ok: false as const, message };
      }

      const data = (await response.json().catch(() => null)) as Faq | null;
      return { ok: true as const, data };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat membuat FAQ.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createFaq, isSubmitting, errorMessage, setErrorMessage };
}

export default useCreateFaq;
