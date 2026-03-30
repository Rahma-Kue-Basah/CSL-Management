"use client";

import { Check, CircleAlert, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type ProgressStepState = "finish" | "process" | "wait" | "error";

export type ProgressStepItem = {
  key: string;
  label: string;
  time?: string;
  state: ProgressStepState;
};

const MISSING_TIME_FALLBACK = "Waktu belum tercatat";

function getStepTone(state: ProgressStepState) {
  switch (state) {
    case "finish":
      return {
        connector: "bg-emerald-500",
        circle:
          "border-emerald-500 bg-emerald-500 text-white shadow-[0_6px_16px_rgba(16,185,129,0.22)]",
        title: "text-slate-900",
        time: "text-slate-500",
      };
    case "process":
      return {
        connector: "bg-sky-500",
        circle:
          "border-sky-500 bg-sky-500 text-white shadow-[0_6px_16px_rgba(14,165,233,0.22)]",
        title: "text-slate-900",
        time: "text-slate-500",
      };
    case "error":
      return {
        connector: "bg-rose-500",
        circle:
          "border-rose-500 bg-rose-500 text-white shadow-[0_6px_16px_rgba(244,63,94,0.22)]",
        title: "text-rose-700",
        time: "text-rose-500",
      };
    case "wait":
    default:
      return {
        connector: "bg-slate-200",
        circle: "border-slate-200 bg-white text-slate-400",
        title: "text-slate-500",
        time: "text-slate-400",
      };
  }
}

function StepIcon({
  state,
  index,
}: {
  state: ProgressStepState;
  index: number;
}) {
  if (state === "finish") {
    return <Check className="h-4 w-4" />;
  }

  if (state === "process") {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (state === "error") {
    return <CircleAlert className="h-4 w-4" />;
  }

  return <span className="text-xs font-semibold">{index + 1}</span>;
}

export function ProgressSteps({
  steps,
  minWidthClassName = "min-w-[720px]",
  orientation = "horizontal",
}: {
  steps: ProgressStepItem[];
  minWidthClassName?: string;
  orientation?: "horizontal" | "vertical";
}) {
  if (orientation === "vertical") {
    return (
      <div className="mt-2">
        <div className="space-y-0">
          {steps.map((step, index) => {
            const tone = getStepTone(step.state);
            const isLast = index === steps.length - 1;
            const resolvedTime =
              step.time && step.time !== "-"
                ? step.time
                : step.state === "wait"
                  ? ""
                  : MISSING_TIME_FALLBACK;

            return (
              <div key={step.key} className="flex gap-3">
                <div className="flex w-8 shrink-0 flex-col items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border text-xs transition-colors",
                      tone.circle,
                    )}
                  >
                    <StepIcon state={step.state} index={index} />
                  </div>
                  {!isLast ? (
                    <div
                      className={cn(
                        "mt-1 h-10 w-[2px] rounded-full",
                        tone.connector,
                      )}
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 pb-4">
                  <p className={cn("text-sm font-medium leading-snug", tone.title)}>
                    {step.label}
                  </p>
                  {resolvedTime ? (
                    <p className={cn("mt-1 text-xs leading-snug", tone.time)}>
                      {resolvedTime}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 overflow-x-auto pb-1">
      <div className={cn("flex items-start", minWidthClassName)}>
        {steps.map((step, index) => {
          const tone = getStepTone(step.state);
          const isLast = index === steps.length - 1;
          const resolvedTime =
            step.time && step.time !== "-"
              ? step.time
              : step.state === "wait"
                ? " "
                : MISSING_TIME_FALLBACK;

          return (
            <div key={step.key} className="flex min-w-0 flex-1 items-start">
              <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border text-xs transition-colors",
                    tone.circle,
                  )}
                >
                  <StepIcon state={step.state} index={index} />
                </div>
                <p
                  className={cn(
                    "mt-2 max-w-[8rem] text-xs font-medium leading-snug",
                    tone.title,
                  )}
                >
                  {step.label}
                </p>
                <p
                  className={cn(
                    "mt-0.5 max-w-[8rem] text-[11px] leading-snug",
                    tone.time,
                  )}
                >
                  {resolvedTime}
                </p>
              </div>
              {!isLast ? (
                <div className="px-2 pt-4">
                  <div
                    className={cn(
                      "h-[2px] w-10 rounded-full md:w-14 xl:w-16",
                      tone.connector,
                    )}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
