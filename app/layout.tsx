import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Footer from "@/components/Footer";
import PauseBanner from "@/components/PauseBanner";

function getMetadataBase(): URL {
  const configured =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    (process.env.VERCEL_URL?.trim()
      ? `https://${process.env.VERCEL_URL.trim()}`
      : "");

  const withProtocol = configured.startsWith("http")
    ? configured
    : configured
      ? `https://${configured}`
      : "http://localhost:3000";

  return new URL(withProtocol.replace(/\/+$/, ""));
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: "900",
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "Giving the Distance - Turn Every Mile Into Meaningful Impact",
  description:
    "Connect your Strava account and create donations where donors pay per mile or kilometer you run. Giving the Distance is currently focused on the New York City community as it grows.",
  keywords: [
    "strava",
    "running",
    "charity",
    "donations",
    "athletics",
    "fundraising",
  ],
  authors: [{ name: "Giving the Distance" }],
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Giving the Distance",
    description:
      "Turn every mile into meaningful impact in a platform currently focused on the New York City community.",
    type: "website",
    images: [
      {
        url: "/icon.png",
        width: 800,
        height: 800,
        alt: "Giving the Distance",
      },
    ],
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
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased flex flex-col min-h-screen`}
      >
        <PauseBanner />
        {children}
        <Footer />
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="78436e7b-dd0f-4ef5-98f1-c2932de45427"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
