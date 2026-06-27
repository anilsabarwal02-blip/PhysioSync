import mongoose from 'mongoose';

const toJSONOptions = {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    return ret;
  }
};

// Doctor Schema
const DoctorSchema = new mongoose.Schema({
  doctor_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: toJSONOptions,
  toObject: toJSONOptions
});

// Appointment Schema
const AppointmentSchema = new mongoose.Schema({
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
  deleted_at: { type: Date }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: toJSONOptions,
  toObject: toJSONOptions
});

// Patient Schema
const PatientSchema = new mongoose.Schema({
  doctor_id: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number },
  gender: { type: String },
  condition: { type: String, required: true },
  student: { type: String, default: 'None' },
  status: { type: String, default: 'Pending' },
  last_visit: { type: String },
  deleted: { type: Boolean, default: false },
  deleted_at: { type: Date }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: toJSONOptions,
  toObject: toJSONOptions
});

// Protocol Schema
const ProtocolSchema = new mongoose.Schema({
  doctor_id: { type: String, required: true },
  patient_name: { type: String, required: true, unique: true },
  pain_score: { type: Number, default: 4 },
  exercises: { type: mongoose.Schema.Types.Mixed, required: true },
  rpe_exertion: { type: Number, default: 4 },
  biomechanical_rationale: { type: Number, default: 1 },
  phase_checklist: { type: mongoose.Schema.Types.Mixed, default: [] },
  status: { type: String, default: 'Pending' }
}, {
  timestamps: { createdAt: false, updatedAt: 'updated_at' },
  toJSON: toJSONOptions,
  toObject: toJSONOptions
});

// EMRNote Schema
const EMRNoteSchema = new mongoose.Schema({
  doctor_id: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: String, required: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: toJSONOptions,
  toObject: toJSONOptions
});

// Wearable Schema
const WearableSchema = new mongoose.Schema({
  doctor_id: { type: String, required: true },
  patient_name: { type: String, required: true, unique: true },
  heart_rate: { type: Number, default: 72 },
  steps: { type: Number, default: 4200 },
  calories: { type: Number, default: 150 },
  sleep_hours: { type: Number, default: 7.5 }
}, {
  timestamps: { createdAt: false, updatedAt: 'updated_at' },
  toJSON: toJSONOptions,
  toObject: toJSONOptions
});

export const Doctor = mongoose.model('Doctor', DoctorSchema);
export const Appointment = mongoose.model('Appointment', AppointmentSchema);
export const Patient = mongoose.model('Patient', PatientSchema);
export const Protocol = mongoose.model('Protocol', ProtocolSchema);
export const EMRNote = mongoose.model('EMRNote', EMRNoteSchema);
export const Wearable = mongoose.model('Wearable', WearableSchema);
