import { Suspense } from "react";
import { UserManagementContent } from "@/components/admin/user-management/content";

export default function UserManagementAdminPage() {
  return (
    <Suspense fallback={null}>
      <UserManagementContent forcedRole="Admin" />
    </Suspense>
  );
}
