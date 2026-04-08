import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useIsMobile } from "@/hooks/use-mobile";

export default function DashboardHomePage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [shouldHideContent, setShouldHideContent] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    setShouldHideContent(isMobile);
    if (!isMobile) return;
    router.replace("/dashboard/overview");
  }, [isMobile, router]);

  if (shouldHideContent) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <div className="relative aspect-[16/7] w-full">
        <Image
          src="/images/welcome.webp"
          alt="Welcome"
          fill
          priority
          className="object-cover"
        />
      </div>
    </section>
  );
}
