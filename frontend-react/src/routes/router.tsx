import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

import AuthLayout from "@/layouts/AuthLayout";
import AdminLayout from "@/layouts/AdminLayout";
import { UserLayout } from "@/layouts/UserLayout";
import { hasAuthToken, RequireAdmin, RequireAuth } from "@/routes/guards";

import LoginPage from "@/pages/auth/LoginPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import SignupGuestPage from "@/pages/auth/SignupGuestPage";
import SignupGuestVerifyPage from "@/pages/auth/SignupGuestVerifyPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";

import DashboardHomePage from "@/pages/dashboard/DashboardHomePage";
import DashboardOverviewPage from "@/pages/dashboard/overview/DashboardOverviewPage";
import DashboardAnnouncementsPage from "@/pages/dashboard/announcements/DashboardAnnouncementsPage";
import DashboardFaqPage from "@/pages/dashboard/faq/DashboardFaqPage";
import DashboardStructureOrganizationsPage from "@/pages/dashboard/organization/DashboardStructureOrganizationsPage";
import SchedulePage from "@/pages/dashboard/schedule/SchedulePage";
import BookingRoomsListPage from "@/pages/dashboard/booking-rooms/BookingRoomsListPage";
import BookingRoomsAllListPage from "@/pages/dashboard/booking-rooms/BookingRoomsAllListPage";
import BookingRoomsFormPage from "@/pages/dashboard/booking-rooms/BookingRoomsFormPage";
import BookingRoomsDetailPage from "@/pages/dashboard/booking-rooms/BookingRoomsDetailPage";
import RoomsListPage from "@/pages/dashboard/booking-rooms/RoomsListPage";
import RoomDetailPage from "@/pages/dashboard/booking-rooms/RoomDetailPage";
import UseEquipmentListPage from "@/pages/dashboard/use-equipment/UseEquipmentListPage";
import UseEquipmentAllListPage from "@/pages/dashboard/use-equipment/UseEquipmentAllListPage";
import UseEquipmentFormPage from "@/pages/dashboard/use-equipment/UseEquipmentFormPage";
import EquipmentListPage from "@/pages/dashboard/use-equipment/EquipmentListPage";
import EquipmentDetailPage from "@/pages/dashboard/use-equipment/EquipmentDetailPage";
import UseEquipmentDetailPage from "@/pages/dashboard/use-equipment/UseEquipmentDetailPage";
import SampleTestingListPage from "@/pages/dashboard/sample-testing/SampleTestingListPage";
import SampleTestingFormPage from "@/pages/dashboard/sample-testing/SampleTestingFormPage";
import BorrowEquipmentListPage from "@/pages/dashboard/borrow-equipment/BorrowEquipmentListPage";
import BorrowEquipmentFormPage from "@/pages/dashboard/borrow-equipment/BorrowEquipmentFormPage";
import BorrowEquipmentAvailablePage from "@/pages/dashboard/borrow-equipment/BorrowEquipmentAvailablePage";
import NotificationsPage from "@/pages/dashboard/account/NotificationsPage";
import ActivityHistoryPage from "@/pages/dashboard/account/ActivityHistoryPage";
import MyProfilePage from "@/pages/dashboard/account/MyProfilePage";
import AdminHomePage from "@/pages/admin/home/AdminHomePage";
import AdminSchedulePage from "@/pages/admin/information/AdminSchedulePage";
import AdminAnnouncementPage from "@/pages/admin/information/AdminAnnouncementPage";
import AdminFaqPage from "@/pages/admin/information/AdminFaqPage";
import AdminEquipmentPage from "@/pages/admin/inventory/AdminEquipmentPage";
import AdminEquipmentDetailPage from "@/pages/admin/inventory/AdminEquipmentDetailPage";
import AdminRoomPage from "@/pages/admin/inventory/AdminRoomPage";
import AdminRoomDetailPage from "@/pages/admin/inventory/AdminRoomDetailPage";
import AdminRoomBorrowRecordPage from "@/pages/admin/records/AdminRoomBorrowRecordPage";
import AdminRoomBorrowRecordDetailPage from "@/pages/admin/records/AdminRoomBorrowRecordDetailPage";
import AdminEquipmentUsageRecordPage from "@/pages/admin/records/AdminEquipmentUsageRecordPage";
import AdminEquipmentUsageRecordDetailPage from "@/pages/admin/records/AdminEquipmentUsageRecordDetailPage";
import AdminEquipmentBorrowRecordPage from "@/pages/admin/records/AdminEquipmentBorrowRecordPage";
import AdminEquipmentBorrowRecordDetailPage from "@/pages/admin/records/AdminEquipmentBorrowRecordDetailPage";
import AdminSampleTestingRecordPage from "@/pages/admin/records/AdminSampleTestingRecordPage";
import AdminSampleTestingRecordDetailPage from "@/pages/admin/records/AdminSampleTestingRecordDetailPage";
import AdminMyProfilePage from "@/pages/admin/profile/AdminMyProfilePage";
import StructureOrgansPage from "@/pages/admin/lab-profile/StructureOrgansPage";
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

