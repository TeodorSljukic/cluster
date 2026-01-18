import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * Lazily creates (and caches) the MongoDB client promise.
 *
 * Important:
 * - We avoid throwing and connecting at module scope, because that can cause
 *   Next.js route modules to fail to load and return a generic 500 (text/plain)
 *   instead of our JSON error response.
 */
export function getMongoClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return Promise.reject(new Error("Missing MONGODB_URI environment variable"));
  }

  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }

  return global._mongoClientPromise;
}

