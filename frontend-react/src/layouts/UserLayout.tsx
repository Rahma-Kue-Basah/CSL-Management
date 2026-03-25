"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Outlet } from "react-router-dom";
import {
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  GitBranch,
  FilePenLine,
  FlaskConical,
  CircleHelp,
  LayoutGrid,
  LayoutDashboard,
  Package,
  ShieldCheck,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DashboardTopNavbar,
  TOP_NAV_ITEMS,
} from "@/components/dashboard/layout/DashboardTopNavbar";
import { DashboardSideNavbar } from "@/components/dashboard/layout/DashboardSideNavbar";
import { DashboardActionPanel } from "@/components/dashboard/layout/DashboardActionPanel";
import { DashboardMainLayout } from "@/components/dashboard/layout/DashboardMainLayout";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLoadProfile } from "@/hooks/profile/use-load-profile";
import Link from "next/link";
import { cn } from "@/lib/utils";

type UserLayoutProps = {
  children?: ReactNode;
};

type ShortcutAction = {
  id: string;
  label: string;
  description: string;
  href: string;
};

type SidebarShortcut = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  actions: ShortcutAction[];
};

function getHeaderIcon(menuId: string, actionId: string | null) {
  if (menuId === "dashboard") {
    if (actionId === "announcements") return Bell;
    if (actionId === "faq") return CircleHelp;
    if (actionId === "organization-structure") return GitBranch;
    if (actionId === "facilities") return Building2;
    return LayoutDashboard;
  }

  if (menuId === "schedule") return CalendarDays;

  if (menuId === "booking-rooms") {
    if (actionId === "request-form") return FilePenLine;
    if (actionId === "request-list" || actionId === "all-requests") {
      return ClipboardList;
    }
    if (actionId === "rooms") return Building2;
    return Building2;
  }

  if (menuId === "use-equipment") {
    if (actionId === "request-form") return FilePenLine;
    if (actionId === "request-list" || actionId === "all-requests")
      return ClipboardList;
    if (actionId === "equipment") return Wrench;
    return Wrench;
  }

  if (menuId === "sample-testing") {
    if (actionId === "request-form") return FilePenLine;
    if (actionId === "request-list") return ClipboardList;
    return FlaskConical;
  }

  if (menuId === "borrow-equipment") {
    if (actionId === "request-form") return FilePenLine;
    if (actionId === "request-list") return ClipboardList;
    if (actionId === "equipment") return Package;
    return Package;
  }

  if (menuId === "notifications") return Bell;

  if (menuId === "my-profile") {
    if (actionId === "change-password") return ShieldCheck;
    return UserRound;
  }

  return LayoutDashboard;
}

const ACTION_PANEL_WIDTH = "22rem";
const SIDEBAR_WIDTH = "5rem";

