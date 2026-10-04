import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ensureDbInitialized } from "@/lib/db-init";
import JsonLd from "@/app/components/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MMSTR — Practice 'That's Right' Negotiation Online",
    template: "%s | MMSTR",
  },
  description:
    "The only app that lets you live-practice Chris Voss's 'That's Right' technique with real people. Turn-based discussions that enforce comprehension before rebuttal — based on Never Split the Difference.",
  keywords: [
    "Chris Voss",
    "Never Split the Difference",
    "That's Right",
    "negotiation practice",
    "negotiation training",
    "FBI negotiation",
    "tactical empathy",
    "mirroring technique",
    "active listening",
    "negotiation skills",
    "online negotiation practice",
    "live negotiation",
  ],
  authors: [{ name: "Jordan Christley" }],
  creator: "Jordan Christley",
  metadataBase: new URL("https://mmstr.jordanchristley.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mmstr.jordanchristley.com",
    siteName: "MMSTR",
    title: "MMSTR — Practice 'That's Right' Negotiation Online",
    description:
      "The only app that lets you live-practice Chris Voss's 'That's Right' technique with real people. Based on Never Split the Difference.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "MMSTR — Make Me Say That's Right",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MMSTR — Practice 'That's Right' Negotiation Online",
    description:
      "The only app that lets you live-practice Chris Voss's 'That's Right' technique with real people.",
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://mmstr.jordanchristley.com",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize database on server startup
  await ensureDbInitialized();
  
  return (
    <html lang="en">
      <head>
        <JsonLd />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
