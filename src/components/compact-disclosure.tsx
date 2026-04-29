"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";

type CompactDisclosureProps = {
  badge?: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  eyebrow?: string;
  id?: string;
  summary?: ReactNode;
  title: string;
};

export function CompactDisclosure({
  badge,
  children,
  className = "",
  defaultOpen = false,
  eyebrow,
  id,
  summary,
  title,
}: CompactDisclosureProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section
      className={`compact-disclosure ${isOpen ? "compact-disclosure--open" : ""} ${className}`.trim()}
      id={id}
    >
      <button
        aria-controls={contentId}
        aria-expanded={isOpen}
        className="compact-disclosure__trigger"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="min-w-0">
          {eyebrow ? <span className="compact-disclosure__eyebrow">{eyebrow}</span> : null}
          <span className="compact-disclosure__title">{title}</span>
          {summary ? <span className="compact-disclosure__summary">{summary}</span> : null}
        </span>

        <span className="compact-disclosure__side">
          {badge ? <span className="pill">{badge}</span> : null}
          <svg
            aria-hidden="true"
            className="compact-disclosure__chevron"
            fill="none"
            height="18"
            viewBox="0 0 18 18"
            width="18"
          >
            <path
              d="M4.5 6.75 9 11.25l4.5-4.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </span>
      </button>

      {isOpen ? (
        <div className="compact-disclosure__content" id={contentId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
