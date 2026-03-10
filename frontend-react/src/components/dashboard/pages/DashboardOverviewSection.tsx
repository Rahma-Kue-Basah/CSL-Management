function KpiCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export function DashboardOverviewSection() {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-800">KPI Overview</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Booking Ruangan" value="24" />
        <KpiCard label="Total Booking Alat" value="18" />
        <KpiCard label="Jadwal Aktif Minggu Ini" value="9" />
        <KpiCard label="Request Menunggu" value="6" />
      </div>
    </section>
  );
}
