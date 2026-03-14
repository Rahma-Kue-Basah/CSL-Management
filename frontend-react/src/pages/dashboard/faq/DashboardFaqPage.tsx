"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useFaqs } from "@/hooks/faqs/use-faqs";
import type { Faq } from "@/hooks/faqs/use-faqs";

function FaqCard({
  item,
  open,
  onToggle,
}: {
  item: Faq;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-help items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
      >
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">
            {item.question}
          </h3>
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition ${open ? "rotate-180" : ""}`}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>
      {open ? (
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-relaxed text-slate-700">
          {item.answer}
        </div>
      ) : null}
    </article>
  );
}

export default function DashboardFaqPage() {
  const { faqs, isLoading, error } = useFaqs();
  const [openId, setOpenId] = useState<string | number | null>(null);

  useEffect(() => {
    if (!faqs.length) {
      setOpenId(null);
      return;
    }
    setOpenId((current) =>
      current && faqs.some((item) => item.id === current) ? current : faqs[0].id,
    );
  }, [faqs]);

  if (isLoading) {
    return (
      <section className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`faq-skeleton-${index}`}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="space-y-3">
        {faqs.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Belum ada FAQ yang tersedia.
          </div>
        ) : faqs.length ? (
          faqs.map((item) => (
            <FaqCard
              key={item.id}
              item={item}
              open={openId === item.id}
              onToggle={() =>
                setOpenId((current) => (current === item.id ? null : item.id))
              }
            />
          ))
        ) : null}
      </div>
    </section>
  );
}
