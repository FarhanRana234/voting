import { NextResponse } from "next/server";
import { computeResults, getVotingEndsAt } from "@/lib/results";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const endsAt = await getVotingEndsAt();
  if (endsAt == null || Date.now() < endsAt) {
    return NextResponse.json({ open: true, votingEndsAt: endsAt }, { status: 403 });
  }
  const results = await computeResults();
  if (!results) {
    return NextResponse.json({ open: true, votingEndsAt: endsAt }, { status: 403 });
  }
  return NextResponse.json({ open: false, votingEndsAt: results.votingEndsAt, winners: results.winners });
}