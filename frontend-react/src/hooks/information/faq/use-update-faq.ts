"use client";

import { useState } from "react";
import { buildFaqUrl, FAQS_ENDPOINT } from "@/hooks/information/faq/utils";
import { extractApiErrorMessage } from "@/lib/core";
import { faqService, type Faq } from "@/services/information";

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
        const uploadResult = await faqService.uploadImage(payload.imageFile);
        if (!uploadResult.ok) {
          throw new Error(parseFaqError(uploadResult.data, "Gagal mengunggah gambar."));
        }
        const uploadedImage = (uploadResult.data ?? {}) as { id?: string | number };
        if (!uploadedImage.id) {
          throw new Error("Response gambar tidak valid.");
        }
        nextImageId = uploadedImage.id;
      }

      const result = await faqService.update(id, {
        question: payload.question,
        answer: payload.answer,
        image: nextImageId,
      });

      if (!result.ok) {
        const payloadData = result.data ?? {};
        const message = parseFaqError(payloadData, "Gagal memperbarui FAQ.");
        setErrorMessage(message);
        return { ok: false as const, message };
      }

      const data = (result.data ?? null) as Faq | null;

      if (
        payload.imageId &&
        (payload.removeImage || (payload.imageFile && nextImageId && String(payload.imageId) !== String(nextImageId)))
      ) {
        await faqService.deleteImage(payload.imageId);
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
