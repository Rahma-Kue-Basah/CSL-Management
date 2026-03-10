"use client";
import React, { Suspense } from "react";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";

import { AppSidebar, NAV_DATA } from "@/components/layout/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { NavUser } from "@/components/layout/nav-user";

const ACTION_PANEL_WIDTH = "18rem";

function normalizeUrl(url) {
  if (!url || url === "#") return null;
  const [pathOnly] = url.split("?");
  return pathOnly.startsWith("/") ? pathOnly : `/${pathOnly.replace(/^\/+/, "")}`;
}

function isCurrentPathMatch(url, currentPath) {
  const normalized = normalizeUrl(url);
  if (!normalized) return false;
  return currentPath === normalized || currentPath.startsWith(`${normalized}/`);
}

function findMenuByTitle(title) {
  if (!title) return null;
  return NAV_DATA.navMain.find((item) => item.title === title) ?? null;
}

function findMatchedTopMenu(currentPath) {
  for (const item of NAV_DATA.navMain) {
    if (isCurrentPathMatch(item.url, currentPath)) return item;
    if (!item.items?.length) continue;

    for (const sub of item.items) {
      if (isCurrentPathMatch(sub.url, currentPath)) return item;
      if (!sub.items?.length) continue;

      for (const grand of sub.items) {
        if (isCurrentPathMatch(grand.url, currentPath)) return item;
      }
    }
  }

  return null;
}

function getActionGroups(menuItem) {
  if (!menuItem?.items?.length) return [];

  const hasNestedGroups = menuItem.items.some((sub) => sub.items?.length);

  if (!hasNestedGroups) {
    return [
      {
        title: `Aksi ${menuItem.title}`,
        links: menuItem.items
          .filter((sub) => normalizeUrl(sub.url))
          .map((sub) => ({
            title: sub.title,
            url: sub.url,
          })),
      },
    ].filter((group) => group.links.length > 0);
  }

  return menuItem.items
    .map((sub) => ({
      title: sub.title,
      links: (sub.items ?? [])
        .filter((grand) => normalizeUrl(grand.url))
        .map((grand) => ({
          title: grand.title,
          url: grand.url,
        })),
    }))
    .filter((group) => group.links.length > 0);
}

