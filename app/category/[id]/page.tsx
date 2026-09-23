import { notFound, redirect } from "next/navigation";
import { getVotingEndsAt, loadCategoryData } from "@/lib/results";
import ResultsView from "@/components/results/ResultsView";
import CategoryVotePage from "@/components/voting/CategoryVotePage";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: { id: string } }) {
  const endsAt = await getVotingEndsAt();

  if (endsAt != null && Date.now() >= endsAt) {
    return <ResultsView mode="home" />;
  }

  const category = await loadCategoryData(params.id);
  if (!category) notFound();

  return <CategoryVotePage category={category} />;
}