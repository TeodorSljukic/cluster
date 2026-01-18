import { getMongoClientPromise } from "./mongodb";

export async function getDb() {
  const client = await getMongoClientPromise();
  // Extract database name from URI or use default
  const dbName = process.env.MONGODB_DB || "abgc";
  return client.db(dbName);
}

export async function getCollection(collectionName: string) {
  const db = await getDb();
  return db.collection(collectionName);
}
