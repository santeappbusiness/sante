import type { Metadata } from "next";
import "./globals.css";

/**
 * Where this copy of Santé lives.
 *
 * Next resolves the Open Graph and Twitter image paths against this. Without
 * it every share card pointed at http://localhost:3000/opengraph-image, which
 * renders a link with no preview at all anywhere it is posted — the one place
 * a wellness app being passed between people cannot afford to look broken.
 *
 * Production keeps the stable domain rather than VERCEL_URL, because that
 * variable is the per-deployment hostname and would change the canonical URL
 * on every push. Preview builds use their own hostname so their cards show
 * that build rather than production's.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_ENV === "production"
    ? "https://sante-chi.vercel.app"
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Santé — a women's wellness app that adapts to the day you are having",
  description:
    "Santé is a women's wellness app that adapts a woman's planned movement to the energy, discomfort, mood and sensory load she has today. A twenty-second check-in, no wearable, no guilt.",
  openGraph: {
    title: "Santé — a women's wellness app that adapts to the day you are having",
    description:
      "Built for women. A twenty-second check-in, and today's session fits the capacity she actually has.",
    type: "website",
    url: siteUrl,
    siteName: "Santé",
  },
  alternates: { canonical: "/" },
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
