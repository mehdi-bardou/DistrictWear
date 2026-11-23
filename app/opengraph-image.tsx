import { ImageResponse } from "next/og";
import { BRAND_CREAM, BRAND_FOREST } from "@/lib/brand";

export const alt = "DISTRICT WEAR — streetwear from Casablanca";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Static, brand-only card. No fonts are loaded and no data is fetched. */
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: BRAND_FOREST,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "90%",
          height: "84%",
          border: `2px solid ${BRAND_CREAM}`,
          color: BRAND_CREAM,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 108,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1,
            textAlign: "center",
          }}
        >
          DISTRICT WEAR
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 26,
            letterSpacing: 8,
            textAlign: "center",
          }}
        >
          CASABLANCA / MA
        </div>
      </div>
    </div>,
    { ...size },
  );
}
