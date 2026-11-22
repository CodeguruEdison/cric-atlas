import { easternDateKey } from "@cric-atlas/domain";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { loadGround } from "@/lib/grounds";

export const revalidate = 60;

export default async function GroundAvailabilityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ground = await loadGround(slug);
  return <AvailabilityCalendar slots={ground.slots} todayKey={easternDateKey(new Date())} permitHref={`/grounds/${ground.slug}/permits`} />;
}
