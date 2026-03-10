"use client";

import type { ReactElement } from "react";
import { usePathname } from "next/navigation";
import { DashboardWelcomeSection } from "@/components/dashboard/pages/DashboardWelcomeSection";
import { DashboardOverviewSection } from "@/components/dashboard/pages/DashboardOverviewSection";
import { ScheduleSection } from "@/components/dashboard/pages/ScheduleSection";
import { BookingRoomsListSection } from "@/components/dashboard/pages/BookingRoomsListSection";
import { BookingRoomsFormSection } from "@/components/dashboard/pages/BookingRoomsFormSection";
import { RoomsListSection } from "@/components/dashboard/pages/RoomsListSection";
import { UseEquipmentListSection } from "@/components/dashboard/pages/UseEquipmentListSection";
import { UseEquipmentFormSection } from "@/components/dashboard/pages/UseEquipmentFormSection";
import { EquipmentListSection } from "@/components/dashboard/pages/EquipmentListSection";
import { SampleTestingListSection } from "@/components/dashboard/pages/SampleTestingListSection";
import { SampleTestingFormSection } from "@/components/dashboard/pages/SampleTestingFormSection";
import { BorrowEquipmentListSection } from "@/components/dashboard/pages/BorrowEquipmentListSection";
import { BorrowEquipmentFormSection } from "@/components/dashboard/pages/BorrowEquipmentFormSection";
import { NotificationsSection } from "@/components/dashboard/pages/NotificationsSection";
import { ActivityHistorySection } from "@/components/dashboard/pages/ActivityHistorySection";
import { MyProfileSection } from "@/components/dashboard/pages/MyProfileSection";
import { DashboardNotFoundSection } from "@/components/dashboard/pages/DashboardNotFoundSection";

export default function DashboardPage() {
  const pathname = usePathname();

  const contentByPath: Record<string, ReactElement> = {
    "/dashboard": <DashboardWelcomeSection />,
    "/dashboard/overview": <DashboardOverviewSection />,
    "/schedule": <ScheduleSection />,
    "/booking-rooms": <BookingRoomsListSection />,
    "/booking-rooms/form": <BookingRoomsFormSection />,
    "/rooms": <RoomsListSection />,
    "/use-equipment": <UseEquipmentListSection />,
    "/use-equipment/form": <UseEquipmentFormSection />,
    "/equipment": <EquipmentListSection />,
    "/sample-testing": <SampleTestingListSection />,
    "/sample-testing/form": <SampleTestingFormSection />,
    "/borrow-equipment": <BorrowEquipmentListSection />,
    "/borrow-equipment/form": <BorrowEquipmentFormSection />,
    "/notifications": <NotificationsSection />,
    "/activity-history": <ActivityHistorySection />,
    "/my-profile": <MyProfileSection />,
    "/my-profile/edit": <MyProfileSection />,
    "/my-profile/security": <MyProfileSection />,
  };

  return contentByPath[pathname] ?? <DashboardNotFoundSection />;
}
