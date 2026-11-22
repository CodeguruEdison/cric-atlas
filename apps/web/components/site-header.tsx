import Link from "next/link";

const links = [
  { href: "/#grounds", label: "Find Grounds" },
  { href: "/#how-it-works", label: "How It Works" },
];

export function SiteHeader() {
  return (
    <header className="bg-navy-950 text-white">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="CricketAtlas GroundIQ home">
          <svg aria-hidden viewBox="0 0 32 32" className="size-10">
            <path d="M22 3l7 7-13 13-6 1 1-6z" fill="#84e11d" />
            <path d="M10 23l-6 6" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
            <circle cx="8" cy="9" r="4" fill="#fff" />
          </svg>
          <span className="leading-none">
            <span className="block text-sm font-semibold">CricketAtlas</span>
            <span className="block text-2xl font-bold tracking-tight">Ground<span className="text-pitch-400">IQ</span></span>
          </span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-4">
          {links.map((link, index) => (
            <Link key={link.href} href={link.href} className={`${index > 0 ? "hidden sm:inline-flex" : "inline-flex"} min-h-11 items-center rounded-lg px-3 text-sm font-semibold hover:bg-white/10`}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
