import mongoose from 'mongoose';
import { initDb } from './db.js';

async function clear() {
  try {
    await initDb();
    console.log("Dropping MongoDB database...");
    await mongoose.connection.dropDatabase();
    console.log("MongoDB database dropped successfully! Database is now empty. 🌟");
    process.exit(0);
  } catch (err) {
    console.error("Failed to clear database:", err);
    process.exit(1);
  }
}
clear();
