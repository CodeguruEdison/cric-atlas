import Image from "next/image";
import type { ReactNode } from "react";
import heroImage from "@/public/images/hero-cricket.webp";

export function Hero({ children }: { children?: ReactNode }) {
  return (
    <section className="relative isolate flex w-full items-start overflow-hidden px-4 pt-9 pb-60 text-center text-white sm:pt-11 md:pb-40 lg:min-h-[clamp(480px,33vw,720px)] lg:pb-16">
      {/* Below lg the banner crops by height, so it renders wider than the viewport. */}
      <Image
        src={heroImage}
        alt=""
        fill
        priority
        quality={90}
        sizes="(max-width: 1023px) 1672px, 100vw"
        placeholder="blur"
        className="-z-20 object-cover object-[88%_100%] lg:object-bottom"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-navy-950/65 via-navy-950/30 to-transparent" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_62%_75%_at_50%_34%,rgb(7_26_47/0.5),transparent)]" />
      <div className="relative mx-auto w-full max-w-5xl">
        <h1 className="text-4xl font-bold tracking-tight text-balance drop-shadow-lg sm:text-5xl xl:text-6xl">
          Find Cricket Grounds.
          <span className="block"><span className="text-pitch-400">Check Permits. Apply</span> with Confidence.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white drop-shadow-md sm:text-xl">
          Discover cricket grounds, understand permit requirements, and apply through official local park systems.
        </p>
        {children}
      </div>
    </section>
  );
}
