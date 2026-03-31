"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
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
import { canUseRootAdminControls } from "@/lib/admin-permissions";

type AppRouteDefinition = {
  href: Route;
  label: string;
  description: string;
  icon: LucideIcon;
};

type PlatformAdminRole = "super_admin" | "support_admin" | "analyst" | null;

type AppShellNavProps = {
  compact?: boolean;
  minimal?: boolean;
  onDrawerOpenChange?: (isOpen: boolean) => void;
  viewer: {
    userId: string;
    email: string | null;
    fullName: string | null;
    isPlatformAdmin: boolean;
    platformAdminRole: PlatformAdminRole;
  } | null;
};

const dashboardRoute: AppRouteDefinition = {
  href: "/dashboard",
  label: "Обзор",
  description: "Главные метрики и прогресс.",
  icon: BarChart3,
};

const workoutsRoute: AppRouteDefinition = {
  href: "/workouts",
  label: "Тренировки",
  description: "План, дни и выполнение.",
  icon: Dumbbell,
};

const nutritionRoute: AppRouteDefinition = {
  href: "/nutrition",
  label: "Питание",
  description: "Логи, цели и анализ фото.",
  icon: Activity,
};

const historyRoute: AppRouteDefinition = {
  href: "/history",
  label: "История",
  description: "Прошлые недели и результаты.",
  icon: History,
};

const aiRoute: AppRouteDefinition = {
  href: "/ai",
  label: "AI",
  description: "Чат и предложения.",
  icon: Sparkles,
};

const settingsRoute: AppRouteDefinition = {
  href: "/settings",
  label: "Настройки",
  description: "Профиль, доступ и данные.",
  icon: Settings2,
};

const adminRoute: AppRouteDefinition = {
  href: "/admin",
  label: "Админ",
  description: "Пользователи и контроль.",
  icon: Shield,
};

const adminControlRoute: AppRouteDefinition = {
  href: "/admin",
  label: "Центр управления",
  description: "Очереди, health и системный обзор.",
  icon: Shield,
};

const adminUsersRoute: AppRouteDefinition = {
  href: "/admin/users",
  label: "Пользователи",
  description: "Каталог, доступы и операции.",
  icon: Shield,
};

const coreRoutes = [dashboardRoute, workoutsRoute, nutritionRoute, aiRoute];
const utilityRoutes = [historyRoute, settingsRoute];
const sectionRoutes = [
  dashboardRoute,
  workoutsRoute,
  nutritionRoute,
  aiRoute,
  historyRoute,
  settingsRoute,
  adminRoute,
  adminUsersRoute,
];

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

