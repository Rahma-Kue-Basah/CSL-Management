"use client";

import * as React from "react";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePickerTime({
  date,
  onDateChange,
  time,
  onTimeChange,
  dateId,
  timeId,
  dateLabel = "Date",
  timeLabel = "Time",
  groupClassName = "flex-row items-end gap-4",
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <FieldGroup className={groupClassName}>
      <Field className="min-w-[200px] flex-1">
        <FieldLabel htmlFor={dateId}>{dateLabel}</FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id={dateId}
              className="w-40 justify-between font-normal"
            >
              {date ? format(date, "PPP") : "Select date"}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              defaultMonth={date}
              onSelect={(nextDate) => {
                onDateChange(nextDate);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </Field>
      <Field className="w-40">
        <FieldLabel htmlFor={timeId}>{timeLabel}</FieldLabel>
        <Input
          type="time"
          id={timeId}
          step="60"
          value={time}
          onChange={(event) => onTimeChange(event.target.value)}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </Field>
    </FieldGroup>
  );
}

export default DatePickerTime;
