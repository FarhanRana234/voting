import "server-only";

import { getAdminDb, Timestamp } from "@/lib/firebase/admin";
import { SETTINGS_DOC, PARTICIPANT_VOTES_COLLECTION } from "@/lib/constants";
import type { Category, CategoryWithParticipants, Participant, WinnerResult } from "@/lib/types";

export async function getVotingEndsAt(): Promise<number | null> {
  const snap = await getAdminDb().doc(SETTINGS_DOC).get();
  if (!snap.exists) return null;
  const endAt = snap.get("votingEndsAt");
  if (!endAt) return null;
  return endAt instanceof Timestamp ? endAt.toMillis() : Number(endAt);
}

export async function isVotingOpen(now = Date.now()): Promise<boolean> {
  const endsAt = await getVotingEndsAt();
  return endsAt == null ? true : now < endsAt;
}

export async function loadPublicData(): Promise<CategoryWithParticipants[]> {
  const db = getAdminDb();

  const [categoriesSnap, participantsSnap] = await Promise.all([
    db.collection("categories").orderBy("order", "asc").get(),
    db.collection("participants").orderBy("order", "asc").get(),
  ]);

  const categories: Category[] = categoriesSnap.docs.map((d) => ({
    id: d.id,
    name: d.get("name") as string,
    imageUrl: d.get("imageUrl") ?? null,
    order: d.get("order") ?? 0,
  }));

  const participantsByCategory = new Map<string, Participant[]>();
  for (const d of participantsSnap.docs) {
    const p: Participant = {
      id: d.id,
      categoryId: d.get("categoryId") as string,
      name: d.get("name") as string,
      photoUrl: d.get("photoUrl") ?? null,
      order: d.get("order") ?? 0,
    };
    const list = participantsByCategory.get(p.categoryId) ?? [];
    list.push(p);
    participantsByCategory.set(p.categoryId, list);
  }

  return categories.map((c) => ({
    ...c,
    participants: (participantsByCategory.get(c.id) ?? []).sort((a, b) => a.order - b.order),
  }));
}

export async function loadCategoryData(categoryId: string): Promise<CategoryWithParticipants | null> {
  const db = getAdminDb();

  const [catSnap, participantsSnap] = await Promise.all([
    db.collection("categories").doc(categoryId).get(),
    db.collection("participants").where("categoryId", "==", categoryId).get(),
  ]);

  if (!catSnap.exists) return null;

  const participants: Participant[] = participantsSnap.docs
    .map((d) => ({
      id: d.id,
      categoryId: d.get("categoryId") as string,
      name: d.get("name") as string,
      photoUrl: d.get("photoUrl") ?? null,
      order: d.get("order") ?? 0,
    }))
    .sort((a, b) => a.order - b.order);

  return {
    id: catSnap.id,
    name: catSnap.get("name") as string,
    imageUrl: catSnap.get("imageUrl") ?? null,
    order: catSnap.get("order") ?? 0,
    participants,
  };
}

export interface LiveResults {
  votingEndsAt: number | null;
  winners: WinnerResult[];
}

export async function computeResults(now = Date.now()): Promise<LiveResults | null> {
  const db = getAdminDb();
  const endsAt = await getVotingEndsAt();
  if (endsAt == null || now < endsAt) return null;

  const [categoriesSnap, participantsSnap, votesSnap] = await Promise.all([
    db.collection("categories").orderBy("order", "asc").get(),
    db.collection("participants").get(),
    db.collection(PARTICIPANT_VOTES_COLLECTION).get(),
  ]);

  const params = new Map<string, Set<string>>();
  for (const d of participantsSnap.docs) {
    const categoryId = d.get("categoryId") as string;
    if (!params.has(categoryId)) params.set(categoryId, new Set());
    params.get(categoryId)!.add(d.id);
  }

  const counts = new Map<string, number>();
  for (const d of votesSnap.docs) {
    counts.set(d.id, Number(d.get("voteCount") ?? 0));
  }

  const winners: WinnerResult[] = [];
  for (const c of categoriesSnap.docs) {
    const categoryId = c.id;
    const memberIds = params.get(categoryId);
    if (!memberIds) continue;

    const ranked = [...memberIds].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0));
    const take = (id: string) => {
      const d = participantsSnap.docs.find((x) => x.id === id);
      if (!d) return null;
      return {
        id: d.id,
        name: d.get("name") as string,
        photoUrl: d.get("photoUrl") ?? null,
      };
    };

    const winner = take(ranked[0]);
    if (!winner) continue;

    winners.push({
      categoryId,
      categoryName: c.get("name") as string,
      categoryImage: c.get("imageUrl") ?? null,
      winner,
      runnerUps: ranked
        .slice(1, 3)
        .map(take)
        .filter((x): x is NonNullable<typeof x> => x !== null),
    });
  }

  return { votingEndsAt: endsAt, winners };
}