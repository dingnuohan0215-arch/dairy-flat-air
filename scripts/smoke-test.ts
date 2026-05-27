import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";
import type { Passenger, Schedule } from "../lib/types";

function loadEnvFile(fileName: string) {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] = process.env[key] ?? value;
  }
}

function reference() {
  return `DFA-SMOKE-${Date.now().toString(36).toUpperCase()}`;
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "dairy_flat_air";
  if (!uri) throw new Error("MONGODB_URI is missing.");

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const schedules = db.collection<Schedule>("schedules");
  const passengers = db.collection<Passenger>("passengers");

  const schedule = await schedules.findOne({
    departureAt: { $gte: new Date().toISOString() }
  });

  if (!schedule?._id) throw new Error("No scheduled flights found.");

  const email = "smoke.test@dairyflatair.local";
  const bookingReference = reference();
  await passengers.updateOne(
    { email },
    {
      $setOnInsert: {
        title: "Mx",
        firstName: "Smoke",
        lastName: "Test",
        email,
        createdAt: new Date().toISOString()
      }
    },
    { upsert: true }
  );

  const update = await schedules.updateOne(
    {
      _id: schedule._id,
      "bookings.email": { $ne: email },
      $expr: {
        $lt: [{ $size: { $ifNull: ["$bookings", []] } }, "$capacity"]
      }
    },
    {
      $push: {
        bookings: {
          reference: bookingReference,
          title: "Mx",
          firstName: "Smoke",
          lastName: "Test",
          email,
          createdAt: new Date().toISOString()
        }
      }
    }
  );

  if (update.modifiedCount !== 1) throw new Error("Could not create smoke-test booking.");

  const found = await schedules.findOne({ "bookings.reference": bookingReference });
  if (!found) throw new Error("Smoke-test booking was not found after creation.");

  const cancel = await schedules.updateOne(
    { "bookings.reference": bookingReference },
    { $pull: { bookings: { reference: bookingReference } } }
  );

  if (cancel.modifiedCount !== 1) throw new Error("Could not cancel smoke-test booking.");

  await passengers.deleteOne({ email });

  const [scheduleCount, passengerCount] = await Promise.all([
    schedules.countDocuments(),
    passengers.countDocuments()
  ]);

  await client.close();
  console.log(`Smoke test passed. ${scheduleCount} flights and ${passengerCount} passengers available.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
