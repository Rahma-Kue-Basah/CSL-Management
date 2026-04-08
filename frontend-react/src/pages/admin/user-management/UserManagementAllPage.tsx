import { Suspense } from "react";
import { UserManagementContent } from "@/components/admin/user-management/content";

export default function UserManagementAllPage() {
  return (
    <Suspense fallback={null}>
      <UserManagementContent
        title="Semua User"
        description="Daftar seluruh user yang terdaftar di sistem."
      />
    </Suspense>
  );
}
