import mongoose from 'mongoose';
import { Patient, Appointment } from './models.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/physiosync';

async function query() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('--- PATIENTS ---');
    const patients = await Patient.find({});
    console.log(JSON.stringify(patients, null, 2));

    console.log('--- APPOINTMENTS ---');
    const appointments = await Appointment.find({});
    console.log(JSON.stringify(appointments, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
query();
