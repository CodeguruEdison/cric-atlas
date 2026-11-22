import { listGroundCards } from "@cric-atlas/db";
import type { GroundCard } from "@cric-atlas/domain";
import { FeatureStrip } from "@/components/feature-strip";
import { GroundExplorer } from "@/components/ground-explorer";
import { Hero } from "@/components/hero";
import { SiteHeader } from "@/components/site-header";
import { publicClient } from "@/lib/supabase";

export const revalidate = 60;

async function loadGrounds(): Promise<GroundCard[] | null> {
  try {
    return await listGroundCards(publicClient());
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function HomePage() {
  const grounds = await loadGrounds();

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-slate-50">
        {grounds ? (
          <GroundExplorer grounds={grounds} features={<FeatureStrip />} />
        ) : (
          <>
            <Hero />
            <FeatureStrip />
            <div role="alert" className="mx-auto my-10 max-w-xl rounded-2xl bg-white p-8 text-center shadow-lg">
              <h2 className="text-lg font-semibold">Grounds are unavailable right now</h2>
              <p className="mt-2 text-slate-600">Please try again in a few minutes.</p>
            </div>
          </>
        )}
      </main>
    </>
  );
}
