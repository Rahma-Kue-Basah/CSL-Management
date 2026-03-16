"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Calendar as RsuiteCalendar } from "rsuite";
import { CalendarDays, Clock3 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useCalendarEvents } from "@/hooks/calendar/use-calendar-events";

function getYearBounds(date: Date) {
  const year = date.getFullYear();
  return {
    start: new Date(year, 0, 1, 0, 0, 0).toISOString(),
    end: new Date(year, 11, 31, 23, 59, 59).toISOString(),
  };
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isSameMonth(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function mapSourceLabel(source: string) {
  if (source === "schedule") return "Jadwal Umum";
  if (source === "booking") return "Booking Ruangan";
  return source;
}

function sourceTone(source: string) {
  if (source === "schedule") return "bg-sky-100 text-sky-700";
  if (source === "booking") return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-700";
}

function getCalendarDotClass(source: string) {
  if (source === "schedule") return "bg-sky-500";
  if (source === "booking") return "bg-emerald-500";
  return "bg-slate-500";
}

function getStickyNoteTone(source: string) {
  if (source === "schedule") {
    return {
      card: "border-sky-200 bg-[#DDF2FF] shadow-[0_6px_14px_rgba(14,116,144,0.08)]",
      tape: "before:bg-white/45",
      overlay:
        "after:bg-[linear-gradient(180deg,rgba(255,255,255,0.1),transparent_30%)]",
      chip: "ring-sky-200/70 bg-white/85 text-slate-700",
      meta: "text-sky-800/70",
    };
  }

  return {
    card: "border-amber-200 bg-[#FFF3A6] shadow-[0_6px_14px_rgba(120,84,0,0.08)]",
    tape: "before:bg-white/45",
    overlay:
      "after:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_30%)]",
    chip: "ring-amber-300/60 bg-white/85 text-slate-700",
    meta: "text-amber-800/70",
  };
}

function getInitials(value?: string | null) {
  const source = String(value ?? "").trim();
  if (!source) return "NA";
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function formatHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function getEventHourRange(event: {
  start_time: string;
  end_time?: string | null;
}) {
  const start = new Date(event.start_time);
  const end = event.end_time
    ? new Date(event.end_time)
    : new Date(event.start_time);
  const startHour = Number.isNaN(start.getTime()) ? 0 : start.getHours();
  const endHourRaw = Number.isNaN(end.getTime()) ? startHour : end.getHours();
  const endHasMinutes = !Number.isNaN(end.getTime()) && end.getMinutes() > 0;
  const endHourExclusive = endHasMinutes
    ? endHourRaw + 1
    : Math.max(startHour + 1, endHourRaw);

  return {
    startHour,
    endHourExclusive: Math.min(24, Math.max(startHour + 1, endHourExclusive)),
  };
}

function HourlyScheduleTable({
  events,
  title,
}: {
  events: Array<{
    id: string | number;
    source: string;
    title: string;
    category?: string | null;
    status?: string | null;
    room_name?: string | null;
    start_time: string;
    end_time?: string | null;
    requested_by_name?: string | null;
    requested_by_role?: string | null;
  }>;
  title?: string;
}) {
  const MIN_LANES = 8;
  const hourRows = Array.from({ length: 11 }, (_, index) => index + 8);
  const laidOutEvents: Array<{
    id: string | number;
    source: string;
    title: string;
    category?: string | null;
    status?: string | null;
    room_name?: string | null;
    start_time: string;
    end_time?: string | null;
    requested_by_name?: string | null;
    requested_by_role?: string | null;
    lane: number;
    startHour: number;
    rowSpan: number;
  }> = [];
  const laneEndHours: number[] = [];

  for (const event of events) {
    const { startHour, endHourExclusive } = getEventHourRange(event);
    const visibleStart = Math.max(8, startHour);
    const visibleEnd = Math.min(19, endHourExclusive);
    const rowSpan = Math.max(0, visibleEnd - visibleStart);

    if (rowSpan <= 0) continue;

    let lane = laneEndHours.findIndex((endHour) => visibleStart >= endHour);
    if (lane === -1) {
      lane = laneEndHours.length;
      laneEndHours.push(visibleEnd);
    } else {
      laneEndHours[lane] = visibleEnd;
    }

    laidOutEvents.push({
      ...event,
      lane,
      startHour: visibleStart,
      rowSpan,
    });
  }

  const laneCount = Math.max(MIN_LANES, laneEndHours.length);
  const hiddenCells = new Set<string>();
  laidOutEvents.forEach((event) => {
    for (
      let hour = event.startHour + 1;
      hour < event.startHour + event.rowSpan;
      hour += 1
    ) {
      hiddenCells.add(`${event.lane}-${hour}`);
    }
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h4 className="text-sm font-semibold text-slate-900">
          {title || "Agenda Per Jam"}
        </h4>
      </div>
      <div className="overflow-x-auto">
        <table
          className="table-fixed border-collapse bg-white text-sm"
          style={{ minWidth: `${112 + laneCount * 260}px` }}
        >
          <colgroup>
            <col style={{ width: "112px" }} />
            {Array.from({ length: laneCount }, (_, laneIndex) => (
              <col key={`col-${laneIndex}`} style={{ width: "260px" }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-slate-50 text-left text-slate-600">
              <th className="sticky left-0 z-20 w-28 border-b border-r border-slate-300 bg-slate-50 px-4 py-3 font-semibold shadow-[1px_0_0_0_rgb(203,213,225)]">
                Jam
              </th>
              {Array.from({ length: laneCount }, (_, laneIndex) => (
                <th
                  key={`lane-head-${laneIndex}`}
                  className={`border-b border-slate-200 px-4 py-3 font-semibold ${
                    laneIndex < laneCount - 1 ? "border-r" : ""
                  }`}
                >
                  Agenda {laneCount > 1 ? laneIndex + 1 : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hourRows.map((hour) => {
              return (
                <tr key={hour} className="align-top">
                  <td className="sticky left-0 z-10 border-b border-r border-slate-300 bg-white px-4 py-3 font-medium text-slate-700 shadow-[1px_0_0_0_rgb(203,213,225)]">
                    {formatHourLabel(hour)}
                  </td>
                  {Array.from({ length: laneCount }, (_, laneIndex) => {
                    const hiddenKey = `${laneIndex}-${hour}`;
                    if (hiddenCells.has(hiddenKey)) return null;

                    const event = laidOutEvents.find(
                      (item) =>
                        item.lane === laneIndex && item.startHour === hour,
                    );

                    if (!event) {
                      return (
                        <td
                          key={`empty-${laneIndex}-${hour}`}
                          className={`border-b border-slate-200 bg-white px-4 py-3 text-slate-400 ${
                            laneIndex < laneCount - 1 ? "border-r" : ""
                          }`}
                        />
                      );
                    }

                    const noteTone = getStickyNoteTone(event.source);

                    return (
                      <td
                        key={`${event.source}-${event.id}-${laneIndex}-${hour}`}
                        rowSpan={event.rowSpan}
                        className={`border-b border-slate-200 px-3 py-3 align-top ${
                          laneIndex < laneCount - 1 ? "border-r" : ""
                        }`}
                      >
                        <div
                          className={`relative h-full rounded-[18px] px-3 py-3 before:absolute before:left-1/2 before:top-2 before:h-4 before:w-14 before:-translate-x-1/2 before:rounded-sm after:absolute after:inset-0 after:rounded-[18px] after:content-[''] ${noteTone.card} ${noteTone.tape} ${noteTone.overlay}`}
                          style={{ minHeight: `${event.rowSpan * 56}px` }}
                        >
                          <div className="relative flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium shadow-sm ${sourceTone(event.source)}`}
                            >
                              {mapSourceLabel(event.source)}
                            </span>
                            {event.category ? (
                              <span className={`rounded-full px-2 py-1 text-xs font-medium ring-1 ${noteTone.chip}`}>
                                {event.category}
                              </span>
                            ) : null}
                            {event.rowSpan > 1 ? (
                              <span className={`text-xs ${noteTone.meta}`}>
                                {event.rowSpan} jam
                              </span>
                            ) : null}
                          </div>
                          <p className="relative mt-3 font-semibold text-slate-900">
                            {event.title}
                          </p>
                          <div className="relative mt-3 grid gap-2 text-xs text-slate-600">
                            {event.source !== "schedule" &&
                            event.requested_by_name ? (
                              <p className={`inline-flex w-fit rounded-full px-2 py-1 ring-1 ${noteTone.chip}`}>
                                {`Oleh ${getInitials(event.requested_by_name)} `}
                                ({event.requested_by_role || "User"})
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const query = searchParams.get("q") ?? "";
  const roomFilter = searchParams.get("room") ?? "";
  const categoryFilter = searchParams.get("category") ?? "";
  const yearBounds = useMemo(() => getYearBounds(selectedDate), [selectedDate]);
  const { events, isLoading, error } = useCalendarEvents(
    yearBounds.start,
    yearBounds.end,
  );

  const filteredEvents = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    return events.filter((item) => {
      if (categoryFilter && item.source !== categoryFilter) return false;
      if (roomFilter && item.room_id !== roomFilter) return false;
      if (!normalizedQuery) return true;
      return normalizeText(
        `${item.title} ${item.description ?? ""} ${item.room_name ?? ""}`,
      ).includes(normalizedQuery);
    });
  }, [categoryFilter, events, query, roomFilter]);

  const monthSummaryEvents = useMemo(() => {
    return events.filter((item) =>
      isSameMonth(new Date(item.start_time), selectedDate),
    );
  }, [events, selectedDate]);

  const monthEvents = useMemo(() => {
    return filteredEvents.filter((item) =>
      isSameMonth(new Date(item.start_time), selectedDate),
    );
  }, [filteredEvents, selectedDate]);

  const monthKpis = useMemo(() => {
    const scheduleCount = monthSummaryEvents.filter(
      (item) => item.source === "schedule",
    ).length;
    const bookingCount = monthSummaryEvents.filter(
      (item) => item.source === "booking",
    ).length;
    const roomCount = new Set(
      monthSummaryEvents.map((item) => item.room_name).filter(Boolean),
    ).size;

    return [
      {
        label: "Agenda Bulan Ini",
        value: String(monthSummaryEvents.length),
        tone: "from-sky-500/15 to-sky-100",
      },
      {
        label: "Jadwal Umum",
        value: String(scheduleCount),
        tone: "from-emerald-500/15 to-emerald-100",
      },
      {
        label: "Booking Disetujui",
        value: String(bookingCount),
        tone: "from-amber-500/15 to-amber-100",
      },
      {
        label: "Ruangan Aktif",
        value: String(roomCount),
        tone: "from-violet-500/15 to-violet-100",
      },
    ];
  }, [monthSummaryEvents]);

  const selectedDayEvents = useMemo(() => {
    return filteredEvents
      .filter((item) => isSameDay(new Date(item.start_time), selectedDate))
      .sort(
        (left, right) =>
          new Date(left.start_time).getTime() -
          new Date(right.start_time).getTime(),
      );
  }, [filteredEvents, selectedDate]);

  const renderCell = (date: Date) => {
    const dayItems = filteredEvents.filter((item) =>
      isSameDay(new Date(item.start_time), date),
    );

    if (!dayItems.length) return null;

    const hasBooking = dayItems.some((item) => item.source === "booking");
    const markerClass = hasBooking
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
    <section className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid items-start gap-4 xl:grid-cols-[auto_minmax(0,1fr)]">
        <div className="inline-block w-fit max-w-full justify-self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          <RsuiteCalendar
            compact
            value={selectedDate}
            onSelect={(value) => setSelectedDate(value ?? new Date())}
            renderCell={renderCell}
            style={{ width: 388 }}
          />
        </div>

        <div className="space-y-3">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Ringkasan Bulan
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {selectedDate.toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Rekap agenda dan booking pada bulan yang sedang dipilih.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 2xl:grid-cols-4">
              {monthKpis.map((item) => (
                <div
                  key={`sidebar-${item.label}`}
                  className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${item.tone} px-4 py-4`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold leading-none text-slate-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tanggal Terpilih
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {selectedDate.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
            {/* <p className="mt-2 text-sm text-slate-500">
              Agenda harian difokuskan pada tabel per jam di bawah.
            </p> */}
          </article>
        </div>
      </div>

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