const SIDEBAR_SHORTCUTS: SidebarShortcut[] = [
  {
    id: "dashboard",
    label: "Welcome, User!",
    description:
      "Akses utama untuk layanan CSL, termasuk jadwal, pemesanan, pengajuan, dan informasi terbaru.",
    href: "/dashboard",
    icon: LayoutDashboard,
    actions: [
      {
        id: "overview",
        label: "Ringkasan",
        description:
          "Lihat ringkasan status pengajuan dan aktivitas terbaru Anda.",
        href: "/dashboard/overview",
      },
      {
        id: "announcements",
        label: "Pengumuman",
        description: "Lihat pengumuman terbaru dari admin.",
        href: "/dashboard/announcements",
      },
      {
        id: "organization-structure",
        label: "Struktur Organisasi",
        description: "Lihat bagan struktur organisasi laboratorium.",
        href: "/dashboard/organization-structure",
      },
      {
        id: "facilities",
        label: "Fasilitas",
        description: "Lihat daftar fasilitas laboratorium yang tersedia.",
        href: "/dashboard/facilities",
      },
      {
        id: "faq",
        label: "FAQ",
        description:
          "Temukan jawaban cepat untuk pertanyaan yang sering diajukan.",
        href: "/dashboard/faq",
      },
    ],
  },
  {
    id: "schedule",
    label: "Jadwal Lab",
    description: "Kelola agenda lab dan jadwal kegiatan mendatang.",
    href: "/schedule",
    icon: CalendarDays,
    actions: [],
  },
  {
    id: "booking-rooms",
    label: "Booking Ruangan",
    description: "Kelola pengajuan booking dan pantau progresnya.",
    href: "/booking-rooms/form",
    icon: Building2,
    actions: [
      {
        id: "request-form",
        label: "Ajukan Booking",
        description: "Buat pengajuan booking ruangan melalui formulir.",
        href: "/booking-rooms/form",
      },
      {
        id: "request-list",
        label: "Pengajuan Saya",
        description: "Lihat daftar pengajuan booking ruangan Anda.",
        href: "/booking-rooms",
      },
      {
        id: "all-requests",
        label: "Daftar Pengajuan",
        description: "Lihat seluruh daftar pengajuan booking ruangan.",
        href: "/booking-rooms/all",
      },
      {
        id: "rooms",
        label: "Ruangan yang Bisa di-Booking",
        description: "Lihat daftar ruangan yang tersedia untuk dibooking.",
        href: "/rooms",
      },
    ],
  },
  {
    id: "use-equipment",
    label: "Penggunaan Alat",
    description: "Kelola pengajuan penggunaan alat beserta formulirnya.",
    href: "/use-equipment/form",
    icon: Wrench,
    actions: [
      {
        id: "request-form",
        label: "Ajukan Penggunaan",
        description: "Buat pengajuan penggunaan alat melalui formulir.",
        href: "/use-equipment/form",
      },
      {
        id: "request-list",
        label: "Pengajuan Saya",
        description: "Lihat daftar pengajuan penggunaan alat Anda.",
        href: "/use-equipment",
      },
      {
        id: "all-requests",
        label: "Daftar Pengajuan",
        description: "Lihat seluruh daftar pengajuan penggunaan alat.",
        href: "/use-equipment/all",
      },
      {
        id: "equipment",
        label: "Peralatan yang Bisa Dibooking",
        description: "Lihat daftar peralatan yang tersedia untuk dibooking.",
        href: "/equipment",
      },
    ],
  },
  {
    id: "sample-testing",
    label: "Pengujian Sampel",
    description: "Kelola pengajuan pengujian sampel dan formulirnya.",
    href: "/sample-testing/form",
    icon: FlaskConical,
    actions: [
      {
        id: "request-form",
        label: "Ajukan Pengujian",
        description: "Buat pengajuan pengujian sampel melalui formulir.",
        href: "/sample-testing/form",
      },
      {
        id: "request-list",
        label: "Pengajuan Saya",
        description: "Lihat daftar pengajuan pengujian sampel Anda.",
        href: "/sample-testing",
      },
    ],
  },
  {
    id: "borrow-equipment",
    label: "Peminjaman Alat",
    description: "Kelola pengajuan peminjaman alat dan pantau progresnya.",
    href: "/borrow-equipment/form",
    icon: Package,
    actions: [
      {
        id: "request-form",
        label: "Ajukan Peminjaman",
        description: "Buat pengajuan peminjaman alat melalui formulir.",
        href: "/borrow-equipment/form",
      },
      {
        id: "request-list",
        label: "Pengajuan Saya",
        description: "Lihat daftar pengajuan peminjaman alat Anda.",
        href: "/borrow-equipment",
      },
      {
        id: "all-requests",
        label: "Daftar Pengajuan",
        description: "Lihat seluruh daftar pengajuan peminjaman alat.",
        href: "/borrow-equipment/all",
      },
      {
        id: "equipment",
        label: "Alat yang Bisa Dipinjam",
        description: "Lihat daftar alat yang tersedia untuk dipinjam.",
        href: "/borrow-equipment/equipment",
      },
    ],
  },
  {
    id: "notifications",
    label: "Notifikasi",
    description: "Lihat update status pengajuan dan pemberitahuan terbaru.",
    href: "/notifications",
    icon: Bell,
    actions: [],
  },
  {
    id: "my-profile",
    label: "Profil Saya",
    description: "Kelola data profil dan informasi akun pengguna.",
    href: "/my-profile",
    icon: UserRound,
    actions: [
      {
        id: "edit-profile",
        label: "Edit Profil",
        description:
          "Perbarui data profil seperti nama, batch, dan department.",
        href: "/my-profile/edit",
      },
      {
        id: "change-password",
        label: "Ganti Password",
        description: "Ubah password akun untuk menjaga keamanan akses.",
        href: "/my-profile/security",
      },
    ],
  },
];

