import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import { Syne } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { PortfolioCacheProvider } from "@/components/providers/PortfolioCacheProvider";
import { RouteProgress } from "@/components/layout/RouteProgress";
import { Analytics } from "@vercel/analytics/next";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["700", "800"],
  display: "swap",
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "LiquidArc — DeFi Portfolio Tracker & LP Analytics",
  description:
    "Track DeFi positions, LP fees, and P&L across Base, Ethereum, Solana, Arbitrum & Optimism. Real-time analytics for Aerodrome, Uniswap, Orca, Raydium, Velodrome & Meteora.",
  keywords: [
    "DeFi portfolio tracker",
    "LP analytics",
    "impermanent loss",
    "liquidity pool",
    "Aerodrome",
    "Uniswap V3",
    "Orca",
    "Raydium",
    "Velodrome",
    "Meteora",
    "Base",
    "Solana",
    "yield farming",
  ],
  openGraph: {
    title: "LiquidArc — DeFi Portfolio Tracker & LP Analytics",
    description:
      "Multi-chain DeFi dashboard. Track LP positions, fees earned, emissions, and P&L across 6 protocols and 5 chains.",
    siteName: "LiquidArc",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LiquidArc — DeFi Portfolio Tracker",
    description:
      "Real-time LP analytics across Base, Ethereum, Solana, Arbitrum & Optimism. Fees, P&L, APR — all in one dashboard.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} font-[family-name:var(--font-geist-sans)] antialiased text-slate-200`}
      >
        <Suspense>
          <RouteProgress />
        </Suspense>
        <SessionProvider>
          <PortfolioCacheProvider>{children}</PortfolioCacheProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
