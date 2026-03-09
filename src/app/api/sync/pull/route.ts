import { createApiErrorResponse } from "@/lib/api/error-response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    return Response.json({
      data: {
        cursor: searchParams.get("cursor"),
        nextCursor: new Date().toISOString(),
        changes: [],
        message:
          "Sync pull is scaffolded. Replace this placeholder with incremental Supabase reads in the next slice.",
      },
    });
  } catch {
    return createApiErrorResponse({
      status: 500,
      code: "SYNC_PULL_FAILED",
      message: "Unable to load sync changes.",
    });
  }
}
