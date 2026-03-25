"use client";

import { useMemo, useState, type FormEvent } from "react";
import { BadgeAlert, CalendarDays, Plus, Search } from "lucide-react";
import { Badge, Calendar as RsuiteCalendar } from "rsuite";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HourlyScheduleTable } from "@/components/admin/information/hourly-schedule-table";
import { ManualSchedulesTable } from "@/components/admin/information/manual-schedules-table";
import {
  formatDateTimeLocalInput,
  type ScheduleCategory,
  ScheduleFormDialog,
  type ScheduleFormState,
  validateScheduleForm,
} from "@/components/admin/information/schedule-form-dialog";
import { AdminFilterCard } from "@/components/admin/admin-filter-card";
import { InventoryPagination } from "@/components/admin/inventory/inventory-pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCalendarEvents } from "@/hooks/calendar/use-calendar-events";
import { useCreateSchedule } from "@/hooks/schedules/use-create-schedule";
import { useDeleteSchedule } from "@/hooks/schedules/use-delete-schedule";
import {
  useSchedules,
  type ScheduleItem,
} from "@/hooks/schedules/use-schedules";
import { useUpdateSchedule } from "@/hooks/schedules/use-update-schedule";
import { useRoomOptions } from "@/hooks/rooms/use-room-options";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const EMPTY_FORM: ScheduleFormState = {
  title: "",
  description: "",
  category: "Agenda",
  room: "",
  startTime: "",
  endTime: "",
  isActive: true,
};

