type WorkoutDayNoticesProps = {
  dayIsLocked: boolean;
  error: string | null;
  isOnline: boolean;
  notice: string | null;
  pendingMutationCount: number;
};

export function WorkoutDayNotices({
  dayIsLocked,
  error,
  isOnline,
  notice,
  pendingMutationCount,
}: WorkoutDayNoticesProps) {
  return (
    <>
      {!dayIsLocked ? (
        <p className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Отмечать выполнение можно после фиксации недели.
        </p>
      ) : null}

      {!isOnline ? (
        <p className="mt-4 rounded-2xl border border-sky-300/60 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Нет связи. Изменения по этой тренировке сохраняются на устройстве и
          отправятся автоматически, когда интернет вернётся.
        </p>
      ) : null}

      {pendingMutationCount > 0 ? (
        <p className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Ждут отправки с этого устройства: {pendingMutationCount}.
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="mt-4 rounded-2xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}
    </>
  );
}
