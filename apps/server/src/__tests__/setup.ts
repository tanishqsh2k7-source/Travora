import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer: MongoMemoryServer | null = null;

export async function setupTestDB(): Promise<string> {
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
  }
  const uri = mongoServer.getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
  return uri;
}

export async function clearTestDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({});
    }
  }
}

export async function teardownTestDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}
