"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FlowerCorner, FloralDivider, RibbonBanner, CrownBadge, PetalBurst, ConfettiDots } from "@/components/decor";
import type { WinnerResult } from "@/lib/types";

interface ResultsPayload {
  open: boolean;
  votingEndsAt?: number | null;
  winners?: WinnerResult[];
}

function formatEndDate(ms: number) {
  return new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function WinnerPhoto({ src, name, winner }: { src?: string | null; name: string; winner?: boolean }) {
  const [errored, setErrored] = useState(false);
  return (
    <div className={`relative ${winner ? "aspect-square w-40 sm:w-52" : "aspect-square w-20 sm:w-28"}`}>
      {src && !errored ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          onError={() => setErrored(true)}
          className={`h-full w-full rounded-2xl object-cover shadow-soft ${winner ? "ring-4 ring-blossom-gold/60" : ""}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-blossom-blush to-blossom-rose shadow-soft">
          <span className="font-script text-5xl text-white text-shadow-soft">{name.charAt(0) || "?"}</span>
        </div>
      )}
    </div>
  );
}

export default function ResultsView({ mode }: { mode: "home" | "results" }) {
  const [data, setData] = useState<ResultsPayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/results");
        const json = await res.json();
        setData(json);
      } catch {
        setError(true);
      }
    })();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <PetalBurst />
      <ConfettiDots />
      <div className="relative z-10">
        <FlowerCorner variant="top-left" className="absolute left-0 top-0 w-32 opacity-80 sm:w-44" />
        <FlowerCorner variant="top-right" className="absolute right-0 top-0 w-28 opacity-70 sm:w-40" />

        <header className="mx-auto max-w-3xl px-6 pb-6 pt-14 text-center sm:pt-20">
          <p className="font-script text-4xl text-blossom-rose sm:text-5xl">Blossom Events</p>
          <h1 className="mt-2 px-2 font-display text-2xl font-bold uppercase leading-tight tracking-wide text-blossom-deeprose sm:text-5xl">
            And the winners are…
          </h1>
          <div className="my-3">
            <RibbonBanner>Tando Adam Eat Festival</RibbonBanner>
          </div>
        </header>

        <FloralDivider className="my-6" />

        <section className="mx-auto max-w-3xl px-6 pb-24">
          {error && (
            <p className="text-center font-semibold text-blossom-ink/60">
              Couldn’t load the results. Please refresh the page.
            </p>
          )}

          {!data && !error && (
            <p className="mt-10 text-center font-semibold text-blossom-sage">Revealing the winners…</p>
          )}

          {data && data.open && (
            <div className="plaque-cream mx-auto mt-8 max-w-md p-8 text-center">
              <p className="font-script text-3xl text-blossom-rose">Not yet!</p>
              <p className="mt-2 font-semibold text-blossom-ink/80">
                Voting is still open. Come back after{" "}
                <strong className="text-blossom-deeprose">
                  {data.votingEndsAt ? formatEndDate(data.votingEndsAt) : "the announced end date"}
                </strong>{" "}
                to see the winners.
              </p>
              <Link
                href="/"
                className="plaque-sage mt-6 inline-block px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:scale-105"
              >
                Back to voting
              </Link>
            </div>
          )}

          {data && !data.open && data.winners && (
            <div className="space-y-10 sm:space-y-12">
              {data.winners.map((w, i) => (
                <div key={w.categoryId} className="animate-fade-scale px-1 sm:px-0" style={{ animationDelay: `${i * 0.25}s` }}>
                  <div className="relative mb-8">
                    {w.categoryImage ? (
                      <div className="relative h-24 w-full overflow-hidden rounded-b-[2.5rem] shadow-soft sm:h-36">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={w.categoryImage} alt={w.categoryName} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-blossom-skin/70 via-transparent to-transparent" />
                      </div>
                    ) : (
                      <div className="pattern-gingham h-24 w-full rounded-b-[2.5rem] shadow-soft sm:h-36" />
                    )}
                    <RibbonBanner className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 whitespace-nowrap">
                      <span className="block max-w-[68vw] truncate text-[11px] sm:max-w-none sm:text-sm">
                        {w.categoryName}
                      </span>
                    </RibbonBanner>
                  </div>

                  <div className="mt-8 flex flex-col items-center px-2 sm:mt-10">
                    <CrownBadge className="animate-float" />
                    <h2 className="mt-3 px-4 text-center font-display text-xl font-bold text-blossom-deeprose sm:px-0 sm:text-3xl">
                      {w.winner.name}
                    </h2>
                    <p className="mt-1 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-blossom-sage sm:text-xs">
                      Winner · {w.categoryName}
                    </p>

                    <div className="mt-4 animate-float flex flex-col items-center sm:mt-5">
                      <WinnerPhoto src={w.winner.photoUrl} name={w.winner.name} winner />
                    </div>

                    {w.runnerUps.length > 0 && (
                      <div className="mt-7 sm:mt-8">
                        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-blossom-rose">
                          Also loved
                        </p>
                        <div className="mt-4 flex flex-wrap items-end justify-center gap-x-5 gap-y-3">
                          {w.runnerUps.map((r) => (
                            <div key={r.id} className="flex flex-col items-center gap-2">
                              <WinnerPhoto src={r.photoUrl} name={r.name} />
                              <p className="max-w-24 text-center text-xs font-bold text-blossom-ink/80 sm:max-w-[7.5rem] sm:text-sm">
                                {r.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="plaque-cream p-6 text-center">
                <p className="font-script text-3xl text-blossom-rose">Thank you for voting!</p>
                <p className="mt-1 font-semibold text-blossom-ink/70">
                  Congratulations to all our wonderful participants. See you at the next Blossom event!
                </p>
                {mode === "results" && (
                  <p className="mt-3 text-xs font-semibold text-blossom-sage">
                    Brought to you by <Link href="/" className="underline">Blossom Events</Link>
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}