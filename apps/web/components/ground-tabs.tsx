"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function GroundTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/grounds/${slug}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/permits`, label: "Permit" },
    { href: `${base}/availability`, label: "Availability" },
  ];
  return (
    <nav aria-label="Ground sections" className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-12 shrink-0 items-center border-b-2 px-4 text-sm font-semibold ${active ? "border-pitch-600 text-navy-950" : "border-transparent text-slate-600 hover:text-navy-950"}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
