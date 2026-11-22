import { cricketStatusLabels, facilityStatusLabels, formatDate, verificationLabels } from "@cric-atlas/domain";
import { Navigation } from "lucide-react";
import Link from "next/link";
import { Facts, Panel, SourceList } from "@/components/detail-ui";
import { loadGround } from "@/lib/grounds";

export const revalidate = 60;

export default async function GroundOverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ground = await loadGround(slug);
  const authority = ground.permits.find((permit) => permit.authority)?.authority;
  const destination = ground.address
    ? ground.address
    : !ground.location_is_approximate && ground.latitude !== null
      ? `${ground.latitude},${ground.longitude}`
      : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-5">
        <Panel title="Ground Information">
          <Facts items={[
            { label: "Address", value: ground.address },
            { label: "Parent facility", value: ground.parent_facility },
            { label: "Pitch type", value: ground.pitch_type },
            { label: "Surface", value: ground.surface_type },
            { label: "Boundary size", value: ground.boundary_size },
            { label: "Amenities", value: ground.amenities?.length ? ground.amenities.join(", ") : null },
          ]} />
        </Panel>
        <Panel title="Status">
          <Facts items={[
            { label: "Facility", value: facilityStatusLabels[ground.facility_status] ?? null },
            { label: "Cricket", value: cricketStatusLabels[ground.cricket_status] },
            { label: "Permit authority", value: authority?.authority_name ?? null },
            { label: "Verification", value: verificationLabels[ground.verification_status] },
            { label: "Last verified", value: ground.last_verified_at ? formatDate(ground.last_verified_at) : null },
          ]} />
        </Panel>
      </div>
      <div className="space-y-5">
        <Panel title="Next Steps">
          <div className="grid gap-2">
            <Link href={`/grounds/${ground.slug}/permits`} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-action-600 px-4 font-semibold text-white hover:bg-blue-800">View Permit Details</Link>
            <Link href={`/grounds/${ground.slug}/availability`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 font-semibold hover:bg-slate-50">Check Availability</Link>
            {destination ? (
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 font-semibold hover:bg-slate-50">
                <Navigation aria-hidden className="size-4" /> Get Directions
              </a>
            ) : (
              <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">Directions are unavailable until the exact location is verified.</p>
            )}
          </div>
        </Panel>
        <Panel title="Sources"><SourceList sources={ground.sources} /></Panel>
      </div>
    </div>
  );
}
