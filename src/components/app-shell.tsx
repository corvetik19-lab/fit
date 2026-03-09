import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

const routes: Array<{ href: Route; label: string }> = [
  { href: "/dashboard", label: "Дашборд" },
  { href: "/workouts", label: "Тренировки" },
  { href: "/nutrition", label: "Питание" },
  { href: "/history", label: "История" },
  { href: "/ai", label: "AI" },
  { href: "/settings", label: "Настройки" },
  { href: "/admin", label: "Админ" },
];

export function AppShell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-6 py-6 sm:px-10">
      <header className="card flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            {routes.map((route) => (
              <Link
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
                href={route.href}
                key={route.href}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
