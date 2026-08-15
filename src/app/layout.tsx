import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Santé",
  description:
    "Santé adapts today's wellness plan to today's capacity: a 20-second check-in instead of a wearable.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
