"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronsLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChangePassword } from "@/hooks/auth/use-change-password";

type DashboardActionPanelProps = {
  width: string;
  isOpen: boolean;
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
  menu,
  menuParam,
  actionParam,
  getActionHref,
  getMenuHref,
  onClose,
}: DashboardActionPanelProps) {
  const router = useRouter();
  const [scheduleKeyword, setScheduleKeyword] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState("all");

  return (
    <aside
      aria-hidden={!isOpen}
      className={`fixed top-16 bottom-0 left-20 z-30 hidden border-r border-[#C5D3E8] bg-[#E8F0FB] shadow-[6px_0_24px_rgba(15,23,42,0.08)] transition-all duration-300 ease-in-out md:flex ${
        isOpen
          ? "translate-x-0 opacity-100"
          : "-translate-x-full opacity-0 pointer-events-none"
      }`}
      style={{ width }}
    >
      <div className="flex h-full w-full flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">{menu.label}</p>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto p-3">
          <div className="rounded-lg border border-[#D2DDED] bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Informasi Menu
            </p>
            <p className="mt-1 text-sm text-slate-700">{menu.description}</p>
          </div>

          {menu.id === "schedule" && (
            <div className="rounded-lg border border-[#D2DDED] bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Filter Jadwal
              </p>
              <div className="mt-2 space-y-2">
                <input
                  value={scheduleKeyword}
                  onChange={(event) => setScheduleKeyword(event.target.value)}
                  type="text"
                  placeholder="Cari jadwal lab..."
                  className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-[#0048B4]"
                />
                <select
                  value={scheduleFilter}
                  onChange={(event) => setScheduleFilter(event.target.value)}
                  className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-[#0048B4]"
                >
                  <option value="all">Semua Hari</option>
                  <option value="weekday">Weekday</option>
                  <option value="weekend">Weekend</option>
                </select>
              </div>
            </div>
          )}

          {menu.actions.length > 0 ? (
            menu.actions.map((action) => {
              const isActionActive =
                actionParam === action.id && menuParam === menu.id;

              return (
                <Link
                  key={action.id}
                  href={getActionHref(action.id)}
                  onClick={(event) => {
                    if (isActionActive && event.detail === 2) {
                      event.preventDefault();
                      router.push(getMenuHref());
                    }
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
