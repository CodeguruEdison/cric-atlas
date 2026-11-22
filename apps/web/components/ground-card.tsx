import {
  cricketStatusLabels,
  formatSlot,
  type CricketStatus,
  type GroundCard as Ground,
  type PermitRequirement,
  permitRequirementLabels,
} from "@cric-atlas/domain";
import { ArrowRight, CalendarDays, CircleCheck, CircleHelp, CircleX, Clock, MapPin, TriangleAlert, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { FieldScene } from "./scenes";

type Tone = "good" | "warn" | "bad" | "unknown";

const toneClass: Record<Tone, string> = {
  good: "bg-green-100 text-green-900",
  warn: "bg-orange-100 text-orange-900",
  bad: "bg-red-100 text-red-900",
  unknown: "bg-slate-100 text-slate-700",
};

const cricketBadge: Record<CricketStatus, { tone: Tone; icon: LucideIcon }> = {
  permitted: { tone: "good", icon: CircleCheck },
  restricted: { tone: "warn", icon: TriangleAlert },
  not_permitted: { tone: "bad", icon: CircleX },
  unverified: { tone: "unknown", icon: CircleHelp },
};

const permitBadge: Record<PermitRequirement, { tone: Tone; icon: LucideIcon }> = {
  required: { tone: "warn", icon: Clock },
  not_required: { tone: "good", icon: CircleCheck },
  unknown: { tone: "unknown", icon: CircleHelp },
};

function Badge({ label, tone, icon: Icon }: { label: string; tone: Tone; icon: LucideIcon }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass[tone]}`}>
      <Icon aria-hidden className="size-4" /> {label}
    </span>
  );
}

export function GroundCard({ ground }: { ground: Ground }) {
  const seed = Number(ground.groundCode.slice(-3));
  return (
    <article className="relative flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200 transition-shadow focus-within:ring-2 focus-within:ring-action-600 hover:shadow-xl">
      <div className="relative h-36">
        <FieldScene seed={seed} />
        {ground.isSample && (
          <span className="absolute top-2 right-2 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950">Sample</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg leading-snug font-bold">
          <Link href={`/grounds/${ground.slug}`} className="outline-none after:absolute after:inset-0">{ground.name}</Link>
        </h3>
        <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-700">
          <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-action-600" />
          {ground.municipality}, {ground.county} County, {ground.state}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge label={cricketStatusLabels[ground.cricketStatus]} {...cricketBadge[ground.cricketStatus]} />
          <Badge label={permitRequirementLabels[ground.permit]} {...permitBadge[ground.permit]} />
        </div>
        <p className="mt-3 flex flex-1 items-end gap-1.5 text-xs text-slate-600">
          <CalendarDays aria-hidden className="size-4 shrink-0" />
          {ground.nextVerifiedSlot ? `Next available: ${formatSlot(ground.nextVerifiedSlot)} ET` : "Availability not yet verified"}
          <ArrowRight aria-hidden className="ml-auto size-5 shrink-0 text-action-600" />
        </p>
      </div>
    </article>
  );
}
