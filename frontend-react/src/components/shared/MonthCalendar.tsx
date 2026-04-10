"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/core";

const WEEKDAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getCalendarDays(month: Date) {
  const monthStart = getMonthStart(month);
  const startDay = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0,
  ).getDate();
  const totalVisibleDays = startDay + daysInMonth;
  const cellCount = totalVisibleDays <= 35 ? 35 : 42;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - startDay);

  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

type MonthCalendarMarkerContext = {
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
};

export default function MonthCalendar({
  value,
  onSelect,
  renderMarker,
  className,
  contentClassName,
}: {
  value: Date;
  onSelect: (value: Date) => void;
  renderMarker?: (date: Date, context: MonthCalendarMarkerContext) => ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const [viewMonth, setViewMonth] = useState(() => getMonthStart(value));

  useEffect(() => {
    setViewMonth(getMonthStart(value));
  }, [value]);

  const days = useMemo(() => getCalendarDays(viewMonth), [viewMonth]);
  const today = useMemo(() => new Date(), []);

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-3">
        <button
          type="button"
          onClick={() =>
            setViewMonth(
              (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
            )
          }
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900">
            {viewMonth.toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setViewMonth(
              (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
            )
          }
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          aria-label="Bulan berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className={cn("p-3", contentClassName)}>
        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="flex h-8 items-center justify-center text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date) => {
            const isCurrentMonth = date.getMonth() === viewMonth.getMonth();
            const isSelected = isSameDay(date, value);
            const isToday = isSameDay(date, today);

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => onSelect(date)}
                className={cn(
                  "flex min-h-[3rem] flex-col items-center justify-start rounded-xl border px-1 py-1.5 text-center transition",
                  isSelected
                    ? "border-[#0048B4] bg-[#E8F0FB] text-[#0048B4]"
                    : "border-transparent hover:border-slate-200 hover:bg-slate-50",
                  !isCurrentMonth && !isSelected && "text-slate-300",
                  isToday && !isSelected && "border-slate-200 text-slate-900",
                )}
              >
                <span className="text-xs font-medium">{date.getDate()}</span>
                <span className="mt-1 flex min-h-[0.5rem] items-center justify-center">
                  {renderMarker
                    ? renderMarker(date, {
                        isCurrentMonth,
                        isSelected,
                        isToday,
                      })
                    : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
