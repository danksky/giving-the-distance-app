import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

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
  title: "Giving the Distance - Turn Every Mile Into Meaningful Impact",
  description:
    "Connect your Strava account and create sponsorships where sponsors pay per mile or kilometer you run. Turn your athletic achievements into charitable donations.",
  keywords: [
    "strava",
    "running",
    "charity",
    "sponsorship",
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
    description: "Turn every mile into meaningful impact",
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
        {children}
        <Footer />
      </body>
    </html>
  );
}
