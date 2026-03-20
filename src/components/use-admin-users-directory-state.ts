"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import {
  areAllVisibleUsersSelected,
  buildActiveFilterSummary,
  buildAdminUsersSearchParams,
  buildBulkActionNotice,
  buildBulkActionRequest,
  buildVisibleUserIds,
  buildVisibleUsersSummary,
  emptySegments,
  emptySummary,
  filterSelectedUserIdsForVisibleUsers,
  toggleSelectedUserId,
  toggleVisibleUserSelection,
  type ActivityFilter,
  type AdminUsersBulkResponse,
  type AdminUsersFetchResponse,
  type AdminRoleFilter,
  type AdminUserRow,
  type AdminUsersSegments,
  type AdminUsersSortKey,
  type AdminUsersSummary,
  type BulkAction,
  type RecentBulkWave,
} from "@/components/admin-users-directory-model";

export function useAdminUsersDirectoryState(params: {
  canRunBulkActions: boolean;
  canViewRoleDetails: boolean;
}) {
  const { canRunBulkActions, canViewRoleDetails } = params;
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [catalogSummary, setCatalogSummary] =
    useState<AdminUsersSummary>(emptySummary);
  const [segments, setSegments] = useState<AdminUsersSegments>(emptySegments);
  const [recentBulkWaves, setRecentBulkWaves] = useState<RecentBulkWave[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDegraded, setIsDegraded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminRoleFilter>("all");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [sortKey, setSortKey] = useState<AdminUsersSortKey>("created_desc");
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>("queue_export");
  const [bulkReason, setBulkReason] = useState("");
  const [bulkTrialDays, setBulkTrialDays] = useState("14");
  const [bulkFeatureKey, setBulkFeatureKey] = useState("ai_chat");
  const [bulkLimitValue, setBulkLimitValue] = useState("");
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);
  const [isBulkPending, setIsBulkPending] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    let isActive = true;

    async function loadUsers() {
      setIsLoading(true);
      setIsDegraded(false);

      try {
        const searchParams = buildAdminUsersSearchParams({
          activityFilter,
          roleFilter,
          searchQuery: deferredSearchQuery,
          sortKey,
        });
        const queryString = searchParams.toString();
        const response = await fetch(
          queryString ? `/api/admin/users?${queryString}` : "/api/admin/users",
          {
            cache: "no-store",
          },
        );
        const payload = (await response
          .json()
          .catch(() => null)) as AdminUsersFetchResponse;

        if (!response.ok) {
          if (isActive) {
            setError(payload?.message ?? "Не удалось загрузить пользователей.");
            setUsers([]);
            setCatalogSummary(emptySummary);
            setSegments(emptySegments);
            setRecentBulkWaves([]);
          }
          return;
        }

        if (isActive) {
          setUsers(payload?.data ?? []);
          setCatalogSummary(payload?.summary ?? emptySummary);
          setSegments(payload?.segments ?? emptySegments);
          setRecentBulkWaves(payload?.recentBulkWaves ?? []);
          setIsDegraded(Boolean(payload?.meta?.degraded));
          setSelectedUserIds((currentSelected) =>
            filterSelectedUserIdsForVisibleUsers(currentSelected, payload?.data ?? []),
          );
          setError(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      isActive = false;
    };
  }, [activityFilter, deferredSearchQuery, reloadToken, roleFilter, sortKey]);

  const summary = useMemo(
    () => buildVisibleUsersSummary(users, catalogSummary),
    [catalogSummary, users],
  );
  const isFiltered =
    Boolean(searchQuery.trim()) || roleFilter !== "all" || activityFilter !== "all";
  const visibleUserIds = buildVisibleUserIds(users);
  const allVisibleSelected = areAllVisibleUsersSelected(selectedUserIds, visibleUserIds);
  const activeFilterSummary = useMemo(
    () =>
      buildActiveFilterSummary({
        searchQuery,
        canViewRoleDetails,
        roleFilter,
        activityFilter,
        sortKey,
      }),
    [activityFilter, canViewRoleDetails, roleFilter, searchQuery, sortKey],
  );

  function reloadCatalog() {
    setReloadToken((value) => value + 1);
  }

  function resetFilters() {
    setSearchQuery("");
    setRoleFilter("all");
    setActivityFilter("all");
    setSortKey("created_desc");
  }

  function toggleUserSelection(userId: string) {
    setSelectedUserIds((current) => toggleSelectedUserId(current, userId));
  }

  function toggleVisibleSelection() {
    setSelectedUserIds((current) => toggleVisibleUserSelection(current, visibleUserIds));
  }

  function clearSelection() {
    setSelectedUserIds([]);
  }

  function submitBulkAction() {
    if (!canRunBulkActions || !selectedUserIds.length) {
      return;
    }

    setError(null);
    setBulkNotice(null);
    setIsBulkPending(true);

    const body = buildBulkActionRequest({
      bulkAction,
      bulkFeatureKey,
      bulkLimitValue,
      bulkReason,
      bulkTrialDays,
      selectedUserIds,
    });

    void (async () => {
      try {
        const response = await fetch("/api/admin/users/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        const payload = (await response
          .json()
          .catch(() => null)) as AdminUsersBulkResponse;

        if (!response.ok) {
          setError(payload?.message ?? "Не удалось выполнить массовое действие.");
          return;
        }

        setBulkNotice(buildBulkActionNotice(payload));
        setSelectedUserIds([]);
        reloadCatalog();
      } finally {
        setIsBulkPending(false);
      }
    })();
  }

  return {
    activeFilterSummary,
    activityFilter,
    allVisibleSelected,
    bulkAction,
    bulkFeatureKey,
    bulkLimitValue,
    bulkNotice,
    bulkReason,
    bulkTrialDays,
    catalogSummary,
    error,
    isBulkPending,
    isDegraded,
    isFiltered,
    isLoading,
    recentBulkWaves,
    clearSelection,
    reloadCatalog,
    resetFilters,
    roleFilter,
    searchQuery,
    segments,
    selectedUserIds,
    setActivityFilter,
    setBulkAction,
    setBulkFeatureKey,
    setBulkLimitValue,
    setBulkReason,
    setBulkTrialDays,
    setRoleFilter,
    setSearchQuery,
    setSortKey,
    sortKey,
    submitBulkAction,
    summary,
    toggleUserSelection,
    toggleVisibleSelection,
    users,
  };
}
