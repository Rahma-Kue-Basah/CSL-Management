"use client";

import { API_BASE_URL, API_IMAGES } from "@/constants/api";
import { authFetch } from "@/lib/auth";

type UploadedImageResponse = {
  id?: string | number;
  url?: string | null;
};

function resolveAssetUrl(value?: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/${value}`;
}

export async function uploadAnnouncementImage(file: File): Promise<{
  id: string | number;
  url: string;
}> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await authFetch(API_IMAGES, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => ({}))) as UploadedImageResponse & {
    detail?: string;
    image?: string[];
  };

  if (!response.ok) {
    const errorMessage =
      payload.detail ||
      payload.image?.[0] ||
      "Gagal mengunggah gambar pengumuman.";
    throw new Error(errorMessage);
  }

  const url = resolveAssetUrl(payload.url);
  if (!payload.id || !url) {
    throw new Error("Respons upload gambar tidak lengkap.");
  }

  return {
    id: payload.id,
    url,
  };
}
