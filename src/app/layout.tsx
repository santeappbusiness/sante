import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Santé — a women's wellness app that adapts to the day you are having",
  description:
    "Santé is a women's wellness app that adapts a woman's planned movement to the energy, discomfort, mood and sensory load she has today. A twenty-second check-in, no wearable, no guilt.",
  openGraph: {
    title: "Santé — a women's wellness app that adapts to the day you are having",
    description:
      "Built for women. A twenty-second check-in, and today's session fits the capacity she actually has.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  themeColor: "#F7F6F2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
