import { NextRequest, NextResponse } from "next/server";
import { addDays, airportOptions, publicSchedule, todayIsoDate } from "@/lib/airline";
import { getDb } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import type { AirportCode, Schedule } from "@/lib/types";

export const dynamic = "force-dynamic";

function isAirportCode(value: string | null): value is AirportCode {
  return ["NZNE", "YSSY", "NZRO", "NZGB", "NZCI", "NZTL"].includes(value ?? "");
}

export async function GET(request: NextRequest) {
  try {
    await ensureSeeded();

    const db = await getDb();
    const params = request.nextUrl.searchParams;
    const date1 = params.get("date1") || todayIsoDate();
    const date2 = params.get("date2") || addDays(date1, 30);
    const orig = params.get("orig");
    const dest = params.get("dest");

    const filter: Record<string, unknown> = {
      "departureLocal.date": { $gte: date1, $lte: date2 }
    };

    if (isAirportCode(orig)) filter.origin = orig;
    if (isAirportCode(dest)) filter.destination = dest;

    const schedules = await db
      .collection<Schedule>("schedules")
      .find(filter)
      .sort({ departureAt: 1 })
      .limit(250)
      .toArray();

    return NextResponse.json({
      schedules: schedules.map(publicSchedule),
      airports: airportOptions(),
      query: { date1, date2, orig, dest }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not fetch schedules.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
