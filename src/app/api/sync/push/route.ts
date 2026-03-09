import { createApiErrorResponse } from "@/lib/api/error-response";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      mutations?: Array<{
        id?: string;
        entity?: string;
        operation?: string;
      }>;
    };

    return Response.json({
      data: {
        accepted: body.mutations?.length ?? 0,
        cursor: new Date().toISOString(),
        message:
          "Sync push is scaffolded. Wire mutation persistence and conflict handling in the next slice.",
      },
    });
  } catch {
    return createApiErrorResponse({
      status: 400,
      code: "SYNC_PUSH_INVALID",
      message: "Unable to accept the sync push payload.",
    });
  }
}
