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
import AdminHomePage from "@/pages/admin/AdminHomePage";
import AdminJadwalPage from "@/pages/admin/AdminJadwalPage";
import AdminPengumumanPage from "@/pages/admin/AdminPengumumanPage";
import AdminPeralatanPage from "@/pages/admin/AdminPeralatanPage";
import AdminRuanganPage from "@/pages/admin/AdminRuanganPage";
import AdminRecordPeminjamanRuanganPage from "@/pages/admin/AdminRecordPeminjamanRuanganPage";
import AdminRecordPenggunaanAlatPage from "@/pages/admin/AdminRecordPenggunaanAlatPage";
import AdminRecordPeminjamanAlatPage from "@/pages/admin/AdminRecordPeminjamanAlatPage";
import AdminRecordPengujianSampelPage from "@/pages/admin/AdminRecordPengujianSampelPage";
import AdminMyProfilePage from "@/pages/admin/AdminMyProfilePage";
import UserManagementAllPage from "@/pages/admin/UserManagementAllPage";
import UserManagementStudentPage from "@/pages/admin/UserManagementStudentPage";
import UserManagementLecturerPage from "@/pages/admin/UserManagementLecturerPage";
import UserManagementAdminPage from "@/pages/admin/UserManagementAdminPage";
import UserManagementStaffPage from "@/pages/admin/UserManagementStaffPage";
import UserManagementGuestPage from "@/pages/admin/UserManagementGuestPage";
import UserManagementUserDetailPage from "@/pages/admin/UserManagementUserDetailPage";
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
      { path: "informasi/jadwal", element: <AdminJadwalPage /> },
      { path: "informasi/pengumuman", element: <AdminPengumumanPage /> },
      { path: "inventarisasi", element: <Navigate to="/admin/inventarisasi/peralatan" replace /> },
      { path: "inventarisasi/peralatan", element: <AdminPeralatanPage /> },
      { path: "inventarisasi/ruangan", element: <AdminRuanganPage /> },
      { path: "record/peminjaman-ruangan", element: <AdminRecordPeminjamanRuanganPage /> },
      { path: "record/penggunaan-alat", element: <AdminRecordPenggunaanAlatPage /> },
      { path: "record/peminjaman-alat", element: <AdminRecordPeminjamanAlatPage /> },
      { path: "record/pengujian-sampel", element: <AdminRecordPengujianSampelPage /> },
      { path: "my-profile", element: <AdminMyProfilePage /> },
      { path: "user-management", element: <Navigate to="/admin/user-management/all" replace /> },
      { path: "user-management/all", element: <UserManagementAllPage /> },
      { path: "user-management/student", element: <UserManagementStudentPage /> },
      { path: "user-management/lecturer", element: <UserManagementLecturerPage /> },
      { path: "user-management/admin", element: <UserManagementAdminPage /> },
      { path: "user-management/staff", element: <UserManagementStaffPage /> },
      { path: "user-management/guest", element: <UserManagementGuestPage /> },
      { path: "user-management/u/:id", element: <UserManagementUserDetailPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
