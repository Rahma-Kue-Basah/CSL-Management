import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

import AuthLayout from "@/layouts/AuthLayout";
import AdminLayout from "@/layouts/AdminLayout";
import { UserLayout } from "@/layouts/UserLayout";
import {
  hasAuthToken,
  RequireAdmin,
  RequireAuth,
  RequireFeatureScope,
  RequireMenuAccess,
  RequireStaffOrAbove,
  useResolvedAuthStatus,
} from "@/routes/guards";

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
import ApprovalSampleTestingPage from "@/pages/dashboard/approval/ApprovalSampleTestingPage";
import NotificationsPage from "@/pages/dashboard/account/NotificationsPage";
import MyProfilePage from "@/pages/dashboard/account/MyProfilePage";
import AdminHomePage from "@/pages/admin/home/AdminHomePage";
import AdminSchedulePage from "@/pages/admin/information/AdminSchedulePage";
import AdminAnnouncementPage from "@/pages/admin/information/AdminAnnouncementPage";
import AdminFaqPage from "@/pages/admin/information/AdminFaqPage";
import AdminEquipmentPage from "@/pages/admin/inventory/AdminEquipmentPage";
import AdminRoomPage from "@/pages/admin/inventory/AdminRoomPage";
import AdminRoomBookingHistoryPage from "@/pages/admin/history/AdminRoomBookingHistoryPage";
import AdminEquipmentUsageHistoryPage from "@/pages/admin/history/AdminEquipmentUsageHistoryPage";
import AdminEquipmentBorrowHistoryPage from "@/pages/admin/history/AdminEquipmentBorrowHistoryPage";
import AdminSampleTestingHistoryPage from "@/pages/admin/history/AdminSampleTestingHistoryPage";
import AdminMyProfilePage from "@/pages/admin/profile/AdminMyProfilePage";
import StructureOrgansPage from "@/pages/admin/lab-profile/StructureOrgansPage";
import FacilityPage from "@/pages/admin/lab-profile/FacilityPage";
import UserManagementAllPage from "@/pages/admin/user-management/UserManagementAllPage";
import UserManagementStudentPage from "@/pages/admin/user-management/UserManagementStudentPage";
import UserManagementLecturerPage from "@/pages/admin/user-management/UserManagementLecturerPage";
import UserManagementAdminPage from "@/pages/admin/user-management/UserManagementAdminPage";
import UserManagementStaffPage from "@/pages/admin/user-management/UserManagementStaffPage";
import UserManagementGuestPage from "@/pages/admin/user-management/UserManagementGuestPage";
import NotFoundPage from "@/pages/errors/NotFoundPage";

function AuthLayoutOutlet() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
}

