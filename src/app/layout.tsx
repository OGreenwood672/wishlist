import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  DM_Serif_Display,
  Fraunces,
  Geist_Mono,
  Instrument_Sans,
  Instrument_Serif,
  Playfair_Display,
  Space_Grotesk,
  Syne,
} from "next/font/google";
import "./globals.css";

const sans = Instrument_Sans({ variable: "--font-body", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

// Display fonts a theme can pick. Not preloaded: only the active one is used.
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], preload: false });
const dmSerif = DM_Serif_Display({ variable: "--font-dm-serif", subsets: ["latin"], weight: "400", preload: false });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], preload: false });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], preload: false });
const syne = Syne({ variable: "--font-syne", subsets: ["latin"], preload: false });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], preload: false });

export const metadata: Metadata = {
  title: "Wishlist",
  description: "A little list of things I'd love.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const fonts = [sans, mono, instrumentSerif, fraunces, dmSerif, playfair, bricolage, syne, spaceGrotesk]
    .map((f) => f.variable)
    .join(" ");
  return (
    <html lang="en-GB" className={`${fonts} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
