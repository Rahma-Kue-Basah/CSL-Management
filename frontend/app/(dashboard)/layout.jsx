"use client";
import React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
} from "@/components/ui/sidebar";

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
    if (itemUrl && (currentPath === itemUrl || currentPath.startsWith(`${itemUrl}/`))) {
      trail = [{ label: item.title, href: itemUrl }];
      break;
    }
  }

  const defaultTrail = [{ label: "Home", href: "/" }, ...parts.map((seg, idx) => ({
    label: seg.replace(/-/g, " "),
    href: "/" + parts.slice(0, idx + 1).join("/"),
  }))];

  const crumbs = trail ?? defaultTrail;

  return (
    <SidebarProvider className="font-sans">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {crumbs.map((crumb, idx) => {
                  const isLast = idx === crumbs.length - 1;
                  return (
                    <React.Fragment key={crumb.href}>
                      {idx > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                      <BreadcrumbItem>
                        {isLast || !crumb.href ? (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link href={crumb.href}>{crumb.label}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
