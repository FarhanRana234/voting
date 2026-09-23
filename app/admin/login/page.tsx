import Link from "next/link";
import LoginForm from "@/components/admin/LoginForm";
import { FlowerCorner } from "@/components/decor";

export const metadata = { title: "Admin Login — Blossom Events" };

export default function AdminLoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <FlowerCorner variant="top-left" className="absolute left-0 top-0 w-36 opacity-80" />
      <FlowerCorner variant="bottom-right" className="absolute bottom-0 right-0 w-36 opacity-70" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-12">
        <div className="text-center">
          <p className="font-script text-4xl text-blossom-rose">Blossom Events</p>
          <h1 className="mt-1 font-display text-2xl font-bold uppercase tracking-wide text-blossom-deeprose">
            Admin Panel
          </h1>
          <p className="mt-1 text-sm font-semibold text-blossom-sage">Tando Adam Eat Festival</p>
        </div>
        <div className="plaque-cream mt-8 w-full p-6 sm:p-8">
          <LoginForm />
        </div>
        <Link href="/" className="mt-6 text-xs font-bold text-blossom-sage underline">
          ← Back to the website
        </Link>
      </div>
    </main>
  );
}