"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarInput,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarHeader,
  SidebarMenuItem,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  ChevronDown,
  FileText,
  History,
  Info,
  LayoutDashboard,
  Package,
  Search,
  User,
  Users,
} from "lucide-react";
import { NavUser } from "./nav-user";

export function AppSidebar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenus, setOpenMenus] = useState({
    document: false,
    information: true,
    inventory: false,
    profile: true,
    record: false,
    user: false,
  });
  const menuButtonClass = (isSelected = false) =>
    isSelected
      ? "text-sidebar-foreground group-data-[collapsible=icon]:mx-auto"
      : "text-sidebar-foreground/65 hover:text-sidebar-foreground group-data-[collapsible=icon]:mx-auto";

  const toggleMenu = (
    menu:
      | "document"
      | "information"
      | "inventory"
      | "profile"
      | "record"
      | "user",
  ) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const isPathActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const hasSearch = normalizedQuery.length > 0;
  const matchesSearch = (text: string) =>
    normalizedQuery.length === 0 ||
    text.toLowerCase().includes(normalizedQuery);

  const inventoryItems = [
    { label: "Ruangan", href: "/admin/inventarisasi/ruangan" },
    { label: "Peralatan", href: "/admin/inventarisasi/peralatan" },
    { label: "Software", href: "/admin/inventarisasi/software" },
  ];

  const documentItems = [
    {
      label: "Surat Bebas Laboratorium",
      href: "/admin/dokumen/surat-bebas-lab",
    },
    {
      label: "Surat Perjanjian Pengujian",
      href: "/admin/dokumen/surat-perjanjian-pengujian",
    },
    {
      label: "Laporan Hasil Pengujian",
      href: "/admin/dokumen/laporan-hasil-pengujian",
    },
    { label: "Invoice", href: "/admin/dokumen/invoice" },
  ];

  const recordItems = [
    { label: "Peminjaman Ruangan", href: "/admin/record/peminjaman-ruangan" },
    { label: "Penggunaan Alat", href: "/admin/record/penggunaan-alat" },
    { label: "Peminjaman Alat", href: "/admin/record/peminjaman-alat" },
    { label: "Pengujian Sampel", href: "/admin/record/pengujian-sampel" },
  ];

  const userItems = [
    { label: "All", href: "/admin/user-management/all" },
    { label: "Student", href: "/admin/user-management/student" },
    { label: "Lecturer", href: "/admin/user-management/lecturer" },
    { label: "Admin", href: "/admin/user-management/admin" },
    { label: "Staff", href: "/admin/user-management/staff" },
    { label: "Guest", href: "/admin/user-management/guest" },
  ];
  const profileItems = [
    { label: "Profile Singkat", href: "/admin/profile/profile" },
    {
      label: "Struktur Organisasi",
      href: "/admin/profile/struktur-organisasi",
    },
    { label: "Fasilitas", href: "/admin/profile/fasilitas" },
  ];
  const informationItems = [
    { label: "Pengumuman", href: "/admin/informasi/pengumuman" },
    { label: "FAQ", href: "/admin/informasi/faq" },
    { label: "Jadwal", href: "/admin/informasi/jadwal" },
  ];

  const filteredDocumentItems = documentItems.filter((item) =>
    matchesSearch(item.label),
  );
  const filteredRecordItems = recordItems.filter((item) =>
    matchesSearch(item.label),
  );
  const filteredInventoryItems = inventoryItems.filter((item) =>
    matchesSearch(item.label),
  );
  const filteredUserItems = userItems.filter((item) =>
    matchesSearch(item.label),
  );
  const filteredProfileItems = profileItems.filter((item) =>
    matchesSearch(item.label),
  );
  const filteredInformationItems = informationItems.filter((item) =>
    matchesSearch(item.label),
  );

  const showHome = matchesSearch("home");
  const showDocument =
    matchesSearch("dokumen") || filteredDocumentItems.length > 0;
  const showRecord = matchesSearch("record") || filteredRecordItems.length > 0;
  const showInventory =
    matchesSearch("inventarisasi") || filteredInventoryItems.length > 0;
  const showUser =
    matchesSearch("user management") ||
    matchesSearch("user") ||
    filteredUserItems.length > 0;
  const showProfile =
    matchesSearch("profile") || filteredProfileItems.length > 0;
  const showInformation =
    matchesSearch("informasi") || filteredInformationItems.length > 0;

  const isHomeActive = pathname === "/admin" || pathname === "/admin/home";
  const isDocumentActive = documentItems.some((item) =>
    isPathActive(item.href),
  );
  const isRecordActive = recordItems.some((item) => isPathActive(item.href));
  const isInventoryActive = inventoryItems.some((item) =>
    isPathActive(item.href),
  );
  const isUserActive = userItems.some((item) => isPathActive(item.href));
  const isProfileActive = profileItems.some((item) => isPathActive(item.href));
  const isInformationActive = informationItems.some((item) =>
    isPathActive(item.href),
  );

  useEffect(() => {
    setOpenMenus((prev) => ({
      ...prev,
      // Preserve manual/default opened state, and auto-open when route is active.
      document: prev.document || isDocumentActive,
      record: prev.record || isRecordActive,
      inventory: prev.inventory || isInventoryActive,
      user: prev.user || isUserActive,
      profile: prev.profile || isProfileActive,
      information: prev.information || isInformationActive,
    }));
  }, [
    isDocumentActive,
    isRecordActive,
    isInventoryActive,
    isUserActive,
    isProfileActive,
    isInformationActive,
  ]);

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="border-r border-sidebar-border bg-slate-900 p-0 [--primary:#0048B4] [--primary-foreground:#FFFFFF] [--ring:#3B82F6] [--sidebar:rgb(15_23_42)] [--sidebar-foreground:#F8FAFC] [--sidebar-accent:rgb(24_34_53)] [--sidebar-accent-foreground:#FFFFFF] [--sidebar-border:rgb(51_65_85)] [--sidebar-primary:#0048B4] [--sidebar-primary-foreground:#FFFFFF] [--sidebar-ring:#3B82F6]"
    >
      <SidebarHeader className="relative h-16 flex-row! items-center! justify-start! gap-0! !p-0 border-b border-sidebar-border/60 px-2">
        <SidebarMenu className="flex h-full w-full items-center justify-start px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <SidebarMenuItem className="w-full group-data-[collapsible=icon]:w-auto">
            <SidebarMenuButton
              size="lg"
              asChild
              className="h-full w-full py-3 overflow-visible rounded-xl mx-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:pt-0"
            >
              <Link
                href="/admin"
                className="mx-0 flex h-full w-full items-center justify-start gap-2 px-2 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0"
              >
                <Image
                  src="/logo/stem-name-white.png"
                  alt="STEM Logo"
                  width={140}
                  height={40}
                  // style={{ width: "auto", height: "auto" }}
                  className="rounded-md group-data-[collapsible=icon]:hidden"
                  priority
                />
                <Image
                  src="/logo/prasmul-white.png"
                  alt="STEM Logo"
                  width={40}
                  height={40}
                  className="hidden rounded-md object-contain group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:block group-data-[collapsible=icon]:size-6"
                  priority
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-4">
        <SidebarGroup>
          <div className="mb-2 group-data-[collapsible=icon]:hidden">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground/60" />
              <SidebarInput
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search..."
                aria-label="Search menu"
                className="border-sidebar-border bg-sidebar-accent pl-8 text-sidebar-foreground placeholder:text-sidebar-foreground/60 focus-visible:ring-sidebar-ring"
              />
            </div>
          </div>
          <SidebarGroupLabel className="text-xs tracking-wide text-sidebar-foreground/70">
            ADMIN AREA
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {showHome && (
                <SidebarMenuItem className="mt-2">
                  <SidebarMenuButton
                    tooltip="Home"
                    className={menuButtonClass(isHomeActive)}
                    asChild
                    isActive={isHomeActive}
                  >
                    <Link href="/admin/home">
                      <LayoutDashboard />
                      <span className="text-sm">Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {showProfile && (
                <SidebarMenuItem className="mt-2">
                  <SidebarMenuButton
                    onClick={() => toggleMenu("profile")}
                    tooltip="Profile"
                    className={menuButtonClass(isProfileActive)}
                    isActive={isProfileActive}
                  >
                    <User />
                    <span className="text-sm">Profile</span>
                    <ChevronDown
                      className={`ml-auto transition-transform group-data-[collapsible=icon]:hidden ${
                        openMenus.profile ||
                        (hasSearch && filteredProfileItems.length > 0)
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </SidebarMenuButton>
                  {(openMenus.profile ||
                    (hasSearch && filteredProfileItems.length > 0)) && (
                    <SidebarMenuSub>
                      {filteredProfileItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton
                            href={item.href}
                            isActive={isPathActive(item.href)}
                            className={
                              isPathActive(item.href)
                                ? "text-sidebar-foreground"
                                : "text-sidebar-foreground/65 hover:text-sidebar-foreground"
                            }
                          >
                            <span className="text-sm">{item.label}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              )}

              {showInformation && (
                <SidebarMenuItem className="mt-2">
                  <SidebarMenuButton
                    onClick={() => toggleMenu("information")}
                    tooltip="Informasi"
                    className={menuButtonClass(isInformationActive)}
                    isActive={isInformationActive}
                  >
                    <Info />
                    <span className="text-sm">Informasi</span>
                    <ChevronDown
                      className={`ml-auto transition-transform group-data-[collapsible=icon]:hidden ${
                        openMenus.information ||
                        (hasSearch && filteredInformationItems.length > 0)
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </SidebarMenuButton>
                  {(openMenus.information ||
                    (hasSearch && filteredInformationItems.length > 0)) && (
                    <SidebarMenuSub>
                      {filteredInformationItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton
                            href={item.href}
                            isActive={isPathActive(item.href)}
                            className={
                              isPathActive(item.href)
                                ? "text-sidebar-foreground"
                                : "text-sidebar-foreground/65 hover:text-sidebar-foreground"
                            }
                          >
                            <span className="text-sm">{item.label}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              )}

              {showRecord && (
                <SidebarMenuItem className="mt-2">
                  <SidebarMenuButton
                    onClick={() => toggleMenu("record")}
                    tooltip="Record"
                    className={menuButtonClass(isRecordActive)}
                    isActive={isRecordActive}
                  >
                    <History />
                    <span className="text-sm">Record</span>
                    <ChevronDown
                      className={`ml-auto transition-transform group-data-[collapsible=icon]:hidden ${
                        openMenus.record ||
                        (hasSearch && filteredRecordItems.length > 0)
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </SidebarMenuButton>
                  {(openMenus.record ||
                    (hasSearch && filteredRecordItems.length > 0)) && (
                    <SidebarMenuSub>
                      {filteredRecordItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton
                            href={item.href}
                            isActive={isPathActive(item.href)}
                            className={
                              isPathActive(item.href)
                                ? "text-sidebar-foreground"
                                : "text-sidebar-foreground/65 hover:text-sidebar-foreground"
                            }
                          >
                            <span className="text-sm">{item.label}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              )}

              {showDocument && (
                <SidebarMenuItem className="mt-2">
                  <SidebarMenuButton
                    onClick={() => toggleMenu("document")}
                    tooltip="Dokumen"
                    className={menuButtonClass(isDocumentActive)}
                    isActive={isDocumentActive}
                  >
                    <FileText />
                    <span className="text-sm">Dokumen</span>
                    <ChevronDown
                      className={`ml-auto transition-transform group-data-[collapsible=icon]:hidden ${
                        openMenus.document ||
                        (hasSearch && filteredDocumentItems.length > 0)
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </SidebarMenuButton>
                  {(openMenus.document ||
                    (hasSearch && filteredDocumentItems.length > 0)) && (
                    <SidebarMenuSub>
                      {filteredDocumentItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton
                            href={item.href}
                            isActive={isPathActive(item.href)}
                            className={
                              isPathActive(item.href)
                                ? "text-sidebar-foreground"
                                : "text-sidebar-foreground/65 hover:text-sidebar-foreground"
                            }
                          >
                            <span className="text-sm">{item.label}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              )}

              {showInventory && (
                <SidebarMenuItem className="mt-2">
                  <SidebarMenuButton
                    onClick={() => toggleMenu("inventory")}
                    tooltip="Inventarisasi"
                    className={menuButtonClass(isInventoryActive)}
                    isActive={isInventoryActive}
                  >
                    <Package />
                    <span className="text-sm">Inventarisasi</span>
                    <ChevronDown
                      className={`ml-auto transition-transform group-data-[collapsible=icon]:hidden ${
                        openMenus.inventory ||
                        (hasSearch && filteredInventoryItems.length > 0)
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </SidebarMenuButton>
                  {(openMenus.inventory ||
                    (hasSearch && filteredInventoryItems.length > 0)) && (
                    <SidebarMenuSub>
                      {filteredInventoryItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton
                            href={item.href}
                            isActive={isPathActive(item.href)}
                            className={
                              isPathActive(item.href)
                                ? "text-sidebar-foreground"
                                : "text-sidebar-foreground/65 hover:text-sidebar-foreground"
                            }
                          >
                            <span className="text-sm">{item.label}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              )}

              {showUser && (
                <SidebarMenuItem className="mt-2">
                  <SidebarMenuButton
                    onClick={() => toggleMenu("user")}
                    tooltip="User"
                    className={menuButtonClass(isUserActive)}
                    isActive={isUserActive}
                  >
                    <Users />
                    <span className="text-sm">User Management</span>
                    <ChevronDown
                      className={`ml-auto transition-transform group-data-[collapsible=icon]:hidden ${
                        openMenus.user ||
                        (hasSearch && filteredUserItems.length > 0)
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </SidebarMenuButton>
                  {(openMenus.user ||
                    (hasSearch && filteredUserItems.length > 0)) && (
                    <SidebarMenuSub>
                      {filteredUserItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton
                            href={item.href}
                            isActive={isPathActive(item.href)}
                            className={
                              isPathActive(item.href)
                                ? "text-sidebar-foreground"
                                : "text-sidebar-foreground/65 hover:text-sidebar-foreground"
                            }
                          >
                            <span className="text-sm">{item.label}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/60 px-2">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
