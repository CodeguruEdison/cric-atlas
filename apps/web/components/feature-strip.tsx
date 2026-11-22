import { CalendarDays, CircleCheck, MapPin, ShieldCheck } from "lucide-react";

const features = [
  { icon: MapPin, title: "Discover Grounds", text: "Find cricket grounds with locations and details" },
  { icon: CalendarDays, title: "Check Permits", text: "See permit requirements, status, and availability" },
  { icon: CircleCheck, title: "Apply & Play", text: "Follow the official steps for each authority" },
  { icon: ShieldCheck, title: "Trust the Source", text: "See what is verified and what still needs checking" },
];

export function FeatureStrip() {
  return (
    <section id="how-it-works" aria-label="How it works" className="scroll-mt-4 border-b border-slate-200 bg-white">
      <ul className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-0">
        {features.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className={`flex items-center gap-4 lg:px-6 ${index > 0 ? "lg:border-l lg:border-slate-200" : ""}`}>
            <Icon aria-hidden strokeWidth={1.8} className="size-11 shrink-0 text-pitch-600" />
            <div>
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="text-sm leading-snug text-slate-600">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
