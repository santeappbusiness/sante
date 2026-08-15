import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Santé — your plan can flex",
  description:
    "Santé adapts today's movement plan to the capacity you actually have, from a 20-second check-in. No wearable, no guilt.",
  openGraph: {
    title: "Santé — your plan can flex",
    description:
      "A 20-second check-in, and today's session adapts to the capacity you actually have.",
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
