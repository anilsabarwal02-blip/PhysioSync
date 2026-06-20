import mongoose from 'mongoose';
import { Doctor, Appointment, Patient, Protocol, EMRNote, Wearable } from './models.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/physiosync';

export async function getDb() {
  return mongoose.connection;
}

export async function initDb() {
  try {
    console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB.');
    return mongoose.connection;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    throw err;
  }
}

export async function seedDoctorData(doctorId) {
  // Database starts completely clean for real-time data input
}
