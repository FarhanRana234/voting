"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FlowerCorner, FloralDivider, RibbonBanner } from "@/components/decor";
import Countdown from "@/components/Countdown";
import { VOTER_COOKIE } from "@/lib/constants";
import type { CategoryWithParticipants, PastVote } from "@/lib/types";

interface Props {
  votingEndsAt: number | null;
  initialCategories: CategoryWithParticipants[];
}

function ParticipantPhoto({ src, name, fallback }: { src?: string | null; name: string; fallback: string }) {
  const [errored, setErrored] = useState(false);
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-t-plaque">
      {src && !errored ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${fallback}`}>
          <span className="font-script text-6xl text-white text-shadow-soft">{name.charAt(0) || "?"}</span>
        </div>
      )}
    </div>
  );
}

export default function VotingView({ votingEndsAt, initialCategories }: Props) {
  const router = useRouter();
  const categories = initialCategories;
  const [votedIn, setVotedIn] = useState<Record<string, string>>({});
  const allVoted = Object.keys(votedIn).length === categories.length;
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const idRes = await fetch("/api/voter-id");
      const { voterId } = await idRes.json();
      localStorage.setItem(VOTER_COOKIE, String(voterId));

      const statusRes = await fetch("/api/vote-status");
      const { voted } = await statusRes.json();
      const map: Record<string, string> = {};
      (voted as PastVote[]).forEach((v) => (map[v.categoryId] = v.participantId));
      setVotedIn(map);
    })();
  }, []);

  async function vote(categoryId: string, participantId: string) {
    if (pending) return;
    setPending(participantId);
    setNotice(null);

    try {
      const voterId = localStorage.getItem(VOTER_COOKIE) ?? "";
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId, categoryId, participantId }),
      });

      if (res.status === 200) {
        setVotedIn((prev) => ({ ...prev, [categoryId]: participantId }));
        setNotice(null);
      } else if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setVotedIn((prev) => ({ ...prev, [categoryId]: data.participantId ?? participantId }));
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

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="relative z-10">
        <FlowerCorner variant="top-left" className="absolute left-0 top-0 w-32 opacity-80 sm:w-44" />
        <FlowerCorner variant="top-right" className="absolute right-0 top-0 w-28 opacity-70 sm:w-40" />

        <header className="mx-auto max-w-2xl px-6 pb-8 pt-16 text-center sm:pt-20">
          <p className="font-script text-4xl text-blossom-rose sm:text-5xl">Blossom Events</p>

          <h1 className="mt-4 font-display font-bold uppercase leading-none tracking-wide">
            <span className="relative inline-block px-2">
              <span className="absolute inset-x-0 top-1/2 -z-10 mx-auto block h-16 -translate-y-1/2 -rotate-1 rounded-[2rem] bg-blossom-blush/45 sm:h-24" aria-hidden="true" />
              <span className="text-5xl text-blossom-deeprose sm:text-7xl">Eat</span>
              <span className="text-5xl text-blossom-sage sm:text-7xl"> Festival</span>
            </span>
            <svg viewBox="0 0 220 18" className="mx-auto mt-2 h-4 w-56 sm:h-5 sm:w-72" aria-hidden="true">
              <path d="M4 12 C 60 4, 120 18, 216 8" fill="none" stroke="#d9a441" strokeWidth="5" strokeLinecap="round" />
              <circle cx="216" cy="8" r="5" fill="#d16b82" />
            </svg>
          </h1>

          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="font-display text-xs font-semibold uppercase tracking-[0.35em] text-blossom-deeprose sm:text-sm">
              Tando Adam
            </span>
            <div className="mx-auto my-2 h-5 w-px bg-blossom-rose/40" aria-hidden="true" />
            <span className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-blossom-sage sm:text-sm">
              Vote for your favorites 🌸
            </span>
          </div>
        </header>

        <div className="mx-auto max-w-2xl px-6">
          {votingEndsAt != null && <Countdown endsAt={votingEndsAt} />}
        </div>

        {notice && (
          <div className="mx-auto mt-5 w-fit max-w-xl rounded-full bg-white px-5 py-2 text-sm font-bold text-blossom-deeprose shadow-soft">
            {notice}
          </div>
        )}

        <section className="mx-auto max-w-2xl px-6 pb-24">
          <FloralDivider className="my-10" />

          {categories.map((category, idx) => {
            const votedParticipantId = votedIn[category.id];
            const locked = Boolean(votedParticipantId);

            return (
              <div key={category.id} className="mb-14">
                <div className="relative">
                  {category.imageUrl ? (
                    <div className="relative h-36 w-full overflow-hidden rounded-b-[2.5rem] shadow-soft sm:h-44">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-blossom-skin/70 via-transparent to-transparent" />
                    </div>
                  ) : (
                    <div className="pattern-gingham h-36 w-full rounded-b-[2.5rem] shadow-soft sm:h-44" />
                  )}
                  <div className="absolute -bottom-0 left-1/2 z-10 w-fit -translate-x-1/2 translate-y-1/2">
                    <RibbonBanner className="whitespace-nowrap">
                      <span className="text-xs sm:text-sm">{category.name}</span>
                    </RibbonBanner>
                  </div>
                </div>

                <p className="mt-10 text-center text-sm font-bold text-blossom-sage">
                  <span className="text-blossom-rose">Pick your favorite!</span>
                </p>

                <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6">
                  {category.participants.map((p) => {
                    const isPicked = votedParticipantId === p.id;
                    const disabled = locked || pending !== null;
                    return (
                      <div
                        key={p.id}
                        className={`plaque-cream flex flex-col overflow-hidden transition duration-300 ${
                          locked ? "opacity-70" : "hover:-translate-y-1"
                        } ${isPicked ? "ring-4 ring-blossom-rose ring-offset-2 ring-offset-blossom-skin" : ""}`}
                      >
                        <ParticipantPhoto src={p.photoUrl} name={p.name} fallback={idx % 2 === 0 ? "from-blossom-blush to-blossom-rose" : "from-blossom-sage to-[#485c3a]"} />
                        <div className="flex flex-1 flex-col justify-between gap-3 p-3 sm:p-4">
                          <h3 className="text-center font-display text-sm font-semibold leading-tight text-blossom-deeprose sm:text-base">
                            {p.name}
                          </h3>
                          {locked ? (
                            <div className="flex items-center justify-center gap-1.5 rounded-full bg-blossom-blush/25 px-3 py-2 text-xs font-bold text-blossom-deeprose sm:text-sm">
                              {isPicked ? (
                                <span className="inline-flex items-center gap-1">
                                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" /></svg>
                                  Your vote — thanks!
                                </span>
                              ) : (
                                <span>Voting closed in this category</span>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => vote(category.id, p.id)}
                              disabled={disabled}
                              className={`plaque-rose w-full px-3 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blossom-rose/40 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base ${
                                pending === p.id ? "opacity-80" : "hover:scale-[1.03] active:scale-95"
                              }`}
                            >
                              {pending === p.id ? "Voting…" : "Vote"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {category.participants.length === 0 && (
                  <p className="mt-4 text-center text-sm font-semibold text-blossom-ink/50">
                    No participants yet — check back soon.
                  </p>
                )}

                {locked && !allVoted && (
                  <p className="mt-3 text-center text-xs font-bold text-blossom-sage">You can still vote in the other category</p>
                )}
              </div>
            );
          })}

          {allVoted && (
            <div className="plaque-cream mt-6 p-6 text-center">
              <p className="font-script text-3xl text-blossom-rose">You’re all done!</p>
              <p className="mt-1 font-semibold text-blossom-ink/70">
                Thanks for voting — winners will be revealed once voting closes.
              </p>
            </div>
          )}
        </section>

        <footer className="relative z-10 bg-blossom-sage/10 py-6 text-center text-xs font-semibold text-blossom-sage">
          <p>Blossom Events · Tando Adam Eat Festival · One vote per category</p>
        </footer>
      </div>
    </main>
  );
}