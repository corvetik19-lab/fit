"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Dumbbell,
  History,
  type LucideIcon,
  Menu,
  Settings2,
  Shield,
  Sparkles,
  X,
} from "lucide-react";

import { SignOutButton } from "@/components/sign-out-button";

type AppRouteDefinition = {
  href: Route;
  label: string;
  description: string;
  icon: LucideIcon;
};

type PlatformAdminRole = "super_admin" | "support_admin" | "analyst" | null;

type AppShellNavProps = {
  viewer: {
    email: string | null;
    fullName: string | null;
    isPlatformAdmin: boolean;
    platformAdminRole: PlatformAdminRole;
  } | null;
};

const dashboardRoute: AppRouteDefinition = {
  href: "/dashboard",
  label: "Дашборд",
  description: "Сводка, графики и текущий статус.",
  icon: BarChart3,
};

const workoutsRoute: AppRouteDefinition = {
  href: "/workouts",
  label: "Тренировки",
  description: "Программы, упражнения и выполнение.",
  icon: Dumbbell,
};

const nutritionRoute: AppRouteDefinition = {
  href: "/nutrition",
  label: "Питание",
  description: "Логи, дневные цели и фото-анализ.",
  icon: Activity,
};

const historyRoute: AppRouteDefinition = {
  href: "/history",
  label: "История",
  description: "Прошлые программы и ретроспектива.",
  icon: History,
};

const aiRoute: AppRouteDefinition = {
  href: "/ai",
  label: "AI",
  description: "Чат, предложения и AI-коуч.",
  icon: Sparkles,
};

const settingsRoute: AppRouteDefinition = {
  href: "/settings",
  label: "Настройки",
  description: "Профиль, аккаунт и управление данными.",
  icon: Settings2,
};

const adminRoute: AppRouteDefinition = {
  href: "/admin",
  label: "Админ",
  description: "Пользователи, доступы и аудит.",
  icon: Shield,
};

const coreRoutes = [dashboardRoute, workoutsRoute, nutritionRoute, aiRoute];
const utilityRoutes = [historyRoute, settingsRoute];
const desktopRoutes = [...coreRoutes, ...utilityRoutes, adminRoute];

function formatAdminRole(value: PlatformAdminRole) {
  switch (value) {
    case "super_admin":
      return "Супер-админ";
    case "support_admin":
      return "Поддержка";
    case "analyst":
      return "Аналитик";
    default:
      return null;
  }
}

function isRouteActive(pathname: string, href: Route) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getBottomNavRoutes(pathname: string) {
  const contextualRoute = isRouteActive(pathname, adminRoute.href)
    ? adminRoute
    : isRouteActive(pathname, historyRoute.href)
      ? historyRoute
      : settingsRoute;

  return [...coreRoutes, contextualRoute];
}

function getCurrentSectionLabel(pathname: string) {
  const currentRoute =
    desktopRoutes.find((route) => isRouteActive(pathname, route.href)) ?? dashboardRoute;

  return currentRoute.label;
}

function DrawerRouteLink({
  href,
  label,
  description,
  icon: Icon,
  isActive,
  onNavigate,
}: AppRouteDefinition & {
  isActive: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`app-drawer-link ${isActive ? "app-drawer-link--active" : ""}`}
      href={href}
      onClick={onNavigate}
    >
      <span className="app-drawer-link__icon">
        <Icon size={18} strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-xs text-muted">{description}</span>
      </span>
      <ArrowRight size={16} strokeWidth={2.2} />
    </Link>
  );
}

