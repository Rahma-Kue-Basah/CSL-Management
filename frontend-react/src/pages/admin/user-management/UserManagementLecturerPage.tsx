import { Suspense } from "react";
import { UserManagementContent } from "@/components/admin/user-management/content";

export default function UserManagementLecturerPage() {
  return (
    <Suspense fallback={null}>
      <UserManagementContent forcedRole="Lecturer" />
    </Suspense>
  );
}
