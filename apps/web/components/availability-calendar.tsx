"use client";

import {
  AVAILABILITY_UNKNOWN_MESSAGE,
  availabilityLabels,
  availabilityStatuses,
  dayStatus,
  easternDateKey,
  formatDate,
  formatTime,
  monthGrid,
  type AvailabilitySlot,
  type AvailabilityStatus,
} from "@cric-atlas/domain";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const MONTHS_AHEAD = 3;
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayClass: Record<AvailabilityStatus, string> = {
  verified_available: "bg-green-600 text-white hover:bg-green-700",
  limited: "bg-orange-200 text-orange-950 hover:bg-orange-300",
  verified_unavailable: "bg-red-600 text-white hover:bg-red-700",
  unknown: "bg-slate-100 text-slate-700 hover:bg-slate-200",
};
const dotClass: Record<AvailabilityStatus, string> = {
  verified_available: "bg-green-600",
  limited: "bg-orange-300",
  verified_unavailable: "bg-red-600",
  unknown: "bg-slate-300",
};

const longDate = (key: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(`${key}T12:00:00Z`));

export function AvailabilityCalendar({ slots, todayKey, permitHref }: { slots: AvailabilitySlot[]; todayKey: string; permitHref: string }) {
  const startYear = Number(todayKey.slice(0, 4));
  const startMonth = Number(todayKey.slice(5, 7)) - 1;
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(todayKey);
  const byDay = useMemo(() => {
    const days = new Map<string, AvailabilitySlot[]>();
    for (const slot of slots) {
      const key = easternDateKey(slot.start_datetime);
      days.set(key, [...(days.get(key) ?? []), slot]);
    }
    return days;
  }, [slots]);

  const monthDate = new Date(Date.UTC(startYear, startMonth + offset, 1));
  const monthLabel = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", year: "numeric" }).format(monthDate);
  const cells = monthGrid(monthDate.getUTCFullYear(), monthDate.getUTCMonth());
  const selectedSlots = byDay.get(selected) ?? [];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <section aria-label="Availability calendar" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        {slots.length === 0 && (
          <p role="status" className="mb-4 rounded-xl bg-slate-100 p-3 text-sm font-medium text-slate-800">{AVAILABILITY_UNKNOWN_MESSAGE}</p>
        )}
        <div className="flex items-center justify-between">
          <button type="button" aria-label="Previous month" disabled={offset === 0} onClick={() => setOffset(offset - 1)} className="grid size-11 place-items-center rounded-lg hover:bg-slate-100 disabled:opacity-30">
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <h2 aria-live="polite" className="text-lg font-bold">{monthLabel}</h2>
          <button type="button" aria-label="Next month" disabled={offset === MONTHS_AHEAD} onClick={() => setOffset(offset + 1)} className="grid size-11 place-items-center rounded-lg hover:bg-slate-100 disabled:opacity-30">
            <ChevronRight aria-hidden className="size-5" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-600">
          {weekdays.map((day) => <div key={day}>{day}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((key, index) => {
            if (!key) return <div key={`blank-${index}`} />;
            const past = key < todayKey;
            const status = past ? "unknown" : dayStatus(byDay.get(key) ?? []);
            return (
              <button
                key={key}
                type="button"
                disabled={past}
                aria-pressed={selected === key}
                aria-label={`${longDate(key)}: ${availabilityLabels[status]}`}
                onClick={() => setSelected(key)}
                className={`aspect-square min-h-10 rounded-lg text-sm font-semibold disabled:bg-transparent disabled:text-slate-300 ${dayClass[status]} ${selected === key ? "ring-2 ring-navy-950 ring-offset-2" : ""}`}
              >
                {Number(key.slice(8))}
              </button>
            );
          })}
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-700">
          {availabilityStatuses.map((status) => (
            <li key={status} className="flex items-center gap-1.5"><span className={`size-3 rounded-sm ${dotClass[status]}`} /> {availabilityLabels[status]}</li>
          ))}
        </ul>
      </section>

      <section aria-live="polite" aria-label="Selected date" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-lg font-bold">{longDate(selected)}</h2>
        {selectedSlots.length === 0 ? (
          <p className="mt-3 text-slate-700">{AVAILABILITY_UNKNOWN_MESSAGE}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {selectedSlots.map((slot) => (
              <li key={slot.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                  <span>{formatTime(slot.start_datetime)} to {formatTime(slot.end_datetime)} ET</span>
                  <span className="flex items-center gap-1.5"><span className={`size-3 rounded-sm ${dotClass[slot.availability_status]}`} />{availabilityLabels[slot.availability_status]}</span>
                </div>
                <p className="mt-2 text-slate-600">Last checked: {formatDate(slot.last_checked_at)}</p>
                <p className="text-slate-600">
                  Evidence:{" "}
                  {slot.source?.source_url ? (
                    <a href={slot.source.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-action-600 hover:underline">
                      {slot.source.source_name} <ExternalLink aria-hidden className="size-3" />
                    </a>
                  ) : (slot.source?.source_name ?? "Not yet verified")}
                </p>
              </li>
            ))}
          </ul>
        )}
        <Link href={permitHref} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-action-600 px-4 font-semibold text-white hover:bg-blue-800">
          View Permit Information
        </Link>
      </section>
    </div>
  );
}
