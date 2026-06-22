import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const MYSQL_URI = process.env.MYSQL_URI || process.env.DATABASE_URL;
const databaseName = process.env.MYSQL_DATABASE || 'physiosync';

export let sequelize;
let useSQLite = false;

// Try to initialize MySQL connection
if (MYSQL_URI) {
  try {
    const tempSeq = new Sequelize(MYSQL_URI, {
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        ssl: MYSQL_URI.includes('sslmode=') || process.env.MYSQL_SSL === 'true' ? {
          rejectUnauthorized: false
        } : undefined
      }
    });
    await tempSeq.authenticate();
    sequelize = tempSeq;
    console.log('MySQL database (URI) connected successfully.');
  } catch (err) {
    console.warn('[DB WARNING] Failed to connect to MySQL database via URI:', err.message);
    useSQLite = true;
  }
} else {
  const host = process.env.MYSQL_HOST || '127.0.0.1';
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';

  try {
    // Attempt database check and auto-creation
    const connection = await mysql.createConnection({ host, port, user, password, connectTimeout: 1500 });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\`;`);
    await connection.end();
    
    sequelize = new Sequelize(databaseName, user, password, {
      host,
      port,
      dialect: 'mysql',
      logging: false
    });
    await sequelize.authenticate();
    console.log('MySQL database connected successfully.');
  } catch (err) {
    console.warn(`[DB WARNING] Failed to connect to MySQL database at ${host}:${port}:`, err.message);
    useSQLite = true;
  }
}

if (useSQLite) {
  const sqliteStorage = process.env.VERCEL ? '/tmp/database.sqlite' : './database.sqlite';
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqliteStorage,
    logging: false
  });
  console.log(`Sequelize initialized with local fallback SQLite database at: ${sqliteStorage}`);
}

export async function initDb() {
  try {
    // Sync models in whatever database is currently selected
    await sequelize.sync({ alter: true });
    console.log('Database models synced.');
  } catch (err) {
    console.error('Failed to sync database models:', err);
    throw err;
  }
}

export async function seedDoctorData(doctorId) {
  // Database starts completely clean for real-time data input
}
