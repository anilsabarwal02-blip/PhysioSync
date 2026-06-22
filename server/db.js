import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
dotenv.config();

const MYSQL_URI = process.env.MYSQL_URI || process.env.DATABASE_URL;
const databaseName = process.env.MYSQL_DATABASE || 'physiosync';

export let sequelize;

const isMySQLConfigured = !!(MYSQL_URI || process.env.MYSQL_HOST);

// Check if sqlite3 driver is loadable in this environment
let isSqlite3Available = false;
try {
  require.resolve('sqlite3');
  require('sqlite3');
  isSqlite3Available = true;
} catch (e) {
  console.warn('[DB WARNING] sqlite3 package is not available or failed to load. Fallback to mock in-memory database will be used if MySQL is not configured.', e.message);
}

if (isMySQLConfigured) {
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
    const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || '';

    sequelize = new Sequelize(databaseName, user, password, {
      host,
      port,
      dialect: 'mysql',
      logging: false
    });
  }
  console.log('Sequelize initialized with MySQL configuration.');
} else if (isSqlite3Available) {
  const sqliteStorage = process.env.VERCEL ? '/tmp/database.sqlite' : './database.sqlite';
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqliteStorage,
    logging: false
  });
  console.log(`Sequelize initialized with SQLite fallback at: ${sqliteStorage}`);
} else {
  console.log('Sequelize initialized with Mock in-memory database fallback.');
  sequelize = createMockSequelize();
}

function createMockSequelize() {
  const mockSequelize = {
    isMock: true,
    define(modelName, attributes, options = {}) {
      const store = [];
      let lastId = 0;

      class MockModelInstance {
        constructor(values = {}) {
          // Initialize default values from attributes schema
          for (const key in attributes) {
            const attr = attributes[key];
            if (attr && attr.defaultValue !== undefined) {
              this[key] = typeof attr.defaultValue === 'function' ? attr.defaultValue() : attr.defaultValue;
            } else {
              this[key] = null;
            }
          }
          Object.assign(this, values);
        }

        static _store = store;
        static _lastId = lastId;
        static _options = options;

        async save() {
          const modelClass = this.constructor;
          const store = modelClass._store;
          
          if (!this.id) {
            modelClass._lastId++;
            this.id = modelClass._lastId;
            
            if (modelClass._options.createdAt) {
              const fieldName = typeof modelClass._options.createdAt === 'string' ? modelClass._options.createdAt : 'created_at';
              this[fieldName] = new Date();
            }
            
            store.push(this);
          } else {
            const idx = store.findIndex(item => item.id === this.id);
            if (idx !== -1) {
              store[idx] = this;
            } else {
              store.push(this);
            }
          }
          
          if (modelClass._options.updatedAt) {
            const fieldName = typeof modelClass._options.updatedAt === 'string' ? modelClass._options.updatedAt : 'updated_at';
            this[fieldName] = new Date();
          }
          
          return this;
        }

        async destroy() {
          const modelClass = this.constructor;
          const store = modelClass._store;
          const idx = store.findIndex(item => item.id === this.id);
          if (idx !== -1) {
            store.splice(idx, 1);
          }
        }

        get(key) {
          if (key) return this[key];
          // return clean data fields only
          const data = {};
          for (const k in this) {
            if (this.hasOwnProperty(k) && typeof this[k] !== 'function') {
              data[k] = this[k];
            }
          }
          return data;
        }

        static async findOne({ where } = {}) {
          const results = await this.findAll({ where });
          return results.length > 0 ? results[0] : null;
        }

        static async findByPk(id) {
          const numericId = Number(id);
          const found = store.find(item => Number(item.id) === numericId);
          return found ? found : null;
        }

        static async findAll(query = {}) {
          let results = [...store];
          if (query.where) {
            results = results.filter(item => {
              for (const key in query.where) {
                const condition = query.where[key];
                const actual = item[key];
                
                // Handle Sequelize query operators like [Op.ne]
                if (condition && typeof condition === 'object' && !Array.isArray(condition) && !(condition instanceof Date)) {
                  for (const sym of Object.getOwnPropertySymbols(condition)) {
                    const symName = sym.description;
                    const expected = condition[sym];
                    if (symName === 'ne') {
                      if (actual === expected) return false;
                    } else if (symName === 'gte') {
                      if (!(new Date(actual) >= new Date(expected))) return false;
                    } else if (symName === 'gt') {
                      if (!(new Date(actual) > new Date(expected))) return false;
                    } else if (symName === 'lte') {
                      if (!(new Date(actual) <= new Date(expected))) return false;
                    } else if (symName === 'lt') {
                      if (!(new Date(actual) < new Date(expected))) return false;
                    } else if (symName === 'eq') {
                      if (actual !== expected) return false;
                    }
                  }
                } else {
                  // Simple equality
                  let match = false;
                  if (key === 'id' || key === '_id') {
                    match = Number(actual) === Number(condition);
                  } else {
                    match = actual === condition;
                  }
                  if (!match) return false;
                }
              }
              return true;
            });
          }
          if (query.order) {
            const [field, direction] = query.order[0];
            results.sort((a, b) => {
              if (direction === 'DESC') {
                if (typeof a[field] === 'number' && typeof b[field] === 'number') {
                  return b[field] - a[field];
                }
                return String(b[field] || '').localeCompare(String(a[field] || ''));
              } else {
                if (typeof a[field] === 'number' && typeof b[field] === 'number') {
                  return a[field] - b[field];
                }
                return String(a[field] || '').localeCompare(String(b[field] || ''));
              }
            });
          }
          return results;
        }

        static async create(values) {
          const instance = new this(values);
          await instance.save();
          return instance;
        }

        static async count({ where } = {}) {
          const results = await this.findAll({ where });
          return results.length;
        }

        static async destroy({ where } = {}) {
          const results = await this.findAll({ where });
          for (const item of results) {
            await item.destroy();
          }
          return results.length;
        }
      }

      return MockModelInstance;
    },
    authenticate() {
      return Promise.resolve();
    },
    sync() {
      return Promise.resolve();
    }
  };
  return mockSequelize;
}

// Helper to pre-create database if it doesn't exist
async function ensureDatabaseExists() {
  if (MYSQL_URI) return;
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
    if (sequelize.isMock) {
      console.log('Using Mock in-memory database fallback.');
      return;
    }
    if (isMySQLConfigured) {
      await ensureDatabaseExists();
      await sequelize.authenticate();
      console.log('Successfully connected to MySQL database.');
    } else {
      console.log('Using SQLite fallback database.');
    }
    await sequelize.sync({ alter: true });
    console.log('Database models synced.');
  } catch (err) {
    console.error('Failed to initialize database:', err);
    throw err;
  }
}

export async function seedDoctorData(doctorId) {
  // Database starts completely clean for real-time data input
}
