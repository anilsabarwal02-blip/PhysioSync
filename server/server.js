import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { initDb, seedDoctorData } from './db.js';
import { Doctor, Appointment, Patient, Protocol, EMRNote, Wearable } from './models.js';
import { Op } from 'sequelize';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'physiosync-super-secret-key-123';

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

// Initialize MySQL database
try {
  await initDb();
  console.log('MySQL connection initialized successfully.');
} catch (err) {
  console.error('Failed to initialize MySQL database:', err);
  process.exit(1);
}

// Authentication Middleware (Bypassed/Optional: defaults to DR-DEFAULT)
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  const defaultDoctor = { doctorId: 'DR-DEFAULT', name: 'Dr. Sharma' };
  
  try {
    const existing = await Doctor.findOne({ where: { doctor_id: defaultDoctor.doctorId } });
    if (!existing) {
      await Doctor.create({ doctor_id: defaultDoctor.doctorId, name: defaultDoctor.name, password: '' });
      await seedDoctorData(defaultDoctor.doctorId);
    }
  } catch (err) {
    console.error('Error seeding default doctor in MySQL:', err);
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

app.get('/api/version', (req, res) => {
  res.json({ version: 'eaa4f79 - auto-create on Vercel or Mock login' });
});

// --- AUTHENTICATION ROUTES ---

// Register Doctor
app.post('/api/auth/register', async (req, res) => {
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

    // Seed default workspace data for this newly registered doctor in MySQL
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
  const { doctorId, password } = req.body;
  if (!doctorId || !password) {
    return res.status(400).json({ error: 'Doctor ID and password are required' });
  }

  try {
    let doctor = await Doctor.findOne({ where: { doctor_id: doctorId } });
    
    // Auto-create on the fly on Vercel or Mock mode to survive serverless restarts/multi-instances
    const { sequelize } = await import('./db.js');
    if (!doctor && (process.env.VERCEL || sequelize.isMock)) {
      console.log(`[MOCK DB] Doctor ${doctorId} not found. Auto-creating on the fly for serverless persistence.`);
      const hashedPassword = await bcrypt.hash(password, 10);
      doctor = await Doctor.create({
        doctor_id: doctorId,
        name: 'Dr. User (' + doctorId + ')',
        password: hashedPassword
      });
    }

    if (!doctor) {
      return res.status(400).json({ error: 'Invalid Doctor ID or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, doctor.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid Doctor ID or password' });
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
    const appointments = await Appointment.findAll({
      where: { doctor_id: req.user.doctorId, deleted: false },
      order: [['id', 'DESC']]
    });
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
    const patientExists = await Patient.findOne({ where: { name: patient, doctor_id: req.user.doctorId } });
    if (!patientExists) {
      await Patient.create({
        doctor_id: req.user.doctorId,
        name: patient,
        age: 35,
        gender: 'Male',
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

// Delete Appointment (Soft Delete)
app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const [affectedCount] = await Appointment.update(
      { deleted: true, deleted_at: new Date() },
      { where: { id: req.params.id, doctor_id: req.user.doctorId } }
    );

    if (affectedCount === 0) {
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
    const totalPatients = await Patient.count({ where: { doctor_id: doctorId, deleted: false } });
    const pendingLogs = await Patient.count({
      where: {
        doctor_id: doctorId,
        student: { [Op.ne]: 'None' },
        status: 'Pending',
        deleted: false
      }
    });
    const todaySessions = await Appointment.count({ where: { doctor_id: doctorId, deleted: false } });
    const approvedPatients = await Patient.count({
      where: {
        doctor_id: doctorId,
        status: 'Approved',
        deleted: false
      }
    });
    const recoveryRate = totalPatients > 0 ? Math.round((approvedPatients / totalPatients) * 100) : 0;
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newPatientsThisMonth = await Patient.count({
      where: {
        doctor_id: doctorId,
        created_at: { [Op.gte]: thirtyDaysAgo },
        deleted: false
      }
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
    const patients = await Patient.findAll({
      where: { doctor_id: req.user.doctorId, deleted: false },
      order: [['id', 'ASC']]
    });
    res.json(patients);
  } catch (err) {
    console.error('Fetch patients error:', err);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Create Patient
app.post('/api/patients', authenticateToken, async (req, res) => {
  const { name, age, gender, condition } = req.body;
  if (!name || !condition) {
    return res.status(400).json({ error: 'Name and condition are required' });
  }

  try {
    // Check if patient already exists
    const existing = await Patient.findOne({ where: { name, doctor_id: req.user.doctorId } });
    if (existing && !existing.deleted) {
      return res.status(409).json({ error: 'Patient with this name already exists' });
    }
    if (existing && existing.deleted) {
      existing.deleted = false;
      existing.deleted_at = null;
      existing.age = age || existing.age;
      existing.gender = gender || existing.gender;
      existing.condition = condition;
      await existing.save();
      return res.status(200).json(existing);
    }

    const newPatient = await Patient.create({
      doctor_id: req.user.doctorId,
      name,
      age: age || null,
      gender: gender || null,
      condition,
      student: 'None',
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
    const patients = await Patient.findAll({
      where: {
        student: { [Op.ne]: 'None' },
        doctor_id: req.user.doctorId,
        deleted: false
      }
    });
    
    // Attach default notes to matching topics
    const logs = patients.map(p => {
      let notes = 'Case report submitted. Patient responding well to parameters.';
      if (p.name === 'Rahul Verma') {
        notes = 'Patient showed 15 degrees improvement in knee flexion. Pain scale 4/10.';
      } else if (p.name === 'Priya Sharma') {
        notes = 'Applied TENS for 15 mins. Muscle spasms reduced significantly.';
      } else if (p.name === 'Neha Gupta') {
        notes = 'Patient successfully completed 3 sets of planks and bird-dogs.';
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
      where: {
        id: req.params.id,
        doctor_id: req.user.doctorId
      }
    });
    
    if (!patientRow) {
      return res.status(404).json({ error: 'Patient case not found' });
    }

    patientRow.status = 'Approved';
    await patientRow.save();

    // Keep protocols table in sync
    await Protocol.update(
      { status: 'Approved', updated_at: new Date() },
      { where: { patient_name: patientRow.name, doctor_id: req.user.doctorId } }
    );

    res.json({ message: 'Patient clinical log approved successfully' });
  } catch (err) {
    console.error('Approve patient case error:', err);
    res.status(500).json({ error: 'Failed to approve case log' });
  }
});


// Soft-delete patient record
app.delete('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.user.doctorId;
    const patientRow = await Patient.findOne({ where: { id: req.params.id, doctor_id: doctorId } });
    if (!patientRow) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Soft-delete patient
    patientRow.deleted = true;
    patientRow.deleted_at = new Date();
    await patientRow.save();

    // Soft-delete associated appointments for this patient
    await Appointment.update(
      { deleted: true, deleted_at: new Date() },
      { where: { patient: patientRow.name, doctor_id: doctorId, deleted: false } }
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
    const appointments = await Appointment.findAll({
      where: { doctor_id: doctorId, deleted: true },
      order: [['deleted_at', 'DESC']]
    });
    const patients = await Patient.findAll({
      where: { doctor_id: doctorId, deleted: true },
      order: [['deleted_at', 'DESC']]
    });
    res.json({ appointments, patients });
  } catch (err) {
    console.error('Fetch recycle bin error:', err);
    res.status(500).json({ error: 'Failed to fetch recycle bin' });
  }
});

// Restore deleted appointment
app.put('/api/recycle-bin/restore/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const [affectedCount] = await Appointment.update(
      { deleted: false, deleted_at: null },
      { where: { id: req.params.id, doctor_id: req.user.doctorId } }
    );
    if (affectedCount === 0) {
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
    const patientRow = await Patient.findOne({ where: { id: req.params.id, doctor_id: doctorId } });
    if (!patientRow) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    patientRow.deleted = false;
    patientRow.deleted_at = null;
    await patientRow.save();

    // Also restore associated appointments that were soft-deleted
    await Appointment.update(
      { deleted: false, deleted_at: null },
      { where: { patient: patientRow.name, doctor_id: doctorId, deleted: true } }
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
    const deletedCount = await Appointment.destroy({
      where: { id: req.params.id, doctor_id: req.user.doctorId }
    });
    if (deletedCount === 0) {
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
    const patientRow = await Patient.findOne({ where: { id: req.params.id, doctor_id: doctorId } });
    if (!patientRow) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Delete associated appointments
    await Appointment.destroy({ where: { patient: patientRow.name, doctor_id: doctorId } });

    // Delete patient
    await Patient.destroy({ where: { id: req.params.id, doctor_id: doctorId } });

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
    await Appointment.destroy({ where: { doctor_id: doctorId, deleted: true } });
    await Patient.destroy({ where: { doctor_id: doctorId, deleted: true } });
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
      where: {
        patient_name: req.params.patientName,
        doctor_id: req.user.doctorId
      }
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

    const existing = await Protocol.findOne({ where: { patient_name, doctor_id: req.user.doctorId } });
    if (existing) {
      await existing.update({
        pain_score: pain_score || 4,
        exercises,
        rpe_exertion: rpe_exertion || 4,
        biomechanical_rationale: biomechanical_rationale === undefined ? 1 : biomechanical_rationale,
        phase_checklist,
        status: newStatus,
        updated_at: new Date()
      });
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
    await Patient.update(
      { status: newStatus === 'Approved' ? 'Approved' : 'Pending' },
      { where: { name: patient_name, doctor_id: req.user.doctorId } }
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
    const notes = await EMRNote.findAll({
      where: { doctor_id: req.user.doctorId },
      order: [['id', 'DESC']]
    });
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
    
    const notes = await EMRNote.findAll({
      where: { doctor_id: req.user.doctorId },
      order: [['id', 'DESC']]
    });
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
      where: {
        patient_name: req.params.patientName,
        doctor_id: req.user.doctorId
      }
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
    const existing = await Wearable.findOne({ where: { patient_name, doctor_id: req.user.doctorId } });
    if (existing) {
      await existing.update({
        heart_rate: heart_rate || 72,
        steps: steps || 4200,
        calories: calories || 150,
        sleep_hours: sleep_hours || 7.5,
        updated_at: new Date()
      });
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

// Start Express Server
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`PhysioSync backend server running on http://localhost:${PORT}`);
  });
}

export default app;
