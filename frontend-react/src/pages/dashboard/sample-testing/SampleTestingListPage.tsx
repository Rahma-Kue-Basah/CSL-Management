"use client";

import { SampleTestingListContent } from "@/components/dashboard/sample-testing/content";

export default function SampleTestingListPage() {
  return (
    <SampleTestingListContent
      scope="my"
      emptyMessage="Belum ada pengajuan pengujian sampel."
    />
  );
}
