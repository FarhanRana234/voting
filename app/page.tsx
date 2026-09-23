import { getVotingEndsAt, loadPublicData } from "@/lib/results";
import VotingView from "@/components/voting/VotingView";
import ResultsView from "@/components/results/ResultsView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const endsAt = await getVotingEndsAt();

  if (endsAt != null && Date.now() >= endsAt) {
    return <ResultsView mode="home" />;
  }

  const categories = await loadPublicData();
  return <VotingView votingEndsAt={endsAt} initialCategories={categories} />;
}