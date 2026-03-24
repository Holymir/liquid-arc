import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import { Syne } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { PortfolioCacheProvider } from "@/components/providers/PortfolioCacheProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
  title: "LiquidArc",
  description: "Track your DeFi portfolio across chains",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} font-[family-name:var(--font-geist-sans)] antialiased`}
        style={{ color: "#dae3f1", background: "#0a141d" }}
      >
        <Suspense>
          <RouteProgress />
        </Suspense>
        <SessionProvider>
          <ErrorBoundary>
            <PortfolioCacheProvider>{children}</PortfolioCacheProvider>
          </ErrorBoundary>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
