"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { HourlyScheduleTable, InlineErrorAlert } from "@/components/shared";
import { useCalendarEvents } from "@/hooks/shared/calendar";
import { parseDateKey } from "@/lib/date";
import { normalizeText } from "@/lib/text";

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const roomFilter = searchParams.get("room") ?? "";
  const categoryFilter = searchParams.get("category") ?? "";
  const selectedDateParam = searchParams.get("date") ?? "";
  const selectedDate = selectedDateParam ? parseDateKey(selectedDateParam) ?? new Date() : new Date();
  const { events, error } = useCalendarEvents();

  const filteredEvents = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    return events.filter((item) => {
      if (categoryFilter && item.source !== categoryFilter) return false;
      if (roomFilter && item.room_id !== roomFilter) return false;
      if (!normalizedQuery) return true;
      return normalizeText(`${item.title} ${item.room_name ?? ""}`).includes(normalizedQuery);
    });
  }, [categoryFilter, events, query, roomFilter]);

  const selectedDayEvents = useMemo(() => {
    return filteredEvents
      .filter((item) => isSameDay(new Date(item.start_time), selectedDate))
      .sort(
        (left, right) =>
          new Date(left.start_time).getTime() -
          new Date(right.start_time).getTime(),
      );
  }, [filteredEvents, selectedDate]);

  return (
    <section className="space-y-4">
      {error ? (
        <InlineErrorAlert>{error}</InlineErrorAlert>
      ) : null}

      <HourlyScheduleTable
        events={selectedDayEvents}
        title={`Agenda ${selectedDate.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}`}
      />
    </section>
  );
}
