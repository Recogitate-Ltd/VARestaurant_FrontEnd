"use client";

import clsx from "clsx";
import React, { useCallback, useEffect, useRef } from "react";

/**
 * A signature strip: draw with a mouse, trackpad or finger. Reports the
 * signature as a PNG data URL (dark ink, transparent background), or "" once
 * cleared.
 */
export default function SignaturePad({
  onChange,
  error,
  label,
}: {
  onChange: (dataUrl: string) => void;
  error?: string;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const hasInk = useRef(false);

  // Match the canvas to its on-screen size (and pixel density) so strokes stay crisp.
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const { width, height } = canvas.getBoundingClientRect();
    if (canvas.width === Math.round(width * ratio) && canvas.height === Math.round(height * ratio)) return;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111111";
    // Resizing wipes the canvas, so the signature has to be drawn again.
    if (hasInk.current) {
      hasInk.current = false;
      onChange("");
    }
  }, [onChange]);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
    // A tap leaves a dot.
    const ctx = e.currentTarget.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(last.current.x, last.current.y, 1.1, 0, Math.PI * 2);
    ctx.fillStyle = "#111111";
    ctx.fill();
    hasInk.current = true;
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return;
    const ctx = e.currentTarget.getContext("2d")!;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    if (hasInk.current && canvasRef.current) onChange(canvasRef.current.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
    onChange("");
  };

  return (
    <div>
      <span className="block text-[12px] uppercase tracking-[0.12em] text-ink-soft mb-1.5">
        {label}
        <span className="text-gold"> *</span>
      </span>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        className={clsx(
          "block h-40 w-full cursor-crosshair touch-none rounded-xl border bg-white",
          error ? "border-danger" : "border-white/15"
        )}
      />
      <div className="mt-1.5 flex items-start justify-between gap-4">
        {error ? (
          <span className="text-[12px] text-danger">{error}</span>
        ) : (
          <span className="text-[12px] text-ink-faint">Sign above using your mouse, trackpad or finger.</span>
        )}
        <button type="button" onClick={clear} className="text-[13px] text-gold hover:underline">
          Clear
        </button>
      </div>
    </div>
  );
}
