"use client";

export default function GroundError({ reset }: { reset: () => void }) {
  return (
    <main role="alert" className="grid min-h-[60vh] place-items-center bg-slate-50 px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold">This ground could not be loaded</h1>
        <button type="button" onClick={reset} className="mt-4 min-h-11 rounded-lg bg-action-600 px-5 font-semibold text-white">Try again</button>
      </div>
    </main>
  );
}
