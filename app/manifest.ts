import type { MetadataRoute } from "next";
import { LOGO_BG } from "@/lib/logo-path";

// Saved to a phone's home screen, the app opens at "/" (which sends a signed-in
// account to its home page) rather than whichever page it was saved from.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vintage Associates Trade",
    short_name: "VA Trade",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: LOGO_BG,
    theme_color: "#121416",
    icons: [{ src: "/apple-icon", sizes: "180x180", type: "image/png" }],
  };
}
