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

import { RepairMojibakeTree } from "@/components/repair-mojibake-tree";
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

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

const dashboardRoute: AppRouteDefinition = {
  description: "Фокус дня, прогресс и ключевые сигналы.",
  href: "/dashboard",
  icon: BarChart3,
  label: "Обзор",
};

const workoutsRoute: AppRouteDefinition = {
  description: "Программы, недели и выполнение.",
  href: "/workouts",
  icon: Dumbbell,
  label: "Тренировки",
};

const nutritionRoute: AppRouteDefinition = {
  description: "Баланс, фото еды и штрихкоды.",
  href: "/nutrition",
  icon: Activity,
  label: "Питание",
};

const historyRoute: AppRouteDefinition = {
  description: "Архив программ, прогресса и действий.",
  href: "/history",
  icon: History,
  label: "История",
};

const aiRoute: AppRouteDefinition = {
  description: "Коуч, планы и контекст.",
  href: "/ai",
  icon: Sparkles,
  label: "AI",
};

const settingsRoute: AppRouteDefinition = {
  description: "Профиль, доступ и данные.",
  href: "/settings",
  icon: Settings2,
  label: "Настройки",
};

const adminRoute: AppRouteDefinition = {
  description: "Состояние платформы и очереди.",
  href: "/admin",
  icon: Shield,
  label: "Админ",
};

const adminUsersRoute: AppRouteDefinition = {
  description: "Каталог, роли и операции.",
  href: "/admin/users",
  icon: Shield,
  label: "Пользователи",
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
      className={`section-chip px-2.5 py-2 text-sm font-semibold ${
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
        <span className="mt-0.5 hidden text-xs text-muted sm:block">
          {description}
        </span>
      </span>
      <ArrowRight size={15} strokeWidth={2.1} />
    </Link>
  );
}

function MobileShellNav({
  adminDrawerRoutes,
  onDrawerOpenChange,
  pathname,
  showAdminRole,
  viewer,
}: {
  adminDrawerRoutes: AppRouteDefinition[];
  onDrawerOpenChange?: (isOpen: boolean) => void;
  pathname: string;
  showAdminRole: boolean;
  viewer: AppShellNavProps["viewer"];
}) {
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const adminRoleLabel = formatAdminRole(viewer?.platformAdminRole ?? null);
  const viewerIdentity = viewer?.fullName ?? viewer?.email ?? "Аккаунт fitora";

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

  return (
    <RepairMojibakeTree>
      <>
        <button
          aria-controls="app-mobile-drawer"
          aria-expanded={isDrawerOpen}
          aria-label="Открыть меню"
          className="toggle-chip inline-flex h-10 w-10 items-center justify-center rounded-[0.95rem] px-0 py-0"
          data-testid="app-mobile-header-drawer-toggle"
          onClick={() => setIsDrawerOpen(true)}
          type="button"
        >
          <Menu size={18} strokeWidth={2.1} />
        </button>

        {isHydrated
          ? createPortal(
              <>
                <div
                  aria-hidden={!isDrawerOpen}
                  className={`app-drawer-backdrop ${
                    isDrawerOpen ? "app-drawer-backdrop--visible" : ""
                  }`}
                  onClick={() => setIsDrawerOpen(false)}
                />

                <aside
                  aria-hidden={!isDrawerOpen}
                  className={`app-drawer ${
                    isDrawerOpen ? "app-drawer--open" : ""
                  }`}
                  data-testid="app-mobile-drawer"
                  id="app-mobile-drawer"
                >
                  <div className="app-drawer__surface">
                    <div className="flex items-start justify-between gap-3 border-b border-border px-4 pb-3 pt-[calc(0.9rem+env(safe-area-inset-top))]">
                      <div className="min-w-0">
                        <p className="workspace-kicker">fitora</p>
                        <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">
                          Разделы
                        </h2>
                        <p className="mt-1 truncate text-xs text-muted">
                          {viewerIdentity}
                        </p>
                      </div>

                      <button
                        aria-label="Закрыть меню"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-[0.95rem] border border-border bg-white/88 text-muted transition hover:bg-white"
                        data-testid="app-mobile-drawer-close"
                        onClick={() => setIsDrawerOpen(false)}
                        type="button"
                      >
                        <X size={18} strokeWidth={2.1} />
                      </button>
                    </div>

                    <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto px-4 py-4">
                      <section className="surface-panel surface-panel--soft p-3">
                        <p className="break-all text-sm font-semibold text-foreground">
                          {viewer?.email ?? "Аккаунт fitora"}
                        </p>
                        {showAdminRole ? (
                          <p className="mt-1.5 text-xs text-muted">
                            Роль:{" "}
                            <span className="text-foreground">
                              {adminRoleLabel}
                            </span>
                          </p>
                        ) : null}
                      </section>

                      <section className="grid gap-2.5">
                        <div>
                          <p className="workspace-kicker">Основное</p>
                          <h3 className="mt-1 text-base font-semibold text-foreground">
                            Ежедневная работа
                          </h3>
                        </div>

                        <div className="grid gap-1.5">
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

                      <section className="grid gap-2.5">
                        <div>
                          <p className="workspace-kicker">Личное</p>
                          <h3 className="mt-1 text-base font-semibold text-foreground">
                            История и контроль
                          </h3>
                        </div>

                        <div className="grid gap-1.5">
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
                        <section className="grid gap-2.5">
                          <div>
                            <p className="workspace-kicker">
                              Операторский доступ
                            </p>
                            <h3 className="mt-1 text-base font-semibold text-foreground">
                              Платформа и пользователи
                            </h3>
                          </div>

                          <div className="grid gap-1.5">
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

                      <section className="surface-panel surface-panel--soft p-3">
                        <p className="text-sm font-semibold text-foreground">
                          Аккаунт
                        </p>
                        <div className="mt-3">
                          <SignOutButton className="w-full justify-center" />
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
              document.body,
            )
          : null}
      </>
    </RepairMojibakeTree>
  );
}

export function AppShellNav({
  minimal = false,
  onDrawerOpenChange,
  viewer,
}: AppShellNavProps) {
  const pathname = usePathname();
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
        ...(viewer.userId
          ? [
              {
                description: "Доступ, аудит и контент.",
                href: `/admin/users/${viewer.userId}` as Route,
                icon: Shield,
                label: "Моя карточка",
              },
            ]
          : []),
      ]
    : [];

  if (!minimal) {
    return (
      <RepairMojibakeTree>
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
      </RepairMojibakeTree>
    );
  }

  return (
    <MobileShellNav
      adminDrawerRoutes={adminDrawerRoutes}
      onDrawerOpenChange={onDrawerOpenChange}
      pathname={pathname}
      showAdminRole={showAdminRole}
      viewer={viewer}
    />
  );
}
