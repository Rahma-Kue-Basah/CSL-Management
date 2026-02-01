"use client";

import { useState } from "react";

import { API_IMAGES, API_ROOMS, API_ROOM_DETAIL } from "@/constants/api";
import { authFetch } from "@/lib/auth-fetch";

function parseRoomError(data, fallback = "Gagal menyimpan ruangan.") {
  if (!data || typeof data !== "object") return fallback;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.non_field_errors?.[0] === "string")
    return data.non_field_errors[0];
  if (typeof data.name?.[0] === "string") return data.name[0];
  if (typeof data.capacity?.[0] === "string") return data.capacity[0];
  if (typeof data.number?.[0] === "string") return data.number[0];
  if (typeof data.floor?.[0] === "string") return data.floor[0];
  if (typeof data.pic?.[0] === "string") return data.pic[0];
  if (typeof data.image?.[0] === "string") return data.image[0];
  return fallback;
}

async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const resp = await authFetch(API_IMAGES, {
    method: "POST",
    body: formData,
  });

  if (!resp.ok) {
    let message = "Gagal mengunggah gambar.";
    try {
      const data = await resp.json();
      message = parseRoomError(data, message);
    } catch (_) {
      // ignore parse error
    }
    throw new Error(message);
  }

  const data = await resp.json();
  if (!data?.id) {
    throw new Error("Response gambar tidak valid.");
  }
  return data.id;
}

function buildPayload(payload) {
  const body = {
    name: payload.name?.trim(),
    capacity: Number(payload.capacity),
    number: payload.number?.trim(),
    floor: Number(payload.floor),
  };

  if (payload.description?.trim()) body.description = payload.description.trim();
  if (payload.picId) body.pic = payload.picId;

  return body;
}

export function useRoomActions() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createRoom = async (payload) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      let imageId = null;
      if (payload?.imageFile) {
        imageId = await uploadImage(payload.imageFile);
      }

      const body = buildPayload(payload);
      if (imageId) body.image = imageId;

      const resp = await authFetch(API_ROOMS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (resp.ok) {
        let data = null;
        try {
          data = await resp.json();
        } catch (_) {
          // ignore parse error
        }
        return { ok: true, data };
      }

      let message = "Gagal membuat ruangan. Periksa data dan coba lagi.";
      try {
        const data = await resp.json();
        message = parseRoomError(data, message);
      } catch (_) {
        // ignore parse error
      }
      setErrorMessage(message);
      return { ok: false, message };
    } catch (error) {
      const message = error.message || "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateRoom = async (id, payload) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      let imageId = payload.imageId || null;
      if (payload?.imageFile) {
        imageId = await uploadImage(payload.imageFile);
      }

      const body = buildPayload(payload);
      if (imageId) body.image = imageId;

      const resp = await authFetch(API_ROOM_DETAIL(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (resp.ok) {
        let data = null;
        try {
          data = await resp.json();
        } catch (_) {
          // ignore parse error
        }
        return { ok: true, data };
      }

      let message = "Gagal memperbarui ruangan. Periksa data dan coba lagi.";
      try {
        const data = await resp.json();
        message = parseRoomError(data, message);
      } catch (_) {
        // ignore parse error
      }
      setErrorMessage(message);
      return { ok: false, message };
    } catch (error) {
      const message = error.message || "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createRoom,
    updateRoom,
    isSubmitting,
    errorMessage,
    setErrorMessage,
  };
}

export default useRoomActions;
