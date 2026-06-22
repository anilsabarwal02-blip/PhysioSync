import { Patient, Appointment } from './models.js';
import { initDb } from './db.js';

async function query() {
  try {
    await initDb();
    console.log('--- PATIENTS ---');
    const patients = await Patient.findAll();
    console.log(JSON.stringify(patients, null, 2));

    console.log('--- APPOINTMENTS ---');
    const appointments = await Appointment.findAll();
    console.log(JSON.stringify(appointments, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
query();
