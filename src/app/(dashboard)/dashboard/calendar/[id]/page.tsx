import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { getCalendarEventAttendanceForAdmin } from "@/modules/dashboard/server/calendar.repository";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDateTime(date: Date) {
  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardCalendarAttendancePage({ params }: Props) {
  const [{ id }, user, cmsPages] = await Promise.all([
    params,
    requireAdmin(),
    discoverPagesGroupRoutes(),
  ]);
  const event = await getCalendarEventAttendanceForAdmin(id);
  if (!event) notFound();

  const confirmed = event.attendances.filter((attendance) => attendance.status === "CONFIRMED");
  const pending = event.attendances.filter((attendance) => attendance.status === "PENDING");
  const declined = event.attendances.filter((attendance) => attendance.status === "DECLINED");

  const showsAttendance = event.attendanceConfirmationEnabled;
  const showsRegistrations = event.registrationsEnabled;
  return (
    <DashboardShell
      userEmail={user.email}
      cmsPages={cmsPages.filter((page) => !page.isDynamic)}
      breadcrumbPage="Asistencia del evento"
    >
      <div className="space-y-8 [font-family:var(--font-montserrat)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/dashboard/calendar" className="text-sm font-semibold text-[var(--complement-800)] hover:underline">
              ← Volver al calendario
            </Link>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">{event.title}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {formatDateTime(event.startsAt)} · {formatTime(event.startsAt)} - {formatTime(event.endsAt)}
              {event.location ? ` · ${event.location}` : ""}
            </p>
          </div>
          <Link href={`/dashboard/calendar?edit=${event.id}`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Editar evento
          </Link>
        </div>

        {(showsAttendance || showsRegistrations) ? (
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {showsAttendance ? <>
              <StatCard label="Confirmados" value={confirmed.length} tone="emerald" />
              <StatCard label="Pendientes" value={pending.length} tone="amber" />
              <StatCard label="No asisten" value={declined.length} tone="rose" />
            </> : null}
            {showsRegistrations ? <StatCard label="Inscriptos" value={event.registrations.length} tone="slate" /> : null}
          </section>
        ) : null}

        {showsAttendance ? <>
          <AttendanceSection title="Confirmados" rows={confirmed} empty="Todavía no hay asistencias confirmadas." tone="emerald" />
          <AttendanceSection title="Pendientes de respuesta" rows={pending} empty="No hay respuestas pendientes." tone="amber" />
          <AttendanceSection title="No podrán asistir" rows={declined} empty="No hay inasistencias informadas." tone="rose" />
        </> : null}

        {showsRegistrations ? (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Inscriptos</h2>
              <p className="mt-1 text-sm text-slate-500">Personas que se anotaron mediante el formulario público.</p>
            </div>
            {event.registrations.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Nombre</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Teléfono</th>
                      <th className="px-5 py-3">Inscripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.registrations.map((registration) => (
                      <tr key={registration.id} className="border-t border-slate-100">
                        <td className="px-5 py-3 font-medium text-slate-900">{registration.name}</td>
                        <td className="px-5 py-3 text-slate-600">{registration.email}</td>
                        <td className="px-5 py-3 text-slate-600">{registration.phone}</td>
                        <td className="px-5 py-3 text-slate-600">{formatDateTime(registration.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="px-5 py-8 text-sm text-slate-500">Todavía no hay inscriptos.</p>}
          </section>
        ) : null}
      </div>
    </DashboardShell>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "emerald" | "amber" | "rose" | "slate" }) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    slate: "border-slate-200 bg-slate-50 text-slate-800",
  };

  return <div className={`rounded-xl border p-4 ${tones[tone]}`}><p className="text-sm font-medium">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>;
}

function AttendanceSection({ title, rows, empty, tone }: {
  title: string;
  rows: Array<{ id: string; name: string; email: string; respondedAt: Date | null }>;
  empty: string;
  tone: "emerald" | "amber" | "rose";
}) {
  const dot = tone === "emerald" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : "bg-rose-500";

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <span className={`size-2 rounded-full ${dot}`} />
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      {rows.length ? (
        <ul className="divide-y divide-slate-100">
          {rows.map((attendance) => (
            <li key={attendance.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
              <div><p className="font-medium text-slate-900">{attendance.name}</p><p className="text-sm text-slate-600">{attendance.email}</p></div>
              {attendance.respondedAt ? <p className="text-xs text-slate-500">Respondió {formatDateTime(attendance.respondedAt)}</p> : null}
            </li>
          ))}
        </ul>
      ) : <p className="px-5 py-7 text-sm text-slate-500">{empty}</p>}
    </section>
  );
}
