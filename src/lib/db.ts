import { type Db } from "mongodb";
import { getMongoClientPromise } from "./mongodb";

let dbIndexesPromise: Promise<void> | null = null;

async function ensureDbIndexes(db: Db): Promise<void> {
  // Posts: list/detail/search queries
  await db.collection("posts").createIndexes([
    { key: { type: 1, status: 1, createdAt: -1 }, name: "posts_type_status_createdAt" },
    { key: { type: 1, status: 1, eventDate: -1, createdAt: -1 }, name: "posts_type_status_eventDate_createdAt" },
    { key: { slug: 1, status: 1 }, name: "posts_slug_status" },
    { key: { locale: 1, status: 1, slug: 1 }, name: "posts_locale_status_slug" },
  ]);

  // Users: auth/admin lookups
  await db.collection("users").createIndexes([
    { key: { email: 1 }, name: "users_email" },
    { key: { username: 1 }, name: "users_username" },
    { key: { role: 1 }, name: "users_role" },
    { key: { status: 1 }, name: "users_status" },
    { key: { resetToken: 1 }, name: "users_resetToken" },
    { key: { createdAt: -1 }, name: "users_createdAt" },
  ]);

  // Common relational/analytics collections
  await db.collection("connections").createIndexes([
    { key: { requester: 1, recipient: 1 }, name: "connections_requester_recipient" },
    { key: { status: 1 }, name: "connections_status" },
  ]);

  await db.collection("messages").createIndexes([
    { key: { sender: 1, receiver: 1, createdAt: -1 }, name: "messages_sender_receiver_createdAt" },
    { key: { groupId: 1, createdAt: -1 }, name: "messages_groupId_createdAt" },
  ]);
}

export async function getDb() {
  try {
    const client = await getMongoClientPromise();
    // Extract database name from URI or use default
    const dbName = process.env.MONGODB_DB || "abgc";
    const db = client.db(dbName);

    if (!dbIndexesPromise) {
      dbIndexesPromise = ensureDbIndexes(db).catch((error) => {
        dbIndexesPromise = null;
        throw error;
      });
    }
    await dbIndexesPromise;

    return db;
  } catch (error: any) {
    console.error("Error getting database:", error);
    // Re-throw with more context
    if (error.message?.includes("MONGODB_URI")) {
      throw new Error("MongoDB connection string is missing. Please check environment variables.");
    }
    throw new Error(`Database connection failed: ${error.message || "Unknown error"}`);
  }
}

export async function getCollection(collectionName: string) {
  try {
    const db = await getDb();
    return db.collection(collectionName);
  } catch (error: any) {
    console.error(`Error getting collection "${collectionName}":`, error);
    throw error; // Re-throw to let caller handle
  }
}
