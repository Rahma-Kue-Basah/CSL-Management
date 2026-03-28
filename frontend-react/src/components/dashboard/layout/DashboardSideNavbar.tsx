"use client";

import type { ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { DashboardUserMenu } from "@/components/dashboard/dashboard-user-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type DashboardSideNavbarProps = {
  menus: Array<{
    id: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
  }>;
  activeMenuId: string;
  getMenuHref: (menuId: string) => string;
  bottomMenuIds?: string[];
  onMenuClick: (menuId: string) => void;
  onLogoClick: () => void;
};

export function DashboardSideNavbar({
  menus,
  activeMenuId,
  getMenuHref,
  bottomMenuIds,
  onMenuClick,
  onLogoClick,
}: DashboardSideNavbarProps) {
  const bottomIds = bottomMenuIds ?? [];
  const topMenus = bottomIds.length
    ? menus.filter((item) => !bottomIds.includes(item.id))
    : menus;
  const bottomMenus = bottomIds
    .map((id) => menus.find((item) => item.id === id) ?? null)
    .filter((item): item is (typeof menus)[number] => item !== null);

  return (
    <aside className="fixed top-0 bottom-0 left-0 z-50 hidden w-20 shrink-0 border-r border-[rgb(51_65_85)] bg-[rgb(15_23_42)] md:flex md:flex-col">
        <div className="flex h-16 items-center justify-center border-b border-[rgb(51_65_85)]">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onLogoClick}
                className="flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-[rgb(24_34_53)]"
                aria-label="Dashboard"
              >
                <Image
                  src="/logo/prasmul-white.png"
                  alt="STEM"
                  width={24}
                  height={24}
                  className="rounded-md object-contain"
                  priority
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" align="center">
              Dashboard
            </TooltipContent>
          </Tooltip>
        </div>

        <nav className="flex flex-1 flex-col items-center gap-2 px-2 py-4">
          {topMenus.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenuId === item.id;

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Link
                    href={getMenuHref(item.id)}
                    aria-label={item.label}
                    onClick={() => onMenuClick(item.id)}
                    className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors ${
                      isActive
                        ? "bg-[rgb(24_34_53)] text-[#F8FAFC]"
                        : "text-[#F8FAFC]/70 hover:bg-[rgb(24_34_53)] hover:text-[#F8FAFC]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {bottomMenus.length ? (
          <div className="flex flex-col items-center gap-2 border-t border-[rgb(51_65_85)] p-2">
            {bottomMenus.map((bottomMenu) => (
              <Tooltip key={bottomMenu.id}>
                <TooltipTrigger asChild>
                  {bottomMenu.id === "my-profile" ? (
                    <div>
                      <DashboardUserMenu
                        triggerClassName={`h-10 w-10 justify-center rounded-md px-0 transition-colors ${
                          activeMenuId === bottomMenu.id
                            ? "bg-[rgb(24_34_53)] text-[#F8FAFC]"
                            : "text-[#F8FAFC]/70 hover:bg-[rgb(24_34_53)] hover:text-[#F8FAFC]"
                        }`}
                        nameClassName="hidden"
                      />
                    </div>
                  ) : (
                    <Link
                      href={getMenuHref(bottomMenu.id)}
                      aria-label={bottomMenu.label}
                      onClick={() => onMenuClick(bottomMenu.id)}
                      className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors ${
                        activeMenuId === bottomMenu.id
                          ? "bg-[rgb(24_34_53)] text-[#F8FAFC]"
                          : "text-[#F8FAFC]/70 hover:bg-[rgb(24_34_53)] hover:text-[#F8FAFC]"
                      }`}
                    >
                      <bottomMenu.icon className="h-4 w-4" />
                    </Link>
                  )}
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  {bottomMenu.label}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        ) : null}
      </aside>
  );
}
