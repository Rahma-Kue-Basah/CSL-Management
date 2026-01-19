"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { API_AUTH_LOGOUT } from "@/constants/api";

export default function DashboardPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch(API_AUTH_LOGOUT, {
        method: "GET",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      Cookies.remove("user");
      setIsLoggingOut(false);
      router.push("/login");
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-xl border border-muted bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Dashboard
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Halaman ini masih dummy. Konten dashboard akan ditambahkan di
                tahap berikutnya.
              </p>
            </div>
            <Button type="button" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-muted p-4">
              <p className="text-sm text-muted-foreground">Statistik 1</p>
              <p className="mt-2 text-xl font-semibold">—</p>
            </div>
            <div className="rounded-lg border border-muted p-4">
              <p className="text-sm text-muted-foreground">Statistik 2</p>
              <p className="mt-2 text-xl font-semibold">—</p>
            </div>
            <div className="rounded-lg border border-muted p-4">
              <p className="text-sm text-muted-foreground">Statistik 3</p>
              <p className="mt-2 text-xl font-semibold">—</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
