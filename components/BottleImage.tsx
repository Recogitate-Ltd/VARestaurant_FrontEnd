"use client";

import clsx from "clsx";
import React, { useState } from "react";
import { typeColour } from "@/lib/format";

/**
 * Product photo. Wines fall back to a drawn bottle in the wine's colour;
 * accessories (`type="accessory"`) to a drawn wine glass.
 */
export default function BottleImage({
  src,
  alt,
  type,
  className,
  eager = false,
}: {
  src: string | null;
  alt: string;
  type: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if ((!src || failed) && type === "accessory") {
    return (
      <div className={clsx("flex items-center justify-center", className)} aria-label={alt} role="img">
        <svg viewBox="0 0 80 160" className="h-[78%] w-auto" fill="none" stroke="#B39C82" strokeWidth="2.2">
          <path d="M18 8h44c2 22 2 40-6 52-5 7-10 10-16 11-6-1-11-4-16-11-8-12-8-30-6-52z" />
          <path d="M20 34c12 4 28 4 40 0" opacity="0.6" />
          <path d="M40 71v66" />
          <path d="M20 148c6-7 34-7 40 0" />
          <path d="M18 150h44" />
        </svg>
      </div>
    );
  }
  if (!src || failed) {
    const colour = typeColour(type);
    return (
      <div className={clsx("flex items-center justify-center", className)} aria-label={alt} role="img">
        <svg viewBox="0 0 60 200" className="h-[88%] w-auto drop-shadow-sm">
          <path
            d="M24 6h12v46c0 8 14 16 14 34v104a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6V86c0-18 14-26 14-34z"
            fill={colour}
            opacity="0.92"
          />
          <rect x="22" y="2" width="16" height="16" rx="2" fill="#C4AD93" />
          <rect x="14" y="112" width="32" height="44" rx="2" fill="#F2EDE6" opacity="0.9" />
          <rect x="19" y="124" width="22" height="2" fill="#C4AD93" />
          <rect x="21" y="132" width="18" height="2" fill="#C4AD93" opacity="0.7" />
        </svg>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={clsx("object-contain", className)}
    />
  );
}