function RootRedirect() {
  const status = useResolvedAuthStatus();

  if (status === "checking") return null;

  return <Navigate to={status === "authenticated" || hasAuthToken() ? "/dashboard" : "/login"} replace />;
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
        element: (
          <RequireMenuAccess menuId="dashboard">
            <Outlet />
          </RequireMenuAccess>
        ),
        children: [
          { index: true, element: <DashboardHomePage /> },
          { path: "overview", element: <DashboardOverviewPage /> },
          { path: "announcements", element: <DashboardAnnouncementsPage /> },
          { path: "faq", element: <DashboardFaqPage /> },
          { path: "organization-structure", element: <DashboardStructureOrganizationsPage /> },
          { path: "facilities", element: <DashboardFacilitiesPage /> },
        ],
      },
      {
        path: "schedule",
        element: (
          <RequireMenuAccess menuId="schedule">
            <SchedulePage />
          </RequireMenuAccess>
        ),
      },
      {
        path: "booking-rooms",
        element: (
          <RequireMenuAccess menuId="booking-rooms">
            <Outlet />
          </RequireMenuAccess>
        ),
        children: [
          {
            index: true,
            element: (
              <RequireFeatureScope featurePath="/booking-rooms" scope="requester">
                <BookingRoomsListPage />
              </RequireFeatureScope>
            ),
          },
          {
            path: "form",
            element: (
              <RequireFeatureScope featurePath="/booking-rooms" scope="requester">
                <BookingRoomsFormPage />
              </RequireFeatureScope>
            ),
          },
          {
            path: "approval",
            element: (
              <RequireFeatureScope featurePath="/booking-rooms" scope="approval">
                <RequireStaffOrAbove>
                  <BookingRoomsAllListPage />
                </RequireStaffOrAbove>
              </RequireFeatureScope>
            ),
          },
          {
            path: "approval/:id",
            element: (
              <RequireFeatureScope featurePath="/booking-rooms" scope="approval">
                <RequireStaffOrAbove>
                  <BookingRoomsDetailPage />
                </RequireStaffOrAbove>
              </RequireFeatureScope>
            ),
          },
          {
            path: ":id",
            element: (
              <RequireFeatureScope featurePath="/booking-rooms" scope="requester">
                <BookingRoomsDetailPage />
              </RequireFeatureScope>
            ),
          },
        ],
      },
      {
        path: "rooms",
        element: (
          <RequireMenuAccess menuId="booking-rooms">
            <RoomsListPage />
          </RequireMenuAccess>
        ),
      },
      {
        path: "rooms/:id",
        element: (
          <RequireMenuAccess menuId="booking-rooms">
            <RoomDetailPage />
          </RequireMenuAccess>
        ),
      },
      {
        path: "use-equipment",
        element: (
          <RequireMenuAccess menuId="use-equipment">
            <Outlet />
          </RequireMenuAccess>
        ),
        children: [
          {
            index: true,
            element: (
              <RequireFeatureScope featurePath="/use-equipment" scope="requester">
                <UseEquipmentListPage />
              </RequireFeatureScope>
            ),
          },
          {
            path: "form",
            element: (
              <RequireFeatureScope featurePath="/use-equipment" scope="requester">
                <UseEquipmentFormPage />
              </RequireFeatureScope>
            ),
          },
          {
            path: "approval",
            element: (
              <RequireFeatureScope featurePath="/use-equipment" scope="approval">
                <RequireStaffOrAbove>
                  <UseEquipmentAllListPage />
                </RequireStaffOrAbove>
              </RequireFeatureScope>
            ),
          },
          {
            path: "approval/:id",
            element: (
              <RequireFeatureScope featurePath="/use-equipment" scope="approval">
                <RequireStaffOrAbove>
                  <UseEquipmentDetailPage />
                </RequireStaffOrAbove>
              </RequireFeatureScope>
            ),
          },
          {
            path: ":id",
            element: (
              <RequireFeatureScope featurePath="/use-equipment" scope="requester">
                <UseEquipmentDetailPage />
              </RequireFeatureScope>
            ),
          },
        ],
      },
      {
        path: "equipment",
        element: (
          <RequireMenuAccess menuId="use-equipment">
            <EquipmentListPage />
          </RequireMenuAccess>
        ),
      },
      {
        path: "equipment/:id",
        element: (
          <RequireMenuAccess menuId="use-equipment">
            <EquipmentDetailPage />
          </RequireMenuAccess>
        ),
      },
      {
        path: "sample-testing",
        element: (
          <RequireMenuAccess menuId="sample-testing">
            <Outlet />
          </RequireMenuAccess>
        ),
        children: [
          {
            index: true,
            element: (
              <RequireFeatureScope featurePath="/sample-testing" scope="requester">
                <SampleTestingListPage />
              </RequireFeatureScope>
            ),
          },
          {
            path: "form",
            element: (
              <RequireFeatureScope featurePath="/sample-testing" scope="requester">
                <SampleTestingFormPage />
              </RequireFeatureScope>
            ),
          },
          {
            path: "approval",
            element: (
              <RequireFeatureScope featurePath="/sample-testing" scope="approval">
                <RequireStaffOrAbove>
                  <ApprovalSampleTestingPage />
                </RequireStaffOrAbove>
              </RequireFeatureScope>
            ),
          },
        ],
      },
      {
        path: "borrow-equipment",
        element: (
          <RequireMenuAccess menuId="borrow-equipment">
            <Outlet />
          </RequireMenuAccess>
        ),
        children: [
          {
            index: true,
            element: (
              <RequireFeatureScope featurePath="/borrow-equipment" scope="requester">
                <BorrowEquipmentListPage />
              </RequireFeatureScope>
            ),
          },
          {
            path: "form",
            element: (
              <RequireFeatureScope featurePath="/borrow-equipment" scope="requester">
                <BorrowEquipmentFormPage />
              </RequireFeatureScope>
            ),
          },
          { path: "equipment", element: <BorrowEquipmentAvailablePage /> },
          {
            path: "approval",
            element: (
              <RequireFeatureScope featurePath="/borrow-equipment" scope="approval">
                <RequireStaffOrAbove>
                  <BorrowEquipmentAllListPage />
                </RequireStaffOrAbove>
              </RequireFeatureScope>
            ),
          },
          {
            path: "approval/:id",
            element: (
              <RequireFeatureScope featurePath="/borrow-equipment" scope="approval">
                <RequireStaffOrAbove>
                  <BorrowEquipmentDetailPage />
                </RequireStaffOrAbove>
              </RequireFeatureScope>
            ),
          },
          {
            path: ":id",
            element: (
              <RequireFeatureScope featurePath="/borrow-equipment" scope="requester">
                <BorrowEquipmentDetailPage />
              </RequireFeatureScope>
            ),
          },
        ],
      },
      {
        path: "notifications",
        element: (
          <RequireMenuAccess menuId="notifications">
            <NotificationsPage />
          </RequireMenuAccess>
        ),
      },
      {
        path: "my-profile",
        element: (
          <RequireMenuAccess menuId="my-profile">
            <Outlet />
          </RequireMenuAccess>
        ),
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
      { path: "schedules", element: <AdminSchedulePage /> },
      { path: "my-profile", element: <AdminMyProfilePage /> },
      {
        path: "information",
        children: [
          { index: true, element: <Navigate to="announcements" replace /> },
          { path: "schedules", element: <Navigate to="/admin/schedules" replace /> },
          { path: "announcements", element: <AdminAnnouncementPage /> },
          { path: "faq", element: <AdminFaqPage /> },
          { path: "organization-structure", element: <StructureOrgansPage /> },
          { path: "facilities", element: <FacilityPage /> },
        ],
      },
      {
        path: "inventory",
        children: [
          { index: true, element: <Navigate to="equipment" replace /> },
          { path: "equipment", element: <AdminEquipmentPage /> },
          { path: "rooms", element: <AdminRoomPage /> },
        ],
      },
      {
        path: "history",
        children: [
          { path: "room-bookings", element: <AdminRoomBookingHistoryPage /> },
          { path: "equipment-usage", element: <AdminEquipmentUsageHistoryPage /> },
          { path: "equipment-borrows", element: <AdminEquipmentBorrowHistoryPage /> },
          { path: "sample-testing", element: <AdminSampleTestingHistoryPage /> },
        ],
      },
      {
        path: "profile",
        children: [
          {
            path: "organization-structure",
            element: <Navigate to="/admin/information/organization-structure" replace />,
          },
          {
            path: "facilities",
            element: <Navigate to="/admin/information/facilities" replace />,
          },
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
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
