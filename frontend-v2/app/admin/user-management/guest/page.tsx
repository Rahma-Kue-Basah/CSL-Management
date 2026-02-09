import UserManagementPage from "@/components/admin/user-management/user-management-page";

export default function UserManagementGuestPage() {
  return <UserManagementPage forcedRole="OTHER" />;
}
