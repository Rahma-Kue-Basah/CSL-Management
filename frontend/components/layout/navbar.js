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

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm font-sans py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo/stem-name 2.png"
              alt="CSL USE Logo"
              width={210}
              height={32}
            />

            {/* <span className="text-lg font-semibold italic text-red-600">
              x CSL USE
            </span> */}
          </Link>

          {/* Navigation Menu */}
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
                  <Link href="/kontak" className={navigationMenuTriggerStyle()}>
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
    </nav>
  );
}
