"use client";

import { useState } from "react";
import { FAQS_ENDPOINT } from "@/hooks/information/faq/utils";
import { extractApiErrorMessage } from "@/lib/core/api-error";
import { faqService, type Faq } from "@/services/information/faq.service";

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

export function useCreateFaq() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createFaq = async (payload: CreateFaqPayload) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      let imageId: string | number | null = null;
      if (payload.imageFile) {
        const uploadResult = await faqService.uploadImage(payload.imageFile);
        if (!uploadResult.ok) {
          throw new Error(parseFaqError(uploadResult.data, "Gagal mengunggah gambar."));
        }
        const uploadedImage = (uploadResult.data ?? {}) as { id?: string | number };
        if (!uploadedImage.id) {
          throw new Error("Response gambar tidak valid.");
        }
        imageId = uploadedImage.id;
      }

      const result = await faqService.create({
        question: payload.question,
        answer: payload.answer,
        image: imageId,
      });

      if (!result.ok) {
        const payloadData = result.data ?? {};
        const message = parseFaqError(payloadData, "Gagal membuat FAQ.");
        setErrorMessage(message);
        return { ok: false as const, message };
      }

      const data = (result.data ?? null) as Faq | null;
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
