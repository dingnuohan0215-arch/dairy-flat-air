import fs from "node:fs";
import path from "node:path";
import { seedDatabase } from "../lib/seed";

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

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const result = await seedDatabase({ reset: true });
  console.log(`Seeded ${result.scheduleCount} scheduled flights.`);
  console.log(`Loaded ${result.passengerCount} passengers.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
