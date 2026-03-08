import { Suspense } from "react";
import UserManagementPage from "@/components/admin/user-management/user-management-page";

export default function UserManagementStudentPage() {
  return (
    <Suspense fallback={null}>
      <UserManagementPage forcedRole="Student" />
    </Suspense>
  );
}
