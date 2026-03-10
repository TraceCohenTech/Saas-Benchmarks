import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
  title: "SaaS Valuation Benchmarks — 73 Public Tech Companies",
  description:
    "Track EV/Revenue compression, Rule of 40, margin expansion, and stock returns across 73 public technology companies.",
  openGraph: {
    title: "SaaS Valuation Benchmarks — 73 Public Tech Companies",
    description:
      "Track EV/Revenue compression, Rule of 40, margin expansion, and stock returns across 73 public technology companies.",
    type: "website",
    siteName: "SaaS Valuation Benchmarks",
  },
  twitter: {
    card: "summary_large_image",
    title: "SaaS Valuation Benchmarks — 73 Public Tech Companies",
    description:
      "Track EV/Revenue compression, Rule of 40, margin expansion, and stock returns across 73 public technology companies.",
    creator: "@Trace_Cohen",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#09090b" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
