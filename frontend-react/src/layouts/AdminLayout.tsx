"use client";

import { Fragment } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleArrowOutUpRightIcon } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
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

  return (
    <div className="min-h-svh overflow-x-hidden bg-background text-foreground [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6] [--sidebar-primary:#0048B4] [--sidebar-primary-foreground:#FFFFFF] [--sidebar-ring:#3B82F6]">
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
                    <span className="ml-1 hidden md:block">Back to Dashboard</span>
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex-1">
              {children}
            </div>
            <footer className="border-t border-slate-200/80 bg-white/80 px-4 py-5 text-center text-xs text-slate-500 backdrop-blur">
              2026 ©
              <Link href="/" className="ml-1 font-medium text-slate-600 hover:text-[#0048B4]">
                CSL STEM Universitas Prasetiya Mulya 
              </Link>
            </footer>
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
