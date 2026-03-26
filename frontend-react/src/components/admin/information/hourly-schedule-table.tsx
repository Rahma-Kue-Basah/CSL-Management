"use client";

import { formatDateTimeWib, formatHourLabel } from "@/lib/date-format";

type HourlyScheduleEvent = {
  id: string | number;
  source: string;
  title: string;
  room_name?: string | null;
  start_time: string;
  end_time?: string | null;
};

function mapSourceLabel(source: string) {
  if (source === "schedule") return "Jadwal Manual";
  if (source === "booking") return "Booking Ruangan";
  if (source === "use") return "Penggunaan Alat";
  return source;
}

function sourceTone(source: string) {
  if (source === "schedule") return "bg-sky-100 text-sky-700";
  if (source === "booking") return "bg-emerald-100 text-emerald-700";
  if (source === "use") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function getEventHourRange(event: {
  start_time: string;
  end_time?: string | null;
}) {
  const start = new Date(event.start_time);
  const end = event.end_time ? new Date(event.end_time) : new Date(event.start_time);
  const startHour = Number.isNaN(start.getTime()) ? 0 : start.getHours();
  const endHourRaw = Number.isNaN(end.getTime()) ? startHour : end.getHours();
  const endHasMinutes = !Number.isNaN(end.getTime()) && end.getMinutes() > 0;
  const endHourExclusive = endHasMinutes ? endHourRaw + 1 : Math.max(startHour + 1, endHourRaw);

  return {
    startHour,
    endHourExclusive: Math.min(24, Math.max(startHour + 1, endHourExclusive)),
  };
}

export function HourlyScheduleTable({
  events,
  title,
}: {
  events: HourlyScheduleEvent[];
  title?: string;
}) {
  const MIN_LANES = 8;
  const hourRows = Array.from({ length: 11 }, (_, index) => index + 8);
  const laidOutEvents: Array<
    HourlyScheduleEvent & {
      lane: number;
      startHour: number;
      rowSpan: number;
    }
  > = [];
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
    for (let hour = event.startHour + 1; hour < event.startHour + event.rowSpan; hour += 1) {
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
              <th className="sticky left-0 z-30 w-28 border-b border-r border-slate-300 bg-slate-50 px-4 py-3 font-semibold after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-slate-400 after:content-[''] shadow-[6px_0_12px_-8px_rgba(15,23,42,0.28)]">
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
            {hourRows.map((hour) => (
              <tr key={hour} className="align-top">
                <td className="sticky left-0 z-20 border-b border-r border-slate-300 bg-white px-4 py-3 font-medium text-slate-700 after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-slate-400 after:content-[''] shadow-[6px_0_12px_-8px_rgba(15,23,42,0.22)]">
                  {formatHourLabel(hour)}
                </td>
                {Array.from({ length: laneCount }, (_, laneIndex) => {
                  const hiddenKey = `${laneIndex}-${hour}`;
                  if (hiddenCells.has(hiddenKey)) return null;

                  const event = laidOutEvents.find(
                    (item) => item.lane === laneIndex && item.startHour === hour,
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

                  return (
                    <td
                      key={`${event.source}-${event.id}-${laneIndex}-${hour}`}
                      rowSpan={event.rowSpan}
                      className={`border-b border-slate-200 px-3 py-3 align-top ${
                        laneIndex < laneCount - 1 ? "border-r" : ""
                      }`}
                    >
                      <div
                        className="h-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                        style={{ minHeight: `${event.rowSpan * 56}px` }}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${sourceTone(event.source)}`}
                          >
                            {mapSourceLabel(event.source)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {event.room_name || "Tanpa ruangan"}
                          </span>
                          {event.rowSpan > 1 ? (
                            <span className="text-xs text-slate-400">{event.rowSpan} jam</span>
                          ) : null}
                        </div>
                        <p className="mt-2 font-medium text-slate-900">{event.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTimeWib(event.start_time)}
                          {event.end_time ? ` - ${formatDateTimeWib(event.end_time)}` : ""}
                        </p>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
