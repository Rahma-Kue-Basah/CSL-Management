import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

import AuthLayout from "@/layouts/AuthLayout";
import AdminLayout from "@/layouts/AdminLayout";
import { UserLayout } from "@/layouts/UserLayout";
import { RequireAdmin, RequireAuth } from "@/routes/guards";

import LoginPage from "@/pages/auth/LoginPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import SignupGuestPage from "@/pages/auth/SignupGuestPage";
import SignupGuestVerifyPage from "@/pages/auth/SignupGuestVerifyPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";

import DashboardPage from "@/pages/dashboard/DashboardPage";
import AdminHomePage from "@/pages/admin/home/AdminHomePage";
import AdminSchedulePage from "@/pages/admin/information/AdminSchedulePage";
import AdminAnnouncementPage from "@/pages/admin/information/AdminAnnouncementPage";
import AdminEquipmentPage from "@/pages/admin/inventory/AdminEquipmentPage";
import AdminEquipmentDetailPage from "@/pages/admin/inventory/AdminEquipmentDetailPage";
import AdminRoomPage from "@/pages/admin/inventory/AdminRoomPage";
import AdminRoomDetailPage from "@/pages/admin/inventory/AdminRoomDetailPage";
import AdminRoomBorrowRecordPage from "@/pages/admin/records/AdminRoomBorrowRecordPage";
import AdminEquipmentUsageRecordPage from "@/pages/admin/records/AdminEquipmentUsageRecordPage";
import AdminEquipmentBorrowRecordPage from "@/pages/admin/records/AdminEquipmentBorrowRecordPage";
import AdminSampleTestingRecordPage from "@/pages/admin/records/AdminSampleTestingRecordPage";
import AdminMyProfilePage from "@/pages/admin/profile/AdminMyProfilePage";
import UserManagementAllPage from "@/pages/admin/user-management/UserManagementAllPage";
import UserManagementStudentPage from "@/pages/admin/user-management/UserManagementStudentPage";
import UserManagementLecturerPage from "@/pages/admin/user-management/UserManagementLecturerPage";
import UserManagementAdminPage from "@/pages/admin/user-management/UserManagementAdminPage";
import UserManagementStaffPage from "@/pages/admin/user-management/UserManagementStaffPage";
import UserManagementGuestPage from "@/pages/admin/user-management/UserManagementGuestPage";
import UserManagementUserDetailPage from "@/pages/admin/user-management/UserManagementUserDetailPage";
import NotFoundPage from "@/pages/errors/NotFoundPage";

function AuthLayoutOutlet() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  {
    element: <AuthLayoutOutlet />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/signup-guest", element: <SignupGuestPage /> },
      { path: "/signup-guest/verify/:key", element: <SignupGuestVerifyPage /> },
      { path: "/reset-password/:uid/:token", element: <ResetPasswordPage /> },
    ],
  },
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <UserLayout>
          <DashboardPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/admin",
    element: (
      <RequireAuth>
        <RequireAdmin>
          <AdminLayout>
            <Outlet />
          </AdminLayout>
        </RequireAdmin>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/home" replace /> },
      { path: "home", element: <AdminHomePage /> },
      { path: "informasi", element: <Navigate to="/admin/informasi/jadwal" replace /> },
      { path: "informasi/jadwal", element: <AdminSchedulePage /> },
      { path: "informasi/pengumuman", element: <AdminAnnouncementPage /> },
      { path: "inventarisasi", element: <Navigate to="/admin/inventarisasi/peralatan" replace /> },
      { path: "inventarisasi/peralatan", element: <AdminEquipmentPage /> },
      { path: "inventarisasi/peralatan/:id", element: <AdminEquipmentDetailPage /> },
      { path: "inventarisasi/ruangan", element: <AdminRoomPage /> },
      { path: "inventarisasi/ruangan/:id", element: <AdminRoomDetailPage /> },
      { path: "record/peminjaman-ruangan", element: <AdminRoomBorrowRecordPage /> },
      { path: "record/penggunaan-alat", element: <AdminEquipmentUsageRecordPage /> },
      { path: "record/peminjaman-alat", element: <AdminEquipmentBorrowRecordPage /> },
      { path: "record/pengujian-sampel", element: <AdminSampleTestingRecordPage /> },
      { path: "my-profile", element: <AdminMyProfilePage /> },
      { path: "user-management", element: <Navigate to="/admin/user-management/all" replace /> },
      { path: "user-management/all", element: <UserManagementAllPage /> },
      { path: "user-management/student", element: <UserManagementStudentPage /> },
      { path: "user-management/lecturer", element: <UserManagementLecturerPage /> },
      { path: "user-management/admin", element: <UserManagementAdminPage /> },
      { path: "user-management/staff", element: <UserManagementStaffPage /> },
      { path: "user-management/guest", element: <UserManagementGuestPage /> },
      { path: "user-management/detail/:id", element: <UserManagementUserDetailPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
