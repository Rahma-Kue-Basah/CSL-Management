"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, ChevronDownIcon, XIcon } from "lucide-react";
import type { Matcher } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value?: Date | null;
  onChange: (value: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  calendarDisabled?: Matcher | Matcher[];
  defaultMonth?: Date;
  captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years";
  className?: string;
  buttonClassName?: string;
  contentClassName?: string;
  formatString?: string;
  align?: "center" | "start" | "end";
  clearable?: boolean;
};

export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  disabled,
  calendarDisabled,
  defaultMonth,
  captionLayout = "dropdown",
  className,
  buttonClassName,
  contentClassName,
  formatString = "dd MMM yyyy",
  align = "start",
  clearable = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ?? undefined;
  const buttonLabel = useMemo(
    () => (selectedDate ? format(selectedDate, formatString) : placeholder),
    [formatString, placeholder, selectedDate],
  );

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-11 w-full justify-between border-slate-300 bg-white px-3 text-sm font-normal shadow-xs focus-visible:border-slate-500 focus-visible:ring-[3px] focus-visible:ring-slate-200",
              !selectedDate && "text-slate-400",
              buttonClassName,
            )}
          >
            <span className="flex min-w-0 items-center gap-2 truncate">
              <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="truncate">{buttonLabel}</span>
            </span>
            <ChevronDownIcon className="h-4 w-4 shrink-0 text-slate-500" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align={align}
          className={cn("w-auto overflow-hidden p-0", contentClassName)}
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={defaultMonth ?? selectedDate}
            captionLayout={captionLayout}
            disabled={calendarDisabled}
            onSelect={(nextDate) => {
              onChange(nextDate);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {clearable && selectedDate ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          onClick={() => onChange(undefined)}
          disabled={disabled}
          aria-label="Reset tanggal"
        >
          <XIcon className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
