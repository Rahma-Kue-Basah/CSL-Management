"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronRight, ChevronsLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  EQUIPMENT_CATEGORY_OPTIONS,
  EQUIPMENT_STATUS_OPTIONS,
  MOVEABLE_OPTIONS,
} from "@/constants/equipments";
import { useChangePassword } from "@/hooks/auth/use-change-password";
import { useRoomOptions } from "@/hooks/rooms/use-room-options";
import { formatDateKey, parseDateKey } from "@/lib/date";

type DashboardActionPanelProps = {
  width: string;
  isOpen: boolean;
  mobile?: boolean;
  menu: {
    id: string;
    label: string;
    description: string;
    actions: Array<{ id: string; label: string; description: string }>;
  };
  menuParam: string | null;
  actionParam: string | null;
  getActionHref: (actionId: string) => string;
  getMenuHref: () => string;
  onClose: () => void;
};

export function DashboardActionPanel({
  width,
  isOpen,
  mobile = false,
  menu,
  menuParam,
  actionParam,
  getActionHref,
  getMenuHref,
  onClose,
}: DashboardActionPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const needsRoomOptions = menu.id === "schedule";
  const { rooms } = useRoomOptions(needsRoomOptions);
  const scheduleKeyword = searchParams.get("q") ?? "";
  const scheduleRoom = searchParams.get("room") ?? "";
  const scheduleCategory = searchParams.get("category") ?? "";
  const bookingKeyword = searchParams.get("q") ?? "";
  const bookingStatus = searchParams.get("status") ?? "";
  const bookingCreatedAfter = searchParams.get("created_after") ?? "";
  const bookingCreatedBefore = searchParams.get("created_before") ?? "";
  const roomKeyword = searchParams.get("q") ?? "";
  const roomFloor = searchParams.get("floor") ?? "";
  const equipmentKeyword = searchParams.get("q") ?? "";
  const equipmentStatus = searchParams.get("status") ?? "";
  const equipmentCategory = searchParams.get("category") ?? "";
  const equipmentRoom = searchParams.get("room") ?? "";
  const equipmentMoveable = searchParams.get("moveable") ?? "";
  const isBookingRequestListPage = pathname === "/booking-rooms";
  const isBookingAllRequestsPage = pathname === "/booking-rooms/all";
  const isRoomsListPage = pathname === "/rooms";
  const isUseRequestListPage = pathname === "/use-equipment";
  const isUseAllRequestsPage = pathname === "/use-equipment/all";
  const isEquipmentListPage = pathname === "/equipment";

  const updateScheduleFilter = (
    key: "q" | "room" | "category",
    value: string,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname);
  };

  const updateBookingFilter = (
    key: "q" | "status" | "created_after" | "created_before",
    value: string,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname);
  };

  const updateRoomFilter = (key: "q" | "floor", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname);
  };

  const updateEquipmentFilter = (
    key: "q" | "status" | "category" | "room" | "moveable",
    value: string,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname);
  };

  const handleActionClick = () => {
    if (mobile) onClose();
  };

  return (
    <aside
      aria-hidden={!isOpen}
      className={
        mobile
          ? "flex h-full w-full flex-col bg-[#E8F0FB]"
          : `fixed top-16 bottom-0 left-20 z-30 hidden border-r border-[#C5D3E8] bg-[#E8F0FB] shadow-[6px_0_24px_rgba(15,23,42,0.08)] transition-all duration-300 ease-in-out md:flex ${
              isOpen
                ? "translate-x-0 opacity-100"
                : "-translate-x-full opacity-0 pointer-events-none"
            }`
      }
      style={mobile ? undefined : { width }}
    >
      <div className="flex h-full w-full flex-col">
        <div
          className={`flex items-center justify-between border-b px-4 py-3 ${
            mobile ? "min-h-16" : ""
          }`}
        >
          <p className="text-sm font-semibold text-slate-800">{menu.label}</p>
          {!mobile ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto p-3">
          <div className="rounded-lg border border-[#D2DDED] bg-white p-3">
            <p className="text-sm text-slate-700">{menu.description}</p>
          </div>

          {menu.id === "schedule" && (
            <div className="rounded-lg border border-[#D2DDED] bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Filter Jadwal
              </p>
              <div className="mt-2 space-y-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Cari Agenda
                  </label>
                  <Input
                    value={scheduleKeyword}
                    onChange={(event) =>
                      updateScheduleFilter("q", event.target.value)
                    }
                    type="text"
                    placeholder="Cari jadwal lab..."
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Kategori
                  </label>
                  <select
                    value={scheduleCategory}
                    onChange={(event) =>
                      updateScheduleFilter("category", event.target.value)
                    }
                    className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-[#0048B4]"
                  >
                    <option value="">Semua Kategori</option>
                    <option value="schedule">Jadwal Umum</option>
                    <option value="booking">Booking Ruangan</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Ruangan
                  </label>
                  <select
                    value={scheduleRoom}
                    onChange={(event) =>
                      updateScheduleFilter("room", event.target.value)
                    }
                    className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-[#0048B4]"
                  >
                    <option value="">Semua Ruangan</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("q");
                    params.delete("category");
                    params.delete("room");
                    const next = params.toString();
                    router.replace(next ? `${pathname}?${next}` : pathname);
                  }}
                >
                  Reset Filter
                </Button>
              </div>
            </div>
          )}

          {menu.actions.length > 0 ? (
            menu.actions.map((action) => {
              const isActionActive =
                actionParam === action.id && menuParam === menu.id;
              const showBookingFilters =
                menu.id === "booking-rooms" &&
                isActionActive &&
                ((action.id === "request-list" && isBookingRequestListPage) ||
                  (action.id === "all-requests" && isBookingAllRequestsPage));
              const showRoomFilters =
                menu.id === "booking-rooms" &&
                isActionActive &&
                action.id === "rooms" &&
                isRoomsListPage;
              const showUseFilters =
                menu.id === "use-equipment" &&
                isActionActive &&
                ((action.id === "request-list" && isUseRequestListPage) ||
                  (action.id === "all-requests" && isUseAllRequestsPage));
              const showEquipmentFilters =
                menu.id === "use-equipment" &&
                isActionActive &&
                action.id === "equipment" &&
                isEquipmentListPage;

              return (
                <div key={action.id} className="space-y-3">
                  <Link
                    href={getActionHref(action.id)}
                    onClick={(event) => {
                      if (isActionActive && event.detail === 2) {
                        event.preventDefault();
                        router.push(getMenuHref());
                        handleActionClick();
                        return;
                      }
                      handleActionClick();
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                      isActionActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="truncate">{action.label}</span>
                    <ChevronRight className="h-4 w-4 opacity-70" />
                  </Link>

                  {showBookingFilters ? (
                    <div className="rounded-lg border border-[#D2DDED] bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Filter Pengajuan
                      </p>
                      <div className="mt-2 space-y-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            Cari
                          </label>
                          <Input
                            value={bookingKeyword}
                            onChange={(event) =>
                              updateBookingFilter("q", event.target.value)
                            }
                            type="search"
                            placeholder="Kode, ruangan"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            Status
                          </label>
                          <select
                            value={bookingStatus}
                            onChange={(event) =>
                              updateBookingFilter("status", event.target.value)
                            }
                            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-[#0048B4]"
                          >
                            <option value="">Semua Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="expired">Expired</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            Dibuat Dari
                          </label>
                          <DatePicker
                            value={parseDateKey(bookingCreatedAfter)}
                            onChange={(value) =>
                              updateBookingFilter(
                                "created_after",
                                value ? formatDateKey(value) : "",
                              )
                            }
                            clearable
                            buttonClassName="h-9 border-slate-200 px-3"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            Dibuat Sampai
                          </label>
                          <DatePicker
                            value={parseDateKey(bookingCreatedBefore)}
                            onChange={(value) =>
                              updateBookingFilter(
                                "created_before",
                                value ? formatDateKey(value) : "",
                              )
                            }
                            clearable
                            buttonClassName="h-9 border-slate-200 px-3"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            const params = new URLSearchParams(searchParams.toString());
                            params.delete("q");
                            params.delete("status");
                            params.delete("created_after");
                            params.delete("created_before");
                            const next = params.toString();
                            router.replace(next ? `${pathname}?${next}` : pathname);
                          }}
                        >
                          Reset Filter
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {showRoomFilters ? (
                    <div className="rounded-lg border border-[#D2DDED] bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Filter Ruangan
                      </p>
                      <div className="mt-2 space-y-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            Cari
                          </label>
                          <Input
                            value={roomKeyword}
                            onChange={(event) =>
                              updateRoomFilter("q", event.target.value)
                            }
                            type="search"
                            placeholder="Nama ruangan atau nomor"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            Lantai
                          </label>
                          <select
                            value={roomFloor}
                            onChange={(event) =>
                              updateRoomFilter("floor", event.target.value)
                            }
                            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-[#0048B4]"
                          >
                            <option value="">Semua Lantai</option>
                            <option value="1">Lantai 1</option>
                            <option value="2">Lantai 2</option>
                            <option value="3">Lantai 3</option>
                            <option value="4">Lantai 4</option>
                            <option value="5">Lantai 5</option>
                          </select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            const params = new URLSearchParams(searchParams.toString());
                            params.delete("q");
                            params.delete("floor");
                            const next = params.toString();
                            router.replace(next ? `${pathname}?${next}` : pathname);
                          }}
                        >
                          Reset Filter
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {showUseFilters ? (
                    <div className="rounded-lg border border-[#D2DDED] bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Filter Pengajuan
                      </p>
                      <div className="mt-2 space-y-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            Cari
                          </label>
                          <Input
                            value={bookingKeyword}
                            onChange={(event) =>
                              updateBookingFilter("q", event.target.value)
                            }
                            type="search"
                            placeholder="Kode, alat"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            Status
                          </label>
                          <select
                            value={bookingStatus}
                            onChange={(event) =>
                              updateBookingFilter("status", event.target.value)
                            }
                            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-[#0048B4]"
                          >
                            <option value="">Semua Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="expired">Expired</option>
                            <option value="in_use">In Use</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            Dibuat Dari
                          </label>
                          <DatePicker
                            value={parseDateKey(bookingCreatedAfter)}
                            onChange={(value) =>
                              updateBookingFilter(
                                "created_after",
                                value ? formatDateKey(value) : "",
                              )
                            }
                            clearable
                            buttonClassName="h-9 border-slate-200 px-3"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            Dibuat Sampai
                          </label>
                          <DatePicker
                            value={parseDateKey(bookingCreatedBefore)}
                            onChange={(value) =>
                              updateBookingFilter(
                                "created_before",
                                value ? formatDateKey(value) : "",
                              )
                            }
                            clearable
                            buttonClassName="h-9 border-slate-200 px-3"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            const params = new URLSearchParams(searchParams.toString());
                            params.delete("q");
                            params.delete("status");
                            params.delete("created_after");
                            params.delete("created_before");
                            const next = params.toString();
                            router.replace(next ? `${pathname}?${next}` : pathname);
                          }}
                        >
                          Reset Filter
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {showEquipmentFilters ? (
                    <div className="rounded-lg border border-[#D2DDED] bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Filter Peralatan
                      </p>
                      <div className="mt-2 space-y-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            Cari
                          </label>
                          <Input
                            value={equipmentKeyword}
                            onChange={(event) =>
                              updateEquipmentFilter("q", event.target.value)
                            }
                            type="search"
                            placeholder="Nama atau kategori"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            Status
                          </label>
                          <select
                            value={equipmentStatus}
                            onChange={(event) =>
                              updateEquipmentFilter("status", event.target.value)
                            }
                            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-[#0048B4]"
                          >
                            <option value="">Semua Status</option>
                            {EQUIPMENT_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            Kategori
                          </label>
                          <select
                            value={equipmentCategory}
                            onChange={(event) =>
                              updateEquipmentFilter("category", event.target.value)
                            }
                            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-[#0048B4]"
                          >
                            <option value="">Semua Kategori</option>
                            {EQUIPMENT_CATEGORY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            Ruangan
                          </label>
                          <select
                            value={equipmentRoom}
                            onChange={(event) =>
                              updateEquipmentFilter("room", event.target.value)
                            }
                            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-[#0048B4]"
                          >
                            <option value="">Semua Ruangan</option>
                            {rooms.map((room) => (
                              <option key={room.id} value={room.id}>
                                {room.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            Moveable
                          </label>
                          <select
                            value={equipmentMoveable}
                            onChange={(event) =>
                              updateEquipmentFilter("moveable", event.target.value)
                            }
                            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-[#0048B4]"
                          >
                            <option value="">Semua</option>
                            {MOVEABLE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            const params = new URLSearchParams(searchParams.toString());
                            params.delete("q");
                            params.delete("status");
                            params.delete("category");
                            params.delete("room");
                            params.delete("moveable");
                            const next = params.toString();
                            router.replace(next ? `${pathname}?${next}` : pathname);
                          }}
                        >
                          Reset Filter
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : null}

          {menu.id === "my-profile" && actionParam === "change-password" ? (
            <ProfileSecurityPanel />
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function ProfileSecurityPanel() {
  const {
    formData: passwordFormData,
    status: passwordStatus,
    message: passwordMessage,
    handleChange: handlePasswordChange,
    handleSubmit: handlePasswordSubmit,
  } = useChangePassword();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="rounded-lg border border-[#D2DDED] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-slate-600" />
        <h2 className="text-sm font-semibold text-slate-900">Keamanan Akun</h2>
      </div>

      <form
        className="mt-3 space-y-3 rounded-md border border-[#E3EAF4] bg-white p-2.5"
        onSubmit={handlePasswordSubmit}
      >
        <PasswordField
          id="currentPassword"
          label="Password Lama"
          name="currentPassword"
          value={passwordFormData.currentPassword}
          onChange={handlePasswordChange}
          show={showCurrentPassword}
          setShow={setShowCurrentPassword}
        />
        <PasswordField
          id="newPassword"
          label="Password Baru"
          name="newPassword"
          value={passwordFormData.newPassword}
          onChange={handlePasswordChange}
          show={showNewPassword}
          setShow={setShowNewPassword}
        />
        <PasswordField
          id="confirmPassword"
          label="Konfirmasi Password Baru"
          name="confirmPassword"
          value={passwordFormData.confirmPassword}
          onChange={handlePasswordChange}
          show={showConfirmPassword}
          setShow={setShowConfirmPassword}
        />

        {passwordMessage ? (
          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              passwordStatus === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-destructive/20 bg-destructive/5 text-destructive"
            }`}
          >
            {passwordMessage}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={passwordStatus === "submitting"}>
          {passwordStatus === "submitting" ? "Menyimpan..." : "Ganti Password"}
        </Button>
      </form>
    </div>
  );
}

function PasswordField({
  id,
  label,
  name,
  value,
  onChange,
  show,
  setShow,
}: {
  id: string;
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  show: boolean;
  setShow: (value: boolean) => void;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-slate-600">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          className="pr-9"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-2 flex items-center text-slate-500"
          onClick={() => setShow(!show)}
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
