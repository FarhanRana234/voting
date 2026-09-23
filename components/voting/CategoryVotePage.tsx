"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlowerCorner } from "@/components/decor";
import SiteHeader from "@/components/SiteHeader";
import { VOTER_COOKIE } from "@/lib/constants";
import type { CategoryWithParticipants, PastVote } from "@/lib/types";

interface Props {
  category: CategoryWithParticipants;
}

export default function CategoryVotePage({ category }: Props) {
  const router = useRouter();
  const [votedParticipantId, setVotedParticipantId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const idRes = await fetch("/api/voter-id");
        const { voterId } = await idRes.json();
        localStorage.setItem(VOTER_COOKIE, String(voterId));

        const statusRes = await fetch("/api/vote-status");
        const { voted } = await statusRes.json();
        const mine = (voted as PastVote[]).find((v) => v.categoryId === category.id);
        setVotedParticipantId(mine?.participantId ?? null);
      } catch {
        setNotice("Could not reach the server. Please refresh.");
      } finally {
        setLoaded(true);
      }
    })();
  }, [category.id]);

  async function vote(participantId: string) {
    if (pending) return;
    setPending(participantId);
    setNotice(null);

    try {
      const voterId = localStorage.getItem(VOTER_COOKIE) ?? "";
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId, categoryId: category.id, participantId }),
      });

      if (res.status === 200 || res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setVotedParticipantId((data.participantId ?? participantId) as string);
        setNotice(null);
      } else if (res.status === 403) {
        router.push("/results");
        return;
      } else {
        const data = await res.json().catch(() => ({}));
        setNotice(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setNotice("Could not reach the server. Please check your connection.");
    } finally {
      setPending(null);
    }
  }

  const locked = Boolean(votedParticipantId);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="relative z-10">
        <FlowerCorner variant="top-right" className="absolute right-0 top-0 w-28 opacity-60 sm:w-40" />

        <SiteHeader variant="compact" backHref="/" backLabel="All categories" />

        {notice && (
          <div className="mx-auto mt-4 w-fit max-w-xl rounded-full bg-white px-5 py-2 text-sm font-bold text-blossom-deeprose shadow-soft">
            {notice}
          </div>
        )}

        <section className="mx-auto max-w-3xl px-5 pb-24">
          <div className="relative mb-8 animate-fade-up overflow-hidden rounded-plaque shadow-soft">
            {category.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={category.imageUrl}
                alt={category.name}
                className="h-32 w-full object-cover sm:h-44"
              />
            ) : (
              <div className="pattern-gingham h-32 w-full sm:h-44" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-blossom-deeprose/75 via-blossom-deeprose/5 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-center">
              <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-white text-shadow-soft sm:text-3xl">
                {category.name}
              </h1>
            </div>
          </div>

          <p className="mb-6 animate-fade-up text-center font-body text-sm font-semibold text-blossom-sage" style={{ animationDelay: "100ms" }}>
            {locked ? "Thanks for voting! Your pick is saved below." : `Pick your ${category.name} favorite`}
          </p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
            {category.participants.map((p, i) => {
              const isPicked = votedParticipantId === p.id;
              const disabled = locked || pending !== null;
              return (
                <div
                  key={p.id}
                  style={{ animationDelay: `${200 + i * 90}ms` }}
                  className={`plaque-cream flex animate-pop-in flex-col overflow-hidden transition ${
                    locked && !isPicked ? "opacity-55 saturate-50" : ""
                  } ${isPicked ? "ring-4 ring-blossom-rose ring-offset-2 ring-offset-blossom-skin" : ""}`}
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-blossom-blush/20">
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blossom-blush/60 to-blossom-rose/60">
                        <span className="font-script text-6xl text-white text-shadow-soft">
                          {p.name.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                    {isPicked && (
                      <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-blossom-rose text-white shadow-soft">
                        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                          <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-2 p-2.5 sm:p-3">
                    <h2 className="text-center font-display text-sm font-semibold leading-tight text-blossom-deeprose sm:text-base">
                      {p.name}
                    </h2>
                    {isPicked ? (
                      <span className="rounded-full bg-blossom-blush/30 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-blossom-deeprose sm:text-sm">
                        Your Vote!
                      </span>
                    ) : (
                      <button
                        onClick={() => vote(p.id)}
                        disabled={disabled}
                        className={`plaque-rose px-3 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blossom-rose/40 disabled:cursor-not-allowed disabled:opacity-50 ${
                          pending === p.id ? "opacity-70" : "hover:scale-[1.03] active:scale-95"
                        }`}
                      >
                        {pending === p.id ? "Voting…" : "Vote"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {category.participants.length === 0 && (
              <p className="col-span-full py-16 text-center font-semibold text-blossom-ink/50">
                No participants in this category yet — check back soon.
              </p>
            )}
          </div>

          {locked && (
            <div className="mt-8 flex flex-col items-center gap-3">
              <div className="plaque-cream px-6 py-4 text-center">
                <p className="font-script text-3xl text-blossom-rose">Your Vote!</p>
                <p className="mt-1 text-sm font-semibold text-blossom-ink/70">
                  You&apos;ve voted in {category.name} — results are revealed once voting closes.
                </p>
              </div>
              <Link
                href="/"
                className="rounded-full bg-blossom-sage/15 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-blossom-sage transition hover:bg-blossom-sage hover:text-white"
              >
                ← Back to all categories
              </Link>
            </div>
          )}
        </section>

        <footer className="relative z-10 bg-blossom-sage/10 py-6 text-center text-xs font-semibold text-blossom-sage">
          <p>Blossom Events · Tando Adam Eat Festival · One vote per category</p>
        </footer>

        {!loaded && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-blossom-skin/70 backdrop-blur-sm">
            <span className="font-semibold text-blossom-sage">Loading…</span>
          </div>
        )}
      </div>
    </main>
  );
}