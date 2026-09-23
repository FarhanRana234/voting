import { getVotingEndsAt, loadPublicData } from "@/lib/results";
import HomePageView from "@/components/voting/HomePageView";
import ResultsView from "@/components/results/ResultsView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const endsAt = await getVotingEndsAt();

  if (endsAt != null && Date.now() >= endsAt) {
    return <ResultsView mode="home" />;
  }

  const categories = await loadPublicData();
  return <HomePageView votingEndsAt={endsAt} categories={categories} />;
}