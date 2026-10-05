"use client";

import { useEffect, useRef } from "react";

/*
 * The investment app's My Wine Cellar backdrop (WineApp-mobile
 * components/layout/video-background.tsx, web branch): the my-cellar footage in
 * a band across the top of the window, under a near-black radial vignette that
 * fades to the page colour at its edges, so the header and the top of each page
 * sit over it and content scrolls up onto plain #121416. A poster frame shows
 * while the footage loads (and stays up if autoplay is refused).
 */
export default function CellarVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  // Respect reduced motion: keep the first frame, don't loop the footage.
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => (mq.matches ? video.pause() : video.play().catch(() => {}));
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[-5vh] h-[65vh] overflow-hidden z-0">
      <video
        ref={ref}
        className="h-full w-full object-cover"
        src="/videos/my-cellar.mp4"
        poster="/videos/my-cellar-poster.jpg"
        playsInline
        autoPlay
        loop
        muted
        preload="auto"
        disablePictureInPicture
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(18, 20, 22, 0.8) 0%, #121416 100%)" }}
      />
      {/* Blend the band's bottom edge into the page */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-base" />
    </div>
  );
}
