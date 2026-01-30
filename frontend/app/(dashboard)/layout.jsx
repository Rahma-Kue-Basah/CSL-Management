"use client";
import React from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";

import { AppSidebar, NAV_DATA } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { NavUser } from "@/components/nav-user";
import { useLogout } from "@/hooks/use-logout";

function DashboardShell({ crumbs, children }) {
  const { state, isMobile } = useSidebar();
  const router = useRouter();
  const { handleLogout } = useLogout();
  const sidebarWidth =
    state === "collapsed"
      ? "calc(var(--sidebar-width-icon) + 1.2rem)"
      : "var(--sidebar-width)";
  const pageTitle = crumbs[crumbs.length - 1]?.label || "Page";

  return (
    <div className="flex min-h-svh flex-1 flex-col min-w-0 overflow-x-hidden">
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <header
          className="fixed top-0 z-40 flex h-16 min-w-0 items-center gap-2 border-b bg-background transition-[left,width] duration-200 ease-linear"
          style={
            isMobile
              ? { left: 0, width: "100%" }
              : { left: sidebarWidth, width: `calc(100% - ${sidebarWidth})` }
          }
        >
          <div className="flex w-full min-w-0 items-center justify-between gap-2 px-4">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb className="min-w-0">
                <BreadcrumbList>
                  {crumbs.map((crumb, idx) => {
                    const isLast = idx === crumbs.length - 1;
                    return (
                      <React.Fragment key={crumb.href}>
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
            <div className="hidden md:flex items-center gap-2 mr-2">
              <NavUser />
              {/* <Button
                type="button"
                variant="text"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4 text-destructive" />
                
              </Button> */}
            </div>
          </div>
        </header>
        <div className="flex flex-1 min-w-0 flex-col pt-16 bg-[#F2F3F7]">
          <div className="bg-card">
            <div className="flex items-center justify-between bg-[#0048B4] text-background">
              <div className="flex min-w-0 items-center gap-2 py-4 px-2">
                <Button
                  type="text"
                  variant="text"
                  size="sm"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="truncate text-lg font-semibold">{pageTitle}</h1>
              </div>
            </div>
            <div className="bg-[#F2F3F7] min-h-[65vh] px-3 py-3 md:px-4 md:py-4">
              <div className="bg-background p-4 md:p-6 min-w-0 overflow-x-hidden">
                {children}
              </div>
            </div>
          </div>
        </div>
        <footer className="px-4 pt-12 pb-24 text-center text-xs text-muted-foreground bg-[#282829] ">
          2026 ©
          <Link href="/" className="ml-1">
            CSL STEM Prasetiya Mulya
          </Link>
        </footer>
      </SidebarInset>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const parts = (pathname || "").split("/").filter(Boolean);
  const currentPath = `/${parts.join("/")}`;

  const normalizeUrl = (url) => {
    if (!url || url === "#") return null;
    return url.startsWith("/") ? url : `/${url.replace(/^\/+/, "")}`;
  };

  const subpageLabels = {
    "/user/form": "Tambah User",
    "/user/new": "Tambah User",
    "/user/form-bulk": "Bulk Upload",
    "/equipment/form": "Tambah Equipment",
    "/room/form": "Tambah Ruangan",
    "/room/form-bulk": "Bulk Upload",
    "/booking/form": "Buat Booking",
  };

  let trail = null;
  for (const item of NAV_DATA.navMain) {
    const itemUrl = normalizeUrl(item.url);
    if (item.items) {
      for (const sub of item.items) {
        const subUrl = normalizeUrl(sub.url);
        if (!subUrl) continue;
        if (currentPath === subUrl || currentPath.startsWith(`${subUrl}/`)) {
          trail = [
            { label: item.title, href: null },
            { label: sub.title, href: subUrl },
          ];
          const subLabel = subpageLabels[currentPath];
          if (subLabel && currentPath !== subUrl) {
            trail.push({ label: subLabel, href: currentPath });
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

  const crumbs = trail ?? defaultTrail;

  return (
    <SidebarProvider
      className="font-sans"
      style={{ "--sidebar-width": "16rem" }}
    >
      <AppSidebar />
      <DashboardShell crumbs={crumbs}>{children}</DashboardShell>
    </SidebarProvider>
  );
}
