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
import DashboardFacilitiesPage from "@/pages/dashboard/facilities/DashboardFacilitiesPage";
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
import BorrowEquipmentAllListPage from "@/pages/dashboard/borrow-equipment/BorrowEquipmentAllListPage";
import BorrowEquipmentFormPage from "@/pages/dashboard/borrow-equipment/BorrowEquipmentFormPage";
import BorrowEquipmentAvailablePage from "@/pages/dashboard/borrow-equipment/BorrowEquipmentAvailablePage";
import BorrowEquipmentDetailPage from "@/pages/dashboard/borrow-equipment/BorrowEquipmentDetailPage";
import NotificationsPage from "@/pages/dashboard/account/NotificationsPage";
import MyProfilePage from "@/pages/dashboard/account/MyProfilePage";
import AdminHomePage from "@/pages/admin/home/AdminHomePage";
import AdminSchedulePage from "@/pages/admin/information/AdminSchedulePage";
import AdminAnnouncementPage from "@/pages/admin/information/AdminAnnouncementPage";
import AdminFaqPage from "@/pages/admin/information/AdminFaqPage";
import AdminEquipmentPage from "@/pages/admin/inventory/AdminEquipmentPage";
import AdminEquipmentDetailPage from "@/pages/admin/inventory/AdminEquipmentDetailPage";
import AdminRoomPage from "@/pages/admin/inventory/AdminRoomPage";
import AdminRoomDetailPage from "@/pages/admin/inventory/AdminRoomDetailPage";
import AdminRoomBookingRecordPage from "@/pages/admin/records/AdminRoomBookingRecordPage";
import AdminEquipmentUsageRecordPage from "@/pages/admin/records/AdminEquipmentUsageRecordPage";
import AdminEquipmentBorrowRecordPage from "@/pages/admin/records/AdminEquipmentBorrowRecordPage";
import AdminSampleTestingRecordPage from "@/pages/admin/records/AdminSampleTestingRecordPage";
import AdminMyProfilePage from "@/pages/admin/profile/AdminMyProfilePage";
import StructureOrgansPage from "@/pages/admin/lab-profile/StructureOrgansPage";
import FacilityPage from "@/pages/admin/lab-profile/FacilityPage";
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
      { path: "login", element: <LoginPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "signup-guest", element: <SignupGuestPage /> },
      { path: "signup-guest/verify/:key", element: <SignupGuestVerifyPage /> },
      { path: "reset-password/:uid/:token", element: <ResetPasswordPage /> },
    ],
  },
  {
    element: (
      <RequireAuth>
        <UserLayout />
      </RequireAuth>
    ),
    children: [
      {
        path: "dashboard",
        children: [
          { index: true, element: <DashboardHomePage /> },
          { path: "overview", element: <DashboardOverviewPage /> },
          { path: "announcements", element: <DashboardAnnouncementsPage /> },
          { path: "faq", element: <DashboardFaqPage /> },
          { path: "organization-structure", element: <DashboardStructureOrganizationsPage /> },
          { path: "facilities", element: <DashboardFacilitiesPage /> },
        ],
      },
      { path: "schedule", element: <SchedulePage /> },
      {
        path: "booking-rooms",
        children: [
          { index: true, element: <BookingRoomsListPage /> },
          { path: "all", element: <BookingRoomsAllListPage /> },
          { path: "all/:id", element: <BookingRoomsDetailPage /> },
          { path: "form", element: <BookingRoomsFormPage /> },
          { path: ":id", element: <BookingRoomsDetailPage /> },
        ],
      },
      { path: "rooms", element: <RoomsListPage /> },
      { path: "rooms/:id", element: <RoomDetailPage /> },
      {
        path: "use-equipment",
        children: [
          { index: true, element: <UseEquipmentListPage /> },
          { path: "all", element: <UseEquipmentAllListPage /> },
          { path: "form", element: <UseEquipmentFormPage /> },
          { path: "all/:id", element: <UseEquipmentDetailPage /> },
          { path: ":id", element: <UseEquipmentDetailPage /> },
        ],
      },
      { path: "equipment", element: <EquipmentListPage /> },
      { path: "equipment/:id", element: <EquipmentDetailPage /> },
      {
        path: "sample-testing",
        children: [
          { index: true, element: <SampleTestingListPage /> },
          { path: "form", element: <SampleTestingFormPage /> },
        ],
      },
      {
        path: "borrow-equipment",
        children: [
          { index: true, element: <BorrowEquipmentListPage /> },
          { path: "all", element: <BorrowEquipmentAllListPage /> },
          { path: "form", element: <BorrowEquipmentFormPage /> },
          { path: "equipment", element: <BorrowEquipmentAvailablePage /> },
          { path: "all/:id", element: <BorrowEquipmentDetailPage /> },
          { path: ":id", element: <BorrowEquipmentDetailPage /> },
        ],
      },
      { path: "notifications", element: <NotificationsPage /> },
      {
        path: "my-profile",
        children: [
          { index: true, element: <MyProfilePage /> },
          { path: "edit", element: <MyProfilePage /> },
          { path: "security", element: <MyProfilePage /> },
        ],
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <RequireAuth>
        <RequireAdmin>
          <AdminLayout />
        </RequireAdmin>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="home" replace /> },
      { path: "home", element: <AdminHomePage /> },
      { path: "my-profile", element: <AdminMyProfilePage /> },
      {
        path: "information",
        children: [
          { index: true, element: <Navigate to="schedules" replace /> },
          { path: "schedules", element: <AdminSchedulePage /> },
          { path: "announcements", element: <AdminAnnouncementPage /> },
          { path: "faq", element: <AdminFaqPage /> },
        ],
      },
      {
        path: "inventory",
        children: [
          { index: true, element: <Navigate to="equipment" replace /> },
          { path: "equipment", element: <AdminEquipmentPage /> },
          { path: "equipment/:id", element: <AdminEquipmentDetailPage /> },
          { path: "rooms", element: <AdminRoomPage /> },
          { path: "rooms/:id", element: <AdminRoomDetailPage /> },
        ],
      },
      {
        path: "records",
        children: [
          { path: "room-bookings", element: <AdminRoomBookingRecordPage /> },
          { path: "equipment-usage", element: <AdminEquipmentUsageRecordPage /> },
          { path: "equipment-borrows", element: <AdminEquipmentBorrowRecordPage /> },
          { path: "sample-testing", element: <AdminSampleTestingRecordPage /> },
        ],
      },
      {
        path: "profile",
        children: [
          { path: "organization-structure", element: <StructureOrgansPage /> },
          { path: "facilities", element: <FacilityPage /> },
        ],
      },
      {
        path: "user-management",
        children: [
          { index: true, element: <Navigate to="all" replace /> },
          { path: "all", element: <UserManagementAllPage /> },
          { path: "student", element: <UserManagementStudentPage /> },
          { path: "lecturer", element: <UserManagementLecturerPage /> },
          { path: "admin", element: <UserManagementAdminPage /> },
          { path: "staff", element: <UserManagementStaffPage /> },
          { path: "guest", element: <UserManagementGuestPage /> },
          { path: "detail/:id", element: <UserManagementUserDetailPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
