import { sequelize, initDb } from './db.js';

async function clear() {
  try {
    await initDb();
    console.log("Dropping all tables from MySQL...");
    await sequelize.drop();
    console.log("All tables dropped successfully! Database is now empty. 🌟");
    process.exit(0);
  } catch (err) {
    console.error("Failed to clear database:", err);
    process.exit(1);
  }
}
clear();
