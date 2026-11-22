import type { ReactNode } from "react";
import { HeroScene } from "./scenes";

export function Hero({ children }: { children?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden px-4 pt-10 pb-14 text-center text-white sm:pt-12 sm:pb-20">
      <HeroScene />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-navy-950/50 via-navy-950/25 to-transparent" />
      <div className="relative mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold tracking-tight text-balance drop-shadow-lg sm:text-6xl">
          Find Cricket Grounds.
          <span className="block"><span className="text-pitch-400">Check Permits. Apply</span> with Confidence.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white drop-shadow sm:text-xl">
          Discover cricket grounds, understand permit requirements, and apply through official local park systems.
        </p>
        {children}
      </div>
    </section>
  );
}
