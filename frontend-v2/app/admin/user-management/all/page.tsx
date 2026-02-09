import { Suspense } from "react";
import UserManagementPage from "@/components/admin/user-management/user-management-page";

export default function UserManagementAllPage() {
  return (
    <Suspense fallback={null}>
      <UserManagementPage />
    </Suspense>
  );
}
