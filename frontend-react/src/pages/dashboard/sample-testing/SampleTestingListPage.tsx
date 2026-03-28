"use client";

import SampleTestingListContent from "@/pages/dashboard/sample-testing/SampleTestingListContent";

export default function SampleTestingListPage() {
  return (
    <SampleTestingListContent
      scope="my"
      emptyMessage="Belum ada pengajuan pengujian sampel."
    />
  );
}
