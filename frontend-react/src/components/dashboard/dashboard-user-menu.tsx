"use client";

import { ArrowBigUpDashIcon, LogOut, UserRound, UserRoundSearch } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useLoadProfile,
  type ProfileUserInput,
} from "@/hooks/profile/use-load-profile";
import { useLogout } from "@/hooks/auth/use-logout";
import { cn } from "@/lib/utils";

type DashboardUserMenuProps = {
  user?: ProfileUserInput | null;
  triggerClassName?: string;
  nameClassName?: string;
};

export function DashboardUserMenu({
  user,
  triggerClassName,
  nameClassName,
}: DashboardUserMenuProps) {
  const { profile, initials } = useLoadProfile(user);
  const { handleLogout } = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 items-center rounded-xl px-0 text-slate-800 transition hover:bg-slate-100",
            triggerClassName,
          )}
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarFallback className="rounded-lg bg-slate-100 text-zinc-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn("ml-2 flex-1 text-left leading-tight", nameClassName)}
          >
            <span className="truncate text-sm font-medium">{profile.name}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-68 rounded-lg border border-slate-200 bg-white text-slate-900 shadow-xl"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-[15px]">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg bg-slate-200 text-slate-900">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-[14px] leading-tight">
              <span className="truncate font-medium">{profile.name}</span>
              <span className="truncate text-[12px] text-slate-500">
                {profile.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-200" />
        <DropdownMenuItem className="cursor-pointer text-slate-900 hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-sm">
          <Link href="/" className="flex items-center w-full">
            <UserRound className="mr-2 h-4 w-4" />
            Profil Saya
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-200" />
        <DropdownMenuItem className="cursor-pointer text-slate-900 hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 text-sm">
          <Link href="/admin/home" className="flex items-center w-full">
            <UserRoundSearch className="mr-2 h-4 w-4" />
            Admin CSL
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer text-slate-900 hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900"
          onSelect={(event) => {
            event.preventDefault();
            handleLogout();
          }}
        >
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
