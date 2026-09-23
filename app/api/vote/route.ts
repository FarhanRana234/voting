import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminDb, Timestamp } from "@/lib/firebase/admin";
import { VOTER_COOKIE, VOTE_COLLECTION, PARTICIPANT_VOTES_COLLECTION, SETTINGS_DOC } from "@/lib/constants";

export const runtime = "nodejs";

type VoteResult =
  | { status: 200; participantId: string }
  | { status: 409; participantId: string; message: string }
  | { status: 403 }
  | { status: 404; error: string }
  | { status: 400; error: string };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categoryId, participantId } = body ?? {};

    const cookieVoterId = cookies().get(VOTER_COOKIE)?.value;
    const voterId = (cookieVoterId || (typeof body?.voterId === "string" ? body.voterId : "")) as string;

    if (!voterId || !categoryId || !participantId) {
      return NextResponse.json({ error: "Missing voterId, categoryId or participantId." }, { status: 400 });
    }

    const db = getAdminDb();

    const result = await db.runTransaction<VoteResult>(async (t) => {
      const settingsSnap = await t.get(db.doc(SETTINGS_DOC));
      const endsAt = settingsSnap.get("votingEndsAt") as Timestamp | number | undefined;

      let endsMs: number | null = null;
      if (endsAt instanceof Timestamp) endsMs = endsAt.toMillis();
      else if (typeof endsAt === "number") endsMs = endsAt;

      if (endsMs != null && Date.now() >= endsMs) {
        return { status: 403 };
      }

      const [categorySnap, participantSnap] = await Promise.all([
        t.get(db.doc(`categories/${categoryId}`)),
        t.get(db.doc(`participants/${participantId}`)),
      ]);
      if (!categorySnap.exists) return { status: 404, error: "Category not found." };
      if (!participantSnap.exists) return { status: 404, error: "Participant not found." };
      if (participantSnap.get("categoryId") !== categoryId) {
        return { status: 400, error: "Participant does not belong to this category." };
      }

      const voteRef = db.doc(`${VOTE_COLLECTION}/${voterId}_${categoryId}`);
      const voteSnap = await t.get(voteRef);
      if (voteSnap.exists) {
        const data = voteSnap.data() ?? {};
        return {
          status: 409,
          participantId: data.participantId as string,
          message: "You've already voted in this category.",
        };
      }

      const pvRef = db.doc(`${PARTICIPANT_VOTES_COLLECTION}/${participantId}`);
      const pvSnap = await t.get(pvRef);
      const nextCount = (pvSnap.exists ? Number(pvSnap.get("voteCount") ?? 0) : 0) + 1;

      t.set(voteRef, {
        voterId,
        categoryId,
        participantId,
        createdAt: Timestamp.now(),
      });
      t.set(pvRef, {
        categoryId,
        voteCount: nextCount,
      });

      return { status: 200, participantId };
    });

    switch (result.status) {
      case 409:
        return NextResponse.json({ error: result.message, participantId: result.participantId }, { status: 409 });
      case 404:
      case 400:
        return NextResponse.json({ error: result.error }, { status: result.status });
      case 403:
        return NextResponse.json({ error: "Voting has closed.", redirect: "/results" }, { status: 403 });
      default:
        return NextResponse.json({ ok: true, participantId, categoryId });
    }
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Something went wrong while voting. Please try again." }, { status: 500 });
  }
}