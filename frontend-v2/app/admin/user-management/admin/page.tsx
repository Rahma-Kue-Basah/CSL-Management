import { Suspense } from "react";
import UserManagementPage from "@/components/admin/user-management/user-management-page";

export default function UserManagementAdminPage() {
  return (
    <Suspense fallback={null}>
      <UserManagementPage forcedRole="ADMIN" />
    </Suspense>
  );
}
