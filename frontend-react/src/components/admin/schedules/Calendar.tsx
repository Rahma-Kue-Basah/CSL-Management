"use client";

import { Badge, Calendar as RsuiteCalendar } from "rsuite";

import type { CalendarEvent } from "@/hooks/shared/calendar/use-calendar-events";

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getCalendarDotClass(source: string) {
  if (source === "schedule") return "bg-sky-500";
  if (source === "booking") return "bg-emerald-500";
  if (source === "use") return "bg-amber-500";
  return "bg-slate-500";
}

type CalendarProps = {
  events: CalendarEvent[];
  selectedDate: Date;
  onSelect: (value: Date) => void;
};

export default function Calendar({
  events,
  selectedDate,
  onSelect,
}: CalendarProps) {
  const renderCell = (date: Date) => {
    const dayItems = events.filter((item) =>
      isSameDay(new Date(item.start_time), date),
    );

    if (!dayItems.length) return null;

    const hasUse = dayItems.some((item) => item.source === "use");
    const hasBooking = dayItems.some((item) => item.source === "booking");
    const markerClass = hasUse
      ? getCalendarDotClass("use")
      : hasBooking
        ? getCalendarDotClass("booking")
        : getCalendarDotClass("schedule");

    return (
      <div className="mt-1 flex justify-center">
        <Badge className="!mr-0">
          <span className={`block h-2 w-2 rounded-full ${markerClass}`} />
        </Badge>
      </div>
    );
  };

  return (
    <div className="inline-block w-fit max-w-full justify-self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <RsuiteCalendar
        compact
        value={selectedDate}
        onSelect={(value) => onSelect(value ?? new Date())}
        renderCell={renderCell}
        style={{ width: 388 }}
      />
    </div>
  );
}
