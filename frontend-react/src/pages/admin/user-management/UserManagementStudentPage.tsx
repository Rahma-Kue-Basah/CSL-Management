import { Suspense } from "react";
import { UserManagementContent } from "@/components/admin/user-management/content";

export default function UserManagementStudentPage() {
  return (
    <Suspense fallback={null}>
      <UserManagementContent forcedRole="Student" />
    </Suspense>
  );
}
