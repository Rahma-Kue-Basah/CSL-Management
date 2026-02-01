"use client";

import BorrowForm from "@/components/feature/borrow-form";

export default function BorrowFormEditPage({ params }) {
  return <BorrowForm borrowId={params?.id} />;
}
