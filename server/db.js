import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const MYSQL_URI = process.env.MYSQL_URI || process.env.DATABASE_URL;

export let sequelize;

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
  const database = process.env.MYSQL_DATABASE || 'physiosync';

  sequelize = new Sequelize(database, user, password, {
    host,
    port,
    dialect: 'mysql',
    logging: false
  });
}

export async function initDb() {
  try {
    console.log('Connecting to MySQL database...');
    await sequelize.authenticate();
    console.log('Successfully connected to MySQL database.');
    // Sync models
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
