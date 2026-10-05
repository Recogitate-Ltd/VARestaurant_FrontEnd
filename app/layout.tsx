import type { Metadata, Viewport } from "next";
import CellarVideo from "@/components/CellarVideo";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Vintage Associates Trade",
    template: "%s · Vintage Associates Trade",
  },
  description: "Wine ordering for restaurants on 30-day account terms. All prices include VAT.",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#121416",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Work+Sans:wght@300;400;500;600&display=swap"
        />
      </head>
      <body className="relative min-h-screen flex flex-col font-sans">
        <CellarVideo />
        <Providers>
          <Header />
          {/* Leave a short band of cellar video under the header; the page
              heading then sits over the video's darker lower half as it fades
              into the page (~30vh down, less the header's height). */}
          <div aria-hidden className="h-[max(2rem,calc(26vh-4rem))] lg:h-[max(3rem,calc(30vh-88px))] shrink-0" />
          <div className="relative z-10 flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
