import { Suspense } from "react";
import UserManagementContent from "@/components/admin/user-management/content/UserManagementContent";

export default function UserManagementGuestPage() {
  return (
    <Suspense fallback={null}>
      <UserManagementContent forcedRole="Guest" />
    </Suspense>
  );
}
