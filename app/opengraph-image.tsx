import { ImageResponse } from "next/og";
import { LOGO_BG, LOGO_FILL, LOGO_PATH, LOGO_VIEWBOX } from "@/lib/logo-path";

// Link-preview image (WhatsApp, iMessage, Slack, etc). Without one, apps fall
// back to the favicon and upscale it, which looks pixelated. WhatsApp shrinks
// this to a ~100px square thumbnail and compresses it hard, so it's square and
// the monogram fills most of the frame: thin strokes survive the downscale.
export const runtime = "edge";
export const alt = "Vintage Associates Trade";
export const size = { width: 1200, height: 1200 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
        <svg width="920" height="748" viewBox={LOGO_VIEWBOX}>
          <path fill={LOGO_FILL} d={LOGO_PATH} />
        </svg>
      </div>
    ),
    size,
  );
}
