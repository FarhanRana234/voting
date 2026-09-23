"use client";

import { useMemo } from "react";

const FLOWER_COLORS = {
  pink: "#e8a0ab",
  rose: "#d16b82",
  sage: "#5c6e4a",
  cream: "#fdf2ec",
  gold: "#d9a441",
};

export function FlowerCorner({
  variant = "top-left",
  className = "",
}: {
  variant?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top" | "bottom";
  className?: string;
}) {
  const rotate = { "top-left": "rotate-0", "top-right": "rotate-90", "bottom-left": "-rotate-90", "bottom-right": "rotate-180", top: "rotate-0", bottom: "rotate-180" }[variant];

  return (
    <svg viewBox="0 0 200 200" className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <g className={`origin-center ${rotate}`}>
        <g opacity="0.9">
          <path
            d="M58 150c-6-34 6-64 34-76 28 4 44 28 40 60-26 18-52 20-74 16Z"
            fill={FLOWER_COLORS.sage}
            opacity="0.5"
          />
          <ellipse cx="60" cy="96" rx="34" ry="16" fill={FLOWER_COLORS.sage} opacity="0.75" transform="rotate(-36 60 96)" />
          <ellipse cx="104" cy="92" rx="32" ry="13" fill="#6d8258" opacity="0.8" transform="rotate(28 104 92)" />
        </g>

        <g transform="translate(96 74)">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse
              key={a}
              cx="0"
              cy="-20"
              rx="10"
              ry="20"
              fill={a % 120 === 0 ? FLOWER_COLORS.rose : FLOWER_COLORS.pink}
              opacity="0.9"
              transform={`rotate(${a})`}
            />
          ))}
          <circle r="9" fill={FLOWER_COLORS.gold} />
          <circle r="4" fill="#f7d98a" />
        </g>

        <g transform="translate(56 128) scale(0.72)">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-17" rx="8" ry="16" fill="#f2c3cc" opacity="0.95" transform={`rotate(${a})`} />
          ))}
          <circle r="7" fill={FLOWER_COLORS.gold} opacity="0.9" />
        </g>

        <g transform="translate(132 120) scale(0.6)">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-17" rx="8" ry="16" fill={FLOWER_COLORS.rose} opacity="0.85" transform={`rotate(${a})`} />
          ))}
          <circle r="7" fill={FLOWER_COLORS.gold} opacity="0.9" />
        </g>
      </g>
    </svg>
  );
}

export function FloralDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-blossom-rose ${className}`} aria-hidden="true">
      <span className="h-px w-12 bg-blossom-rose/40" />
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M12 21s-6.7-4.35-9.3-8.2C.7 9.8 1.9 6.5 4.6 5.5c1.8-.65 3.9-.1 5.1 1.3.6.7 1.1 1.4 2.3 1.4s1.7-.7 2.3-1.4c1.2-1.4 3.3-1.95 5.1-1.3 2.7 1 3.9 4.3 2.3 7.3C18.7 16.65 12 21 12 21Z" />
      </svg>
      <span className="text-blossom-gold text-base leading-none">✦</span>
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M12 21s-6.7-4.35-9.3-8.2C.7 9.8 1.9 6.5 4.6 5.5c1.8-.65 3.9-.1 5.1 1.3.6.7 1.1 1.4 2.3 1.4s1.7-.7 2.3-1.4c1.2-1.4 3.3-1.95 5.1-1.3 2.7 1 3.9 4.3 2.3 7.3C18.7 16.65 12 21 12 21Z" />
      </svg>
      <span className="h-px w-12 bg-blossom-rose/40" />
    </div>
  );
}

export function RibbonBanner({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto my-2 w-fit ${className}`}>
      <span className="absolute -left-4 top-1/2 h-0 w-0 -translate-y-1/2 border-y-[9px] border-r-[14px] border-y-transparent border-r-blossom-gold/80" aria-hidden="true" />
      <span className="absolute -right-4 top-1/2 h-0 w-0 -translate-y-1/2 border-y-[9px] border-l-[14px] border-y-transparent border-l-blossom-gold/80" aria-hidden="true" />
      <div className="rounded-md bg-gradient-to-b from-blossom-sage to-[#485c3a] px-8 py-2 text-center font-display text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-soft">
        {children}
      </div>
    </div>
  );
}

export function CrownBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blossom-rose to-blossom-deeprose text-white shadow-card ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current">
        <path d="M3 7l4 3 5-6 5 6 4-3-2 12H5L3 7Zm4 10h10v2H7v-2Z" />
      </svg>
    </div>
  );
}

const PETAL_COLORS = ["#e8a0ab", "#d16b82", "#d9a441", "#f2c3cc", "#5c6e4a"];

export function PetalBurst({ count = 18 }: { count?: number }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 8;
        const duration = 7 + Math.random() * 8;
        const size = 8 + Math.random() * 10;
        const color = PETAL_COLORS[i % PETAL_COLORS.length];
        return { id: i, left, delay, duration, size, color };
      }),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {petals.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 block animate-petal-fall rounded-full"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            opacity: 0.8,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            borderRadius: "60% 40% 60% 40% / 40% 60% 40% 60%",
          }}
        />
      ))}
    </div>
  );
}

export function ConfettiDots({ count = 26 }: { count?: number }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 6;
        const duration = 6 + Math.random() * 7;
        const size = 5 + Math.random() * 7;
        const color = PETAL_COLORS[i % PETAL_COLORS.length];
        const shape = i % 3;
        return { id: i, left, delay, duration, size, color, shape };
      }),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {dots.map((d) => (
        <span
          key={d.id}
          className="absolute top-0 block animate-petal-fall"
          style={{
            left: `${d.left}%`,
            width: d.size,
            height: d.shape === 1 ? d.size * 0.5 : d.size,
            background: d.color,
            opacity: 0.85,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
            borderRadius: d.shape === 2 ? "50%" : d.shape === 1 ? "1px" : "60% 0 60% 0",
            transform: `rotate(${Math.random() * 180}deg)`,
          }}
        />
      ))}
    </div>
  );
}