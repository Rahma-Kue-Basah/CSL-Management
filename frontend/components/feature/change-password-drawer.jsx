"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { AlertMessage } from "@/components/ui/alert-message";
import { useChangePassword } from "@/hooks/use-change-password";
import { Lock, Eye, EyeOff } from "lucide-react";

export function ChangePasswordDrawer({ children }) {
  const [open, setOpen] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { form, status, message, handleChange, submit, setMessage } = useChangePassword();

  const onSubmit = async (e) => {
    await submit(e);
    if (status === "success") {
      setTimeout(() => setOpen(false), 800);
    }
  };

  return (
    <Drawer direction="right" open={open} onOpenChange={(v) => { setOpen(v); if (!v) setMessage(""); }}>
      <DrawerTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon">
            <Lock className="h-4 w-4" />
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent
        data-full-mobile
        overlayClassName="backdrop-blur-xs"
        className="font-sans data-[vaul-drawer-direction=right]:max-w-md drawer-full-mobile"
      >
        <DrawerHeader className="mt-12">
          <DrawerTitle>Ubah Password</DrawerTitle>
          <DrawerDescription>Masukkan password sekarang dan password baru.</DrawerDescription>
        </DrawerHeader>

        <form
          onSubmit={onSubmit}
          className="space-y-3 px-4 pb-4 max-h-[70vh] overflow-y-auto"
        >
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Password Sekarang</p>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                placeholder="Password sekarang"
                required
                className="pr-10 placeholder:text-muted-foreground/50"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Password Baru</p>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Password baru"
                required
                className="pr-10 placeholder:text-muted-foreground/50"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Konfirmasi Password Baru</p>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Ulangi password baru"
                required
                className="pr-10 placeholder:text-muted-foreground/50"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {message && (
            <AlertMessage
              variant={status === "success" ? "success" : "error"}
            >
              {message}
            </AlertMessage>
          )}

          <Button type="submit" className="w-full" disabled={status === "submitting"}>
            {status === "submitting" ? "Menyimpan..." : "Simpan Password"}
          </Button>
        </form>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="secondary">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default ChangePasswordDrawer;
