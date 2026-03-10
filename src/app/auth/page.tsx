import type { Route } from "next";
import { redirect } from "next/navigation";

import { getViewer } from "@/lib/viewer";

export default async function AuthPage() {
  const viewer = await getViewer();

  if (viewer) {
    redirect((viewer.hasCompletedOnboarding ? "/dashboard" : "/onboarding") as Route);
  }

  redirect("/" as Route);
}
