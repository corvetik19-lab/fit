import Link from "next/link";
import { LoaderCircle } from "lucide-react";

import {
  formatProposalStatus,
  formatProposalType,
  type AssistantProposalActionOutput,
  type AssistantProposalListOutput,
  type AssistantProposalOutput,
  type AssistantProposalTarget,
  type AssistantProposalType,
  type AssistantSearchOutput,
} from "@/components/ai-chat-panel-model";

function ProposalStatusPill({
  proposalType,
  status,
}: {
  proposalType: AssistantProposalType;
  status: string;
}) {
  return (
    <span className="pill">
      {proposalType === "workout_plan" ? "Тренировки" : "Питание"} ·{" "}
      {formatProposalStatus(status)}
    </span>
  );
}

function LoadingToolCard({ text }: { text: string }) {
  return (
    <div className="surface-panel px-4 py-4 text-sm text-muted">
      <div className="flex items-center gap-2">
        <LoaderCircle className="animate-spin" size={16} />
        {text}
      </div>
    </div>
  );
}

export function ProposalToolCard({
  output,
  state,
}: {
  output?: AssistantProposalOutput;
  state: string;
}) {
  if (state === "input-streaming" || state === "input-available") {
    return <LoadingToolCard text="Собираю новый черновик плана..." />;
  }

  if (!output) {
    return null;
  }

  return (
    <div className="surface-panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill">Шаг 3 · Черновик</span>
            <span className="pill">
              {output.proposalType === "workout_plan" ? "Тренировки" : "Питание"}
            </span>
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">{output.title}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{output.description}</p>
        </div>
      </div>

      {output.highlights.length ? (
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted">
          {output.highlights.slice(0, 4).map((item) => (
            <li key={`${output.proposalId}-${item}`}>{item}</li>
          ))}
        </ul>
      ) : null}

      <p className="mt-4 text-sm leading-6 text-muted">
        Черновик уже сохранён. Следующий шаг: подтвердить его или сразу
        применить прямо из этого чата.
      </p>
    </div>
  );
}

export function SearchToolCard({
  output,
  state,
}: {
  output?: AssistantSearchOutput;
  state: string;
}) {
  if (state === "input-streaming" || state === "input-available") {
    return <LoadingToolCard text="Ищу свежую информацию..." />;
  }

  if (!output) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-border bg-white/90 p-4">
      <p className="text-sm font-semibold text-foreground">
        Поиск в интернете: {output.query}
      </p>
      <div className="mt-3 grid gap-3">
        {output.results.length ? (
          output.results.map((result) => (
            <a
              className="rounded-2xl border border-border bg-white/80 px-3 py-3 text-sm transition hover:border-accent/40 hover:bg-white"
              href={result.url}
              key={`${output.query}-${result.url}`}
              rel="noreferrer"
              target="_blank"
            >
              <p className="font-semibold text-foreground">{result.title}</p>
              {result.snippet ? (
                <p className="mt-1 leading-6 text-muted">{result.snippet}</p>
              ) : null}
            </a>
          ))
        ) : (
          <p className="text-sm text-muted">Подходящих результатов не нашлось.</p>
        )}
      </div>
    </div>
  );
}

export function ProposalListToolCard({
  actionBusyKey,
  onApply,
  onApprove,
  output,
  state,
}: {
  actionBusyKey: string | null;
  onApply: (target: AssistantProposalTarget) => void;
  onApprove: (target: AssistantProposalTarget) => void;
  output?: AssistantProposalListOutput;
  state: string;
}) {
  if (state === "input-streaming" || state === "input-available") {
    return <LoadingToolCard text="Поднимаю последние предложения..." />;
  }

  if (!output) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-border bg-white/90 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Шаг 4 · Проверка черновиков
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">
            Ниже можно быстро выбрать сохранённый черновик и перейти к
            подтверждению или применению.
          </p>
        </div>
        <span className="pill">{output.count}</span>
      </div>

      <div className="mt-3 grid gap-3">
        {output.items.length ? (
          output.items.slice(0, 4).map((item) => (
            <div
              className="rounded-2xl border border-border bg-white/80 px-3 py-3"
              key={item.proposalId}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {`Сохранённый ${formatProposalType(item.proposalType)}-план.`}
                  </p>
                </div>
                <ProposalStatusPill
                  proposalType={item.proposalType}
                  status={item.status}
                />
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                {item.status === "applied"
                  ? "Уже добавлен в приложение."
                  : item.status === "approved"
                    ? "Подтверждён и готов к применению."
                    : "Черновик готов к проверке и применению."}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {item.status === "draft" ? (
                  <button
                    className="rounded-full border border-border bg-white/80 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={actionBusyKey === `approve:${item.proposalId}`}
                    onClick={() =>
                      onApprove({
                        proposalId: item.proposalId,
                        proposalType: item.proposalType,
                      })
                    }
                    type="button"
                  >
                    {actionBusyKey === `approve:${item.proposalId}`
                      ? "Подтверждаю..."
                      : "Подтвердить"}
                  </button>
                ) : null}

                {item.status !== "applied" ? (
                  <button
                    className="rounded-full bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={actionBusyKey === `apply:${item.proposalId}`}
                    onClick={() =>
                      onApply({
                        proposalId: item.proposalId,
                        proposalType: item.proposalType,
                      })
                    }
                    type="button"
                  >
                    {actionBusyKey === `apply:${item.proposalId}`
                      ? "Применяю..."
                      : "Применить"}
                  </button>
                ) : (
                  <Link
                    className="rounded-full border border-border bg-white/80 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white"
                    href={item.proposalType === "workout_plan" ? "/workouts" : "/nutrition"}
                  >
                    Открыть раздел
                  </Link>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">Сохранённых предложений пока нет.</p>
        )}
      </div>
    </div>
  );
}

export function ProposalActionToolCard({
  actionBusyKey,
  onApply,
  output,
  state,
  variant,
}: {
  actionBusyKey: string | null;
  onApply: (target: AssistantProposalTarget) => void;
  output?: AssistantProposalActionOutput;
  state: string;
  variant: "approve" | "apply";
}) {
  if (state === "input-streaming" || state === "input-available") {
    return (
      <LoadingToolCard
        text={
          variant === "approve"
            ? "Подтверждаю предложение..."
            : "Применяю предложение..."
        }
      />
    );
  }

  if (!output) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-border bg-white/90 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill">
              {variant === "approve" ? "Шаг 4 · Подтверждение" : "Шаг 5 · Применение"}
            </span>
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">{output.title}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{output.summary}</p>
        </div>
        <ProposalStatusPill
          proposalType={output.proposalType}
          status={output.status}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {output.status !== "applied" ? (
          <button
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={actionBusyKey === `apply:${output.proposalId}`}
            onClick={() =>
              onApply({
                proposalId: output.proposalId,
                proposalType: output.proposalType,
              })
            }
            type="button"
          >
            {actionBusyKey === `apply:${output.proposalId}`
              ? "Применяю..."
              : "Применить"}
          </button>
        ) : null}

        <Link
          className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white"
          href={output.proposalType === "workout_plan" ? "/workouts" : "/nutrition"}
        >
          Открыть раздел
        </Link>
      </div>
    </div>
  );
}
