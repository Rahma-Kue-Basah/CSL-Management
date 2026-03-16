import Image from "next/image";

export default function DashboardHomePage() {
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
