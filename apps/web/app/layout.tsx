import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cricatlas.us"),
  title: "CricketAtlas GroundIQ",
  description: "Find cricket grounds and check permit requirements in Somerset County, NJ.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body className="bg-white text-navy-950 antialiased">{children}</body></html>;
}