export function AppShellNav({ viewer }: AppShellNavProps) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const bottomNavRoutes = getBottomNavRoutes(pathname);
  const currentSectionLabel = getCurrentSectionLabel(pathname);
  const adminRoleLabel = formatAdminRole(viewer?.platformAdminRole ?? null);

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isDrawerOpen]);

  return (
    <>
      <nav className="hidden flex-wrap gap-2 lg:flex">
        {desktopRoutes
          .filter((route) => viewer?.isPlatformAdmin || route.href !== "/admin")
          .map((route) => {
            const isActive = isRouteActive(pathname, route.href);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border-accent bg-accent text-white"
                    : "border-border text-foreground hover:bg-white/70"
                }`}
                href={route.href}
                key={route.href}
              >
                {route.label}
              </Link>
            );
          })}
      </nav>

      <div className="grid gap-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
              PWA navigation
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">
              Сейчас открыт:
              {" "}
              {currentSectionLabel}
            </p>
          </div>

          <button
            aria-controls="app-mobile-drawer"
            aria-expanded={isDrawerOpen}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white/75 px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-white"
            onClick={() => setIsDrawerOpen(true)}
            type="button"
          >
            <Menu size={18} strokeWidth={2.2} />
            Меню
          </button>
        </div>
      </div>

      <div
        aria-hidden={!isDrawerOpen}
        className={`app-drawer-backdrop ${isDrawerOpen ? "app-drawer-backdrop--visible" : ""}`}
        onClick={() => setIsDrawerOpen(false)}
      />

      <aside
        aria-hidden={!isDrawerOpen}
        className={`app-drawer ${isDrawerOpen ? "app-drawer--open" : ""}`}
        id="app-mobile-drawer"
      >
        <div className="app-drawer__surface">
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 pb-4 pt-[calc(1.1rem+env(safe-area-inset-top))]">
            <div className="min-w-0">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                fit app
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">
                Быстрое меню
              </h2>
              <p className="mt-2 truncate text-sm text-muted">
                {viewer?.fullName ?? viewer?.email ?? "Пользователь fit"}
              </p>
            </div>

            <button
              aria-label="Закрыть меню"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/75 text-foreground transition hover:bg-white"
              onClick={() => setIsDrawerOpen(false)}
              type="button"
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>

          <div className="grid gap-5 overflow-y-auto px-5 py-5">
            <section className="rounded-3xl border border-border bg-white/70 p-4">
              <p className="text-sm font-semibold text-foreground">
                {viewer?.email ?? "Нет email"}
              </p>
              <p className="mt-2 text-sm text-muted">
                Роль:
                {" "}
                <span className="text-foreground">
                  {adminRoleLabel ?? "Пользователь"}
                </span>
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">
                Меню собрано под телефонный PWA-режим: основные разделы остаются
                под рукой, а расширенная навигация живёт в drawer.
              </p>
            </section>

            <section className="grid gap-3">
              <div>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                  Основное
                </p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">
                  Ежедневная работа
                </h3>
              </div>

              <div className="grid gap-2">
                {coreRoutes.map((route) => (
                  <DrawerRouteLink
                    {...route}
                    isActive={isRouteActive(pathname, route.href)}
                    key={route.href}
                    onNavigate={() => setIsDrawerOpen(false)}
                  />
                ))}
              </div>
            </section>

            <section className="grid gap-3">
              <div>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                  Сервис
                </p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">
                  Профиль и история
                </h3>
              </div>

              <div className="grid gap-2">
                {utilityRoutes.map((route) => (
                  <DrawerRouteLink
                    {...route}
                    isActive={isRouteActive(pathname, route.href)}
                    key={route.href}
                    onNavigate={() => setIsDrawerOpen(false)}
                  />
                ))}

                {viewer?.isPlatformAdmin ? (
                  <DrawerRouteLink
                    {...adminRoute}
                    isActive={isRouteActive(pathname, adminRoute.href)}
                    onNavigate={() => setIsDrawerOpen(false)}
                  />
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-[color-mix(in_srgb,var(--surface)_92%,white)] p-4">
              <p className="font-semibold text-foreground">Аккаунт</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Выход остаётся доступным из drawer, чтобы в PWA-режиме не
                приходилось искать его на отдельном экране.
              </p>
              <div className="mt-4">
                <SignOutButton className="w-full justify-center bg-white/75" />
              </div>
            </section>
          </div>
        </div>
      </aside>

      <nav className="app-bottom-nav lg:hidden">
        <div className="app-bottom-nav__inner">
          {bottomNavRoutes.map((route) => {
            const isActive = isRouteActive(pathname, route.href);
            const Icon = route.icon;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`app-bottom-nav__item ${isActive ? "app-bottom-nav__item--active" : ""}`}
                href={route.href}
                key={`${route.href}-bottom`}
              >
                <Icon size={18} strokeWidth={2.25} />
                <span>{route.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
