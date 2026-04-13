"use client";

import { AssistantMarkdown } from "@/components/assistant-markdown";
import {
  ProposalActionToolCard,
  ProposalListToolCard,
  ProposalToolCard,
  SearchToolCard,
} from "@/components/ai-chat-panel-cards";
import type {
  AssistantProposalTarget,
  AssistantToolPart,
} from "@/components/ai-chat-panel-model";
import { timeFormatter } from "@/components/ai-chat-panel-model";

type TranscriptMessage = {
  id: string;
  role: string;
  parts: unknown[];
};

export function AiChatTranscript({
  actionBusyKey,
  lastAssistantMessageId,
  messageTimes,
  messages,
  nowLabel,
  onApplyProposal,
  onApproveProposal,
  scrollViewportRef,
  status,
}: {
  actionBusyKey: string | null;
  lastAssistantMessageId: string | null;
  messageTimes: Map<string, string>;
  messages: TranscriptMessage[];
  nowLabel: string;
  onApplyProposal: (target: AssistantProposalTarget) => void;
  onApproveProposal: (target: AssistantProposalTarget) => void;
  scrollViewportRef: React.RefObject<HTMLDivElement | null>;
  status: string;
}) {
  return (
    <div
      className="surface-panel surface-panel--soft mt-4 flex-1 overflow-y-auto p-3 sm:p-4"
      data-testid="ai-chat-transcript"
      ref={scrollViewportRef}
    >
      <div className="grid gap-4">
        {messages.length ? (
          messages.map((message) => (
            <article
              className={`chat-bubble ${
                message.role === "assistant"
                  ? "chat-bubble--assistant"
                  : "chat-bubble--user ml-auto"
              }`}
              data-message-id={message.id}
              data-role={message.role}
              data-testid="ai-transcript-message"
              key={message.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {message.role === "assistant" ? "AI-коуч" : "Ты"}
                </p>
                <p className="text-xs text-muted">
                  {messageTimes.has(message.id)
                    ? timeFormatter.format(
                        new Date(messageTimes.get(message.id) ?? ""),
                      )
                    : nowLabel}
                </p>
              </div>

              <div className="mt-3 grid gap-3">
                {(message.parts as AssistantToolPart[]).map((part, index) => {
                  if (part.type === "text") {
                    return (
                      <AssistantMarkdown
                        isStreaming={
                          message.role === "assistant" &&
                          status === "streaming" &&
                          message.id === lastAssistantMessageId
                        }
                        key={`${message.id}-text-${index}`}
                        text={part.text}
                      />
                    );
                  }

                  if (part.type === "tool-createWorkoutPlan") {
                    return (
                      <ProposalToolCard
                        key={`${message.id}-workout-${index}`}
                        output={part.output}
                        state={part.state}
                      />
                    );
                  }

                  if (part.type === "tool-createMealPlan") {
                    return (
                      <ProposalToolCard
                        key={`${message.id}-meal-${index}`}
                        output={part.output}
                        state={part.state}
                      />
                    );
                  }

                  if (part.type === "tool-searchWeb") {
                    return (
                      <SearchToolCard
                        key={`${message.id}-search-${index}`}
                        output={part.output}
                        state={part.state}
                      />
                    );
                  }

                  if (part.type === "tool-listRecentProposals") {
                    return (
                      <ProposalListToolCard
                        actionBusyKey={actionBusyKey}
                        key={`${message.id}-proposal-list-${index}`}
                        onApply={onApplyProposal}
                        onApprove={onApproveProposal}
                        output={part.output}
                        state={part.state}
                      />
                    );
                  }

                  if (part.type === "tool-approveProposal") {
                    return (
                      <ProposalActionToolCard
                        actionBusyKey={actionBusyKey}
                        key={`${message.id}-proposal-approve-${index}`}
                        onApply={onApplyProposal}
                        output={part.output}
                        state={part.state}
                        variant="approve"
                      />
                    );
                  }

                  if (part.type === "tool-applyProposal") {
                    return (
                      <ProposalActionToolCard
                        actionBusyKey={actionBusyKey}
                        key={`${message.id}-proposal-apply-${index}`}
                        onApply={onApplyProposal}
                        output={part.output}
                        state={part.state}
                        variant="apply"
                      />
                    );
                  }

                  if (part.type === "tool-call") {
                    return (
                      <div
                        className="rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm text-muted"
                        key={`${message.id}-tool-call-${index}`}
                      >
                        Выполняю действие: {part.toolName}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </article>
          ))
        ) : (
          <div
            className="surface-panel border-dashed px-4 py-6"
            data-testid="ai-transcript-empty"
          >
            <p className="text-sm font-semibold text-foreground">
              Здесь появятся разбор, план и история решений.
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Начни с одного запроса: попроси оценить прогресс, собрать
              тренировку, составить план питания или разобрать фото еды.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
