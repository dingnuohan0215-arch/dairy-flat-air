import { NextRequest, NextResponse } from "next/server";
import { publicSchedule } from "@/lib/airline";
import { getDb } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import type { Schedule } from "@/lib/types";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    reference: string;
  }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await ensureSeeded();

    const params = await context.params;
    const reference = decodeURIComponent(params.reference).trim().toUpperCase();
    const db = await getDb();
    const schedules = db.collection<Schedule>("schedules");
    const schedule = await schedules.findOne({ "bookings.reference": reference });

    if (!schedule) {
      return NextResponse.json({ error: "Booking reference not found." }, { status: 404 });
    }

    const booking = schedule.bookings.find((item) => item.reference === reference);
    await schedules.updateOne(
      { _id: schedule._id },
      { $pull: { bookings: { reference } } }
    );

    return NextResponse.json({
      cancelled: booking,
      schedule: publicSchedule({
        ...schedule,
        bookings: schedule.bookings.filter((item) => item.reference !== reference)
      })
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not cancel booking.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
