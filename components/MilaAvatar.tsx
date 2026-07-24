"use client";

// MiLa's avatar. Uses a real portrait when one exists at /mila-avatar.jpg
// (drop your image there — public/mila-avatar.jpg — and it appears everywhere),
// otherwise falls back to a warm on-brand illustrated mark so she never looks
// cold. Swapping the photo is a one-file change; no code edits needed.

import { useState } from "react";

export default function MilaAvatar({ size = 40, ring = false }: { size?: number; ring?: boolean }) {
  const [imgOk, setImgOk] = useState(true);
  const src = "https://images.mlrecloud.com/site/livemodern/mila-avatar.jpg?v=2";

  return (
    <span
      style={{
        width: size, height: size, borderRadius: "50%", overflow: "hidden",
        display: "inline-block", flex: "none", position: "relative",
        boxShadow: ring ? "0 0 0 2px #fff, 0 0 0 3px var(--accent)" : undefined,
        background: "linear-gradient(135deg, #0d173b 0%, #00b2cc 120%)",
      }}
      aria-hidden
    >
      {imgOk ? (
        // Real photo if present; onError falls back to the illustration below.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          onError={() => setImgOk(false)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <MilaMark size={size} />
      )}
    </span>
  );
}

// On-brand fallback illustration — a warm, stylized silhouette in the navy→teal
// gradient with a soft highlight. Clearly an avatar, never mistaken for a photo.
function MilaMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="milaBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d173b" />
          <stop offset="100%" stopColor="#00b2cc" />
        </linearGradient>
        <radialGradient id="milaGlow" cx="50%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#milaBg)" />
      <rect width="100" height="100" fill="url(#milaGlow)" />
      {/* soft head + shoulders silhouette */}
      <circle cx="50" cy="40" r="16" fill="#ffffff" fillOpacity="0.92" />
      <path d="M22 82c0-15.5 12.5-26 28-26s28 10.5 28 26v4H22v-4z" fill="#ffffff" fillOpacity="0.92" />
    </svg>
  );
}
