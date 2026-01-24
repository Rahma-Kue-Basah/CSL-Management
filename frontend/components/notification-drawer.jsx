"use client";

import { useState } from "react";
import { Bell, CheckCircle2, CircleDot } from "lucide-react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const dummyNotifications = [
  {
    id: 1,
    title: "Peminjaman disetujui",
    message: "Booking ruang Lab 3 telah disetujui untuk 28 Jan 2026.",
    time: "2m ago",
    read: false,
  },
  {
    id: 2,
    title: "Pengingat pengembalian",
    message: "Pengembalian alat mikroskop jatuh tempo besok pukul 10.00.",
    time: "1h ago",
    read: false,
  },
  {
    id: 3,
    title: "Info sistem",
    message: "Pemeliharaan server dijadwalkan 30 Jan 2026 pukul 22.00.",
    time: "1d ago",
    read: true,
  },
];

function NotificationItem({ title, message, time, read }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-1">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {read ? (
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        ) : (
          <CircleDot className="h-4 w-4 text-primary" />
        )}
        <span>{title}</span>
        <span className="ml-auto text-xs text-muted-foreground">{time}</span>
      </div>
      <p className="text-sm leading-snug text-muted-foreground">{message}</p>
    </div>
  );
}

export function NotificationDrawer({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent
        data-full-mobile
        className="data-[vaul-drawer-direction=right]:max-w-md drawer-full-mobile"
        overlayClassName="backdrop-blur-xs"
      >
        <DrawerHeader className="mt-12 items-start">
          <DrawerTitle>Notifikasi</DrawerTitle>
          <DrawerDescription>Berisi pemberitahuan terbaru</DrawerDescription>
        </DrawerHeader>

        <div className="max-h-[70vh] overflow-y-auto space-y-3 px-4 pb-4">
          {dummyNotifications.map((item) => (
            <NotificationItem key={item.id} {...item} />
          ))}
          <Separator />
          <p className="text-xs text-muted-foreground">
            Data masih dummy. Integrasikan ke endpoint notifikasi ketika tersedia.
          </p>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="secondary">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default NotificationDrawer;