function ActionPanel({ menuItem, onClose }) {
  const groups = getActionGroups(menuItem);

  if (!menuItem || groups.length === 0) return null;

  return (
    <aside className="hidden md:flex w-72 shrink-0 border-r bg-background">
      <div className="flex h-full w-full flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="truncate text-sm font-semibold">Action: {menuItem.title}</h2>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.title} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </p>
              <div className="flex flex-col gap-1">
                {group.links.map((link) => (
                  <Link
                    key={`${group.title}-${link.title}`}
                    href={link.url}
                    className="rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    {link.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function DashboardShell({
  crumbs,
  children,
  topShortcuts,
  activeActionMenu,
  onCloseActionPanel,
}) {
  const { state, isMobile } = useSidebar();
  const router = useRouter();
  const sidebarWidth =
    state === "collapsed"
      ? "calc(var(--sidebar-width-icon) + 1.2rem)"
      : "var(--sidebar-width)";
  const hasActionPanel = Boolean(activeActionMenu?.items?.length) && !isMobile;
  const leftOffset = hasActionPanel
    ? `calc(${sidebarWidth} + ${ACTION_PANEL_WIDTH})`
    : sidebarWidth;
  const pageTitle = crumbs[crumbs.length - 1]?.label || "Page";

  return (
    <div className="flex min-h-svh flex-1 flex-col min-w-0 overflow-x-hidden">
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <header
          className="fixed top-0 z-40 flex h-16 min-w-0 items-center border-b bg-background transition-[left,width] duration-200 ease-linear"
          style={
            isMobile
              ? { left: 0, width: "100%" }
              : { left: leftOffset, width: `calc(100% - ${leftOffset})` }
          }
        >
          <div className="flex w-full min-w-0 items-center justify-between gap-3 px-4">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger className="-ml-1" />
              <nav className="hidden lg:flex items-center gap-2 min-w-0">
                {topShortcuts.map((item) => (
                  <Link
                    key={item.title}
                    href={item.url}
                    className="rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    {item.title}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="hidden md:flex items-center gap-2 mr-2">
              <NavUser />
            </div>
          </div>
        </header>

        <div className="flex flex-1 min-w-0 pt-16 bg-[#F2F3F7]">
          <ActionPanel menuItem={activeActionMenu} onClose={onCloseActionPanel} />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="bg-card">
              <div className="flex items-center justify-between bg-[#0048B4] text-background">
                <div className="flex min-w-0 items-center gap-2 py-4 px-2">
                  <Button
                    type="button"
                    variant="text"
                    size="sm"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h1 className="truncate text-lg font-semibold">{pageTitle}</h1>
                </div>
              </div>
              <div className="px-3 py-2 bg-muted/35 border-b">
                <Breadcrumb className="min-w-0">
                  <BreadcrumbList>
                    {crumbs.map((crumb, idx) => {
                      const isLast = idx === crumbs.length - 1;
                      return (
                        <React.Fragment key={`${crumb.href ?? "crumb"}-${idx}`}>
                          {idx > 0 && (
                            <BreadcrumbSeparator className="mx-1 inline-block" />
                          )}
                          <BreadcrumbItem className="min-w-0">
                            {isLast || !crumb.href ? (
                              <BreadcrumbPage className="truncate">
                                {crumb.label}
                              </BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink asChild>
                                <Link href={crumb.href} className="truncate">
                                  {crumb.label}
                                </Link>
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                        </React.Fragment>
                      );
                    })}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <div className="bg-[#F2F3F7] min-h-[65vh] px-3 py-3 md:px-4 md:py-4">
                <div className="bg-background p-4 md:p-6 min-w-0 overflow-x-hidden">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </div>
  );
}

function DashboardLayoutContent({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parts = (pathname || "").split("/").filter(Boolean);
  const currentPath = `/${parts.join("/")}`;
  const roleParam = searchParams?.get("role")?.trim();

  const subpageLabels = {
    "/user/form": "Tambah User",
    "/user/new": "Tambah User",
    "/user/form-bulk": "Bulk Upload",
    "/equipment/form": "Tambah Equipment",
    "/equipment/form-bulk": "Bulk Upload",
    "/room/form": "Tambah Ruangan",
    "/room/form-bulk": "Bulk Upload",
    "/booking/form": "Buat Booking",
    "/my-bookings-request/form": "Ajukan Booking",
    "/my-borrows-request/form": "Ajukan Peminjaman",
  };

  let trail = null;
  for (const item of NAV_DATA.navMain) {
    const itemUrl = normalizeUrl(item.url);
    if (item.items) {
      for (const sub of item.items) {
        const subUrl = normalizeUrl(sub.url);
        if (sub.items?.length) {
          for (const grand of sub.items) {
            const grandUrl = normalizeUrl(grand.url);
            if (!grandUrl) continue;
            if (
              currentPath === grandUrl ||
              currentPath.startsWith(`${grandUrl}/`)
            ) {
              trail = [
                { label: item.title, href: null },
                { label: sub.title, href: null },
                { label: grand.title, href: grandUrl },
              ];
              if (grandUrl === "/user" && roleParam) {
                trail.push({ label: roleParam, href: currentPath });
              }
              break;
            }
          }
          if (trail) break;
        }
        if (!subUrl) continue;
        if (currentPath === subUrl || currentPath.startsWith(`${subUrl}/`)) {
          trail = [
            { label: item.title, href: null },
            { label: sub.title, href: subUrl },
          ];
          const subLabel = subpageLabels[currentPath];
          if (subLabel && currentPath !== subUrl) {
            trail.push({ label: subLabel, href: currentPath });
          } else if (currentPath.startsWith("/equipment/form/")) {
            trail.push({ label: "Ubah Equipment", href: currentPath });
          } else if (currentPath.startsWith("/room/form/")) {
            trail.push({ label: "Ubah Ruangan", href: currentPath });
          } else if (currentPath.startsWith("/my-bookings-request/form/")) {
            trail.push({ label: "Ubah Booking", href: currentPath });
          } else if (currentPath.startsWith("/my-borrows-request/form/")) {
            trail.push({ label: "Ubah Peminjaman", href: currentPath });
          }
          break;
        }
      }
    }
    if (trail) break;
    if (
      itemUrl &&
      (currentPath === itemUrl || currentPath.startsWith(`${itemUrl}/`))
    ) {
      trail = [{ label: item.title, href: itemUrl }];
      break;
    }
  }

  const defaultTrail = [
    { label: "Home", href: "/" },
    ...parts.map((seg, idx) => ({
      label: seg.replace(/-/g, " "),
      href: "/" + parts.slice(0, idx + 1).join("/"),
    })),
  ];

  let crumbs = trail ?? defaultTrail;

  if (currentPath.startsWith("/user")) {
    if (roleParam) {
      const roleLabel = roleParam;
      crumbs = [
        { label: "Admin", href: null },
        { label: "User", href: null },
        { label: roleLabel, href: "/user" },
      ];
      if (currentPath === "/user/form") {
        crumbs.push({ label: `Tambah ${roleLabel}`, href: currentPath });
      } else if (currentPath === "/user/form-bulk") {
        crumbs.push({ label: `Bulk Upload ${roleLabel}`, href: currentPath });
      }
    } else if (currentPath === "/user") {
      crumbs = [
        { label: "Admin", href: null },
        { label: "User", href: null },
        { label: "All", href: "/user" },
      ];
    } else if (currentPath === "/user/form" || currentPath === "/user/new") {
      crumbs = [
        { label: "Admin", href: null },
        { label: "User", href: null },
        { label: "Tambah User", href: currentPath },
      ];
    } else if (currentPath === "/user/form-bulk") {
      crumbs = [
        { label: "Admin", href: null },
        { label: "User", href: null },
        { label: "Bulk Upload", href: currentPath },
      ];
    }
  }

  const topShortcuts = React.useMemo(
    () =>
      NAV_DATA.navMain.filter((item) => normalizeUrl(item.url))
        .slice(0, 4)
        .map((item) => ({ title: item.title, url: item.url })),
    [],
  );

  const matchedTopMenu = React.useMemo(
    () => findMatchedTopMenu(currentPath),
    [currentPath],
  );

  const [activeActionMenuTitle, setActiveActionMenuTitle] = React.useState(
    matchedTopMenu?.title ?? null,
  );

  React.useEffect(() => {
    if (!matchedTopMenu?.items?.length) return;

    setActiveActionMenuTitle((previous) => {
      if (previous === null) return previous;
      return matchedTopMenu.title;
    });
  }, [matchedTopMenu]);

  const activeActionMenu = findMenuByTitle(activeActionMenuTitle);

  const handleActionMenuSelect = React.useCallback((item) => {
    if (!item?.items?.length) {
      setActiveActionMenuTitle(null);
      return;
    }

    setActiveActionMenuTitle((current) =>
      current === item.title ? null : item.title,
    );
  }, []);

  return (
    <SidebarProvider
      className="font-sans"
      style={{ "--sidebar-width": "16rem" }}
    >
      <AppSidebar
        activeActionMenuTitle={activeActionMenuTitle}
        onActionMenuSelect={handleActionMenuSelect}
      />
      <DashboardShell
        crumbs={crumbs}
        topShortcuts={topShortcuts}
        activeActionMenu={activeActionMenu}
        onCloseActionPanel={() => setActiveActionMenuTitle(null)}
      >
        {children}
      </DashboardShell>
    </SidebarProvider>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
