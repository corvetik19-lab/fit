import type { Route } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { RepairMojibakeTree } from "@/components/repair-mojibake-tree";
import { getViewer } from "@/lib/viewer";

export default async function Home() {
  const viewer = await getViewer();

  if (viewer) {
    redirect(
      (viewer.hasCompletedOnboarding ? "/dashboard" : "/onboarding") as Route,
    );
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-5 py-6 sm:px-8 sm:py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(8,145,255,0.16),transparent_30%),radial-gradient(circle_at_86%_8%,rgba(45,212,191,0.18),transparent_28%),radial-gradient(circle_at_85%_92%,rgba(37,99,235,0.10),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fbff_48%,#edf7ff_100%)]" />
      <div className="absolute left-6 top-10 h-32 w-32 rounded-full border border-white/80 opacity-70" />
      <div className="absolute bottom-12 right-[-3rem] h-56 w-56 rounded-full border border-[#0891ff]/10" />

      <RepairMojibakeTree>
        <div className="relative z-10 w-full max-w-[20.5rem]">
          <header className="mb-5 flex flex-col items-center text-center sm:mb-6">
            <Image
              alt="fitora"
              className="h-auto w-[min(100%,18.5rem)] object-contain drop-shadow-[0_18px_28px_rgba(8,145,255,0.12)]"
              height={260}
              priority
              src="/fitora-brand-clean.png"
              width={1364}
            />
          </header>

          <section className="flex justify-center">
            <AuthForm />
          </section>
        </div>
      </RepairMojibakeTree>
    </main>
  );
}
