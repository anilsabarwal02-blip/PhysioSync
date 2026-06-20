import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/physiosync';

async function clear() {
  try {
    console.log(`Connecting to MongoDB at ${MONGODB_URI} to drop collections...`);
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (const coll of collections) {
      console.log(`Dropping collection: ${coll.name}`);
      await db.dropCollection(coll.name).catch(e => console.log(`Skipped dropping ${coll.name}: ${e.message}`));
    }
    
    console.log("All collections dropped successfully! Database is now empty. 🌟");
    process.exit(0);
  } catch (err) {
    console.error("Failed to clear database:", err);
    process.exit(1);
  }
}
clear();
