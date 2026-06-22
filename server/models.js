import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

// Doctor Model
export const Doctor = sequelize.define('Doctor', {
  doctor_id: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING }
}, {
  tableName: 'doctors',
  createdAt: 'created_at',
  updatedAt: false
});

// Appointment Model
export const Appointment = sequelize.define('Appointment', {
  doctor_id: { type: DataTypes.STRING, allowNull: false },
  patient: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  treatment: { type: DataTypes.STRING, defaultValue: 'General Physiotherapy' },
  time: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.STRING, defaultValue: '' },
  duration: { type: DataTypes.STRING, defaultValue: '45 min' },
  status: { type: DataTypes.STRING, defaultValue: 'Confirmed' },
  notes: { type: DataTypes.TEXT, defaultValue: '' },
  deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  deleted_at: { type: DataTypes.DATE }
}, {
  tableName: 'appointments',
  createdAt: 'created_at',
  updatedAt: false
});

// Patient Model
export const Patient = sequelize.define('Patient', {
  doctor_id: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  age: { type: DataTypes.INTEGER },
  gender: { type: DataTypes.STRING },
  condition: { type: DataTypes.STRING, allowNull: false },
  student: { type: DataTypes.STRING, defaultValue: 'None' },
  status: { type: DataTypes.STRING, defaultValue: 'Pending' },
  last_visit: { type: DataTypes.STRING },
  deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  deleted_at: { type: DataTypes.DATE }
}, {
  tableName: 'patients',
  createdAt: 'created_at',
  updatedAt: false
});

// Protocol Model
export const Protocol = sequelize.define('Protocol', {
  doctor_id: { type: DataTypes.STRING, allowNull: false },
  patient_name: { type: DataTypes.STRING, allowNull: false, unique: true },
  pain_score: { type: DataTypes.INTEGER, defaultValue: 4 },
  exercises: { type: DataTypes.JSON, allowNull: false },
  rpe_exertion: { type: DataTypes.INTEGER, defaultValue: 4 },
  biomechanical_rationale: { type: DataTypes.INTEGER, defaultValue: 1 },
  phase_checklist: { type: DataTypes.JSON, defaultValue: [] },
  status: { type: DataTypes.STRING, defaultValue: 'Pending' }
}, {
  tableName: 'protocols',
  createdAt: false,
  updatedAt: 'updated_at'
});

// EMRNote Model
export const EMRNote = sequelize.define('EMRNote', {
  doctor_id: { type: DataTypes.STRING, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: false },
  date: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'emr_notes',
  createdAt: 'created_at',
  updatedAt: false
});

// Wearable Model
export const Wearable = sequelize.define('Wearable', {
  doctor_id: { type: DataTypes.STRING, allowNull: false },
  patient_name: { type: DataTypes.STRING, allowNull: false, unique: true },
  heart_rate: { type: DataTypes.INTEGER, defaultValue: 72 },
  steps: { type: DataTypes.INTEGER, defaultValue: 4200 },
  calories: { type: DataTypes.INTEGER, defaultValue: 150 },
  sleep_hours: { type: DataTypes.FLOAT, defaultValue: 7.5 }
}, {
  tableName: 'wearables',
  createdAt: false,
  updatedAt: 'updated_at'
});

// Add _id virtual field or mapping for frontend compatibility
const addVirtualId = (model) => {
  model.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    values._id = values.id;
    return values;
  };
};

addVirtualId(Doctor);
addVirtualId(Appointment);
addVirtualId(Patient);
addVirtualId(Protocol);
addVirtualId(EMRNote);
addVirtualId(Wearable);
