"use client";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-bold">This page could not be loaded</h1>
      <button type="button" onClick={reset} className="mt-4 h-11 rounded-lg bg-action-600 px-5 font-semibold text-white">Try again</button>
    </div>
  );
}
