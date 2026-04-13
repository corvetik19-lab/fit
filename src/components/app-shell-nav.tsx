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
  description: string;
  href: Route;
  icon: LucideIcon;
  label: string;
};

type PlatformAdminRole = "super_admin" | "support_admin" | "analyst" | null;

type AppShellNavProps = {
  compact?: boolean;
  minimal?: boolean;
  onDrawerOpenChange?: (isOpen: boolean) => void;
  viewer: {
    email: string | null;
    fullName: string | null;
    isPlatformAdmin: boolean;
    platformAdminRole: PlatformAdminRole;
    userId: string;
  } | null;
};

const dashboardRoute: AppRouteDefinition = {
  href: "/dashboard",
  label: "Обзор",
  description: "Главные сигналы дня.",
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
  description: "Логи, фото и штрихкоды.",
  icon: Activity,
};

const historyRoute: AppRouteDefinition = {
  href: "/history",
  label: "Архив",
  description: "Прошлые циклы и история.",
  icon: History,
};

const aiRoute: AppRouteDefinition = {
  href: "/ai",
  label: "AI коуч",
  description: "Диалог и предложения.",
  icon: Sparkles,
};

const settingsRoute: AppRouteDefinition = {
  href: "/settings",
  label: "Настройки",
  description: "Профиль, данные и доступ.",
  icon: Settings2,
};

const adminRoute: AppRouteDefinition = {
  href: "/admin",
  label: "Центр управления",
  description: "Системное состояние и очереди.",
  icon: Shield,
};

const adminUsersRoute: AppRouteDefinition = {
  href: "/admin/users",
  label: "Пользователи",
  description: "Каталог, роли и операции.",
  icon: Shield,
};

const coreRoutes = [dashboardRoute, workoutsRoute, nutritionRoute, aiRoute];
const utilityRoutes = [historyRoute, settingsRoute];
const mobileBottomRoutes = [
  dashboardRoute,
  workoutsRoute,
  nutritionRoute,
  aiRoute,
  historyRoute,
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

function DesktopRouteLink({
  href,
  isActive,
  label,
}: {
  href: Route;
  isActive: boolean;
  label: string;
}) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`section-chip rounded-full px-4 py-2 text-sm font-semibold ${
        isActive ? "section-chip--active" : ""
      }`}
      href={href}
    >
      {label}
    </Link>
  );
}

function DrawerRouteLink({
  description,
  href,
  icon: Icon,
  isActive,
  label,
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
        <Icon size={18} strokeWidth={2.1} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-xs text-muted">{description}</span>
      </span>
      <ArrowRight size={15} strokeWidth={2.1} />
    </Link>
  );
}

export function AppShellNav({
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
        adminRoute,
        adminUsersRoute,
        ...(viewer?.userId
          ? [
              {
                href: `/admin/users/${viewer.userId}` as Route,
                label: "Моя карточка",
                description: "Ваши доступы и аудит.",
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
      {minimal ? (
        <button
          aria-controls="app-mobile-drawer"
          aria-expanded={isDrawerOpen}
          aria-label="Открыть меню"
          className="toggle-chip inline-flex h-11 w-11 items-center justify-center rounded-full px-0 py-0 lg:hidden"
          data-testid="app-mobile-header-drawer-toggle"
          onClick={() => setIsDrawerOpen(true)}
          type="button"
        >
          <Menu size={18} strokeWidth={2.1} />
        </button>
      ) : (
        <nav className="hidden flex-wrap gap-2 lg:flex">
          {desktopRoutes.map((route) => (
            <DesktopRouteLink
              href={route.href}
              isActive={isRouteActive(pathname, route.href)}
              key={route.href}
              label={route.label}
            />
          ))}
        </nav>
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
                  <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 pb-4 pt-[calc(1.1rem+env(safe-area-inset-top))]">
                    <div className="min-w-0">
                      <p className="workspace-kicker">fit</p>
                      <h2 className="app-display mt-2 text-2xl font-semibold text-foreground">
                        Разделы приложения
                      </h2>
                      <p className="mt-2 truncate text-sm text-muted">
                        {viewer?.fullName ?? viewer?.email ?? "Аккаунт fit"}
                      </p>
                    </div>

                    <button
                      aria-label="Закрыть меню"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-white/90 text-foreground transition hover:bg-white"
                      data-testid="app-mobile-drawer-close"
                      onClick={() => setIsDrawerOpen(false)}
                      type="button"
                    >
                      <X size={18} strokeWidth={2.1} />
                    </button>
                  </div>

                  <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-5 py-5">
                    <section className="surface-panel p-4">
                      <p className="text-sm font-semibold text-foreground">
                        {viewer?.email ?? "Аккаунт fit"}
                      </p>
                      {showAdminRole ? (
                        <p className="mt-2 text-sm text-muted">
                          Роль:{" "}
                          <span className="text-foreground">{adminRoleLabel}</span>
                        </p>
                      ) : null}
                    </section>

                    <section className="grid gap-3">
                      <div>
                        <p className="workspace-kicker">Основное</p>
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
                        <p className="workspace-kicker">Личное</p>
                        <h3 className="mt-2 text-lg font-semibold text-foreground">
                          Архив и настройки
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
                          <p className="workspace-kicker">Операторский доступ</p>
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

                    <section className="surface-panel p-4">
                      <p className="font-semibold text-foreground">Аккаунт</p>
                      <div className="mt-4">
                        <SignOutButton className="w-full justify-center bg-white" />
                      </div>
                    </section>
                  </div>
                </div>
              </aside>

              {viewer ? (
                <div className="app-bottom-nav lg:hidden">
                  <nav className="app-bottom-nav__inner">
                    {mobileBottomRoutes.map((route) => {
                      const isActive = isRouteActive(pathname, route.href);
                      const Icon = route.icon;

                      return (
                        <Link
                          aria-current={isActive ? "page" : undefined}
                          className={`app-bottom-nav__item ${
                            isActive ? "app-bottom-nav__item--active" : ""
                          }`}
                          href={route.href}
                          key={route.href}
                        >
                          <Icon size={18} strokeWidth={2.1} />
                          <span>{route.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              ) : null}
            </>,
            portalRoot,
          )
        : null}
    </>
  );
}
