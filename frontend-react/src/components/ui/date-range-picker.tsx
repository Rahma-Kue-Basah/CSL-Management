"use client";


import { useMemo, useState } from "react";

import { format } from "date-fns";

import { CalendarDays, ChevronDownIcon, XIcon } from "lucide-react";

import type { DateRange } from "react-day-picker";

import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui";

import { cn } from "@/lib/core";

type DateRangePickerProps = {
  value?: DateRange;
  onChange: (value: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  contentClassName?: string;
  align?: "center" | "start" | "end";
  clearable?: boolean;
};

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pilih rentang tanggal",
  disabled,
  className,
  buttonClassName,
  contentClassName,
  align = "start",
  clearable = false,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const buttonLabel = useMemo(() => {
    if (value?.from && value?.to) {
      return `${format(value.from, "dd MMM yyyy")} - ${format(value.to, "dd MMM yyyy")}`;
    }
    if (value?.from) {
      return `${format(value.from, "dd MMM yyyy")} - ...`;
    }
    return placeholder;
  }, [placeholder, value]);

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
              !value?.from && "text-slate-400",
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
            mode="range"
            selected={value}
            defaultMonth={value?.from ?? value?.to}
            captionLayout="dropdown"
            numberOfMonths={2}
            onSelect={onChange}
          />
        </PopoverContent>
      </Popover>
      {clearable && value?.from ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          onClick={() => onChange(undefined)}
          disabled={disabled}
          aria-label="Reset rentang tanggal"
        >
          <XIcon className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}

export default DateRangePicker;
