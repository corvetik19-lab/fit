"use client";

import { Streamdown } from "streamdown";

import "streamdown/styles.css";

export function AssistantMarkdown({
  isStreaming,
  text,
}: {
  isStreaming: boolean;
  text: string;
}) {
  return (
    <div className="text-sm leading-7 text-foreground">
      <Streamdown isAnimating={isStreaming}>{text}</Streamdown>
    </div>
  );
}