function toMenuHref(menuId?: string, actionId?: string) {
  if (!menuId) return "/dashboard";
  const menu = SIDEBAR_SHORTCUTS.find((item) => item.id === menuId);
  if (!menu) return "/dashboard";
  if (!actionId) return menu.href;
  const action = menu.actions.find((item) => item.id === actionId);
  return action?.href ?? menu.href;
}

function parseDashboardPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] === "dashboard") {
    if (parts[1] === "overview") {
      return { menu: "dashboard", action: "overview" };
    }
    if (parts[1] === "announcements") {
      return { menu: "dashboard", action: "announcements" };
    }
    if (parts[1] === "faq") {
      return { menu: "dashboard", action: "faq" };
    }
    if (parts[1] === "organization-structure") {
      return { menu: "dashboard", action: "organization-structure" };
    }
    if (parts[1] === "facilities") {
      return { menu: "dashboard", action: "facilities" };
    }
    return { menu: "dashboard", action: null };
  }
  if (parts[0] === "schedule") {
    return { menu: "schedule", action: null };
  }
  if (parts[0] === "booking-rooms") {
    if (parts[1] === "all") {
      return { menu: "booking-rooms", action: "all-requests" };
    }
    if (parts[1] === "form") {
      return { menu: "booking-rooms", action: "request-form" };
    }
    return { menu: "booking-rooms", action: "request-list" };
  }
  if (parts[0] === "rooms") {
    return { menu: "booking-rooms", action: "rooms" };
  }
  if (parts[0] === "use-equipment") {
    if (parts[1] === "all") {
      return { menu: "use-equipment", action: "all-requests" };
    }
    if (parts[1] === "form") {
      return { menu: "use-equipment", action: "request-form" };
    }
    return { menu: "use-equipment", action: "request-list" };
  }
  if (parts[0] === "equipment") {
    return { menu: "use-equipment", action: "equipment" };
  }
  if (parts[0] === "sample-testing") {
    if (parts[1] === "form") {
      return { menu: "sample-testing", action: "request-form" };
    }
    return { menu: "sample-testing", action: "request-list" };
  }
  if (parts[0] === "borrow-equipment") {
    if (parts[1] === "equipment") {
      return { menu: "borrow-equipment", action: "equipment" };
    }
    if (parts[1] === "all") {
      return { menu: "borrow-equipment", action: "all-requests" };
    }
    if (parts[1] === "form") {
      return { menu: "borrow-equipment", action: "request-form" };
    }
    return { menu: "borrow-equipment", action: "request-list" };
  }
  if (parts[0] === "notifications") {
    return { menu: "notifications", action: null };
  }
  if (parts[0] === "my-profile") {
    if (parts[1] === "edit") {
      return { menu: "my-profile", action: "edit-profile" };
    }
    if (parts[1] === "security") {
      return { menu: "my-profile", action: "change-password" };
    }
    return { menu: "my-profile", action: null };
  }

  return { menu: null, action: null };
}

