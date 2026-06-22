import mongoose from 'mongoose';

// Enable virtual id mapping for json output
mongoose.set('toJSON', { virtuals: true });
mongoose.set('toObject', { virtuals: true });

// Doctor Schema
const doctorSchema = new mongoose.Schema({
  doctor_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String }, 
  created_at: { type: Date, default: Date.now }
});

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
  doctor_id: { type: String, required: true },
  patient: { type: String, required: true },
  type: { type: String, required: true },
  treatment: { type: String, default: 'General Physiotherapy' },
  time: { type: String, required: true },
  date: { type: String, default: '' },
  duration: { type: String, default: '45 min' },
  status: { type: String, default: 'Confirmed' },
  notes: { type: String, default: '' },
  deleted: { type: Boolean, default: false },
  deleted_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});

// Patient Schema
const patientSchema = new mongoose.Schema({
  doctor_id: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number },
  gender: { type: String },
  condition: { type: String, required: true },
  student: { type: String, default: 'None' },
  status: { type: String, default: 'Pending' },
  last_visit: { type: String },
  deleted: { type: Boolean, default: false },
  deleted_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});

// Protocol Schema
const protocolSchema = new mongoose.Schema({
  doctor_id: { type: String, required: true },
  patient_name: { type: String, required: true, unique: true },
  pain_score: { type: Number, default: 4 },
  exercises: { type: mongoose.Schema.Types.Mixed, required: true }, 
  rpe_exertion: { type: Number, default: 4 },
  biomechanical_rationale: { type: Number, default: 1 },
  phase_checklist: { type: mongoose.Schema.Types.Mixed, default: [] }, 
  status: { type: String, default: 'Pending' },
  updated_at: { type: Date, default: Date.now }
});

// EMRNote Schema
const emrNoteSchema = new mongoose.Schema({
  doctor_id: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// Wearable Schema
const wearableSchema = new mongoose.Schema({
  doctor_id: { type: String, required: true },
  patient_name: { type: String, required: true, unique: true },
  heart_rate: { type: Number, default: 72 },
  steps: { type: Number, default: 4200 },
  calories: { type: Number, default: 150 },
  sleep_hours: { type: Number, default: 7.5 },
  updated_at: { type: Date, default: Date.now }
});

export const Doctor = mongoose.model('Doctor', doctorSchema);
export const Appointment = mongoose.model('Appointment', appointmentSchema);
export const Patient = mongoose.model('Patient', patientSchema);
export const Protocol = mongoose.model('Protocol', protocolSchema);
export const EMRNote = mongoose.model('EMRNote', emrNoteSchema);
export const Wearable = mongoose.model('Wearable', wearableSchema);
