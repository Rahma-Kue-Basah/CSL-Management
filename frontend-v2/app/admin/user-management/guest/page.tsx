import { Suspense } from "react";
import UserManagementPage from "@/components/admin/user-management/user-management-page";

export default function UserManagementGuestPage() {
  return (
    <Suspense fallback={null}>
      <UserManagementPage forcedRole="OTHER" />
    </Suspense>
  );
}
