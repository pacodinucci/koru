import Link from "next/link";

type PublicCalendarEvent = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location: string | null;
};

type PublicCalendarViewProps = {
  dateCursor: Date;
  selectedDate?: Date;
  events: PublicCalendarEvent[];
};

const weekDays = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatDateParam(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calendarHref(date: Date, selectedDate?: Date) {
  const params = new URLSearchParams({ date: formatDateParam(date) });
  if (selectedDate) params.set("day", formatDateParam(selectedDate));
  return `/calendario?${params.toString()}`;
}

function getMonthDays(dateCursor: Date) {
  const firstDay = new Date(dateCursor.getFullYear(), dateCursor.getMonth(), 1);
  const lastDay = new Date(
    dateCursor.getFullYear(),
    dateCursor.getMonth() + 1,
    0,
  );
  const offset = (firstDay.getDay() + 6) % 7;
  const leading = Array.from({ length: offset }, () => null);
  const days = Array.from(
    { length: lastDay.getDate() },
    (_, index) =>
      new Date(dateCursor.getFullYear(), dateCursor.getMonth(), index + 1),
  );
  const trailing = Array.from(
    { length: (7 - ((leading.length + days.length) % 7)) % 7 },
    () => null,
  );
  return [...leading, ...days, ...trailing];
}

function formatTime(start: Date, end: Date) {
  return `${start.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
}

export function PublicCalendarView({
  dateCursor,
  selectedDate,
  events,
}: PublicCalendarViewProps) {
  const selected =
    selectedDate &&
    selectedDate.getMonth() === dateCursor.getMonth() &&
    selectedDate.getFullYear() === dateCursor.getFullYear()
      ? selectedDate
      : undefined;
  const monthLabel = `${dateCursor.toLocaleDateString("es-AR", { month: "long" })} ${dateCursor.getFullYear()}`;
  const selectedEvents = selected
    ? events.filter((event) => isSameDay(new Date(event.startsAt), selected))
    : events;
  const days = getMonthDays(dateCursor);
  const currentYearMonths = Array.from(
    { length: 12 },
    (_, index) => new Date(dateCursor.getFullYear(), index, 1),
  );

  return (
    <main className="mx-auto min-h-[calc(100svh-8rem)] w-full max-w-7xl px-6 pb-16 pt-10 [font-family:var(--font-montserrat)] md:px-10 lg:min-h-[58rem] lg:px-14">
      <header className="mx-auto max-w-6xl">
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[var(--complement-900)] [font-family:var(--font-roboto-condensed)] md:text-5xl">
          Calendario
        </h1>
      </header>

      <section className="mx-auto mt-10 grid max-w-6xl overflow-hidden rounded-[0.5rem] bg-[#fbfaf4] lg:grid-cols-[13rem_minmax(0,1fr)_18rem]">
        <aside className="border-b-[2.5px] border-[var(--complement-800)] bg-[#fbfaf4] lg:border-r-[2.5px] lg:border-b-0">
          <div className="flex min-h-[76px] items-center justify-between border-b-[2.5px] border-white/80 bg-[var(--complement-800)] px-5 text-white">
            <Link
              href={calendarHref(
                new Date(
                  dateCursor.getFullYear() - 1,
                  dateCursor.getMonth(),
                  1,
                ),
              )}
              className="text-3xl font-bold leading-none text-white transition hover:text-[var(--complement-300)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              aria-label="Ver ano anterior"
            >
              &larr;
            </Link>
            <span className="text-xl font-semibold">
              {dateCursor.getFullYear()}
            </span>
            <Link
              href={calendarHref(
                new Date(
                  dateCursor.getFullYear() + 1,
                  dateCursor.getMonth(),
                  1,
                ),
              )}
              className="text-3xl font-bold leading-none text-white transition hover:text-[var(--complement-500)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              aria-label="Ver ano siguiente"
            >
              &rarr;
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-1 px-5 pb-5 lg:grid-cols-1">
            {currentYearMonths.map((month) => {
              const isActive = month.getMonth() === dateCursor.getMonth();
              return (
                <Link
                  key={month.toISOString()}
                  href={calendarHref(month)}
                  className={`rounded-xl px-3 py-2 text-sm capitalize transition ${
                    isActive
                      ? "font-semibold text-[var(--complement-800)]"
                      : "text-[var(--complement-900)] hover:text-[var(--complement-700)]"
                  }`}
                >
                  {month.toLocaleDateString("es-AR", { month: "long" })}
                </Link>
              );
            })}
          </div>
        </aside>

        <div className="min-w-0 border-b-[2.5px] border-[var(--complement-800)] lg:border-r-[2.5px] lg:border-b-0">
          <div className="flex min-h-[76px] items-center justify-center border-b-[2.5px] border-white/80 bg-[var(--complement-800)] px-5 py-5">
            <div className="flex items-center gap-6">
              <Link
                href={calendarHref(addMonths(dateCursor, -1))}
                className="text-3xl font-bold leading-none text-white transition hover:text-[var(--complement-500)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                aria-label="Ver mes anterior"
              >
                &larr;
              </Link>
              <h2 className="text-2xl font-semibold capitalize text-white">
                {monthLabel}
              </h2>
              <Link
                href={calendarHref(addMonths(dateCursor, 1))}
                className="text-3xl font-bold leading-none text-white transition hover:text-[var(--complement-500)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                aria-label="Ver mes siguiente"
              >
                &rarr;
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-7">
            {weekDays.map((day) => (
              <div
                key={day}
                className="px-1 py-3 text-center text-xs font-semibold text-[var(--complement-800)]"
              >
                {day}
              </div>
            ))}
            {days.map((day, index) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-20 md:min-h-24"
                  />
                );
              }

              const dayEvents = events.filter((event) =>
                isSameDay(new Date(event.startsAt), day),
              );
              const isSelected = selected ? isSameDay(day, selected) : false;

              return (
                <Link
                  key={day.toISOString()}
                  href={calendarHref(dateCursor, day)}
                  className={`flex min-h-20 flex-col items-center justify-center gap-2 p-2 transition hover:text-[var(--complement-700)] md:min-h-24 ${
                    isSelected ? "text-[var(--complement-800)]" : ""
                  }`}
                >
                  <span
                    className={`inline-flex size-10 items-center justify-center rounded-full text-sm ${
                      isSelected
                        ? "bg-[var(--complement-800)] font-semibold text-white"
                        : "text-[var(--complement-900)]"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {dayEvents.length ? (
                    <span className="flex flex-wrap gap-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <span
                          key={event.id}
                          className="size-1.5 rounded-full border-[2.5px] border-[var(--orange-500)]"
                        />
                      ))}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="min-w-0 bg-[#fbfaf4]">
          <div className="min-h-[76px] border-b-[2.5px] border-white/80 bg-[var(--complement-800)]" />
          <div className="p-5">
            <p className="text-sm font-semibold capitalize text-[var(--complement-800)]">
              {selected
                ? selected.toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "long",
                  })
                : `Eventos de ${monthLabel}`}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--complement-900)]">
              {selected ? "Eventos del dia" : "Proximos eventos"}
            </h2>
            <div className="mt-5 max-h-[31rem] space-y-4 overflow-y-auto pr-2 [scrollbar-color:var(--complement-700)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--complement-700)]">
              {selectedEvents.length ? (
                selectedEvents.map((event) => {
                  const startsAt = new Date(event.startsAt);
                  const endsAt = new Date(event.endsAt);
                  return (
                    <article
                      key={event.id}
                      className="border-b-[2.5px] border-[var(--complement-800)] pb-4 last:border-b-0"
                    >
                      <h3 className="text-base font-semibold leading-tight text-[var(--complement-900)]">
                        {event.title}
                      </h3>
                      <p className="mt-2 text-sm text-black/65">
                        {startsAt.toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        · {formatTime(startsAt, endsAt)}
                      </p>
                      {event.location ? (
                        <p className="mt-1 text-sm text-black/65">
                          {event.location}
                        </p>
                      ) : null}
                    </article>
                  );
                })
              ) : (
                <p className="text-sm text-black/60">
                  No hay eventos para este periodo.
                </p>
              )}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
