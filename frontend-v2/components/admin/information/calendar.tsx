"use client";

import { CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { AdminPageHeader } from "@/components/admin/admin-page-header";

type CalEvent = {
  id: string;
  title: string;
  start: string; // ISO string (mis. '2026-02-15T10:00:00')
  end?: string;
  allDay?: boolean;
  extendedProps?: {
    description?: string;
    location?: string;
  };
};

export default function CalendarClient() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  });
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  // Contoh event
  const events: CalEvent[] = useMemo(
    () => [
      {
        id: "1",
        title: "Lab Meeting",
        start: "2026-02-11T09:00:00",
        end: "2026-02-11T09:15:00",
        extendedProps: { description: "Daily sync", location: "Zoom" },
      },
      {
        id: "2",
        title: "Lab Booking by Aziz",
        start: "2026-02-12T15:00:00",
        extendedProps: { description: "Demo + retrospective" },
      },
    ],
    []
  );

  const filteredEvents = useMemo(() => {
    return events;
  }, [events]);

  const agendaForSelectedDate = useMemo(() => {
    return filteredEvents
      .filter((e) => e.start.slice(0, 10) === selectedDate)
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [filteredEvents, selectedDate]);

  return (
    <section className="w-full min-w-0 space-y-4 overflow-x-hidden pb-6">
      <AdminPageHeader
        title="Jadwal"
        description="Pantau jadwal kegiatan laboratorium dan agenda harian."
        icon={<CalendarDays className="h-5 w-5 text-blue-100" />}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="admin-calendar rounded-xl border bg-card p-3 text-card-foreground shadow-xs sm:p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            fixedWeekCount={false}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={{
              today: "Hari ini",
              month: "Bulan",
              week: "Minggu",
              day: "Hari",
            }}
            dayMaxEvents={2}
            nowIndicator
            selectable
            height="auto"
            eventColor="var(--primary)"
            eventTextColor="var(--primary-foreground)"
            events={filteredEvents}
            dateClick={(info) => {
              setSelectedDate(info.dateStr); // 'YYYY-MM-DD'
              setActiveEventId(null);
            }}
            eventClick={(info) => {
              const e = info.event;
              setSelectedDate(e.startStr.slice(0, 10));
              setActiveEventId(e.id);
            }}
          />
        </div>

        <aside className="rounded-xl border bg-card p-4 shadow-xs">
          <div className="mb-1 text-sm font-semibold text-foreground">Agenda {selectedDate}</div>
          <p className="mb-3 text-xs text-muted-foreground">
            Menampilkan agenda sesuai tanggal yang dipilih di kalender.
          </p>

          {agendaForSelectedDate.length === 0 ? (
            <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              Tidak ada agenda.
            </div>
          ) : (
            <ul className="space-y-2">
              {agendaForSelectedDate.map((e) => (
                <li
                  key={e.id}
                  className={`rounded-lg border bg-background p-3 ${
                    activeEventId === e.id ? "border-primary/50 ring-1 ring-primary/20" : ""
                  }`}
                >
                  <div className="font-medium">{e.title}</div>
                  {e.extendedProps?.description && (
                    <div className="mt-1 text-sm text-muted-foreground">{e.extendedProps.description}</div>
                  )}
                  {e.extendedProps?.location && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Lokasi: {e.extendedProps.location}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </section>
  );
}
