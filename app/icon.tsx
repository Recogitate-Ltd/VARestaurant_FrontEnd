import { ImageResponse } from "next/og";
import { LOGO_BG, LOGO_FILL, LOGO_PATH, LOGO_VIEWBOX } from "@/lib/logo-path";

// Browser tab icon: gold monogram on the brand background, rendered from the
// vector so it stays sharp at any size.
export const runtime = "edge";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: LOGO_BG,
        }}
      >
        <svg width="48" height="39" viewBox={LOGO_VIEWBOX}>
          <path fill={LOGO_FILL} d={LOGO_PATH} />
        </svg>
      </div>
    ),
    size,
  );
}
