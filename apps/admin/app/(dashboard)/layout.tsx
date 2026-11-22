import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin-nav";
import { signOut } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="bg-navy-950 p-3 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:p-4">
        <div className="mb-3 flex items-center justify-between gap-2 px-2 lg:mb-6 lg:block">
          <div className="leading-tight"><p className="text-xs font-semibold">CricketAtlas</p><p className="text-xl font-bold">Ground<span className="text-pitch-400">IQ</span> Admin</p></div>
          <form action={signOut} className="lg:hidden"><button aria-label="Sign out" className="grid size-11 place-items-center rounded-lg hover:bg-white/10"><LogOut aria-hidden className="size-5" /></button></form>
        </div>
        <AdminNav />
        <div className="mt-auto hidden border-t border-white/15 pt-3 lg:block">
          <p className="truncate px-2 text-xs text-slate-300">{user.email}</p>
          <form action={signOut}><button className="mt-1 flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"><LogOut aria-hidden className="size-4" /> Sign out</button></form>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
