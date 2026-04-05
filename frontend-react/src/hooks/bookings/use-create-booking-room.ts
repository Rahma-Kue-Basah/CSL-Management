"use client";

import { useState } from "react";

import { API_BOOKINGS } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import {
  extractApiErrorMessage,
  extractApiErrorMessageFromText,
} from "@/lib/api-error";

type CreateBookingRoomPayload = {
  roomId: string;
  purpose: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  attendeeNames?: string;
  note?: string;
  requesterPhone?: string;
  requesterMentor?: string;
  requesterMentorProfileId?: string;
  institution?: string;
  institutionAddress?: string;
  workshopTitle?: string;
  workshopPic?: string;
  workshopInstitution?: string;
  equipmentItems?: Array<{
    equipmentId: string;
    quantity: number;
  }>;
};

function parseBookingError(data: unknown, fallback = "Gagal membuat peminjaman lab.") {
  return extractApiErrorMessage(data, fallback, [
    "attendee_count",
    "requester_phone",
    "requester_mentor",
    "requester_mentor_profile",
    "institution",
    "institution_address",
    "workshop_title",
    "workshop_pic",
    "workshop_institution",
    "room",
    "purpose",
    "start_time",
    "end_time",
    "note",
    "equipment_items",
  ]);
}

export function useCreateBookingRoom() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createBookingRoom = async (payload: CreateBookingRoomPayload) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        room: payload.roomId,
        purpose: payload.purpose.trim(),
        start_time: payload.startTime,
        end_time: payload.endTime,
        attendee_count: payload.attendeeCount,
      };
      if (payload.attendeeNames?.trim()) body.attendee_names = payload.attendeeNames.trim();
      if (payload.note?.trim()) body.note = payload.note.trim();
      if (payload.requesterPhone?.trim()) body.requester_phone = payload.requesterPhone.trim();
      if (payload.requesterMentor?.trim()) body.requester_mentor = payload.requesterMentor.trim();
      if (payload.requesterMentorProfileId?.trim()) {
        body.requester_mentor_profile = payload.requesterMentorProfileId.trim();
      }
      if (payload.institution?.trim()) body.institution = payload.institution.trim();
      if (payload.institutionAddress?.trim()) body.institution_address = payload.institutionAddress.trim();
      if (payload.workshopTitle?.trim()) body.workshop_title = payload.workshopTitle.trim();
      if (payload.workshopPic?.trim()) body.workshop_pic = payload.workshopPic.trim();
      if (payload.workshopInstitution?.trim()) {
        body.workshop_institution = payload.workshopInstitution.trim();
      }
      if (Array.isArray(payload.equipmentItems) && payload.equipmentItems.length > 0) {
        body.equipment_items = payload.equipmentItems.map((item) => ({
          equipment: item.equipmentId.trim(),
          quantity: item.quantity,
        }));
      }

      const response = await authFetch(API_BOOKINGS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return { ok: true as const };
      }

      let message = "Gagal membuat peminjaman lab. Periksa data lalu coba lagi.";
      try {
        const raw = await response.text();
        try {
          const data = JSON.parse(raw) as unknown;
          message = parseBookingError(data, message);
        } catch {
          message = extractApiErrorMessageFromText(raw, message);
        }
      } catch {
        // ignore parse error
      }

      setErrorMessage(message);
      return { ok: false as const, message };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createBookingRoom, isSubmitting, errorMessage, setErrorMessage };
}

export default useCreateBookingRoom;
