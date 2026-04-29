import {
  cloneElement,
  isValidElement,
  type ReactNode,
} from "react";

import { repairMojibakeText } from "@/lib/text/repair-mojibake";

function sanitizePropValue(value: unknown): unknown {
  if (typeof value === "string") {
    return repairMojibakeText(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizePropValue(entry));
  }

  if (isValidElement(value)) {
    return sanitizeNode(value);
  }

  return value;
}

function sanitizeNode(node: ReactNode): ReactNode {
  if (typeof node === "string") {
    return repairMojibakeText(node);
  }

  if (Array.isArray(node)) {
    return node.map((entry, index) => (
      <RepairMojibakeTree key={index}>{entry}</RepairMojibakeTree>
    ));
  }

  if (!isValidElement(node)) {
    return node;
  }

  const props = node.props as Record<string, unknown>;
  const nextProps: Record<string, unknown> = {};
  let shouldClone = false;

  for (const [key, value] of Object.entries(props)) {
    const sanitizedValue =
      key === "children" ? sanitizeNode(value as ReactNode) : sanitizePropValue(value);

    if (sanitizedValue !== value) {
      nextProps[key] = sanitizedValue;
      shouldClone = true;
    }
  }

  return shouldClone ? cloneElement(node, nextProps) : node;
}

export function RepairMojibakeTree({ children }: { children: ReactNode }) {
  return <>{sanitizeNode(children)}</>;
}
