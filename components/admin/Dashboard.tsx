"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onSnapshot, collection, query } from "firebase/firestore";
import { signInWithCustomToken, signOut } from "firebase/auth";
import { getClientAuth, getClientDb } from "@/lib/firebase/client";
import { PARTICIPANT_VOTES_COLLECTION } from "@/lib/constants";
import type { Category, Participant } from "@/lib/types";

interface Toast {
  id: number;
  msg: string;
  type: "ok" | "err";
}

let toastCounter = 0;

function toLocalInput(ms: number | null) {
  if (ms == null) return "";
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function post(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export default function Dashboard() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [remote, setRemote] = useState<boolean>(false);
  const [rulesDenied, setRulesDenied] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [endsInput, setEndsInput] = useState("");
  const [endsSaved, setEndsSaved] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newPartMap, setNewPartMap] = useState<Record<string, { name: string }>>({});

  const addToast = (msg: string, type: Toast["type"] = "ok") => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/admin/me");
      if (!me.ok) {
        router.replace("/admin/login");
        return;
      }
      setAuthed(true);

      try {
        const res = await fetch("/api/admin/session-token");
        const { customToken } = await res.json();
        await signInWithCustomToken(getClientAuth(), customToken);
        setRemote(true);
      } catch {
        setRulesDenied(true);
      }
    })();

    const cleanup: Array<() => void> = [];

    const db = getClientDb();
    cleanup.push(
      onSnapshot(query(collection(db, "categories")), (snap) => {
        setCategories(
          snap.docs
            .map((d) => ({
              id: d.id,
              name: d.get("name") as string,
              imageUrl: d.get("imageUrl") ?? null,
              order: Number(d.get("order") ?? 0),
            }))
            .sort((a, b) => a.order - b.order)
        );
      })
    );

    cleanup.push(
      onSnapshot(query(collection(db, "participants")), (snap) => {
        setParticipants(
          snap.docs.map((d) => ({
            id: d.id,
            categoryId: d.get("categoryId") as string,
            name: d.get("name") as string,
            photoUrl: d.get("photoUrl") ?? null,
            order: Number(d.get("order") ?? 0),
          }))
        );
      })
    );

    cleanup.push(
      onSnapshot(
        query(collection(db, PARTICIPANT_VOTES_COLLECTION)),
        (snap) => {
          const map: Record<string, number> = {};
          snap.docs.forEach((d) => {
            map[d.id] = Number(d.get("voteCount") ?? 0);
          });
          setVotes(map);
          setRulesDenied(false);
        },
        () => setRulesDenied(true)
      )
    );

    return () => cleanup.forEach((fn) => fn());
  }, [router]);

  useEffect(() => {
    if (authed && !endsSaved) {
      (async () => {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        setEndsInput(toLocalInput(data.votingEndsAt));
        setEndsSaved(true);
      })();
    }
  }, [authed, endsSaved]);

  const byCategory = useMemo(() => {
    const map = new Map<string, Participant[]>();
    categories.forEach((c) => map.set(c.id, []));
    participants.forEach((p) => {
      if (!map.has(p.categoryId)) map.set(p.categoryId, []);
      map.get(p.categoryId)!.push(p);
    });
    map.forEach((list) =>
      list.sort((a, b) => (votes[b.id] ?? 0) - (votes[a.id] ?? 0))
    );
    return map;
  }, [categories, participants, votes]);

  async function saveSchedule() {
    setBusy("schedule");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ votingEndsAt: endsInput ? new Date(endsInput).toISOString() : null }),
    });
    setBusy(null);
    if (res.ok) addToast("Voting schedule saved.");
    else addToast("Could not save the schedule.", "err");
    router.refresh();
  }

  async function adjustVote(participantId: string, delta: number) {
    const res = await post("/api/admin/vote-adjust", { participantId, delta });
    if (!res.ok) addToast("Could not adjust votes.", "err");
  }

  async function uploadImage(file: File, kind: "category" | "participant"): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      addToast(data.error ?? "Upload failed.", "err");
      return null;
    }
    const data = await res.json();
    return data.url as string;
  }

  async function addCategory() {
    const name = newCatName.trim();
    if (!name) return;
    const res = await post("/api/admin/categories", { name });
    if (res.ok) {
      setNewCatName("");
      addToast("Category added.");
    } else addToast("Could not add category.", "err");
  }

  async function renameCategory(id: string, name: string) {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) addToast("Could not rename category.", "err");
  }

  async function replaceCategoryImage(id: string, file: File) {
    const url = await uploadImage(file, "category");
    if (!url) return;
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url }),
    });
    addToast(res.ok ? "Banner updated." : "Could not update banner.", res.ok ? "ok" : "err");
  }

  async function deleteCategory(id: string) {
    if (!window.confirm("Delete this category and all its participants & votes?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    addToast(res.ok ? "Category deleted." : "Could not delete category.", res.ok ? "ok" : "err");
  }

  async function addParticipant(categoryId: string) {
    const name = newPartMap[categoryId]?.name?.trim();
    if (!name) return;
    setBusy(`add-${categoryId}`);
    const res = await post("/api/admin/participants", { categoryId, name });
    setBusy(null);
    if (res.ok) {
      setNewPartMap((prev) => ({ ...prev, [categoryId]: { name: "" } }));
      addToast("Participant added.");
    } else addToast("Could not add participant.", "err");
  }

  async function addParticipantWithPhoto(categoryId: string, file: File) {
    setBusy(`photo-${categoryId}`);
    const url = await uploadImage(file, "participant");
    setBusy(null);
    if (!url) return;
    const name = newPartMap[categoryId]?.name?.trim();
    const res = await post("/api/admin/participants", { categoryId, name: name || "Untitled", photoUrl: url });
    if (res.ok) {
      setNewPartMap((prev) => ({ ...prev, [categoryId]: { name: "" } }));
      addToast("Participant added.");
    } else addToast("Could not add participant.", "err");
  }

  async function renameParticipant(id: string, name: string) {
    const res = await fetch(`/api/admin/participants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) addToast("Could not rename participant.", "err");
  }

  async function replaceParticipantPhoto(id: string, file: File) {
    const url = await uploadImage(file, "participant");
    if (!url) return;
    const res = await fetch(`/api/admin/participants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl: url }),
    });
    addToast(res.ok ? "Photo updated." : "Could not update photo.", res.ok ? "ok" : "err");
  }

  async function deleteParticipant(id: string) {
    if (!window.confirm("Delete this participant and its vote count?")) return;
    const res = await fetch(`/api/admin/participants/${id}`, { method: "DELETE" });
    addToast(res.ok ? "Participant deleted." : "Could not delete participant.", res.ok ? "ok" : "err");
  }

  async function logout() {
    await post("/api/admin/logout", {});
    try {
      await signOut(getClientAuth());
    } catch {
      /* ignore */
    }
    router.replace("/admin/login");
    router.refresh();
  }

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center font-semibold text-blossom-sage">
        Checking session…
      </div>
    );
  }

  return (
    <main className="relative min-h-screen">
      <div className="sticky top-0 z-20 border-b border-blossom-blush/20 bg-blossom-skin/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-baseline gap-2">
            <span className="font-script text-2xl text-blossom-rose">Blossom</span>
            <span className="font-display text-sm font-bold uppercase tracking-widest text-blossom-deeprose">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" target="_blank" className="text-xs font-bold text-blossom-sage underline">
              View site
            </Link>
            <button
              onClick={logout}
              className="rounded-full bg-blossom-sage/15 px-4 py-1.5 text-xs font-bold text-blossom-sage transition hover:bg-blossom-sage hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      <div className="fixed right-4 top-16 z-30 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-full px-4 py-2 text-sm font-bold text-white shadow-soft ${t.type === "ok" ? "bg-blossom-sage" : "bg-blossom-deeprose"}`}
          >
            {t.msg}
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-4xl space-y-8 px-5 py-8">
        <section className="plaque-cream p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-blossom-deeprose">Voting schedule</h2>
          <p className="mt-1 text-xs font-semibold text-blossom-ink/60">
            When voting closes, the public site switches to the winners page automatically. Push it forward to re-open voting.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block flex-1">
              <span className="text-xs font-bold uppercase tracking-wide text-blossom-sage">Voting ends at (your local time)</span>
              <input
                type="datetime-local"
                value={endsInput}
                onChange={(e) => setEndsInput(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-blossom-blush/40 bg-blossom-cream px-4 py-2.5 text-blossom-ink focus:border-blossom-rose focus:outline-none focus:ring-2 focus:ring-blossom-rose/30"
              />
            </label>
            <button
              onClick={saveSchedule}
              disabled={busy === "schedule"}
              className="plaque-sage whitespace-nowrap px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60"
            >
              {busy === "schedule" ? "Saving…" : "Save schedule"}
            </button>
          </div>
          <button
            onClick={() => setEndsInput("")}
            className="mt-2 text-xs font-bold text-blossom-rose underline"
          >
            Clear (no end date set — voting stays open)
          </button>
        </section>

        <section className="plaque-cream p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-blossom-deeprose">Live vote counts</h2>
            {rulesDenied && (
              <span className="rounded-full bg-blossom-gold/30 px-3 py-1 text-xs font-bold text-blossom-deeprose">
                Live feed blocked — re-login
              </span>
            )}
            {remote && !rulesDenied && (
              <span className="flex items-center gap-1.5 rounded-full bg-blossom-sage/15 px-3 py-1 text-xs font-bold text-blossom-sage">
                <span className="h-2 w-2 rounded-full bg-blossom-sage" /> Live
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-semibold text-blossom-ink/60">
            Only visible here. {remote ? "Updates in real time as votes arrive." : "Connecting to live feed…"}
          </p>

          {categories.map((c) => (
            <div key={c.id} className="mt-5 overflow-hidden rounded-2xl border border-blossom-blush/25">
              <div className="bg-blossom-sage/10 px-4 py-2.5 font-display text-sm font-bold uppercase tracking-widest text-blossom-sage">
                {c.name}
              </div>
              <ul className="divide-y divide-blossom-blush/15">
                {(byCategory.get(c.id) ?? []).map((p, idx) => {
                  const count = votes[p.id] ?? 0;
                  const isLeader = idx === 0 && count > 0;
                  return (
                    <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blossom-blush/30 font-bold text-blossom-deeprose">
                        {p.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.photoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          p.name.charAt(0).toUpperCase()
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-blossom-ink">
                          {p.name} {isLeader && <span className="text-xs font-bold text-blossom-gold">· Leading</span>}
                        </p>
                        <p className="text-xs font-semibold text-blossom-ink/50">
                          {count} vote{count === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => adjustVote(p.id, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-blossom-blush/25 font-bold text-blossom-deeprose transition hover:bg-blossom-blush hover:text-white"
                          aria-label={`Subtract vote for ${p.name}`}
                        >
                          −
                        </button>
                        <button
                          onClick={() => adjustVote(p.id, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-blossom-sage/20 font-bold text-blossom-sage transition hover:bg-blossom-sage hover:text-white"
                          aria-label={`Add vote for ${p.name}`}
                        >
                          +
                        </button>
                      </div>
                    </li>
                  );
                })}
                {byCategory.get(c.id)?.length === 0 && (
                  <li className="px-4 py-4 text-sm font-semibold text-blossom-ink/50">No participants yet.</li>
                )}
              </ul>
            </div>
          ))}
        </section>

        <section className="plaque-cream p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-blossom-deeprose">Categories</h2>
          <div className="mt-4 space-y-5">
            {categories.map((c) => (
              <div key={c.id} className="rounded-2xl border border-blossom-blush/25 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    defaultValue={c.name}
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value.trim() !== c.name) renameCategory(c.id, e.target.value.trim());
                    }}
                    className="flex-1 rounded-xl border border-blossom-blush/40 bg-blossom-cream px-4 py-2.5 font-display font-semibold text-blossom-ink focus:border-blossom-rose focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer rounded-full bg-blossom-sage/15 px-4 py-2 text-xs font-bold text-blossom-sage transition hover:bg-blossom-sage hover:text-white">
                      {c.imageUrl ? "Change banner" : "Upload banner"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) replaceCategoryImage(c.id, f);
                        }}
                      />
                    </label>
                    <button
                      onClick={() => deleteCategory(c.id)}
                      className="rounded-full bg-blossom-deeprose/10 px-4 py-2 text-xs font-bold text-blossom-deeprose transition hover:bg-blossom-deeprose hover:text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {c.imageUrl && (
                  <div className="mt-3 overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.imageUrl} alt={c.name} className="h-24 w-40 object-cover" />
                  </div>
                )}

                <div className="mt-4 border-t border-blossom-blush/20 pt-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-blossom-sage">Participants</p>
                  <ul className="mt-2 space-y-2">
                    {byCategory.get(c.id)?.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 rounded-xl bg-blossom-cream px-3 py-2">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blossom-blush/30 font-bold text-blossom-deeprose">
                          {p.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.photoUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            p.name.charAt(0).toUpperCase()
                          )}
                        </span>
                        <input
                          defaultValue={p.name}
                          onBlur={(e) => {
                            if (e.target.value.trim() && e.target.value.trim() !== p.name) renameParticipant(p.id, e.target.value.trim());
                          }}
                          className="min-w-0 flex-1 rounded-lg border border-blossom-blush/30 bg-white px-3 py-1.5 font-semibold text-blossom-ink focus:border-blossom-rose focus:outline-none"
                        />
                        <label className="cursor-pointer rounded-full bg-blossom-sage/15 px-3 py-1.5 text-xs font-bold text-blossom-sage transition hover:bg-blossom-sage hover:text-white">
                          {p.photoUrl ? "Replace" : "Add photo"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) replaceParticipantPhoto(p.id, f);
                            }}
                          />
                        </label>
                        <button
                          onClick={() => deleteParticipant(p.id)}
                          className="rounded-full bg-blossom-deeprose/10 px-3 py-1.5 text-xs font-bold text-blossom-deeprose transition hover:bg-blossom-deeprose hover:text-white"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                    {byCategory.get(c.id)?.length === 0 && (
                      <li className="text-sm font-semibold text-blossom-ink/50">No participants yet.</li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-2 border-t border-blossom-blush/20 pt-4 sm:flex-row">
            <input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New category name…"
              className="flex-1 rounded-xl border border-blossom-blush/40 bg-blossom-cream px-4 py-2.5 focus:border-blossom-rose focus:outline-none"
            />
            <button
              onClick={addCategory}
              disabled={!newCatName.trim()}
              className="plaque-sage px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-50"
            >
              Add category
            </button>
          </div>
        </section>

        <section className="plaque-cream p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-blossom-deeprose">Add participant</h2>
          <div className="mt-4 space-y-5">
            {categories.map((c) => (
              <div key={c.id} className="rounded-2xl border border-blossom-blush/25 p-4">
                <p className="font-display text-sm font-bold uppercase tracking-widest text-blossom-sage">{c.name}</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    value={newPartMap[c.id]?.name ?? ""}
                    onChange={(e) => setNewPartMap((prev) => ({ ...prev, [c.id]: { name: e.target.value } }))}
                    placeholder="Participant name…"
                    className="flex-1 rounded-xl border border-blossom-blush/40 bg-blossom-cream px-4 py-2.5 focus:border-blossom-rose focus:outline-none"
                  />
                  <label className="cursor-pointer rounded-full bg-blossom-sage/15 px-4 py-2.5 text-center text-xs font-bold text-blossom-sage transition hover:bg-blossom-sage hover:text-white">
                    {busy === `photo-${c.id}` ? "Uploading…" : "Add with photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={busy === `photo-${c.id}`}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) addParticipantWithPhoto(c.id, f);
                      }}
                    />
                  </label>
                  <button
                    onClick={() => addParticipant(c.id)}
                    disabled={busy === `add-${c.id}` || !newPartMap[c.id]?.name?.trim()}
                    className="rounded-full bg-blossom-rose px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:scale-105 disabled:opacity-50"
                  >
                    {busy === `add-${c.id}` ? "Adding…" : "Add"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}