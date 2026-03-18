import { useEffect, useState } from "react";
import Image from "next/image";
import { useNavigate } from "react-router-dom";

import { useIsMobile } from "@/hooks/use-mobile";

export default function DashboardHomePage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [shouldHideContent, setShouldHideContent] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    setShouldHideContent(isMobile);
    if (!isMobile) return;
    navigate("/dashboard/overview", { replace: true });
  }, [isMobile, navigate]);

  if (shouldHideContent) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <div className="relative aspect-[16/7] w-full">
        <Image
          src="/images/welcome.jpg"
          alt="Welcome"
          fill
          priority
          className="object-cover"
        />
      </div>
    </section>
  );
}
