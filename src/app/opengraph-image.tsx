import { ImageResponse } from "next/og";

/**
 * The link preview.
 *
 * Anywhere the URL gets shared, this is the pitch: the transformation itself,
 * in the brand's colours. Generated rather than designed by hand so it cannot
 * drift out of date with the numbers in the product.
 */

export const runtime = "edge";
export const alt = "Santé — your plan can flex";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 88px",
          background: "#F7F6F2",
          color: "#2F3A33",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#6E7D83",
            fontFamily: "sans-serif",
          }}
        >
          Santé
        </div>

        <div style={{ fontSize: 76, marginTop: 18, lineHeight: 1.05 }}>
          Your plan can flex.
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 34, marginTop: 56 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "26px 34px",
              borderRadius: 22,
              background: "#FFFDF9",
              border: "1px solid rgba(47,58,51,0.12)",
            }}
          >
            <div style={{ fontSize: 20, color: "#6E7D83", fontFamily: "sans-serif" }}>
              Today&apos;s plan
            </div>
            <div style={{ fontSize: 46, marginTop: 6 }}>30 min · moderate</div>
          </div>

          <div style={{ fontSize: 54, color: "#F97C50" }}>→</div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "26px 34px",
              borderRadius: 22,
              background: "rgba(160,168,124,0.25)",
            }}
          >
            <div style={{ fontSize: 20, color: "#6E7D83", fontFamily: "sans-serif" }}>
              Adapted for today
            </div>
            <div style={{ fontSize: 46, marginTop: 6, color: "#5F7D52" }}>12 min · low</div>
          </div>
        </div>

        <div
          style={{
            fontSize: 26,
            marginTop: 54,
            color: "#55635B",
            fontFamily: "sans-serif",
          }}
        >
          A 20-second check-in, not a wearable.
        </div>
      </div>
    ),
    size
  );
}
