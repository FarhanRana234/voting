import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import Dashboard from "@/components/admin/Dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const authed = await requireAdmin();
  if (!authed) redirect("/admin/login");
  return <Dashboard />;
}