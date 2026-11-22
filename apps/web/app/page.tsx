export default function HomePage() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center bg-navy-950 px-4 text-center text-white">
      <p className="font-semibold text-pitch-400">CricketAtlas GroundIQ</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
        Find Cricket Grounds. <span className="text-pitch-400">Check Permits.</span> Apply with Confidence.
      </h1>
      <p className="mt-5 max-w-xl text-lg text-slate-200">Ground and permit information for Somerset County, New Jersey.</p>
    </main>
  );
}
