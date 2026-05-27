import fs from "node:fs/promises";
import path from "node:path";
import { generateSchedules, todayIsoDate } from "./airline";
import { getDb } from "./db";
import type { Passenger, Schedule } from "./types";

function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      current += "\"";
      i += 1;
    } else if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

async function readPassengers() {
  const csvPath = path.join(process.cwd(), "data", "randomnames.csv");
  const text = await fs.readFile(csvPath, "utf8");
  const now = new Date().toISOString();

  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => parseCsvLine(line))
    .filter((row) => row.length === 6)
    .map<Passenger>(([sourceId, title, firstName, lastName, gender, email]) => ({
      sourceId: Number(sourceId),
      title,
      firstName,
      lastName,
      gender,
      email: email.toLowerCase(),
      createdAt: now
    }));
}

export async function createIndexes() {
  const db = await getDb();
  await Promise.all([
    db.collection<Schedule>("schedules").createIndex({ flightKey: 1 }, { unique: true }),
    db.collection<Schedule>("schedules").createIndex({ origin: 1, destination: 1, departureAt: 1 }),
    db.collection<Schedule>("schedules").createIndex({ "bookings.reference": 1 }),
    db.collection<Schedule>("schedules").createIndex({ "bookings.email": 1 }),
    db.collection<Passenger>("passengers").createIndex({ sourceId: 1 }),
    db.collection<Passenger>("passengers").createIndex({ email: 1 })
  ]);
}

export async function seedDatabase({ reset = false } = {}) {
  const db = await getDb();
  await createIndexes();

  if (reset) {
    await Promise.all([
      db.collection("schedules").deleteMany({}),
      db.collection("passengers").deleteMany({})
    ]);
  }

  const passengers = await readPassengers();
  const schedules = generateSchedules(todayIsoDate(), 120);

  if (passengers.length > 0) {
    await db.collection<Passenger>("passengers").bulkWrite(
      passengers.map((passenger) => ({
        updateOne: {
          filter: { sourceId: passenger.sourceId },
          update: { $setOnInsert: passenger },
          upsert: true
        }
      })),
      { ordered: false }
    );
  }

  if (schedules.length > 0) {
    await db.collection<Schedule>("schedules").bulkWrite(
      schedules.map((schedule) => ({
        updateOne: {
          filter: { flightKey: schedule.flightKey },
          update: { $setOnInsert: schedule },
          upsert: true
        }
      })),
      { ordered: false }
    );
  }

  const [passengerCount, scheduleCount] = await Promise.all([
    db.collection("passengers").countDocuments(),
    db.collection("schedules").countDocuments()
  ]);

  return { passengerCount, scheduleCount };
}

export async function ensureSeeded() {
  const db = await getDb();
  await createIndexes();

  const scheduleCount = await db.collection("schedules").estimatedDocumentCount();
  if (scheduleCount === 0) {
    return seedDatabase();
  }

  const passengerCount = await db.collection("passengers").estimatedDocumentCount();
  if (passengerCount === 0) {
    return seedDatabase();
  }

  return { passengerCount, scheduleCount };
}