function RootRedirect() {
  return <Navigate to={hasAuthToken() ? "/dashboard" : "/login"} replace />;
}

export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },
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
          <DashboardHomePage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/overview",
    element: (
      <RequireAuth>
        <UserLayout>
          <DashboardOverviewPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/announcements",
    element: (
      <RequireAuth>
        <UserLayout>
          <DashboardAnnouncementsPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/faq",
    element: (
      <RequireAuth>
        <UserLayout>
          <DashboardFaqPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/organization-structure",
    element: (
      <RequireAuth>
        <UserLayout>
          <DashboardStructureOrganizationsPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/schedule",
    element: (
      <RequireAuth>
        <UserLayout>
          <SchedulePage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/booking-rooms",
    element: (
      <RequireAuth>
        <UserLayout>
          <BookingRoomsListPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/booking-rooms/all",
    element: (
      <RequireAuth>
        <UserLayout>
          <BookingRoomsAllListPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/booking-rooms/all/:id",
    element: (
      <RequireAuth>
        <UserLayout>
          <BookingRoomsDetailPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/booking-rooms/form",
    element: (
      <RequireAuth>
        <UserLayout>
          <BookingRoomsFormPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/booking-rooms/:id",
    element: (
      <RequireAuth>
        <UserLayout>
          <BookingRoomsDetailPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/rooms",
    element: (
      <RequireAuth>
        <UserLayout>
          <RoomsListPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/rooms/:id",
    element: (
      <RequireAuth>
        <UserLayout>
          <RoomDetailPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/use-equipment",
    element: (
      <RequireAuth>
        <UserLayout>
          <UseEquipmentListPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/use-equipment/all",
    element: (
      <RequireAuth>
        <UserLayout>
          <UseEquipmentAllListPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/use-equipment/form",
    element: (
      <RequireAuth>
        <UserLayout>
          <UseEquipmentFormPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/use-equipment/all/:id",
    element: (
      <RequireAuth>
        <UserLayout>
          <UseEquipmentDetailPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/use-equipment/:id",
    element: (
      <RequireAuth>
        <UserLayout>
          <UseEquipmentDetailPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/equipment",
    element: (
      <RequireAuth>
        <UserLayout>
          <EquipmentListPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/equipment/:id",
    element: (
      <RequireAuth>
        <UserLayout>
          <EquipmentDetailPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/sample-testing",
    element: (
      <RequireAuth>
        <UserLayout>
          <SampleTestingListPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/sample-testing/form",
    element: (
      <RequireAuth>
        <UserLayout>
          <SampleTestingFormPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/borrow-equipment",
    element: (
      <RequireAuth>
        <UserLayout>
          <BorrowEquipmentListPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/borrow-equipment/form",
    element: (
      <RequireAuth>
        <UserLayout>
          <BorrowEquipmentFormPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/borrow-equipment/equipment",
    element: (
      <RequireAuth>
        <UserLayout>
          <BorrowEquipmentAvailablePage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/notifications",
    element: (
      <RequireAuth>
        <UserLayout>
          <NotificationsPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/activity-history",
    element: (
      <RequireAuth>
        <UserLayout>
          <ActivityHistoryPage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/my-profile",
    element: (
      <RequireAuth>
        <UserLayout>
          <MyProfilePage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/my-profile/edit",
    element: (
      <RequireAuth>
        <UserLayout>
          <MyProfilePage />
        </UserLayout>
      </RequireAuth>
    ),
  },
  {
    path: "/my-profile/security",
    element: (
      <RequireAuth>
        <UserLayout>
          <MyProfilePage />
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
      { path: "informasi/faq", element: <AdminFaqPage /> },
      { path: "inventarisasi", element: <Navigate to="/admin/inventarisasi/peralatan" replace /> },
      { path: "inventarisasi/peralatan", element: <AdminEquipmentPage /> },
      { path: "inventarisasi/peralatan/:id", element: <AdminEquipmentDetailPage /> },
      { path: "inventarisasi/ruangan", element: <AdminRoomPage /> },
      { path: "inventarisasi/ruangan/:id", element: <AdminRoomDetailPage /> },
      { path: "record/peminjaman-ruangan", element: <AdminRoomBorrowRecordPage /> },
      { path: "record/peminjaman-ruangan/:id", element: <AdminRoomBorrowRecordDetailPage /> },
      { path: "record/penggunaan-alat", element: <AdminEquipmentUsageRecordPage /> },
      { path: "record/penggunaan-alat/:id", element: <AdminEquipmentUsageRecordDetailPage /> },
      { path: "record/peminjaman-alat", element: <AdminEquipmentBorrowRecordPage /> },
      { path: "record/peminjaman-alat/:id", element: <AdminEquipmentBorrowRecordDetailPage /> },
      { path: "record/pengujian-sampel", element: <AdminSampleTestingRecordPage /> },
      { path: "record/pengujian-sampel/:id", element: <AdminSampleTestingRecordDetailPage /> },
      { path: "my-profile", element: <AdminMyProfilePage /> },
      { path: "profile/struktur-organisasi", element: <StructureOrgansPage /> },
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
