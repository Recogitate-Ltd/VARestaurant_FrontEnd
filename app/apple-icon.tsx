import { ImageResponse } from "next/og";
import { LOGO_BG, LOGO_FILL, LOGO_PATH, LOGO_VIEWBOX } from "@/lib/logo-path";

// Home-screen icon on iOS; same gold-on-black treatment as the favicon.
export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        <svg width="124" height="101" viewBox={LOGO_VIEWBOX}>
          <path fill={LOGO_FILL} d={LOGO_PATH} />
        </svg>
      </div>
    ),
    size,
  );
}