function getCurrentSectionLabel(pathname: string) {
  if (pathname.startsWith("/admin/users")) {
    return "Пользователи";
  }

  const currentRoute =
    sectionRoutes.find((route) => isRouteActive(pathname, route.href)) ??
    dashboardRoute;

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

export function AppShellNav({
  compact = false,
  minimal = false,
  onDrawerOpenChange,
  viewer,
}: AppShellNavProps) {
  const pathname = usePathname();
  const isClientMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const currentSectionLabel = getCurrentSectionLabel(pathname);
  const adminRoleLabel = formatAdminRole(viewer?.platformAdminRole ?? null);
  const showAdminRole = canUseRootAdminControls(
    viewer?.platformAdminRole ?? null,
    viewer?.email ?? null,
  );
  const desktopRoutes: AppRouteDefinition[] = viewer?.isPlatformAdmin
    ? [...coreRoutes, ...utilityRoutes, adminRoute, adminUsersRoute]
    : [...coreRoutes, ...utilityRoutes];
  const adminDrawerRoutes: AppRouteDefinition[] = viewer?.isPlatformAdmin
    ? [
        adminControlRoute,
        adminUsersRoute,
        ...(viewer?.userId
          ? [
              {
                href: `/admin/users/${viewer.userId}` as Route,
                label: "Моя карточка",
                description: "Ваши доступы, аудит и операции.",
                icon: Shield,
              },
            ]
          : []),
      ]
    : [];

  useEffect(() => {
    onDrawerOpenChange?.(isDrawerOpen);
    return () => onDrawerOpenChange?.(false);
  }, [isDrawerOpen, onDrawerOpenChange]);

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

  const portalRoot = isClientMounted ? document.body : null;

  return (
    <>
      {!minimal ? (
        <>
          <nav className="hidden flex-wrap gap-2 lg:flex">
            {desktopRoutes.map((route) => {
                const isActive = isRouteActive(pathname, route.href);

                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={`section-chip rounded-full px-4 py-2 text-sm font-semibold ${
                      isActive ? "section-chip--active" : ""
                    }`}
                    href={route.href}
                    key={route.href}
                  >
                    {route.label}
                  </Link>
                );
              })}
          </nav>

          <div className="grid gap-2 lg:hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 max-w-[55vw]">
                {!compact ? (
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                    Навигация
                  </p>
                ) : null}
                <p
                  className={`truncate font-semibold text-foreground ${
                    compact ? "text-sm" : "mt-1 text-sm"
                  }`}
                >
                  {currentSectionLabel}
                </p>
              </div>

              <button
                aria-controls="app-mobile-drawer"
                aria-expanded={isDrawerOpen}
                className="toggle-chip shrink-0 px-3.5 py-2.5 text-sm font-semibold shadow-[0_18px_34px_-24px_rgba(15,122,96,0.24)]"
                onClick={() => setIsDrawerOpen(true)}
                type="button"
              >
                <Menu size={18} strokeWidth={2.2} />
                Меню
              </button>
            </div>
          </div>
        </>
      ) : (
        <button
          aria-controls="app-mobile-drawer"
          aria-expanded={isDrawerOpen}
          aria-label="Открыть меню"
          className="toggle-chip inline-flex h-11 w-11 items-center justify-center rounded-full px-0 py-0 shadow-[0_18px_34px_-24px_rgba(15,122,96,0.24)] lg:hidden"
          data-testid="app-mobile-header-drawer-toggle"
          onClick={() => setIsDrawerOpen(true)}
          type="button"
        >
          <Menu size={18} strokeWidth={2.2} />
        </button>
      )}

      {portalRoot
        ? createPortal(
            <>
              <div
                aria-hidden={!isDrawerOpen}
                className={`app-drawer-backdrop ${isDrawerOpen ? "app-drawer-backdrop--visible" : ""}`}
                onClick={() => setIsDrawerOpen(false)}
              />

              <aside
                aria-hidden={!isDrawerOpen}
                className={`app-drawer ${isDrawerOpen ? "app-drawer--open" : ""}`}
                data-testid="app-mobile-drawer"
                id="app-mobile-drawer"
              >
                <div className="app-drawer__surface">
                  <div className="flex items-start justify-between gap-3 border-b border-border px-5 pb-4 pt-[calc(1.1rem+env(safe-area-inset-top))]">
                    <div className="min-w-0">
                      <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                        Меню
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-foreground">
                        Разделы приложения
                      </h2>
                      <p className="mt-2 truncate text-sm text-muted">
                        {viewer?.fullName ?? viewer?.email ?? "Аккаунт fit"}
                      </p>
                    </div>

                    <button
                      aria-label="Закрыть меню"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/75 text-foreground transition hover:bg-white"
                      data-testid="app-mobile-drawer-close"
                      onClick={() => setIsDrawerOpen(false)}
                      type="button"
                    >
                      <X size={18} strokeWidth={2.2} />
                    </button>
                  </div>

                  <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-5 py-5">
                    <section className="rounded-3xl border border-border bg-white/70 p-4">
                      <p className="text-sm font-semibold text-foreground">
                        {viewer?.email ?? "Аккаунт fit"}
                      </p>
                      {showAdminRole ? (
                        <p className="mt-2 text-sm text-muted">
                          Роль: <span className="text-foreground">{adminRoleLabel}</span>
                        </p>
                      ) : null}
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
                          Личное
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-foreground">
                          История и настройки
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
                      </div>
                    </section>

                    {viewer?.isPlatformAdmin ? (
                      <section className="grid gap-3">
                        <div>
                          <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                            Управление
                          </p>
                          <h3 className="mt-2 text-lg font-semibold text-foreground">
                            Платформа и пользователи
                          </h3>
                        </div>

                        <div className="grid gap-2">
                          {adminDrawerRoutes.map((route) => (
                            <DrawerRouteLink
                              {...route}
                              isActive={isRouteActive(pathname, route.href)}
                              key={route.href}
                              onNavigate={() => setIsDrawerOpen(false)}
                            />
                          ))}
                        </div>
                      </section>
                    ) : null}

                    <section className="rounded-3xl border border-border bg-[color-mix(in_srgb,var(--surface)_92%,white)] p-4">
                      <p className="font-semibold text-foreground">Аккаунт</p>
                      <div className="mt-4">
                        <SignOutButton className="w-full justify-center bg-white/75" />
                      </div>
                    </section>
                  </div>
                </div>
              </aside>
            </>,
            portalRoot,
          )
        : null}
    </>
  );
}
