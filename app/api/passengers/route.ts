import { NextRequest, NextResponse } from "next/server";
import { publicSchedule } from "@/lib/airline";
import { getDb } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import type { Passenger, Schedule } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await ensureSeeded();

    const email = (request.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a passenger email address." }, { status: 400 });
    }

    const db = await getDb();
    const passenger = await db.collection<Passenger>("passengers").findOne({ email });
    const schedules = await db
      .collection<Schedule>("schedules")
      .find({ "bookings.email": email })
      .sort({ departureAt: 1 })
      .toArray();

    const bookings = schedules.map((schedule) => ({
      schedule: publicSchedule(schedule),
      booking: schedule.bookings.find((item) => item.email === email)
    }));

    return NextResponse.json({ passenger, bookings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not fetch passenger bookings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
