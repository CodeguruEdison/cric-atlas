import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="grid min-h-[60vh] place-items-center bg-slate-50 px-4 text-center">
        <div>
          <h1 className="text-3xl font-bold">Ground not found</h1>
          <p className="mt-2 text-slate-600">This page may have moved or is not published.</p>
          <Link href="/#grounds" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-action-600 px-5 font-semibold text-white">Browse grounds</Link>
        </div>
      </main>
    </>
  );
}
