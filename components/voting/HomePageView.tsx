"use client";

import Link from "next/link";
import { FlowerCorner } from "@/components/decor";
import SiteHeader from "@/components/SiteHeader";
import Countdown from "@/components/Countdown";
import type { CategoryWithParticipants } from "@/lib/types";

interface Props {
  votingEndsAt: number | null;
  categories: CategoryWithParticipants[];
}

export default function HomePageView({ votingEndsAt, categories }: Props) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="relative z-10">
        <FlowerCorner variant="top-left" className="absolute left-0 top-0 w-32 opacity-80 sm:w-44" />
        <FlowerCorner variant="top-right" className="absolute right-0 top-0 w-28 opacity-70 sm:w-40" />

        <SiteHeader variant="hero" />

        {votingEndsAt != null && (
          <div className="mx-auto max-w-2xl px-6">
            <Countdown endsAt={votingEndsAt} />
          </div>
        )}

        <section className="mx-auto max-w-2xl px-6 pb-24 pt-8">
          <p className="mb-5 text-center font-display text-sm font-semibold uppercase tracking-[0.25em] text-blossom-deeprose">
            Pick a category to vote
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            {categories.map((c, i) => (
              <Link
                key={c.id}
                href={`/category/${c.id}`}
                style={{ animationDelay: `${i * 120}ms` }}
                className="group relative flex aspect-[16/10] w-full animate-fade-up items-center justify-center overflow-hidden rounded-plaque shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card focus:outline-none focus:ring-4 focus:ring-blossom-rose/50 active:scale-[0.96] active:duration-100"
              >
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.imageUrl}
                    alt={c.name}
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110 group-active:scale-100"
                  />
                ) : (
                  <div className="pattern-gingham absolute inset-0 bg-blossom-blush/25" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-blossom-deeprose/70 via-blossom-deeprose/10 to-transparent" />

                <div className="relative z-10 flex flex-col items-center gap-3 px-4 text-center">
                  <span className="font-display text-2xl font-bold uppercase leading-tight tracking-wide text-white text-shadow-soft transition group-hover:scale-105 sm:text-3xl">
                    {c.name}
                  </span>
                  <span className="rounded-full bg-white/95 px-5 py-2 text-xs font-bold uppercase tracking-widest text-blossom-deeprose shadow-soft transition group-hover:bg-blossom-rose group-hover:text-white group-active:scale-90">
                    Vote now →
                  </span>
                </div>
              </Link>
            ))}

            {categories.length === 0 && (
              <p className="col-span-full py-16 text-center font-semibold text-blossom-ink/50">
                No categories yet — check back soon.
              </p>
            )}
          </div>
        </section>

        <footer className="relative z-10 bg-blossom-sage/10 py-6 text-center text-xs font-semibold text-blossom-sage">
          <p>Blossom Events · Tando Adam Eat Festival · One vote per category</p>
        </footer>
      </div>
    </main>
  );
}