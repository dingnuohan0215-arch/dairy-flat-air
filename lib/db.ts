import { Db, MongoClient } from "mongodb";

type MongoCache = {
  client?: MongoClient;
  db?: Db;
};

declare global {
  var __dairyFlatMongo: MongoCache | undefined;
}

const cache = global.__dairyFlatMongo ?? {};
global.__dairyFlatMongo = cache;

export async function getDb() {
  if (cache.db) return cache.db;

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "dairy_flat_air";

  if (!uri) {
    throw new Error("MONGODB_URI is not configured. Add it to .env.local or Vercel.");
  }

  cache.client = cache.client ?? new MongoClient(uri);
  await cache.client.connect();
  cache.db = cache.client.db(dbName);
  return cache.db;
}
