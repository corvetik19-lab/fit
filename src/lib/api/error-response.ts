import { NextResponse } from "next/server";

export function createApiErrorResponse({
  status,
  code,
  message,
  details,
}: {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}) {
  return NextResponse.json(
    {
      code,
      message,
      contextId: crypto.randomUUID(),
      error: true,
      details,
    },
    { status },
  );
}
