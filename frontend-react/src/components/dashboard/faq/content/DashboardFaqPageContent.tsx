"use client";

import { useEffect, useState } from "react";
import { Image as AntdImage } from "antd";
import { ChevronDown } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useFaqs } from "@/hooks/information/faq/use-faqs";
import type { Faq } from "@/hooks/information/faq/use-faqs";

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
        className="flex w-full cursor-help items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-200 hover:bg-slate-50"
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
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`border-t border-slate-200 bg-slate-50 px-5 text-sm leading-relaxed text-slate-700 transition-[padding,opacity,transform] duration-300 ease-out ${
              open
                ? "translate-y-0 py-4 opacity-100"
                : "-translate-y-1 py-0 opacity-0"
            }`}
          >
            {item.imageUrl ? (
              <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                <AntdImage
                  src={item.imageUrl}
                  alt={item.question}
                  className="max-h-[420px] w-full object-contain"
                />
              </div>
            ) : null}
            {item.answer}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function DashboardFaqPage() {
  const { faqs, isLoading, error } = useFaqs();
  const [openId, setOpenId] = useState<string | number | null>(null);
  const leftColumnFaqs = faqs.filter((_, index) => index % 2 === 0);
  const rightColumnFaqs = faqs.filter((_, index) => index % 2 === 1);

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
      {faqs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          Belum ada FAQ yang tersedia.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 xl:items-start">
          <div className="space-y-3">
            {leftColumnFaqs.map((item) => (
              <FaqCard
                key={item.id}
                item={item}
                open={openId === item.id}
                onToggle={() =>
                  setOpenId((current) => (current === item.id ? null : item.id))
                }
              />
            ))}
          </div>
          <div className="space-y-3">
            {rightColumnFaqs.map((item) => (
              <FaqCard
                key={item.id}
                item={item}
                open={openId === item.id}
                onToggle={() =>
                  setOpenId((current) => (current === item.id ? null : item.id))
                }
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
