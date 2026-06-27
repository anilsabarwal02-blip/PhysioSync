import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Doctor, Appointment, Patient, Protocol, EMRNote, Wearable } from './models.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/physiosync';

// Export Op for compatibility during intermediate migration steps
export const Op = {
  eq: Symbol.for('eq'),
  ne: Symbol.for('ne'),
  gte: Symbol.for('gte'),
  gt: Symbol.for('gt'),
  lte: Symbol.for('lte'),
  lt: Symbol.for('lt'),
  in: Symbol.for('in')
};

export async function initDb() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB.');
  } catch (err) {
    console.error('Failed to initialize MongoDB database:', err);
    throw err;
  }
}

export async function seedDoctorData(doctorId) {
  try {
    // Check if patients already exist for this doctor
    const count = await Patient.countDocuments({ doctor_id: doctorId });
    if (count > 0) {
      console.log(`[DB SEED] Data already exists for doctor ${doctorId}. Skipping seeding.`);
      return;
    }

    console.log(`[DB SEED] Seeding default clinical data for doctor ${doctorId}...`);

    // 1. Seed Patients
    await Patient.create([
      {
        doctor_id: doctorId,
        name: 'Rahul Verma',
        age: 28,
        gender: 'Male',
        condition: 'Knee Ligament Post-Op Rehab',
        student: 'None',
        status: 'Approved',
        last_visit: '1 day ago',
        deleted: false
      },
      {
        doctor_id: doctorId,
        name: 'Vikram Singh',
        age: 45,
        gender: 'Male',
        condition: 'Shoulder Rotator Cuff Tear',
        student: 'None',
        status: 'Approved',
        last_visit: '2 days ago',
        deleted: false
      },
      {
        doctor_id: doctorId,
        name: 'Priya Sharma',
        age: 32,
        gender: 'Female',
        condition: 'Cervical Spondylosis',
        student: 'Karan',
        status: 'Pending',
        last_visit: '3 days ago',
        deleted: false
      },
      {
        doctor_id: doctorId,
        name: 'Neha Gupta',
        age: 29,
        gender: 'Female',
        condition: 'Lumbar Herniated Disc Rehab',
        student: 'Amit',
        status: 'Pending',
        last_visit: '4 days ago',
        deleted: false
      }
    ]);

    // 2. Seed Appointments
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    await Appointment.create([
      {
        doctor_id: doctorId,
        patient: 'Rahul Verma',
        type: 'OPD',
        treatment: 'Knee Ligament Post-Op Rehab',
        time: '10:00 AM',
        date: todayStr,
        duration: '45 min',
        status: 'Confirmed',
        notes: 'Perform quad activation and early extension exercises.',
        deleted: false
      },
      {
        doctor_id: doctorId,
        patient: 'Vikram Singh',
        type: 'OPD',
        treatment: 'Shoulder Rotator Cuff Tear',
        time: '11:30 AM',
        date: todayStr,
        duration: '45 min',
        status: 'Confirmed',
        notes: 'Assess passive shoulder abduction range.',
        deleted: false
      },
      {
        doctor_id: doctorId,
        patient: 'Priya Sharma',
        type: 'Clinic Session',
        treatment: 'Cervical Spondylosis',
        time: '02:00 PM',
        date: tomorrowStr,
        duration: '45 min',
        status: 'Confirmed',
        notes: 'Cervical retraction movements and postural correction.',
        deleted: false
      },
      {
        doctor_id: doctorId,
        patient: 'Neha Gupta',
        type: 'Tele Rehab',
        treatment: 'Lumbar Herniated Disc Rehab',
        time: '04:00 PM',
        date: yesterdayStr,
        duration: '45 min',
        status: 'Confirmed',
        notes: 'Core stabilization via dead bug and pelvic tilts.',
        deleted: false
      }
    ]);

    // 3. Seed Wearables
    await Wearable.create([
      {
        doctor_id: doctorId,
        patient_name: 'Rahul Verma',
        heart_rate: 76,
        steps: 5400,
        calories: 210,
        sleep_hours: 7.2
      },
      {
        doctor_id: doctorId,
        patient_name: 'Vikram Singh',
        heart_rate: 72,
        steps: 4200,
        calories: 150,
        sleep_hours: 7.5
      },
      {
        doctor_id: doctorId,
        patient_name: 'Priya Sharma',
        heart_rate: 80,
        steps: 6800,
        calories: 280,
        sleep_hours: 6.8
      },
      {
        doctor_id: doctorId,
        patient_name: 'Neha Gupta',
        heart_rate: 74,
        steps: 3500,
        calories: 130,
        sleep_hours: 8.0
      }
    ]);

    // 4. Seed EMR Notes
    await EMRNote.create([
      {
        doctor_id: doctorId,
        text: 'Patient Rahul Verma reports minimal swelling today. Quad sets completed with no extension lag.',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString()
      },
      {
        doctor_id: doctorId,
        text: 'Vikram Singh shows positive progress in passive external rotation. Pain is down to 3/10.',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString()
      }
    ]);

    // 5. Seed Protocols
    const kneeExercises = [
      {
        phase: 'Weeks 1-2',
        title: 'Phase I: Edema Control & Quad Activation',
        goals: ['Full extension (0°)', 'Flexion to 90°', 'Quad activation (no lag on SLR)', 'Pain VAS score < 3/10'],
        exercises: [
          { name: 'Isometric Quad Sets', parameters: '3 sets x 10 reps (5s hold), 3x daily', rpe: '3-4 (Light)', load: 'Low', rationale: 'Facilitates voluntary firing of the vastus medialis obliquus (VMO) without joint excursion, reducing reflex inhibition.' },
          { name: 'Straight Leg Raises (SLR)', parameters: '3 sets x 10 reps (brace at 0°), 2x daily', rpe: '4-5 (Moderate)', load: 'Low-Moderate', rationale: 'Strengthens hip flexors and proximal stabilizer muscles while keeping the knee locked in extension to prevent graft strain.' }
        ]
      },
      {
        phase: 'Weeks 3-4',
        title: 'Phase II: Range of Motion & Gait Normalization',
        goals: ['Flexion to 120°', 'Normal symmetrical gait (no limp)', 'Single-leg stance balance for 15s'],
        exercises: [
          { name: 'Wall Slides', parameters: '3 sets x 12 reps, controlled tempo, 2x daily', rpe: '4-5 (Moderate)', load: 'Moderate', rationale: 'Uses wall friction support to guide safe closed-chain knee flexion under partial bodyweight.' }
        ]
      }
    ];

    const cervicalExercises = [
      {
        phase: 'Weeks 1-2',
        title: 'Phase I: Neck Decompression & Flexor Activation',
        goals: ['Reduction of radiating arm symptoms', 'Pain-free cervical chin tucks', 'Neck rotation to 45°'],
        exercises: [
          { name: 'Cervical Retraction (Chin Tucks)', parameters: '3 sets x 10 reps (5s hold), 3x daily', rpe: '3-4 (Light)', load: 'Low', rationale: 'Decompresses the suboccipital region and opens cervical foraminal spaces, relieving nerve compression.' }
        ]
      }
    ];

    await Protocol.create([
      {
        doctor_id: doctorId,
        patient_name: 'Rahul Verma',
        pain_score: 4,
        exercises: kneeExercises,
        rpe_exertion: 4,
        biomechanical_rationale: 1,
        phase_checklist: ['Full extension (0°)', 'Flexion to 90°'],
        status: 'Approved'
      },
      {
        doctor_id: doctorId,
        patient_name: 'Priya Sharma',
        pain_score: 5,
        exercises: cervicalExercises,
        rpe_exertion: 5,
        biomechanical_rationale: 1,
        phase_checklist: [],
        status: 'Pending'
      }
    ]);

    console.log(`[DB SEED] Successfully seeded data for doctor ${doctorId}! 🌟`);
  } catch (err) {
    console.error(`[DB SEED ERROR] Failed to seed data for doctor ${doctorId}:`, err);
  }
}
