import Link from "next/link";

export default function SiteHeader({
  variant = "hero",
  backHref,
  backLabel = "All categories",
}: {
  variant?: "hero" | "compact";
  backHref?: string;
  backLabel?: string;
}) {
  if (variant === "compact") {
    return (
      <header className="mx-auto max-w-2xl px-6 pb-2 pt-12 text-center sm:pt-16">
        {backHref && (
          <Link
            href={backHref}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blossom-sage shadow-soft backdrop-blur transition hover:-translate-x-0.5"
          >
            ← {backLabel}
          </Link>
        )}
        <p className="font-script text-4xl text-blossom-rose sm:text-5xl">Blossom Events</p>
        <p className="mt-2 font-display text-sm font-semibold uppercase tracking-[0.3em] text-blossom-deeprose">
          Tando Adam · Eat Festival
        </p>
      </header>
    );
  }

  return (
    <header className="mx-auto max-w-2xl px-6 pb-8 pt-16 text-center sm:pt-20">
      <p className="font-script text-4xl text-blossom-rose sm:text-5xl">Blossom Events</p>

      <h1 className="mt-4 font-display font-bold uppercase leading-none tracking-wide">
        <span className="relative inline-block px-2">
          <span
            className="absolute inset-x-0 top-1/2 -z-10 mx-auto block h-16 -translate-y-1/2 -rotate-1 rounded-[2rem] bg-blossom-blush/45 sm:h-24"
            aria-hidden="true"
          />
          <span className="text-5xl text-blossom-deeprose sm:text-7xl">Eat</span>
          <span className="text-5xl text-blossom-sage sm:text-7xl"> Festival</span>
        </span>
        <svg viewBox="0 0 220 18" className="mx-auto mt-2 h-4 w-56 sm:h-5 sm:w-72" aria-hidden="true">
          <path d="M4 12 C 60 4, 120 18, 216 8" fill="none" stroke="#d9a441" strokeWidth="5" strokeLinecap="round" />
          <circle cx="216" cy="8" r="5" fill="#d16b82" />
        </svg>
      </h1>

      <p className="mt-6 font-body text-xs font-semibold uppercase tracking-[0.25em] text-blossom-sage sm:text-sm">
        Tando Adam · Vote for your favorites 🌸
      </p>
    </header>
  );
}