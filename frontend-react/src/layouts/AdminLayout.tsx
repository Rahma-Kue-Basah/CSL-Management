"use client";


import { Fragment, useEffect, useRef, useState } from "react";

import { Outlet } from "react-router-dom";

import {
  SidebarProvider,
  SidebarTrigger,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui";

import { AppSidebar } from "@/components/admin/layout";

import Link from "next/link";

import { usePathname } from "next/navigation";

import { CircleArrowOutUpRightIcon } from "lucide-react";

import { useLoadProfile } from "@/hooks/shared/profile";

export default function AdminLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile } = useLoadProfile();
  const [showAdminSplash, setShowAdminSplash] = useState(false);
  const hasEvaluatedEntryRef = useRef(false);
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .slice(1)
    .filter((segment) => !uuidPattern.test(segment));

  const formatSegment = (segment: string) =>
    segment
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (hasEvaluatedEntryRef.current) {
      window.sessionStorage.setItem("last_app_path", pathname);
      return;
    }

    hasEvaluatedEntryRef.current = true;

    const lastPath = window.sessionStorage.getItem("last_app_path");
    const cameFromNonAdmin =
      typeof lastPath === "string" &&
      lastPath.length > 0 &&
      !lastPath.startsWith("/admin");

    if (cameFromNonAdmin) {
      setShowAdminSplash(true);
      window.sessionStorage.setItem("last_app_path", pathname);
      return;
    }

    window.sessionStorage.setItem("last_app_path", pathname);
    return undefined;
  }, [pathname]);

  useEffect(() => {
    if (!showAdminSplash || typeof window === "undefined") return;

    const timeoutId = window.setTimeout(() => {
      setShowAdminSplash(false);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [showAdminSplash]);

  return (
    <div className="min-h-svh overflow-x-hidden bg-background text-foreground [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6] [--sidebar-primary:#0048B4] [--sidebar-primary-foreground:#FFFFFF] [--sidebar-ring:#3B82F6]">
      {showAdminSplash ? (
        <div className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/30 backdrop-blur-md">
          <div className="mx-4 text-center text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
              CSL Admin
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Welcome, {profile?.name || profile?.email || "Admin"}
            </h2>
            <p className="mt-2 text-sm text-white/70">
              You have successfully entered the admin area.
            </p>
          </div>
        </div>
      ) : null}
      <SidebarProvider>
        <AppSidebar />
        <main className="flex min-w-0 -ml-1 flex-1 flex-col overflow-x-hidden">
          <div className="flex min-w-0 flex-1 flex-col gap-4 bg-sidebar">
            <div className="flex min-w-0 items-center justify-between bg-[#0048B4] text-background">
              <div className="flex min-w-0 items-center gap-2 px-2 py-3">
                <SidebarTrigger />
                <Breadcrumb className="min-w-0 overflow-hidden">
                  <BreadcrumbList className="min-w-0 flex-nowrap overflow-x-auto text-background [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link
                          href="/admin"
                          className="text-background/80 hover:text-white"
                        >
                          Admin
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {segments.map((segment, index) => {
                      const href = `/admin/${segments.slice(0, index + 1).join("/")}`;
                      const isLast = index === segments.length - 1;
                      return (
                        <Fragment key={href}>
                          <BreadcrumbSeparator className="text-background/70" />
                          <BreadcrumbItem>
                            {isLast ? (
                              <BreadcrumbPage className="text-background">
                                {formatSegment(segment)}
                              </BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink asChild>
                                <Link
                                  href={href}
                                  className="text-background/80 hover:text-white"
                                >
                                  {formatSegment(segment)}
                                </Link>
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                        </Fragment>
                      );
                    })}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <div className="px-2 py-2">
                <Button
                  asChild
                  size="sm"
                  variant="link"
                  className="text-white text-xs no-underline hover:no-underline"
                >
                  <Link href="/dashboard">
                    <CircleArrowOutUpRightIcon className="h-4 w-4" />
                    <span className="ml-1 hidden md:block">
                      Back to Dashboard
                    </span>
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex-1">{children ?? <Outlet />}</div>
            <footer className="border-t border-slate-200/80 bg-white/80 px-4 py-5 text-center text-xs text-slate-500 backdrop-blur">
              2026 ©
              <Link
                href="/"
                className="ml-1 font-medium text-slate-600 hover:text-[#0048B4]"
              >
                CSL STEM Universitas Prasetiya Mulya
              </Link>
            </footer>
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
