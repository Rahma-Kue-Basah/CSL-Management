import { Suspense } from "react";
import { UserManagementContent } from "@/components/admin/user-management/content";

export default function UserManagementStaffPage() {
  return (
    <Suspense fallback={null}>
      <UserManagementContent forcedRole="Staff" />
    </Suspense>
  );
}
