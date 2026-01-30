"use client"

import { ChevronRight } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import Link from "next/link";

export function NavMain({
  items
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[14px] tracking-wide text-sidebar-foreground/70">
        CSL Management
      </SidebarGroupLabel>
      <SidebarMenu className="gap-0">
        {items.map((item) => {
          const hasChildren = item.items?.length;
          const alwaysOpen = item.alwaysOpen && hasChildren;
          return (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive || alwaysOpen}
            open={alwaysOpen ? true : undefined}
            className="mt-3"
          >
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={item.title}
                asChild={!!(item.url && item.url !== "#")}
                className={`text-[14px] transition-all duration-200 hover:translate-x-0.5 ${
                  !item.url || item.url === "#" ? "cursor-default" : ""
                }`}
              >
                {item.url && item.url !== "#" ? (
                  <Link href={item.url}>
                    <item.icon className="h-4 w-4" />
                      <span className="text-[14px]">{item.title}</span>
                    </Link>
                  ) : (
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span className="text-[14px]">{item.title}</span>
                  </div>
                )}
              </SidebarMenuButton>
              {hasChildren ? (
                <>
                  {!alwaysOpen && (
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                  )}
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-[sidebar-accordion-up_0.2s_ease-out] data-[state=open]:animate-[sidebar-accordion-down_0.2s_ease-out]">
                    <SidebarMenuSub className="mt-1 border-l border-sidebar-border/70 pl-2">
                      {item.items?.map((subItem) => {
                        const hasGrandChildren = subItem.items?.length;
                        if (!hasGrandChildren) {
                          return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild className="text-[14px]">
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      }

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild className="text-[14px]">
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                          <SidebarMenuSub className="ml-3 mt-1">
                            {subItem.items?.map((grandItem) => (
                              <SidebarMenuSubItem key={grandItem.title}>
                                <SidebarMenuSubButton asChild className="text-[14px]">
                                  <Link href={grandItem.url}>
                                    <span>{grandItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                            </SidebarMenuSub>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        )})}
      </SidebarMenu>
    </SidebarGroup>
  );
}
