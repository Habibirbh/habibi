import type { Metadata } from "next";
import { Manrope, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { SiteProvider } from "@/components/site/SiteProvider";
import { Web3Provider } from "@/components/web3/Web3Provider";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://habibi.example"),
  title: {
    default: "Habibi — Own a piece of the UAE",
    template: "%s — Habibi",
  },
  description:
    "Fractional access to curated UAE real estate. Discover properties across Dubai and the Emirates, participate fractionally, and manage your holdings in one transparent platform built for Robinhood Chain.",
  keywords: [
    "UAE real estate",
    "fractional real estate",
    "Dubai property",
    "Robinhood Chain",
    "real world assets",
  ],
  openGraph: {
    title: "Habibi — Own a piece of the UAE",
    description:
      "Fractional access to curated UAE real estate, built for a modern onchain world.",
    type: "website",
  },
};

import { IntelligenceProvider } from "@/components/intelligence/IntelligenceProvider";
import { HabibiAssistantDrawer } from "@/components/intelligence/HabibiAssistantDrawer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${instrumentSerif.variable}`}
    >
      <body className="antialiased">
        <SiteProvider>
          <Web3Provider>
            <IntelligenceProvider>
              {children}
              <HabibiAssistantDrawer />
            </IntelligenceProvider>
          </Web3Provider>
        </SiteProvider>
      </body>
    </html>
  );
}
