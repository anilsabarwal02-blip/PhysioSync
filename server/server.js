import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, seedDoctorData } from './db.js';
import { Doctor, Appointment, Patient, Protocol, EMRNote, Wearable } from './models.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'physiosync-super-secret-key-123';

// Load production security and compression middlewares
if (process.env.NODE_ENV === 'production') {
  try {
    const helmet = (await import('helmet')).default;
    const compression = (await import('compression')).default;
    app.use(helmet({
      contentSecurityPolicy: false, // Turn off CSP to avoid blocking 3D assets loading
    }));
    app.use(compression());
  } catch (err) {
    console.warn('[PROD] Helmet or Compression failed to load:', err.message);
  }
}

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url} - Body:`, req.body);
  const originalJson = res.json;
  res.json = function(body) {
    console.log(`[RESPONSE] ${req.method} ${req.url} - Status: ${res.statusCode} - Body:`, body);
    return originalJson.call(this, body);
  };
  next();
});

// Initialize MongoDB database
try {
  await initDb();
  console.log('MongoDB database connection initialized successfully.');
} catch (err) {
  console.error('Failed to initialize MongoDB database:', err);
  process.exit(1);
}

// Authentication Middleware (Bypassed/Optional: defaults to DR-DEFAULT)
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  const defaultDoctor = { doctorId: 'DR-DEFAULT', name: 'Dr. Sharma' };
  
  try {
    const existing = await Doctor.findOne({ doctor_id: defaultDoctor.doctorId });
    const hashedPassword = await bcrypt.hash('password123', 10);
    if (!existing) {
      await Doctor.create({ doctor_id: defaultDoctor.doctorId, name: defaultDoctor.name, password: hashedPassword });
      await seedDoctorData(defaultDoctor.doctorId);
    } else if (existing.password === '' || existing.password === null) {
      existing.password = hashedPassword;
      await existing.save();
    }
  } catch (err) {
    console.error('Error seeding default doctor in MongoDB:', err);
  }

  if (!token) {
    req.user = defaultDoctor;
    return next();
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = defaultDoctor;
      return next();
    }
    req.user = user;
    next();
  });
};

// --- AUTHENTICATION ROUTES ---

// Register Doctor
app.post('/api/auth/register', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is not connected. Please configure MONGODB_URI on your live server.' });
  }
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ error: 'Name and password are required' });
  }

  try {
    const doctorId = 'DR-' + Math.floor(1000 + Math.random() * 9000);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await Doctor.create({
      doctor_id: doctorId,
      name,
      password: hashedPassword
    });

    // Seed default workspace data for this newly registered doctor in MongoDB
    await seedDoctorData(doctorId);

    res.status(201).json({ 
      message: 'Doctor registered successfully', 
      doctor: { doctorId, name } 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register doctor. ID may already exist.' });
  }
});

// Login Doctor
app.post('/api/auth/login', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is not connected. Please configure MONGODB_URI on your live server.' });
  }
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ error: 'Name and password are required' });
  }

  try {
    let doctor = await Doctor.findOne({ name: name });
    
    if (!doctor) {
      return res.status(400).json({ error: 'Invalid name or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, doctor.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid name or password' });
    }

    const token = jwt.sign(
      { id: doctor.id, doctorId: doctor.doctor_id, name: doctor.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Seed default collections if missing
    await seedDoctorData(doctor.doctor_id);

    res.json({
      token,
      user: { doctorId: doctor.doctor_id, name: doctor.name }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get Current Doctor Profile
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});


// --- APPOINTMENTS ROUTES ---

// Get Appointments
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      doctor_id: req.user.doctorId,
      deleted: false
    }).sort({ _id: -1 });
    res.json(appointments);
  } catch (err) {
    console.error('Fetch appointments error:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Create Appointment
app.post('/api/appointments', authenticateToken, async (req, res) => {
  const { patient, type, treatment, time, duration, status, notes, date } = req.body;
  if (!patient || !type || !time) {
    return res.status(400).json({ error: 'Patient, type, and time are required' });
  }

  try {
    const newApp = await Appointment.create({
      doctor_id: req.user.doctorId,
      patient,
      type,
      treatment: treatment || 'General Physiotherapy',
      time,
      date: date || '',
      duration: duration || '45 min',
      status: status || 'Confirmed',
      notes: notes || ''
    });

    // Automatically create patient record if it doesn't exist yet, or restore if soft-deleted
    const patientExists = await Patient.findOne({ name: patient, doctor_id: req.user.doctorId });
    if (!patientExists) {
      await Patient.create({
        doctor_id: req.user.doctorId,
        name: patient,
        age: null,
        gender: null,
        condition: treatment || 'General Physiotherapy',
        student: 'None',
        status: 'Pending',
        last_visit: 'Just Scheduled'
      });
    } else if (patientExists.deleted) {
      patientExists.deleted = false;
      patientExists.deleted_at = null;
      await patientExists.save();
    }

    res.status(201).json(newApp);
  } catch (err) {
    console.error('Create appointment error:', err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Update Appointment
app.put('/api/appointments/:id', authenticateToken, async (req, res) => {
  const { status, patient, type, treatment, time, duration, notes, date } = req.body;
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor_id: req.user.doctorId
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (patient !== undefined) updateFields.patient = patient;
    if (type !== undefined) updateFields.type = type;
    if (treatment !== undefined) updateFields.treatment = treatment;
    if (time !== undefined) updateFields.time = time;
    if (duration !== undefined) updateFields.duration = duration;
    if (notes !== undefined) updateFields.notes = notes;
    if (date !== undefined) updateFields.date = date;

    Object.assign(appointment, updateFields);
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    console.error('Update appointment error:', err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Delete Appointment (Soft Delete)
app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Appointment.updateOne(
      { _id: req.params.id, doctor_id: req.user.doctorId },
      { deleted: true, deleted_at: new Date() }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment moved to Recycle Bin' });
  } catch (err) {
    console.error('Delete appointment error:', err);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});


// Get Dashboard Stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.user.doctorId;
    const totalPatients = await Patient.countDocuments({ 
      doctor_id: doctorId, 
      deleted: false,
      $or: [{ student: 'None' }, { student: { $exists: false } }]
    });
    const pendingLogs = await Patient.countDocuments({
      doctor_id: doctorId,
      student: { $ne: 'None' },
      status: 'Pending',
      deleted: false
    });
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const todaySessions = await Appointment.countDocuments({ 
      doctor_id: doctorId, 
      date: todayStr,
      deleted: false 
    });
    const approvedPatients = await Patient.countDocuments({
      doctor_id: doctorId,
      status: 'Approved',
      deleted: false,
      $or: [{ student: 'None' }, { student: { $exists: false } }]
    });
    const recoveryRate = totalPatients > 0 ? Math.round((approvedPatients / totalPatients) * 100) : 0;
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newPatientsThisMonth = await Patient.countDocuments({
      doctor_id: doctorId,
      created_at: { $gte: thirtyDaysAgo },
      deleted: false,
      $or: [{ student: 'None' }, { student: { $exists: false } }]
    });

    res.json({
      totalPatients,
      pendingLogs,
      todaySessions,
      recoveryRate,
      newPatientsThisMonth
    });
  } catch (err) {
    console.error('Fetch dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});


// --- PATIENTS & LOGBOOK ROUTES ---

// Get Patients List
app.get('/api/patients', authenticateToken, async (req, res) => {
  try {
    const patients = await Patient.find({
      doctor_id: req.user.doctorId,
      deleted: false,
      $or: [{ student: 'None' }, { student: { $exists: false } }]
    }).sort({ _id: 1 });
    res.json(patients);
  } catch (err) {
    console.error('Fetch patients error:', err);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Create Patient
app.post('/api/patients', authenticateToken, async (req, res) => {
  const { name, age, gender, phone, condition, student, log_notes } = req.body;
  if (!name || !condition) {
    return res.status(400).json({ error: 'Name and condition are required' });
  }

  try {
    // Check if patient already exists
    const existing = await Patient.findOne({ name, doctor_id: req.user.doctorId });
    if (existing && !existing.deleted) {
      if (student && student !== 'None') {
        existing.student = student;
        if (log_notes !== undefined) existing.log_notes = log_notes;
        existing.status = 'Pending';
        existing.condition = condition || existing.condition;
        await existing.save();
        return res.status(200).json(existing);
      }
      return res.status(409).json({ error: 'Patient with this name already exists' });
    }
    if (existing && existing.deleted) {
      existing.deleted = false;
      existing.deleted_at = null;
      existing.age = age || existing.age;
      existing.gender = gender || existing.gender;
      existing.phone = phone || existing.phone;
      existing.condition = condition;
      await existing.save();
      return res.status(200).json(existing);
    }

    const newPatient = await Patient.create({
      doctor_id: req.user.doctorId,
      name,
      age: age || null,
      gender: gender || null,
      phone: phone || null,
      condition,
      student: student || 'None',
      log_notes: log_notes || '',
      status: 'Pending',
      last_visit: 'New Patient'
    });

    res.status(201).json(newPatient);
  } catch (err) {
    console.error('Create patient error:', err);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Get Student Logbook Cases (Derived from Patients table)
app.get('/api/patients/logs', authenticateToken, async (req, res) => {
  try {
    const patients = await Patient.find({
      student: { $ne: 'None' },
      doctor_id: req.user.doctorId,
      deleted: false
    });
    
    // Attach default notes to matching topics, otherwise use p.log_notes
    const logs = patients.map(p => {
      let notes = p.log_notes || 'Case report submitted. Patient responding well to parameters.';
      if (!p.log_notes) {
        if (p.name === 'Rahul Verma') {
          notes = 'Patient showed 15 degrees improvement in knee flexion. Pain scale 4/10.';
        } else if (p.name === 'Priya Sharma') {
          notes = 'Applied TENS for 15 mins. Muscle spasms reduced significantly.';
        } else if (p.name === 'Neha Gupta') {
          notes = 'Patient successfully completed 3 sets of planks and bird-dogs.';
        }
      }
      return {
        id: p.id,
        student: p.student,
        patient: p.name,
        topic: p.condition,
        time: p.last_visit,
        status: p.status,
        notes
      };
    });

    res.json(logs);
  } catch (err) {
    console.error('Fetch logbook logs error:', err);
    res.status(500).json({ error: 'Failed to fetch logbook cases' });
  }
});

// Approve Student Log Case (Updates Patients table)
app.put('/api/patients/logs/:id', authenticateToken, async (req, res) => {
  try {
    const patientRow = await Patient.findOne({
      _id: req.params.id,
      doctor_id: req.user.doctorId
    });
    
    if (!patientRow) {
      return res.status(404).json({ error: 'Patient case not found' });
    }

    patientRow.status = 'Approved';
    await patientRow.save();

    // Keep protocols table in sync
    await Protocol.updateMany(
      { patient_name: patientRow.name, doctor_id: req.user.doctorId },
      { status: 'Approved', updated_at: new Date() }
    );

    res.json({ message: 'Patient clinical log approved successfully' });
  } catch (err) {
    console.error('Approve patient case error:', err);
    res.status(500).json({ error: 'Failed to approve case log' });
  }
});

// Delete (Dismiss) Student Log Case (Updates Patients table)
app.delete('/api/patients/logs/:id', authenticateToken, async (req, res) => {
  try {
    const patientRow = await Patient.findOne({
      _id: req.params.id,
      doctor_id: req.user.doctorId
    });
    
    if (!patientRow) {
      return res.status(404).json({ error: 'Patient case not found' });
    }

    patientRow.student = 'None';
    patientRow.status = 'Pending';
    await patientRow.save();

    res.json({ success: true, message: 'Log dismissed successfully' });
  } catch (err) {
    console.error('Delete log error:', err);
    res.status(500).json({ error: 'Failed to delete log' });
  }
});


// Soft-delete patient record
app.delete('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.user.doctorId;
    const patientRow = await Patient.findOne({ _id: req.params.id, doctor_id: doctorId });
    if (!patientRow) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Soft-delete patient
    patientRow.deleted = true;
    patientRow.deleted_at = new Date();
    await patientRow.save();

    // Soft-delete associated appointments for this patient
    await Appointment.updateMany(
      { patient: patientRow.name, doctor_id: doctorId, deleted: false },
      { deleted: true, deleted_at: new Date() }
    );

    res.json({ message: 'Patient and associated appointments moved to Recycle Bin' });
  } catch (err) {
    console.error('Delete patient error:', err);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

// Get Recycle Bin items
app.get('/api/recycle-bin', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.user.doctorId;
    const appointments = await Appointment.find({
      doctor_id: doctorId,
      deleted: true
    }).sort({ deleted_at: -1 });
    const patients = await Patient.find({
      doctor_id: doctorId,
      deleted: true
    }).sort({ deleted_at: -1 });
    res.json({ appointments, patients });
  } catch (err) {
    console.error('Fetch recycle bin error:', err);
    res.status(500).json({ error: 'Failed to fetch recycle bin' });
  }
});

// Restore deleted appointment
app.put('/api/recycle-bin/restore/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Appointment.updateOne(
      { _id: req.params.id, doctor_id: req.user.doctorId },
      { deleted: false, deleted_at: null }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json({ message: 'Appointment restored successfully' });
  } catch (err) {
    console.error('Restore appointment error:', err);
    res.status(500).json({ error: 'Failed to restore appointment' });
  }
});

// Restore deleted patient
app.put('/api/recycle-bin/restore/patients/:id', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.user.doctorId;
    const patientRow = await Patient.findOne({ _id: req.params.id, doctor_id: doctorId });
    if (!patientRow) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    patientRow.deleted = false;
    patientRow.deleted_at = null;
    await patientRow.save();

    // Also restore associated appointments that were soft-deleted
    await Appointment.updateMany(
      { patient: patientRow.name, doctor_id: doctorId, deleted: true },
      { deleted: false, deleted_at: null }
    );

    res.json({ message: 'Patient restored successfully' });
  } catch (err) {
    console.error('Restore patient error:', err);
    res.status(500).json({ error: 'Failed to restore patient' });
  }
});

// Permanently delete appointment
app.delete('/api/recycle-bin/permanent/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Appointment.deleteOne({
      _id: req.params.id,
      doctor_id: req.user.doctorId
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json({ message: 'Appointment permanently deleted' });
  } catch (err) {
    console.error('Permanent delete appointment error:', err);
    res.status(500).json({ error: 'Failed to delete appointment permanently' });
  }
});

// Permanently delete patient
app.delete('/api/recycle-bin/permanent/patients/:id', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.user.doctorId;
    const patientRow = await Patient.findOne({ _id: req.params.id, doctor_id: doctorId });
    if (!patientRow) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Delete associated appointments
    await Appointment.deleteMany({ patient: patientRow.name, doctor_id: doctorId });

    // Delete patient
    await Patient.deleteOne({ _id: req.params.id, doctor_id: doctorId });

    res.json({ message: 'Patient and all associated appointments permanently deleted' });
  } catch (err) {
    console.error('Permanent delete patient error:', err);
    res.status(500).json({ error: 'Failed to delete patient permanently' });
  }
});

// Empty Recycle Bin
app.delete('/api/recycle-bin/empty', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.user.doctorId;
    await Appointment.deleteMany({ doctor_id: doctorId, deleted: true });
    await Patient.deleteMany({ doctor_id: doctorId, deleted: true });
    res.json({ message: 'Recycle bin emptied successfully' });
  } catch (err) {
    console.error('Empty recycle bin error:', err);
    res.status(500).json({ error: 'Failed to empty recycle bin' });
  }
});


// --- CLINICAL PROTOCOLS ROUTES ---

// Get Protocol for Patient
app.get('/api/protocols/:patientName', authenticateToken, async (req, res) => {
  try {
    const protocol = await Protocol.findOne({
      patient_name: req.params.patientName,
      doctor_id: req.user.doctorId
    });
    
    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }
    
    res.json(protocol);
  } catch (err) {
    console.error('Fetch protocol error:', err);
    res.status(500).json({ error: 'Failed to fetch protocol' });
  }
});

// Create/Update Protocol (Syncs to Patients status if Approved)
app.put('/api/protocols', authenticateToken, async (req, res) => {
  const { patient_name, pain_score, exercises, rpe_exertion, biomechanical_rationale, phase_checklist, status } = req.body;
  if (!patient_name || !exercises || !phase_checklist) {
    return res.status(400).json({ error: 'Patient name, exercises, and checklist are required' });
  }

  try {
    const newStatus = status || 'Pending';

    const existing = await Protocol.findOne({ patient_name, doctor_id: req.user.doctorId });
    if (existing) {
      Object.assign(existing, {
        pain_score: pain_score || 4,
        exercises,
        rpe_exertion: rpe_exertion || 4,
        biomechanical_rationale: biomechanical_rationale === undefined ? 1 : biomechanical_rationale,
        phase_checklist,
        status: newStatus,
        updated_at: new Date()
      });
      await existing.save();
    } else {
      await Protocol.create({
        doctor_id: req.user.doctorId,
        patient_name,
        pain_score: pain_score || 4,
        exercises,
        rpe_exertion: rpe_exertion || 4,
        biomechanical_rationale: biomechanical_rationale === undefined ? 1 : biomechanical_rationale,
        phase_checklist,
        status: newStatus,
        updated_at: new Date()
      });
    }

    // Sync to patient status
    await Patient.updateMany(
      { name: patient_name, doctor_id: req.user.doctorId },
      { status: newStatus === 'Approved' ? 'Approved' : 'Pending' }
    );

    res.json({ message: 'Protocol saved successfully', status: newStatus });
  } catch (err) {
    console.error('Save protocol error:', err);
    res.status(500).json({ error: 'Failed to save protocol' });
  }
});


// --- EMR NOTES ROUTES ---

// Get EMR Notes
app.get('/api/notes', authenticateToken, async (req, res) => {
  try {
    const notes = await EMRNote.find({
      doctor_id: req.user.doctorId
    }).sort({ _id: -1 });
    res.json(notes);
  } catch (err) {
    console.error('Fetch notes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Create Note
app.post('/api/notes', authenticateToken, async (req, res) => {
  const { text, date } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Transcribed note text is required' });
  }

  try {
    const dateFormatted = date || new Date().toLocaleString();
    await EMRNote.create({
      doctor_id: req.user.doctorId,
      text,
      date: dateFormatted
    });
    
    const notes = await EMRNote.find({
      doctor_id: req.user.doctorId
    }).sort({ _id: -1 });
    res.status(201).json(notes);
  } catch (err) {
    console.error('Save note error:', err);
    res.status(500).json({ error: 'Failed to save note' });
  }
});


// --- WEARABLE DATA ROUTES ---

// Get Wearables Data
app.get('/api/wearables/:patientName', authenticateToken, async (req, res) => {
  try {
    const data = await Wearable.findOne({
      patient_name: req.params.patientName,
      doctor_id: req.user.doctorId
    });
    
    if (!data) {
      return res.json({
        patient_name: req.params.patientName,
        heart_rate: 72,
        steps: 4200,
        calories: 150,
        sleep_hours: 7.5
      });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Fetch wearable metrics error:', err);
    res.status(500).json({ error: 'Failed to fetch wearable metrics' });
  }
});

// Sync Wearables Data
app.put('/api/wearables', authenticateToken, async (req, res) => {
  const { patient_name, heart_rate, steps, calories, sleep_hours } = req.body;
  if (!patient_name) {
    return res.status(400).json({ error: 'Patient name is required' });
  }

  try {
    const existing = await Wearable.findOne({ patient_name, doctor_id: req.user.doctorId });
    if (existing) {
      Object.assign(existing, {
        heart_rate: heart_rate || 72,
        steps: steps || 4200,
        calories: calories || 150,
        sleep_hours: sleep_hours || 7.5,
        updated_at: new Date()
      });
      await existing.save();
    } else {
      await Wearable.create({
        doctor_id: req.user.doctorId,
        patient_name,
        heart_rate: heart_rate || 72,
        steps: steps || 4200,
        calories: calories || 150,
        sleep_hours: sleep_hours || 7.5,
        updated_at: new Date()
      });
    }

    res.json({ message: 'Wearables synced successfully' });
  } catch (err) {
    console.error('Sync wearable metrics error:', err);
    res.status(500).json({ error: 'Failed to sync wearable metrics' });
  }
});

// Serve static client assets from the dist directory (if built)
const frontendBuildPath = path.join(__dirname, '../dist');
app.use(express.static(frontendBuildPath));

// Fallback all non-API GET requests to serve frontend index.html for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('PhysioSync API is active. Client bundle not found; please build the frontend.');
    }
  });
});

// Start Express Server
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`PhysioSync backend server running on http://localhost:${PORT}`);
  });
}

export default app;
