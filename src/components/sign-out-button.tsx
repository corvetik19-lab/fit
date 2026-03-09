"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { createClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, setIsPending] = useState(false);

  function signOut() {
    setIsPending(true);

    startTransition(async () => {
      try {
        await supabase.auth.signOut();
        router.replace("/auth" as Route);
        router.refresh();
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <button
      className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isPending}
      onClick={signOut}
      type="button"
    >
      {isPending ? "Выход..." : "Выйти"}
    </button>
  );
}
