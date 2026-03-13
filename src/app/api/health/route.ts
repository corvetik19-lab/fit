import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      app: "fit",
      status: "ok",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