function DashboardShell({ children }: UserLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { profile } = useLoadProfile();

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("last_app_path", pathname);
  }, [pathname]);

  const { menu: menuParam, action: actionParam } = parseDashboardPath(pathname);
  const defaultMenuId = SIDEBAR_SHORTCUTS[0].id;
  const displayName = profile.name?.trim() || "User";
  const sidebarShortcuts = SIDEBAR_SHORTCUTS.map((item) =>
    item.id === "dashboard"
      ? {
          ...item,
          label: `Welcome, ${displayName}!`,
        }
      : item,
  );

  const [activeMenuId, setActiveMenuId] = useState<string>(
    menuParam || defaultMenuId,
  );
  const [isActionPanelOpen, setIsActionPanelOpen] = useState(true);
  const [isMobileActionOpen, setIsMobileActionOpen] = useState(false);
  const [isMobileShortcutOpen, setIsMobileShortcutOpen] = useState(false);

  useEffect(() => {
    if (!menuParam) return;
    if (!SIDEBAR_SHORTCUTS.some((menu) => menu.id === menuParam)) return;
    setActiveMenuId(menuParam);
    setIsActionPanelOpen(true);
  }, [menuParam]);

  const activeMenu =
    sidebarShortcuts.find((item) => item.id === activeMenuId) ??
    sidebarShortcuts[0];
  const activeAction =
    activeMenu.id === "my-profile"
      ? null
      : (activeMenu.actions.find((action) => action.id === actionParam) ??
        null);
  const pageTitle =
    activeMenu.id === "my-profile"
      ? "Informasi Profil"
      : (activeAction?.label ?? activeMenu.label);
  const pageDescription =
    activeMenu.id === "my-profile"
      ? "Ringkasan data akun pengguna Anda."
      : (activeAction?.description ?? activeMenu.description);
  const isAllBookingRequestsPage = pathname.startsWith("/booking-rooms/all");
  const pageEyebrow = isAllBookingRequestsPage ? "CSL Management" : undefined;
  const HeaderIcon = getHeaderIcon(activeMenu.id, actionParam);
  const pageHeaderIcon = <HeaderIcon className="h-5 w-5 text-white" />;

  const hasActionPanel = isActionPanelOpen && !isMobile;
  const mobileBottomMenus = sidebarShortcuts.filter(
    (item) => item.id !== "notifications" && item.id !== "my-profile",
  );
  const mobileTopShortcuts = TOP_NAV_ITEMS.map((item) => ({
    ...item,
    isActive: activeMenuId === item.id,
  }));

  const getMenuDefaultHref = (menuId: string) => toMenuHref(menuId);

  const handleMenuClick = (menu: SidebarShortcut) => {
    setActiveMenuId(menu.id);
    setIsActionPanelOpen(true);
  };

  const handleTopShortcutClick = (menuId: string) => {
    const selectedMenu = sidebarShortcuts.find((item) => item.id === menuId);
    if (selectedMenu) handleMenuClick(selectedMenu);
    setIsMobileShortcutOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6] [--sidebar-primary:#0048B4] [--sidebar-primary-foreground:#FFFFFF] [--sidebar-ring:#3B82F6]">
      <Sheet open={isMobileActionOpen} onOpenChange={setIsMobileActionOpen}>
        <SheetContent
          side="left"
          className="w-[360px] max-w-[calc(100%-1rem)] p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Action Panel</SheetTitle>
            <SheetDescription>
              Panel aksi dan filter dashboard pengguna.
            </SheetDescription>
          </SheetHeader>
          {activeMenu ? (
            <DashboardActionPanel
              width={ACTION_PANEL_WIDTH}
              isOpen
              mobile
              menu={activeMenu}
              menuParam={menuParam}
              actionParam={actionParam}
              getActionHref={(actionId) => toMenuHref(activeMenu.id, actionId)}
              getMenuHref={() => toMenuHref(activeMenu.id)}
              onClose={() => setIsMobileActionOpen(false)}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <DashboardTopNavbar
        activeMenuId={activeMenuId}
        onShortcutClick={(menuId) => {
          handleTopShortcutClick(menuId);
        }}
        onMobileActionOpen={() => setIsMobileActionOpen(true)}
      />

      <div
        className="flex min-h-screen pt-16 transition-[padding-left] duration-300 ease-in-out"
        style={
          isMobile
            ? undefined
            : {
                paddingLeft: hasActionPanel
                  ? `calc(${SIDEBAR_WIDTH} + ${ACTION_PANEL_WIDTH})`
                  : SIDEBAR_WIDTH,
              }
        }
      >
        <DashboardSideNavbar
          menus={sidebarShortcuts}
          activeMenuId={activeMenuId}
          getMenuHref={getMenuDefaultHref}
          bottomMenuIds={["notifications", "my-profile"]}
          onMenuClick={(menuId) => {
            const selectedMenu = sidebarShortcuts.find(
              (item) => item.id === menuId,
            );
            if (selectedMenu) handleMenuClick(selectedMenu);
          }}
          onLogoClick={() => router.push(toMenuHref())}
        />

        {activeMenu && (
          <DashboardActionPanel
            width={ACTION_PANEL_WIDTH}
            isOpen={hasActionPanel}
            menu={activeMenu}
            menuParam={menuParam}
            actionParam={actionParam}
            getActionHref={(actionId) => toMenuHref(activeMenu.id, actionId)}
            getMenuHref={() => toMenuHref(activeMenu.id)}
            onClose={() => setIsActionPanelOpen(false)}
          />
        )}

        <DashboardMainLayout
          pageTitle={isAllBookingRequestsPage ? "Daftar Pengajuan" : pageTitle}
          pageDescription={
            isAllBookingRequestsPage
              ? "Lihat seluruh daftar pengajuan booking ruangan."
              : pageDescription
          }
          pageEyebrow={pageEyebrow}
          pageIcon={pageHeaderIcon}
        >
          {children}
        </DashboardMainLayout>
      </div>

      {isMobileShortcutOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-50 bg-slate-950/10 backdrop-blur-sm md:hidden"
            aria-label="Close shortcuts"
            onClick={() => setIsMobileShortcutOpen(false)}
          />
          <div className="fixed right-4 bottom-40 z-[60] w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur md:hidden">
            <div className="mb-2 flex items-center justify-between px-1">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Shortcut Menu
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileShortcutOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                aria-label="Close shortcuts"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[min(70vh,32rem)] space-y-1 overflow-y-auto pr-1">
              {mobileTopShortcuts.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="border-b border-slate-100 pb-1 last:border-b-0"
                  >
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={() => handleTopShortcutClick(item.id)}
                        className={cn(
                          "block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50",
                          item.isActive && "text-[#0048B4]",
                        )}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <div className="px-1 py-1">
                        <div
                          className={cn(
                            "px-2 py-2 text-sm font-semibold text-slate-900",
                            item.isActive && "text-[#0048B4]",
                          )}
                        >
                          {item.label}
                        </div>
                        <div className="space-y-1">
                          {item.children?.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => handleTopShortcutClick(item.id)}
                              className="block rounded-lg px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-4 backdrop-blur md:hidden">
        <div className="mx-auto flex w-full justify-center">
          <div className="flex max-w-full gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {mobileBottomMenus.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenuId === item.id;
              return (
                <Link
                  key={item.id}
                  href={getMenuDefaultHref(item.id)}
                  onClick={() => handleMenuClick(item)}
                  className={cn(
                    "flex h-10 min-w-14 shrink-0 items-center justify-center rounded-xl px-4 transition",
                    isActive
                      ? "bg-blue-50 text-[#0048B4]"
                      : "text-slate-600 hover:bg-slate-50",
                  )}
                  aria-label={item.label}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <button
        type="button"
        onClick={() => setIsMobileShortcutOpen((current) => !current)}
        className="fixed right-4 bottom-20 z-[60] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#0048B4] text-white shadow-[0_18px_36px_rgba(0,72,180,0.32)] transition hover:bg-[#003b92] md:hidden"
        aria-label="Open shortcut menu"
      >
        {isMobileShortcutOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <LayoutGrid className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}

export function UserLayout({ children }: UserLayoutProps) {
  return <DashboardShell>{children ?? <Outlet />}</DashboardShell>;
}
