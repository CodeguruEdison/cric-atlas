"use client";

import { CalendarDays, FileCheck, Image as ImageIcon, Landmark, LayoutDashboard, Link2, MapPin, Receipt, ScrollText, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/grounds", label: "Grounds", icon: MapPin },
  { href: "/permits", label: "Permits", icon: FileCheck },
  { href: "/fees", label: "Permit Fees", icon: Receipt },
  { href: "/authorities", label: "Authorities", icon: Landmark },
  { href: "/availability", label: "Availability", icon: CalendarDays },
  { href: "/sources", label: "Sources", icon: ScrollText },
  { href: "/source-links", label: "Source Links", icon: Link2 },
  { href: "/photos", label: "Photos", icon: ImageIcon },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold ${active ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
            <Icon aria-hidden className="size-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
