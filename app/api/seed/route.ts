import { NextRequest, NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const configuredSecret = process.env.SEED_SECRET?.trim();
    const providedSecret =
      request.headers.get("x-seed-secret") ?? request.nextUrl.searchParams.get("secret") ?? "";

    if (configuredSecret && providedSecret !== configuredSecret) {
      return NextResponse.json({ error: "Seed secret is missing or incorrect." }, { status: 401 });
    }

    const result = await seedDatabase({ reset: true });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not seed database.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
