import mongoose from 'mongoose';
import { Doctor } from './models.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkDB() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/physiosync');
    const doctors = await Doctor.find({});
    console.log(JSON.stringify(doctors, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkDB();
