"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  FilePenLine,
  FlaskConical,
  CircleHelp,
  History,
  LayoutDashboard,
  Package,
  ShieldCheck,
  UserRound,
  Wrench,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DashboardTopNavbar } from "@/components/dashboard/layout/DashboardTopNavbar";
import { DashboardSideNavbar } from "@/components/dashboard/layout/DashboardSideNavbar";
import { DashboardActionPanel } from "@/components/dashboard/layout/DashboardActionPanel";
import { DashboardMainLayout } from "@/components/dashboard/layout/DashboardMainLayout";

type UserLayoutProps = {
  children: ReactNode;
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
    if (actionId === "request-list" || actionId === "all-requests") return ClipboardList;
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
  if (menuId === "activity-history") return History;

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
    label: "Dashboard",
    description: "Ringkasan aktivitas dan insight utama pengguna.",
    href: "/dashboard",
    icon: LayoutDashboard,
    actions: [
      {
        id: "overview",
        label: "Ringkasan Dashboard",
        description: "Lihat KPI dan highlight terbaru dalam satu tampilan.",
        href: "/dashboard/overview",
      },
      {
        id: "announcements",
        label: "Pengumuman",
        description: "Lihat pengumuman terbaru dari admin.",
        href: "/dashboard/announcements",
      },
      {
        id: "faq",
        label: "FAQ",
        description: "Temukan jawaban cepat untuk pertanyaan yang sering diajukan.",
        href: "/dashboard/faq",
      },
    ],
  },
  {
    id: "schedule",
    label: "Jadwal",
    description: "Kelola agenda lab dan jadwal kegiatan mendatang.",
    href: "/schedule",
    icon: CalendarDays,
    actions: [],
  },
  {
    id: "booking-rooms",
    label: "Booking Ruangan",
    description: "Kelola pengajuan booking dan pantau progresnya.",
    href: "/booking-rooms",
    icon: Building2,
    actions: [
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
        id: "request-form",
        label: "Ajukan Booking",
        description: "Buat pengajuan booking ruangan melalui formulir.",
        href: "/booking-rooms/form",
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
    label: "Booking Alat",
    description: "Kelola pengajuan penggunaan alat beserta formulirnya.",
    href: "/use-equipment",
    icon: Wrench,
    actions: [
      {
        id: "request-list",
        label: "Pengajuan Saya",
        description: "Lihat daftar pengajuan booking alat Anda.",
        href: "/use-equipment",
      },
      {
        id: "all-requests",
        label: "Daftar Pengajuan",
        description: "Lihat seluruh daftar pengajuan booking alat.",
        href: "/use-equipment/all",
      },
      {
        id: "request-form",
        label: "Ajukan Booking",
        description: "Buat pengajuan booking alat melalui formulir.",
        href: "/use-equipment/form",
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
    href: "/sample-testing",
    icon: FlaskConical,
    actions: [
      {
        id: "request-list",
        label: "Pengajuan Saya",
        description: "Lihat daftar pengajuan pengujian sampel Anda.",
        href: "/sample-testing",
      },
      {
        id: "request-form",
        label: "Ajukan Pengujian",
        description: "Buat pengajuan pengujian sampel melalui formulir.",
        href: "/sample-testing/form",
      },
    ],
  },
  {
    id: "borrow-equipment",
    label: "Peminjaman Alat",
    description: "Kelola permintaan peminjaman alat dan formulirnya.",
    href: "/borrow-equipment",
    icon: Package,
    actions: [
      {
        id: "request-list",
        label: "Pengajuan Saya",
        description: "Lihat daftar pengajuan peminjaman alat Anda.",
        href: "/borrow-equipment",
      },
      {
        id: "request-form",
        label: "Ajukan Peminjaman",
        description: "Buat pengajuan peminjaman alat melalui formulir.",
        href: "/borrow-equipment/form",
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
    id: "activity-history",
    label: "Riwayat Aktivitas",
    description: "Lihat histori aktivitas pengajuan yang pernah dilakukan.",
    href: "/activity-history",
    icon: History,
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
        description: "Perbarui data profil seperti nama, batch, dan department.",
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
    if (parts[1] === "form") {
      return { menu: "borrow-equipment", action: "request-form" };
    }
    return { menu: "borrow-equipment", action: "request-list" };
  }
  if (parts[0] === "notifications") {
    return { menu: "notifications", action: null };
  }
  if (parts[0] === "activity-history") {
    return { menu: "activity-history", action: null };
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

  const { menu: menuParam, action: actionParam } = parseDashboardPath(pathname);
  const defaultMenuId = SIDEBAR_SHORTCUTS[0].id;

  const [activeMenuId, setActiveMenuId] = useState<string>(
    menuParam || defaultMenuId,
  );
  const [isActionPanelOpen, setIsActionPanelOpen] = useState(true);

  useEffect(() => {
    if (!menuParam) return;
    if (!SIDEBAR_SHORTCUTS.some((menu) => menu.id === menuParam)) return;
    setActiveMenuId(menuParam);
    setIsActionPanelOpen(true);
  }, [menuParam]);

  const activeMenu =
    SIDEBAR_SHORTCUTS.find((item) => item.id === activeMenuId) ??
    SIDEBAR_SHORTCUTS[0];
  const activeAction =
    activeMenu.id === "my-profile"
      ? null
      : activeMenu.actions.find((action) => action.id === actionParam) ?? null;
  const pageTitle =
    activeMenu.id === "my-profile"
      ? "Informasi Profil"
      : activeAction?.label ?? activeMenu.label;
  const pageDescription =
    activeMenu.id === "my-profile"
      ? "Ringkasan data akun pengguna Anda."
      : activeAction?.description ?? activeMenu.description;
  const isAllBookingRequestsPage = pathname.startsWith("/booking-rooms/all");
  const pageEyebrow = isAllBookingRequestsPage ? "CSL Management" : undefined;
  const HeaderIcon = getHeaderIcon(activeMenu.id, actionParam);
  const pageHeaderIcon = <HeaderIcon className="h-5 w-5 text-white" />;

  const hasActionPanel = isActionPanelOpen && !isMobile;

  const getMenuDefaultHref = (menuId: string) => toMenuHref(menuId);

  const handleMenuClick = (menu: SidebarShortcut) => {
    setActiveMenuId(menu.id);
    setIsActionPanelOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6] [--sidebar-primary:#0048B4] [--sidebar-primary-foreground:#FFFFFF] [--sidebar-ring:#3B82F6]">
      <DashboardTopNavbar
        activeMenuId={activeMenuId}
        onShortcutClick={(menuId) => {
          const selectedMenu = SIDEBAR_SHORTCUTS.find((item) => item.id === menuId);
          if (selectedMenu) handleMenuClick(selectedMenu);
        }}
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
          menus={SIDEBAR_SHORTCUTS}
          activeMenuId={activeMenuId}
          getMenuHref={getMenuDefaultHref}
          bottomMenuId="my-profile"
          onMenuClick={(menuId) => {
            const selectedMenu = SIDEBAR_SHORTCUTS.find((item) => item.id === menuId);
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
    </div>
  );
}

export function UserLayout({ children }: UserLayoutProps) {
  return <DashboardShell>{children}</DashboardShell>;
}
