"use client";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Image from "next/image";
import { useState } from "react";
import { HamburgerIcon } from "@/components/ui/hamburger-icon";
import { AnimatePresence, motion } from "framer-motion";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm font-sans py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo/stem-name 2.png"
              alt="CSL USE Logo"
              width={160}
              height={32}
            />
          </Link>

          {/* Hamburger for mobile */}
          <div className="flex lg:hidden">
            <button
              className="lg:hidden p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle menu"
            >
              <HamburgerIcon />
            </button>

            <Link
              href="/login"
              className={`${navigationMenuTriggerStyle()} bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md`}
            >
              Login
            </Link>
          </div>

          {/* Navigation Menu - Desktop */}
          <div className="hidden lg:block">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/" className={navigationMenuTriggerStyle()}>
                      Home
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/layanan"
                      className={navigationMenuTriggerStyle()}
                    >
                      Layanan
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/tentang"
                      className={navigationMenuTriggerStyle()}
                    >
                      Tentang Kami
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/struktur"
                      className={navigationMenuTriggerStyle()}
                    >
                      Struktur Organisasi
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/kontak"
                      className={navigationMenuTriggerStyle()}
                    >
                      Kontak
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/jadwal-lab"
                      className={navigationMenuTriggerStyle()}
                    >
                      Jadwal Lab
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/login"
                      className={`${navigationMenuTriggerStyle()} bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md`}
                    >
                      Login
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              className="lg:hidden mt-2"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="flex flex-col gap-2 bg-white py-4">
                <Link
                  href="/"
                  className={navigationMenuTriggerStyle()}
                  onClick={() => setMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/layanan"
                  className={navigationMenuTriggerStyle()}
                  onClick={() => setMenuOpen(false)}
                >
                  Layanan
                </Link>
                <Link
                  href="/tentang"
                  className={navigationMenuTriggerStyle()}
                  onClick={() => setMenuOpen(false)}
                >
                  Tentang Kami
                </Link>
                <Link
                  href="/struktur"
                  className={navigationMenuTriggerStyle()}
                  onClick={() => setMenuOpen(false)}
                >
                  Struktur Organisasi
                </Link>
                <Link
                  href="/kontak"
                  className={navigationMenuTriggerStyle()}
                  onClick={() => setMenuOpen(false)}
                >
                  Kontak
                </Link>
                <Link
                  href="/jadwal-lab"
                  className={navigationMenuTriggerStyle()}
                  onClick={() => setMenuOpen(false)}
                >
                  Jadwal Lab
                </Link>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </nav>
  );
}
