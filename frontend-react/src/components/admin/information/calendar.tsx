"use client";

import { CSSProperties, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Badge, Calendar } from "rsuite";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

type TodoItem = {
  startTime: string;
  endTime: string;
  title: string;
  activityType: "Booking Room" | "Praktikum" | "Penggunaan Alat";
  room: string;
  equipment: string;
  status: "Disetujui";
  course?: string;
  classGroup?: string;
  instructor?: string;
  participants?: number;
  labRequirement?: string;
};
type ActivityFilter = "Semua" | TodoItem["activityType"];
type RoomFilter = "Semua Ruangan" | string;

function getTodoList(date: Date | null): TodoItem[] {
  if (!date) {
    return [];
  }

  switch (date.getDate()) {
    case 10:
      return [
        {
          startTime: "08:00",
          endTime: "10:00",
          title: "Praktikum Dasar Pemrograman",
          activityType: "Praktikum",
          room: "Lab Komputer A",
          equipment: "30 PC + Proyektor Epson EB-X06",
          status: "Disetujui",
          course: "Dasar Pemrograman",
          classGroup: "IF-1A",
          instructor: "Asisten Raka",
          participants: 28,
          labRequirement: "Wajib Lab Komputer A (spesifikasi i5, RAM 8GB)",
        },
        {
          startTime: "08:00",
          endTime: "10:00",
          title: "Praktikum Sistem Digital",
          activityType: "Praktikum",
          room: "Lab Elektronika",
          equipment: "Trainer Kit Digital + Osiloskop",
          status: "Disetujui",
          course: "Sistem Digital",
          classGroup: "TE-1B",
          instructor: "Asisten Nando",
          participants: 22,
          labRequirement: "Wajib Lab Elektronika (trainer logika digital)",
        },
        {
          startTime: "08:00",
          endTime: "11:00",
          title: "Praktikum Fisika Dasar",
          activityType: "Praktikum",
          room: "Lab Fisika",
          equipment: "Set Pengukuran Mekanika + Data Logger",
          status: "Disetujui",
          course: "Fisika Dasar",
          classGroup: "TE-1A",
          instructor: "Asisten Wulan",
          participants: 26,
          labRequirement: "Wajib Lab Fisika (alat ukur terkalibrasi)",
        },
        {
          startTime: "09:00",
          endTime: "12:00",
          title: "Praktikum Kimia Analitik",
          activityType: "Praktikum",
          room: "Lab Kimia",
          equipment: "Spektrofotometer UV-Vis + Gelas Ukur",
          status: "Disetujui",
          course: "Kimia Analitik",
          classGroup: "TK-2A",
          instructor: "Asisten Putri",
          participants: 20,
          labRequirement: "Wajib Lab Kimia (lemari asam aktif)",
        },
        {
          startTime: "09:00",
          endTime: "12:00",
          title: "Praktikum Metrologi Industri",
          activityType: "Praktikum",
          room: "Lab Metrologi",
          equipment: "CMM + Surface Roughness Tester",
          status: "Disetujui",
          course: "Metrologi Industri",
          classGroup: "TM-3A",
          instructor: "Asisten Galih",
          participants: 19,
          labRequirement: "Wajib Lab Metrologi (alat ukur presisi)",
        },
        {
          startTime: "09:30",
          endTime: "11:30",
          title: "Penggunaan Thermal Camera untuk Audit Energi",
          activityType: "Penggunaan Alat",
          room: "Lab Energi",
          equipment: "Thermal Camera FLIR E8",
          status: "Disetujui",
        },
        {
          startTime: "10:00",
          endTime: "12:00",
          title: "Praktikum Mikrokontroler",
          activityType: "Praktikum",
          room: "Lab Embedded",
          equipment: "STM32 Kit + Logic Analyzer",
          status: "Disetujui",
          course: "Sistem Embedded",
          classGroup: "TE-3A",
          instructor: "Asisten Reyhan",
          participants: 24,
          labRequirement: "Wajib Lab Embedded (bench soldering siap pakai)",
        },
        {
          startTime: "10:00",
          endTime: "12:00",
          title: "Praktikum Sistem Tenaga Listrik",
          activityType: "Praktikum",
          room: "Lab Power System",
          equipment: "Power Analyzer + Trainer Panel",
          status: "Disetujui",
          course: "Sistem Tenaga",
          classGroup: "TE-4B",
          instructor: "Asisten Yoga",
          participants: 21,
          labRequirement: "Wajib Lab Power System (panel simulasi aktif)",
        },
        {
          startTime: "13:30",
          endTime: "15:00",
          title: "Booking Presentasi Tugas Akhir",
          activityType: "Booking Room",
          room: "Ruang Rapat 2",
          equipment: "Proyektor Epson EB-X06",
          status: "Disetujui",
        },
        {
          startTime: "13:00",
          endTime: "16:00",
          title: "Praktikum Machine Learning",
          activityType: "Praktikum",
          room: "Lab AI",
          equipment: "GPU Workstation + JupyterHub Lokal",
          status: "Disetujui",
          course: "Machine Learning",
          classGroup: "IF-4A",
          instructor: "Asisten Daffa",
          participants: 30,
          labRequirement: "Wajib Lab AI (akses GPU lokal)",
        },
        {
          startTime: "14:00",
          endTime: "17:00",
          title: "Praktikum Keamanan Jaringan",
          activityType: "Praktikum",
          room: "Lab Keamanan Siber",
          equipment: "VM Server + Firewall Appliance",
          status: "Disetujui",
          course: "Keamanan Jaringan",
          classGroup: "IF-4B",
          instructor: "Asisten Ghani",
          participants: 23,
          labRequirement: "Wajib Lab Keamanan Siber (isolated network)",
        },
        {
          startTime: "14:00",
          endTime: "16:00",
          title: "Booking Simulasi Sidang",
          activityType: "Booking Room",
          room: "Ruang Seminar 1",
          equipment: "Proyektor Laser + Wireless Mic",
          status: "Disetujui",
        },
        {
          startTime: "14:30",
          endTime: "17:30",
          title: "Penggunaan CNC untuk Pembuatan Prototype",
          activityType: "Penggunaan Alat",
          room: "Workshop Manufaktur",
          equipment: "CNC Milling Machine",
          status: "Disetujui",
        },
        {
          startTime: "15:00",
          endTime: "18:00",
          title: "Praktikum IoT",
          activityType: "Praktikum",
          room: "Lab IoT",
          equipment: "ESP32 Kit + Sensor Pack",
          status: "Disetujui",
          course: "Internet of Things",
          classGroup: "SI-3A",
          instructor: "Asisten Sinta",
          participants: 27,
          labRequirement: "Wajib Lab IoT (gateway MQTT aktif)",
        },
        {
          startTime: "16:00",
          endTime: "18:00",
          title: "Penggunaan Spektrometer untuk Penelitian",
          activityType: "Penggunaan Alat",
          room: "Lab Instrumentasi",
          equipment: "Spektrometer FTIR",
          status: "Disetujui",
        },
        {
          startTime: "18:00",
          endTime: "20:00",
          title: "Praktikum Robotika",
          activityType: "Praktikum",
          room: "Lab Robotika",
          equipment: "Mobile Robot Kit + Lidar",
          status: "Disetujui",
          course: "Robotika",
          classGroup: "TE-4A",
          instructor: "Asisten Faris",
          participants: 18,
          labRequirement: "Wajib Lab Robotika (arena uji robot siap pakai)",
        },
      ];
    case 12:
      return [
        {
          startTime: "09:00",
          endTime: "12:00",
          title: "Praktikum Jaringan Komputer",
          activityType: "Praktikum",
          room: "Lab Jaringan",
          equipment: "Router Cisco + Switch + Kabel LAN",
          status: "Disetujui",
          course: "Jaringan Komputer",
          classGroup: "IF-3B",
          instructor: "Asisten Nabila",
          participants: 24,
          labRequirement: "Wajib Lab Jaringan (rack dan perangkat jaringan aktif)",
        },
      ];
    case 15:
      return [
        {
          startTime: "10:00",
          endTime: "12:00",
          title: "Praktikum Basis Data",
          activityType: "Praktikum",
          room: "Lab Database",
          equipment: "Server MySQL Lokal + 25 PC",
          status: "Disetujui",
          course: "Basis Data",
          classGroup: "SI-2A",
          instructor: "Asisten Dimas",
          participants: 25,
          labRequirement: "Wajib Lab Database (akses server lokal)",
        },
        {
          startTime: "14:00",
          endTime: "15:00",
          title: "Penggunaan 3D Printer untuk Prototype",
          activityType: "Penggunaan Alat",
          room: "Maker Space",
          equipment: "3D Printer Prusa MK4",
          status: "Disetujui",
        },
        {
          startTime: "17:00",
          endTime: "18:00",
          title: "Product test and acceptance",
          activityType: "Booking Room",
          room: "Testing Lab",
          equipment: "Oscilloscope + Multimeter",
          status: "Disetujui",
        },
        {
          startTime: "18:30",
          endTime: "19:30",
          title: "Client entertaining",
          activityType: "Booking Room",
          room: "Meeting Room Nusantara",
          equipment: "Speaker Conference Jabra",
          status: "Disetujui",
        },
      ];
    default:
      return [];
  }
}

function parseTimeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function getHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function filterTodoList(
  list: TodoItem[],
  query: string,
  activityFilter: ActivityFilter,
  roomFilter: RoomFilter,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return list.filter((item) => {
    const matchesCategory =
      activityFilter === "Semua" || item.activityType === activityFilter;
    if (!matchesCategory) return false;
    const matchesRoom =
      roomFilter === "Semua Ruangan" || item.room === roomFilter;
    if (!matchesRoom) return false;

    if (!normalizedQuery) return true;

    const searchableText = [
      item.title,
      item.room,
      item.equipment,
      item.course,
      item.classGroup,
      item.instructor,
      item.activityType,
      item.startTime,
      item.endTime,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
}

function getFilteredTodoList(
  date: Date | null,
  query: string,
  activityFilter: ActivityFilter,
  roomFilter: RoomFilter,
) {
  return filterTodoList(getTodoList(date), query, activityFilter, roomFilter);
}

function renderCell(
  date: Date,
  query: string,
  activityFilter: ActivityFilter,
  roomFilter: RoomFilter,
) {
  const list = getFilteredTodoList(date, query, activityFilter, roomFilter);

  if (!list.length) {
    return null;
  }

  return <Badge className="calendar-todo-item-badge" />;
}

type TodoListProps = {
  date: Date | null;
  query: string;
  activityFilter: ActivityFilter;
  roomFilter: RoomFilter;
};
type StatsProps = {
  date: Date | null;
};

const stickyTimeCellStyle: CSSProperties = {
  boxShadow: "inset -1px 0 0 #cbd5e1, inset 0 -1px 0 #e2e8f0",
};
const HOUR_ROW_HEIGHT_PX = 96;

function CompactStats({ date }: StatsProps) {
  const selectedDayEvents = getTodoList(date).sort(
    (a, b) =>
      parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime),
  );
  const monthDate = date ?? new Date();
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthEvents: TodoItem[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    monthEvents.push(...getTodoList(new Date(year, month, day)));
  }

  const praktikumMonth = monthEvents.filter(
    (item) => item.activityType === "Praktikum",
  ).length;
  const bookingMonth = monthEvents.filter(
    (item) => item.activityType === "Booking Room",
  ).length;
  const penggunaanAlatMonth = monthEvents.filter(
    (item) => item.activityType === "Penggunaan Alat",
  ).length;

  return (
    <div className="min-w-[260px] flex-1 rounded-lg border bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Statistik Bulan Ini
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {monthDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
      </p>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <div className="rounded-md border border-sky-200 bg-linear-to-br from-sky-100 to-sky-50 px-2 py-1.5">
          <p className="text-[11px] text-sky-700">Total Event</p>
          <p className="text-base font-semibold text-sky-900">{monthEvents.length}</p>
        </div>
        <div className="rounded-md border border-indigo-200 bg-linear-to-br from-indigo-100 to-indigo-50 px-2 py-1.5">
          <p className="text-[11px] text-indigo-700">Praktikum</p>
          <p className="text-base font-semibold text-indigo-900">{praktikumMonth}</p>
        </div>
        <div className="rounded-md border border-amber-200 bg-linear-to-br from-amber-100 to-amber-50 px-2 py-1.5">
          <p className="text-[11px] text-amber-700">Booking Room</p>
          <p className="text-base font-semibold text-amber-900">{bookingMonth}</p>
        </div>
        <div className="rounded-md border border-fuchsia-200 bg-linear-to-br from-fuchsia-100 to-fuchsia-50 px-2 py-1.5">
          <p className="text-[11px] text-fuchsia-700">Penggunaan Alat</p>
          <p className="text-base font-semibold text-fuchsia-900">{penggunaanAlatMonth}</p>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-cyan-200 bg-linear-to-r from-cyan-100 to-blue-50 px-2 py-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Hari Dipilih
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {date?.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          }) ?? "-"}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900">
          {selectedDayEvents.length} event
        </p>
      </div>
    </div>
  );
}

function TodoList({ date, query, activityFilter, roomFilter }: TodoListProps) {
  const list = getFilteredTodoList(date, query, activityFilter, roomFilter).sort(
    (a, b) =>
      parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime),
  );

  if (!list.length) {
    return (
      <div className="min-h-80 w-full rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        Pilih tanggal yang punya event untuk melihat detail agenda.
      </div>
    );
  }

  const startHour = 7;
  const endHour = 21;
  const hours = Array.from(
    { length: endHour - startHour },
    (_, index) => startHour + index,
  );
  const laneEndTimes: number[] = [];
  const eventByLaneStartHour = new Map<number, Map<number, { item: TodoItem; rowSpan: number }>>();
  const occupiedByLaneHour = new Map<number, Set<number>>();

  list.forEach((item) => {
    const startMinutes = parseTimeToMinutes(item.startTime);
    const endMinutes = parseTimeToMinutes(item.endTime);

    let laneIndex = laneEndTimes.findIndex((laneEnd) => laneEnd <= startMinutes);
    if (laneIndex === -1) {
      laneIndex = laneEndTimes.length;
      laneEndTimes.push(endMinutes);
      eventByLaneStartHour.set(laneIndex, new Map());
      occupiedByLaneHour.set(laneIndex, new Set());
    } else {
      laneEndTimes[laneIndex] = endMinutes;
    }

    const slotStart = Math.floor(startMinutes / 60);
    const slotEnd = Math.max(slotStart + 1, Math.ceil(endMinutes / 60));
    const rowSpan = slotEnd - slotStart;

    const laneEvents = eventByLaneStartHour.get(laneIndex);
    const laneOccupied = occupiedByLaneHour.get(laneIndex);
    if (!laneEvents || !laneOccupied) return;

    laneEvents.set(slotStart, { item, rowSpan });
    for (let hour = slotStart + 1; hour < slotEnd; hour += 1) {
      laneOccupied.add(hour);
    }
  });

  const laneCount = Math.max(1, laneEndTimes.length);
  const tableMinWidth = 120 + laneCount * 320;

  return (
    <div className="rounded-xl border bg-linear-to-b from-white to-slate-50 p-3">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">
        Event {date?.toLocaleDateString("id-ID")}
      </h3>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table
          className="w-full table-fixed border-collapse text-xs"
          style={{ minWidth: `${tableMinWidth}px` }}
        >
          <colgroup>
            <col style={{ width: "80px" }} />
            {Array.from({ length: laneCount }, (_, laneIndex) => (
              <col key={`lane-col-${laneIndex}`} style={{ width: "320px" }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-slate-50 text-slate-700">
              <th
                className="sticky left-0 z-30 w-20 border-b border-r bg-slate-50 p-2 text-left font-semibold"
                style={stickyTimeCellStyle}
              >
                Jam
              </th>
              <th
                colSpan={laneCount}
                className="border-b p-2 text-left font-semibold"
              >
                Agenda
              </th>
            </tr>
          </thead>
          <tbody>
            {hours.map((hour) => {
              return (
                <tr key={`hour-${hour}`} className="h-24 align-top">
                  <td
                    className="sticky left-0 z-20 border-r border-b bg-white p-2 align-top text-slate-600"
                    style={stickyTimeCellStyle}
                  >
                    {getHourLabel(hour)}
                  </td>
                  {Array.from({ length: laneCount }, (_, laneIndex) => {
                    const laneEvents = eventByLaneStartHour.get(laneIndex);
                    const laneOccupied = occupiedByLaneHour.get(laneIndex);
                    const eventData = laneEvents?.get(hour);
                    const isCoveredByPreviousEvent = laneOccupied?.has(hour);

                    if (eventData) {
                      const item = eventData.item;
                      return (
                        <td
                          key={`event-${hour}-${laneIndex}`}
                          rowSpan={eventData.rowSpan}
                          className="border-r border-b p-0 align-top last:border-r-0"
                          style={{ height: `${eventData.rowSpan * HOUR_ROW_HEIGHT_PX}px` }}
                        >
                          <div className="h-full p-2">
                            <div className="relative h-full overflow-hidden rounded-lg border bg-slate-50 p-3">
                            <span
                              className={`absolute inset-y-0 left-0 w-1 ${
                                item.activityType === "Praktikum"
                                  ? "bg-indigo-500"
                                  : item.activityType === "Penggunaan Alat"
                                    ? "bg-fuchsia-500"
                                    : "bg-sky-500"
                              }`}
                            />
                            <div className="ml-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs text-slate-500">
                                    {item.startTime} - {item.endTime}
                                  </p>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {item.title}
                                  </p>
                                </div>
                                <span
                                  className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                                    item.activityType === "Praktikum"
                                      ? "border-indigo-200 bg-indigo-100 text-indigo-800"
                                      : item.activityType === "Penggunaan Alat"
                                        ? "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-800"
                                        : "border-sky-200 bg-sky-100 text-sky-800"
                                  }`}
                                >
                                  {item.activityType}
                                </span>
                              </div>
                              <div className="mt-2 grid gap-1 text-xs text-slate-600">
                                <p>Ruangan: {item.room}</p>
                                <p>Alat: {item.equipment}</p>
                                {item.course && <p>Mata Kuliah: {item.course}</p>}
                                {item.classGroup && <p>Kelas: {item.classGroup}</p>}
                                {item.instructor && <p>Asisten/Dosen: {item.instructor}</p>}
                                {typeof item.participants === "number" && (
                                  <p>Peserta: {item.participants} orang</p>
                                )}
                              </div>
                            </div>
                          </div>
                          </div>
                        </td>
                      );
                    }

                    if (isCoveredByPreviousEvent) {
                      return null;
                    }

                    return (
                      <td
                        key={`empty-${hour}-${laneIndex}`}
                        className="border-r border-b p-2 text-slate-400 last:border-r-0"
                      >
                        -
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CalendarClient() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [query, setQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("Semua");
  const [roomFilter, setRoomFilter] = useState<RoomFilter>("Semua Ruangan");
  const filterMonthDate = selectedDate ?? new Date();
  const filterYear = filterMonthDate.getFullYear();
  const filterMonth = filterMonthDate.getMonth();
  const filterDaysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
  const availableRooms = Array.from(
    new Set(
      Array.from({ length: filterDaysInMonth }, (_, index) => {
        const day = index + 1;
        return getTodoList(new Date(filterYear, filterMonth, day)).map(
          (item) => item.room,
        );
      }).flat(),
    ),
  ).sort((a, b) => a.localeCompare(b, "id-ID"));

  return (
    <section className="space-y-4">
      <AdminPageHeader
        title="Jadwal"
        description="Pantau agenda booking ruangan dan praktikum laboratorium."
        icon={<CalendarDays className="h-5 w-5 text-blue-100" />}
      />

      <div className="flex flex-wrap items-start gap-4">
        <div className="rounded-xl border bg-card p-3 shadow-xs">
          <Calendar
            compact
            renderCell={(date) => renderCell(date, query, activityFilter, roomFilter)}
            onSelect={setSelectedDate}
            style={{ width: 320 }}
          />
        </div>
        <div className="min-w-[260px] flex-1 space-y-3">
          <CompactStats date={selectedDate} />
          <div className="rounded-lg border bg-white p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Filter Event
            </p>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Cari Event</span>
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari judul, ruangan, alat, atau pengampu..."
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Kategori</span>
                <select
                  value={activityFilter}
                  onChange={(event) => setActivityFilter(event.target.value as ActivityFilter)}
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="Semua">Semua</option>
                  <option value="Praktikum">Praktikum</option>
                  <option value="Booking Room">Booking Room</option>
                  <option value="Penggunaan Alat">Penggunaan Alat</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Ruangan</span>
                <select
                  value={roomFilter}
                  onChange={(event) => setRoomFilter(event.target.value)}
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="Semua Ruangan">Semua Ruangan</option>
                  {availableRooms.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full min-w-0">
        <TodoList
          date={selectedDate}
          query={query}
          activityFilter={activityFilter}
          roomFilter={roomFilter}
        />
      </div>
    </section>
  );
}
