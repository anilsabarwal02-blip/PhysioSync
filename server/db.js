import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const MYSQL_URI = process.env.MYSQL_URI || process.env.DATABASE_URL;

export let sequelize;

const databaseName = process.env.MYSQL_DATABASE || 'physiosync';

if (MYSQL_URI) {
  sequelize = new Sequelize(MYSQL_URI, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: MYSQL_URI.includes('sslmode=') || process.env.MYSQL_SSL === 'true' ? {
        rejectUnauthorized: false
      } : undefined
    }
  });
} else {
  const host = process.env.MYSQL_HOST || '127.0.0.1';
  const port = process.env.MYSQL_PORT || 3306;
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';

  sequelize = new Sequelize(databaseName, user, password, {
    host,
    port,
    dialect: 'mysql',
    logging: false
  });
}

// Helper to pre-create database if it doesn't exist
async function ensureDatabaseExists() {
  if (MYSQL_URI) return; // Cloud database URIs are usually pre-created
  
  const host = process.env.MYSQL_HOST || '127.0.0.1';
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  
  try {
    const connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\`;`);
    await connection.end();
    console.log(`Database "${databaseName}" verified/created successfully.`);
  } catch (err) {
    console.warn(`[DB WARNING] Failed to auto-create database "${databaseName}":`, err.message);
  }
}

export async function initDb() {
  try {
    // 1. Ensure the MySQL database exists
    await ensureDatabaseExists();

    // 2. Authenticate and connect
    console.log('Connecting to MySQL database...');
    await sequelize.authenticate();
    console.log('Successfully connected to MySQL database.');
    
    // 3. Sync tables
    await sequelize.sync({ alter: true });
    console.log('Database models synced.');
  } catch (err) {
    console.error('Failed to initialize MySQL database:', err);
    throw err;
  }
}

export async function seedDoctorData(doctorId) {
  // Database starts completely clean for real-time data input
}
