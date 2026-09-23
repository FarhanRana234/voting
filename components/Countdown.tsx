"use client";

import { useEffect, useState } from "react";

function diff(endsAt: number, now: number) {
  const total = Math.max(0, endsAt - now);
  const days = Math.floor(total / 86_400_000);
  const hours = Math.floor((total % 86_400_000) / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);
  return { days, hours, minutes, seconds, done: total <= 0 };
}

export default function Countdown({ endsAt }: { endsAt: number }) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { days, hours, minutes, seconds, done } = diff(endsAt, now);

  if (done) return null;

  const parts = [
    { label: "d", value: days },
    { label: "h", value: hours },
    { label: "m", value: minutes },
    { label: "s", value: seconds },
  ];

  return (
    <div className="mx-auto flex w-fit items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 text-sm font-bold text-blossom-deeprose shadow-soft backdrop-blur">
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M12 2 4.5 20.3l7.5-4.3 7.5 4.3L12 2Z" />
      </svg>
      <span className="mr-1 font-semibold text-blossom-ink">Voting closes in</span>
      {parts.map((p, i) => (
        <span key={p.label} className="inline-flex items-baseline">
          <span className="tabular-nums">{String(p.value).padStart(2, "0")}</span>
          <span className="ml-0.5 text-xs font-bold text-blossom-rose">{p.label}</span>
          {i < parts.length - 1 && <span className="mx-1 text-blossom-ink/40">·</span>}
        </span>
      ))}
    </div>
  );
}