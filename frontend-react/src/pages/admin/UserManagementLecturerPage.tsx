import { Suspense } from "react";
import UserManagementPage from "@/components/admin/user-management/user-management-page";

export default function UserManagementLecturerPage() {
  return (
    <Suspense fallback={null}>
      <UserManagementPage forcedRole="Lecturer" />
    </Suspense>
  );
}
