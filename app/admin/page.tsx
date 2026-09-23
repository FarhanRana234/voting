import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await requireAdmin();
  redirect(authed ? "/admin/dashboard" : "/admin/login");
}