function getYearBounds(date: Date) {
  const year = date.getFullYear();
  return {
    start: new Date(year, 0, 1, 0, 0, 0).toISOString(),
    end: new Date(year, 11, 31, 23, 59, 59).toISOString(),
  };
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isSameMonth(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function getCalendarDotClass(source: string) {
  if (source === "schedule") return "bg-sky-500";
  if (source === "booking") return "bg-emerald-500";
  if (source === "use") return "bg-amber-500";
  return "bg-slate-500";
}

export default function CalendarClient() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("true");
  const [filterOpen, setFilterOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<ScheduleFormState>(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState<ScheduleItem | null>(null);
  const [editForm, setEditForm] = useState<ScheduleFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const yearBounds = useMemo(() => getYearBounds(selectedDate), [selectedDate]);
  const { rooms } = useRoomOptions();
  const {
    events,
    error: calendarError,
  } = useCalendarEvents(yearBounds.start, yearBounds.end, { room: roomFilter }, reloadKey);
  const {
    schedules,
    totalCount,
    isLoading: isSchedulesLoading,
    error: schedulesError,
    setError: setSchedulesError,
  } = useSchedules(
    page,
    PAGE_SIZE,
    {
      search: query,
      room: roomFilter,
      isActive: activeFilter,
      start: yearBounds.start,
      end: yearBounds.end,
    },
    reloadKey,
  );
  const {
    createSchedule,
    isSubmitting: isCreating,
    errorMessage: createError,
    setErrorMessage: setCreateError,
  } = useCreateSchedule();
  const {
    updateSchedule,
    isSubmitting: isUpdating,
    errorMessage: updateError,
    setErrorMessage: setUpdateError,
  } = useUpdateSchedule();
  const {
    deleteSchedule,
    isDeleting,
    errorMessage: deleteError,
    setErrorMessage: setDeleteError,
  } = useDeleteSchedule();

  const filteredEvents = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    return events.filter((item) => {
      if (roomFilter && item.room_id !== roomFilter) return false;
      if (!normalizedQuery) return true;
      return normalizeText(
        `${item.title} ${item.description ?? ""} ${item.room_name ?? ""} ${item.requested_by_name ?? ""}`,
      ).includes(normalizedQuery);
    });
  }, [events, query, roomFilter]);

  const monthEvents = useMemo(() => {
    return filteredEvents.filter((item) =>
      isSameMonth(new Date(item.start_time), selectedDate),
    );
  }, [filteredEvents, selectedDate]);

  const monthKpis = useMemo(() => {
    const scheduleCount = monthEvents.filter((item) => item.source === "schedule").length;
    const bookingCount = monthEvents.filter((item) => item.source === "booking").length;
    const useCount = monthEvents.filter((item) => item.source === "use").length;
    const roomCount = new Set(
      monthEvents.map((item) => item.room_name).filter(Boolean),
    ).size;

    return [
      {
        label: "Agenda Bulan Ini",
        value: String(monthEvents.length),
        tone: "from-sky-500/15 to-sky-100",
      },
      {
        label: "Jadwal Manual",
        value: String(scheduleCount),
        tone: "from-emerald-500/15 to-emerald-100",
      },
      {
        label: "Booking Ruangan",
        value: String(bookingCount),
        tone: "from-amber-500/15 to-amber-100",
      },
      {
        label: "Ruangan Terpakai",
        value: String(roomCount),
        tone: "from-violet-500/15 to-violet-100",
        helper: useCount ? `${useCount} penggunaan alat` : undefined,
      },
    ];
  }, [monthEvents]);

  const selectedDayEvents = useMemo(() => {
    return filteredEvents
      .filter((item) => isSameDay(new Date(item.start_time), selectedDate))
      .sort(
        (left, right) =>
          new Date(left.start_time).getTime() - new Date(right.start_time).getTime(),
      );
  }, [filteredEvents, selectedDate]);

  const totalPages = Math.max(1, Math.ceil((totalCount || schedules.length) / PAGE_SIZE));

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) {
      setCreateForm(EMPTY_FORM);
      setCreateError("");
    }
  };

  const handleEditOpen = (item: ScheduleItem) => {
    setEditTarget(item);
    setEditForm({
      title: item.title,
      description: item.description ?? "",
      category: (item.category as ScheduleCategory) || "Agenda",
      room: item.room ? String(item.room) : "",
      startTime: formatDateTimeLocalInput(item.start_time),
      endTime: formatDateTimeLocalInput(item.end_time),
      isActive: Boolean(item.is_active),
    });
    setUpdateError("");
  };

  const handleEditDialogChange = (open: boolean) => {
    if (!open) {
      setEditTarget(null);
      setEditForm(EMPTY_FORM);
      setUpdateError("");
    }
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError("");
    const payload = validateScheduleForm(createForm, setCreateError);
    if (!payload) return;

    const result = await createSchedule(payload);
    if (!result.ok) return;

    handleCreateDialogChange(false);
    setReloadKey((prev) => prev + 1);
    toast.success("Jadwal berhasil ditambahkan.");
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;
    setUpdateError("");
    const payload = validateScheduleForm(editForm, setUpdateError);
    if (!payload) return;

    const result = await updateSchedule(editTarget.id, payload);
    if (!result.ok) return;

    handleEditDialogChange(false);
    setReloadKey((prev) => prev + 1);
    toast.success("Jadwal berhasil diperbarui.");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    const result = await deleteSchedule(deleteTarget.id);
    if (!result.ok) {
      setSchedulesError(result.message || "Gagal menghapus jadwal.");
      return;
    }
    setDeleteTarget(null);
    setReloadKey((prev) => prev + 1);
    toast.success("Jadwal berhasil dihapus.");
  };

  const renderCell = (date: Date) => {
    const dayItems = filteredEvents.filter((item) =>
      isSameDay(new Date(item.start_time), date),
    );

    if (!dayItems.length) return null;

    const hasUse = dayItems.some((item) => item.source === "use");
    const hasBooking = dayItems.some((item) => item.source === "booking");
    const markerClass = hasUse
      ? getCalendarDotClass("use")
      : hasBooking
        ? getCalendarDotClass("booking")
        : getCalendarDotClass("schedule");

    return (
      <div className="mt-1 flex justify-center">
        <Badge className="!mr-0">
          <span className={`block h-2 w-2 rounded-full ${markerClass}`} />
        </Badge>
      </div>
    );
  };

  return (
    <section className="space-y-4">
      <AdminPageHeader
        title="Jadwal"
        description="Kelola jadwal manual dan pantau agenda gabungan dari jadwal admin, booking ruangan, dan penggunaan alat."
        icon={<CalendarDays className="h-5 w-5 text-blue-100" />}
        actions={
          <ScheduleFormDialog
            open={isCreateOpen}
            onOpenChange={handleCreateDialogChange}
            form={createForm}
            onChange={(field, value) =>
              setCreateForm((prev) => ({ ...prev, [field]: value }))
            }
            onSubmit={handleCreateSubmit}
            rooms={rooms}
            title="Tambah Jadwal"
            description="Masukkan jadwal manual seperti praktikum tetap, maintenance, atau agenda laboratorium."
            error={createError}
            isSubmitting={isCreating}
            trigger={
              <Button
                type="button"
                size="sm"
                className="bg-white text-slate-900 hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" />
                Tambah Jadwal
              </Button>
            }
          />
        }
      />

      <ScheduleFormDialog
        open={Boolean(editTarget)}
        onOpenChange={handleEditDialogChange}
        form={editForm}
        onChange={(field, value) => setEditForm((prev) => ({ ...prev, [field]: value }))}
        onSubmit={handleEditSubmit}
        rooms={rooms}
        title="Edit Jadwal"
        description="Perbarui detail jadwal manual."
        error={updateError}
        isSubmitting={isUpdating}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus jadwal?</AlertDialogTitle>
            <AlertDialogDescription>
              Jadwal manual yang dihapus tidak bisa dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-[#0052C7] text-white hover:bg-[#0048B4]"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdminFilterCard
        open={filterOpen}
        onToggle={() => setFilterOpen((prev) => !prev)}
        onReset={() => {
          setQuery("");
          setRoomFilter("");
          setActiveFilter("true");
          setPage(1);
          setFilterOpen(false);
        }}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Cari judul, deskripsi, atau agenda"
              className="h-6 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
            />
          </div>
          <select
            value={roomFilter}
            onChange={(event) => {
              setRoomFilter(event.target.value);
              setPage(1);
            }}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            <option value="">Semua Ruangan</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.label}
              </option>
            ))}
          </select>
          <select
            value={activeFilter}
            onChange={(event) => {
              setActiveFilter(event.target.value);
              setPage(1);
            }}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            <option value="true">Jadwal Aktif</option>
            <option value="false">Jadwal Nonaktif</option>
            <option value="">Semua Status</option>
          </select>
        </div>
      </AdminFilterCard>

      {calendarError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {calendarError}
        </div>
      ) : null}
      {schedulesError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {schedulesError}
        </div>
      ) : null}
      {deleteError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {deleteError}
        </div>
      ) : null}

      <div className="grid items-start gap-4 xl:grid-cols-[auto_minmax(0,1fr)]">
        <div className="inline-block w-fit max-w-full justify-self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          <RsuiteCalendar
            compact
            value={selectedDate}
            onSelect={(value) => setSelectedDate(value ?? new Date())}
            renderCell={renderCell}
            style={{ width: 388 }}
          />
        </div>

        <div className="space-y-3">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Ringkasan Bulan
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {selectedDate.toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Rekap agenda otomatis berdasarkan bulan yang sedang dipilih.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 2xl:grid-cols-4">
              {monthKpis.map((item) => (
                <div
                  key={`sidebar-${item.label}`}
                  className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${item.tone} px-4 py-4`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold leading-none text-slate-900">
                    {item.value}
                  </p>
                  {/* <p className="mt-3 text-xs leading-5 text-slate-500">
                    {item.helper ?? "Agenda terhitung pada bulan aktif"}
                  </p> */}
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tanggal Terpilih
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {selectedDate.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Agenda harian difokuskan pada tabel per jam di bawah.
            </p>
          </article>
        </div>
      </div>

      <HourlyScheduleTable
        events={selectedDayEvents}
        title={`Agenda ${selectedDate.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}`}
      />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {/* <BadgeAlert className="h-4 w-4 text-slate-500" /> */}
          <h3 className="text-base font-semibold text-slate-900">Jadwal</h3>
        </div>

        <ManualSchedulesTable
          schedules={schedules}
          isLoading={isSchedulesLoading}
          onEdit={handleEditOpen}
          onDelete={(item) => setDeleteTarget(item)}
        />

        <InventoryPagination
          page={page}
          totalPages={totalPages}
          isLoading={isSchedulesLoading}
          onPageChange={setPage}
        />
      </div>
    </section>
  );
}
