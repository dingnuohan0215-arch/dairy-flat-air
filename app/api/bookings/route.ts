import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { publicSchedule } from "@/lib/airline";
import { getDb } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import type { Booking, Passenger, Schedule } from "@/lib/types";

export const dynamic = "force-dynamic";

type BookingRequest = {
  scheduleId?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

function bookingReference() {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DFA-${stamp}-${suffix}`;
}

function cleanText(value?: string) {
  return (value ?? "").trim();
}

function cleanEmail(value?: string) {
  return cleanText(value).toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    await ensureSeeded();

    const body = (await request.json()) as BookingRequest;
    const scheduleId = cleanText(body.scheduleId);
    const title = cleanText(body.title) || "Mx";
    const firstName = cleanText(body.firstName);
    const lastName = cleanText(body.lastName);
    const email = cleanEmail(body.email);

    if (!ObjectId.isValid(scheduleId)) {
      return NextResponse.json({ error: "Choose a valid scheduled flight." }, { status: 400 });
    }

    if (!firstName || !lastName || !email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Enter the passenger first name, last name, and email address." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const schedules = db.collection<Schedule>("schedules");
    const objectId = new ObjectId(scheduleId);
    const passenger: Passenger = {
      title,
      firstName,
      lastName,
      email,
      createdAt: new Date().toISOString()
    };

    const passengerResult = await db.collection<Passenger>("passengers").findOneAndUpdate(
      { email, firstName, lastName },
      { $setOnInsert: passenger },
      { upsert: true, returnDocument: "after" }
    );

    const booking: Booking = {
      reference: bookingReference(),
      passengerId: passengerResult?._id?.toString(),
      title,
      firstName,
      lastName,
      email,
      createdAt: new Date().toISOString()
    };

    const updateResult = await schedules.updateOne(
      {
        _id: objectId,
        "bookings.email": { $ne: email },
        $expr: {
          $lt: [{ $size: { $ifNull: ["$bookings", []] } }, "$capacity"]
        }
      },
      { $push: { bookings: booking } }
    );

    if (updateResult.modifiedCount !== 1) {
      const schedule = await schedules.findOne({ _id: objectId });

      if (!schedule) {
        return NextResponse.json({ error: "That scheduled flight no longer exists." }, { status: 404 });
      }

      if (schedule.bookings.some((item) => item.email === email)) {
        return NextResponse.json(
          { error: "This passenger already has a booking on that flight." },
          { status: 409 }
        );
      }

      if (schedule.bookings.length >= schedule.capacity) {
        return NextResponse.json({ error: "That flight is full." }, { status: 409 });
      }

      return NextResponse.json({ error: "The booking could not be created." }, { status: 409 });
    }

    const bookedSchedule = await schedules.findOne({ _id: objectId });

    return NextResponse.json(
      {
        booking,
        schedule: bookedSchedule ? publicSchedule(bookedSchedule) : null
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create booking.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
