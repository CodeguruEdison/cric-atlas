import {
  cricketStatusLabels,
  dayStatus,
  formatDate,
  formatSlot,
  permitRequirement,
  permitRequirementLabels,
  verificationLabels,
} from "@cric-atlas/domain";
import { ArrowLeft, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { GroundTabs } from "@/components/ground-tabs";
import { FieldScene } from "@/components/scenes";
import { SiteHeader } from "@/components/site-header";
import { loadGround } from "@/lib/grounds";

export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

type Props = { children: ReactNode; params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const ground = await loadGround(slug);
  return {
    title: `${ground.ground_name} | CricketAtlas GroundIQ`,
    description: `Ground, permit and availability information for ${ground.ground_name} in ${ground.municipality}, ${ground.state}.`,
    // Demo records should not be indexed as facts about real parks.
    robots: ground.is_sample ? { index: false, follow: false } : undefined,
  };
}

export default async function GroundLayout({ children, params }: Props) {
  const { slug } = await params;
  const ground = await loadGround(slug);
  const next = ground.slots.find((slot) => dayStatus([slot]) === "verified_available");
  const summary = [
    { label: "Cricket", value: cricketStatusLabels[ground.cricket_status] },
    { label: "Permit", value: permitRequirementLabels[permitRequirement(ground.permits)] },
    { label: "Next available", value: next ? `${formatSlot(next.start_datetime)} ET` : "Not yet verified" },
    { label: "Last verified", value: ground.last_verified_at ? formatDate(ground.last_verified_at) : verificationLabels[ground.verification_status] },
  ];

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-slate-50">
        <section className="relative isolate overflow-hidden text-white">
          <div className="absolute inset-0 -z-10"><FieldScene seed={Number(ground.ground_code.slice(-3))} /></div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950/90 via-navy-950/70 to-navy-950/40" />
          <div className="w-full px-4 py-8 sm:px-6 lg:px-10 2xl:px-16 sm:py-10">
            <Link href="/#grounds" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold hover:underline">
              <ArrowLeft aria-hidden className="size-4" /> All grounds
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold">
              <span>{ground.ground_code}</span>
              {ground.is_sample && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-950">Sample</span>}
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-balance sm:text-5xl">{ground.ground_name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-lg"><MapPin aria-hidden className="size-5 text-pitch-400" />{ground.municipality}, {ground.county} County, {ground.state}</p>
          </div>
        </section>
        <div className="border-b border-slate-200 bg-white">
          <dl className="grid w-full grid-cols-2 gap-4 px-4 py-4 sm:px-6 lg:px-10 2xl:px-16 lg:grid-cols-4">
            {summary.map((item) => (
              <div key={item.label}>
                <dt className="text-xs font-medium text-slate-600">{item.label}</dt>
                <dd className="text-sm font-bold">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <GroundTabs slug={ground.slug} />
        <div className="w-full px-4 py-6 sm:px-6 lg:px-10 2xl:px-16 sm:py-8">{children}</div>
      </main>
    </>
  );
}
