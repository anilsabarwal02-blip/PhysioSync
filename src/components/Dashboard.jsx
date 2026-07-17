import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ActivitySquare, Bell, Mic, Search, Clock, X, BrainCircuit, Trash2, Plus, CheckCircle, Phone } from 'lucide-react';
import { api, getBackendStatus } from '../utils/api';

let idCounter = Date.now();
const getUniqueId = () => {
  idCounter += 1;
  return idCounter;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHistory, setSearchHistory] = useState(() => {
    return JSON.parse(localStorage.getItem('searchHistory') || '[]');
  });
  const [showHistory, setShowHistory] = useState(false);
  const [patients, setPatients] = useState(() => {
    const localPatientsList = JSON.parse(localStorage.getItem('patients_list') || '[]');
    return localPatientsList.filter(p => !p.student || p.student === 'None').map(p => {
      const desc = `${p.condition} • ${p.student && p.student !== 'None' ? 'Student: ' + p.student : 'Waiting for Assessment'}`;
      const isApproved = p.status === 'Approved' || localStorage.getItem(`patient_status_${p.name}`) === 'Approved';
      return {
        id: p.id,
        name: p.name,
        phone: p.phone,
        desc,
        status: isApproved ? 'Approved' : p.status,
        statusClass: isApproved ? 'status-active' : 'status-pending',
        style: isApproved ? { background: 'rgba(16, 185, 129, 0.2)', color: '#0d9488' } : null
      };
    });
  });
  const [doctorName] = useState(() => {
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      const user = JSON.parse(currentUserStr);
      return user.name || 'Dr. Sharma';
    }
    return 'Dr. Sharma';
  });
  const [patientToDelete, setPatientToDelete] = useState(null); // { id, name }
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem('clinic_notifications');
    if (stored) return JSON.parse(stored);
    return [
      { id: 1, text: "Welcome to PhysioSync clinic management dashboard.", time: "1 hour ago", read: false },
      { id: 2, text: "System check: Database connection is healthy.", time: "2 hours ago", read: true }
    ];
  });
  const [stats, setStats] = useState(() => {
    const localPatientsList = JSON.parse(localStorage.getItem('patients_list') || '[]');
    let localAppointments = JSON.parse(localStorage.getItem('appointments_list') || '[]');
    
    if (localAppointments.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      localAppointments = [
        { id: 'a1', patient: 'Rahul Verma', type: 'Tele Rehab', treatment: 'Knee Ligament Post-Op Rehab', time: '10:00 AM', date: today, duration: '45 min', status: 'Confirmed', notes: 'Initial consultation.' },
        { id: 'a2', patient: 'Aaryan Sharma', type: 'OPD', treatment: 'Shoulder Rotator Cuff Tear', time: '11:30 AM', date: today, duration: '30 min', status: 'Confirmed', notes: 'Follow up.' },
        { id: 'a3', patient: 'Priya Patel', type: 'Clinic Session', treatment: 'Lumbar Herniated Disc Rehab', time: '02:00 PM', date: today, duration: '60 min', status: 'Confirmed', notes: 'Therapy.' }
      ];
      localStorage.setItem('appointments_list', JSON.stringify(localAppointments));
    }

    const total = localPatientsList.length;
    const pending = localPatientsList.filter(p => p.student && p.student !== 'None' && p.status === 'Pending').length;

    // Filter today's appointments by date string
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const today = localAppointments.filter(app => app.date === todayStr).length;

    const approved = localPatientsList.filter(p => p.status === 'Approved').length;
    const recovery = total > 0 ? Math.round((approved / total) * 100) : 0;
    
    // Filter patients registered in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newPatients = localPatientsList.filter(p => {
      const createdTime = p.created_at || p.createdAt ? new Date(p.created_at || p.createdAt) : null;
      return !createdTime || createdTime >= thirtyDaysAgo;
    }).length;

    return {
      totalPatients: total,
      pendingLogs: pending,
      todaySessions: today,
      recoveryRate: recovery,
      newPatientsThisMonth: newPatients
    };
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState('Male');
  const [newPhone, setNewPhone] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newStudent, setNewStudent] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [activeListTab, setActiveListTab] = useState(localStorage.getItem('activeListTab') || 'patients'); // 'patients' | 'logs'
  useEffect(() => {
    localStorage.setItem('activeListTab', activeListTab);
  }, [activeListTab]);
  const [studentLogs, setStudentLogs] = useState([]);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncOfflineData = async () => {
    setIsSyncing(true);
    let pCount = 0;
    let aCount = 0;
    
    // Sync Patients
    const localPatients = JSON.parse(localStorage.getItem('patients_list') || '[]');
    for (const p of localPatients) {
      if (p.id && p.id.toString().startsWith('temp-')) {
        try {
          await api.createPatient({
            name: p.name,
            age: p.age,
            gender: p.gender,
            phone: p.phone,
            condition: p.condition,
            student: p.student,
            log_notes: p.log_notes
          });
          pCount++;
        } catch (e) { console.error("Failed to sync patient:", p.name, e); }
      }
    }
    
    // Sync Appointments
    const localApps = JSON.parse(localStorage.getItem('appointments_list') || '[]');
    for (const a of localApps) {
      if (a.id && a.id.toString().startsWith('a-')) {
        try {
          await api.createAppointment({
            patient: a.patient || a.name,
            type: a.type || 'Clinic Session',
            treatment: a.treatment || a.desc,
            time: a.time,
            date: a.date,
            duration: a.duration,
            status: a.status,
            notes: a.notes || 'Synced from offline mode'
          });
          aCount++;
        } catch (e) { console.error("Failed to sync appointment:", a.patient, e); }
      }
    }
    
    // Clear old offline entries from local storage to prevent duplicate syncing
    const newLocalPatients = localPatients.filter(p => !p.id || !p.id.toString().startsWith('temp-'));
    localStorage.setItem('patients_list', JSON.stringify(newLocalPatients));
    
    const newLocalApps = localApps.filter(a => !a.id || !a.id.toString().startsWith('a-'));
    localStorage.setItem('appointments_list', JSON.stringify(newLocalApps));
    
    setIsSyncing(false);
    alert(`Successfully synced ${pCount} offline patients and ${aCount} offline appointments to the database! Refresh the page to see them.`);
  };

  const handleAddPatient = async () => {
    setFormError('');
    if (activeListTab === 'logs') {
      if (!newName.trim() || !newCondition.trim() || !newStudent.trim()) {
        setFormError("Please fill in Patient Name, Student Name, and Condition.");
        return;
      }
    } else {
      if (!newName.trim() || !newCondition.trim() || !newPhone.trim()) {
        setFormError("Please fill in Name, Phone Number, and Condition.");
        return;
      }
      if (newPhone.length !== 10) {
        setFormError("Phone number must be exactly 10 digits.");
        return;
      }
    }

    const tempId = 'temp-' + Date.now();
    const newPatLocal = {
      id: tempId,
      name: newName,
      age: newAge ? parseInt(newAge) : null,
      gender: activeListTab === 'logs' ? null : newGender,
      phone: activeListTab === 'logs' ? null : newPhone,
      condition: newCondition,
      student: activeListTab === 'logs' ? (newStudent || 'None') : 'None',
      log_notes: activeListTab === 'logs' ? newNotes : '',
      status: activeListTab === 'logs' && newStudent ? 'Pending' : 'Pending',
      last_visit: 'New Patient',
      created_at: new Date().toISOString(),
      deleted: false
    };

    // Optimistically update local UI state
    if (activeListTab === 'logs') {
      const newLogLocal = {
        id: tempId,
        student: newPatLocal.student,
        patient: newPatLocal.name,
        topic: newPatLocal.condition,
        time: 'New Patient',
        status: newPatLocal.status,
        notes: newPatLocal.log_notes
      };
      setStudentLogs([newLogLocal, ...studentLogs]);
      setStats(prev => ({ ...prev, pendingLogs: prev.pendingLogs + 1 }));
    } else {
      const desc = `${newPatLocal.condition} • Waiting for Assessment`;
      const mappedLocal = {
        id: tempId,
        name: newPatLocal.name,
        phone: newPatLocal.phone,
        desc,
        status: newPatLocal.status,
        statusClass: 'status-pending',
        style: null
      };
      setPatients([mappedLocal, ...patients]);
    }

    // Save to local patients list cache
    const currentLocalPatientsList = JSON.parse(localStorage.getItem('patients_list') || '[]');
    localStorage.setItem('patients_list', JSON.stringify([newPatLocal, ...currentLocalPatientsList]));

    // Auto-create an appointment for the new patient
    const todayStr = new Date().toISOString().split('T')[0];
    const newApp = {
      id: 'a-' + Date.now(),
      patient: newPatLocal.name,
      type: (() => {
        const cond = newPatLocal.condition.toLowerCase();
        if (cond.includes('clinic')) return 'Clinic Session';
        if (cond.includes('opd')) return 'OPD';
        if (cond.includes('ipd')) return 'IPD';
        if (cond.includes('emergency')) return 'Emergency';
        if (cond.includes('home')) return 'Home Visit';
        if (cond.includes('diagnostic')) return 'Diagnostic';
        if (cond.includes('antenatal')) return 'Antenatal';
        if (cond.includes('paediatric')) return 'Paediatric';
        return 'Other';
      })(),
      treatment: newPatLocal.condition,
      time: '04:00 PM',
      date: todayStr,
      duration: '45 min',
      status: 'Confirmed',
      notes: 'Auto-scheduled initial consultation.'
    };
    const currentAppointments = JSON.parse(localStorage.getItem('appointments_list') || '[]');
    localStorage.setItem('appointments_list', JSON.stringify([newApp, ...currentAppointments]));

    // Update total patients count in stats optimistically
    setStats(prev => ({
      ...prev,
      totalPatients: prev.totalPatients + 1,
      todaySessions: prev.todaySessions + 1,
      newPatientsThisMonth: prev.newPatientsThisMonth + 1
    }));

    // Reset and close modal
    setNewName('');
    setNewAge('');
    setNewGender('Male');
    setNewPhone('');
    setNewCondition('');
    setShowAddModal(false);

    // Sync with backend API
    try {
      const savedPatient = await api.createPatient({
        name: newPatLocal.name,
        age: newPatLocal.age,
        gender: newPatLocal.gender,
        phone: newPatLocal.phone,
        condition: newPatLocal.condition,
        student: newPatLocal.student,
        log_notes: newPatLocal.log_notes
      });

      // Also sync the auto-created appointment
      try {
        await api.createAppointment(newApp);
      } catch (appErr) {
        console.warn("[API] Failed to sync auto-created appointment:", appErr.message);
      }

      // Update state and cache with actual database item
      if (activeListTab === 'logs') {
        setStudentLogs(prev => prev.map(p => p.id === tempId ? { ...p, id: savedPatient._id || savedPatient.id } : p));
      } else {
        setPatients(prev => {
          const desc = `${savedPatient.condition} • ${savedPatient.student && savedPatient.student !== 'None' ? 'Student: ' + savedPatient.student : 'Waiting for Assessment'}`;
          const isApproved = savedPatient.status === 'Approved';
          const finalMapped = {
            id: savedPatient._id || savedPatient.id,
            name: savedPatient.name,
            phone: savedPatient.phone,
            desc,
            status: savedPatient.status,
            statusClass: isApproved ? 'status-active' : 'status-pending',
            style: isApproved ? { background: 'rgba(16, 185, 129, 0.2)', color: '#0d9488' } : null
          };
          
          const exists = prev.some(p => p.id === tempId || p.id === finalMapped.id);
          return exists 
            ? prev.map(p => (p.id === tempId ? finalMapped : p))
            : [finalMapped, ...prev];
        });
      }
        
      // Refresh local storage patients_list
      const currentLocal = JSON.parse(localStorage.getItem('patients_list') || '[]');
      const localExists = currentLocal.some(p => p.id === tempId || (p._id || p.id) === savedPatient.id);
      const updatedLocal = localExists
        ? currentLocal.map(p => (p.id === tempId ? savedPatient : p))
        : [savedPatient, ...currentLocal];
      localStorage.setItem('patients_list', JSON.stringify(updatedLocal));

      // Fetch dashboard stats from backend to get fresh counts
      try {
        const freshStats = await api.getDashboardStats();
        setStats(freshStats);
      } catch (err) {
        console.debug("Failed to fetch dashboard stats", err);
      }

    } catch (err) {
      console.warn("[API] Background patient sync failed. Stored locally. Error:", err.message);
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications([]);
  };

  const getInitials = (name) => {
    if (!name) return 'DS';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    window.location.reload();
  };

  useEffect(() => {
    localStorage.setItem('clinic_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.header-actions')) {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const backendPatients = await api.getPatients();
        const mapped = backendPatients.filter(p => !p.student || p.student === 'None').map(p => {
          const desc = `${p.condition} • ${p.student && p.student !== 'None' ? 'Student: ' + p.student : 'Waiting for Assessment'}`;
          const isApproved = p.status === 'Approved';
          return {
            id: p._id || p.id,
            name: p.name,
            desc,
            status: p.status,
            statusClass: isApproved ? 'status-active' : 'status-pending',
            style: isApproved ? { background: 'rgba(16, 185, 129, 0.2)', color: '#0d9488' } : null
          };
        });
        setPatients(mapped);
        localStorage.setItem('patients_list', JSON.stringify(backendPatients));
      } catch (err) {
        console.warn("[API] Failed to fetch patients from backend in background:", err.message);
      }
    };

    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.warn("[API] Failed to fetch dashboard stats in background:", err.message);
      }
    };

    const fetchLogs = async () => {
      try {
        const data = await api.getLogs();
        setStudentLogs(data);
      } catch (err) {
        console.warn("[API] Failed to fetch student logs from backend:", err.message);
      }
    };

    fetchPatients();
    fetchStats();
    fetchLogs();
  }, []);

  const handleDeletePatient = (id, name, e) => {
    e.stopPropagation();
    setPatientToDelete({ id, name });
  };

  const executeDeletePatient = async () => {
    if (!patientToDelete) return;
    const { id, name } = patientToDelete;
    setPatientToDelete(null);
    try {
      await api.deletePatient(id);
      // Add notification
      const newNotif = {
        id: Date.now(),
        text: `Patient ${name} was moved to Recycle Bin`,
        time: "Just now",
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);

      // Refresh patients and stats
      const backendPatients = await api.getPatients();
      const mapped = backendPatients.filter(p => !p.student || p.student === 'None').map(p => {
        const desc = `${p.condition} • ${p.student && p.student !== 'None' ? 'Student: ' + p.student : 'Waiting for Assessment'}`;
        const isApproved = p.status === 'Approved';
        return {
          id: p._id || p.id,
          name: p.name,
          desc,
          status: p.status,
          statusClass: isApproved ? 'status-active' : 'status-pending',
          style: isApproved ? { background: 'rgba(16, 185, 129, 0.2)', color: '#0d9488' } : null
        };
      });
      setPatients(mapped);
      
      const statsData = await api.getDashboardStats();
      setStats(statsData);
    } catch (err) {
      if (!getBackendStatus()) {
        // Offline fallback
        const localPatientsList = JSON.parse(localStorage.getItem('patients_list') || '[]');
        
        // Move patient to bin in localStorage
        const patientToDeleteLocal = localPatientsList.find(p => p.id === id);
        if (patientToDeleteLocal) {
          const patientsBin = JSON.parse(localStorage.getItem('patients_bin') || '[]');
          patientToDeleteLocal.deleted = true;
          patientToDeleteLocal.deleted_at = new Date().toISOString();
          patientsBin.push(patientToDeleteLocal);
          localStorage.setItem('patients_bin', JSON.stringify(patientsBin));
          
          const updatedPatients = localPatientsList.filter(p => p.id !== id);
          localStorage.setItem('patients_list', JSON.stringify(updatedPatients));

          // Soft-delete patient's associated appointments in localStorage
          const localAppointmentsList = JSON.parse(localStorage.getItem('appointments_list') || '[]');
          const appointmentsToDelete = localAppointmentsList.filter(a => a.patient === patientToDeleteLocal.name);
          const remainingAppointments = localAppointmentsList.filter(a => a.patient !== patientToDeleteLocal.name);
          
          if (appointmentsToDelete.length > 0) {
            const appointmentsBin = JSON.parse(localStorage.getItem('appointments_bin') || '[]');
            const appointmentsWithFlag = appointmentsToDelete.map(a => ({
              ...a,
              deleted: true,
              deleted_at: new Date().toISOString()
            }));
            appointmentsBin.push(...appointmentsWithFlag);
            localStorage.setItem('appointments_bin', JSON.stringify(appointmentsBin));
          }
          localStorage.setItem('appointments_list', JSON.stringify(remainingAppointments));
          
          // Add notification
          const newNotif = {
            id: Date.now(),
            text: `Patient ${name} was moved to Recycle Bin (Offline)`,
            time: "Just now",
            read: false
          };
          setNotifications(prev => [newNotif, ...prev]);

          // Map and update state
          const mapped = updatedPatients.filter(p => !p.student || p.student === 'None').map(p => {
            const desc = `${p.condition} • ${p.student && p.student !== 'None' ? 'Student: ' + p.student : 'Waiting for Assessment'}`;
            const isApproved = p.status === 'Approved';
            return {
              id: p.id,
              name: p.name,
              desc,
              status: p.status,
              statusClass: isApproved ? 'status-active' : 'status-pending',
              style: isApproved ? { background: 'rgba(16, 185, 129, 0.2)', color: '#0d9488' } : null
            };
          });
          setPatients(mapped);
          
          // Recalculate stats locally
          const total = updatedPatients.length;
          const pending = updatedPatients.filter(p => p.student && p.student !== 'None' && p.status === 'Pending').length;
          const today = remainingAppointments.length;
          const approved = updatedPatients.filter(p => p.status === 'Approved').length;
          const recovery = total > 0 ? Math.round((approved / total) * 100) : 0;
          
          setStats({
            totalPatients: total,
            pendingLogs: pending,
            todaySessions: today,
            recoveryRate: recovery,
            newPatientsThisMonth: total
          });
        }
      } else {
        alert(`Failed to delete patient: ${err.message}`);
      }
    }
  };

  const handleApproveStudentCase = async (id, patientName) => {
    try {
      await api.approveLog(id);
      
      // Add notification
      const newNotif = {
        id: getUniqueId(),
        text: `Clinical case log for ${patientName} has been approved.`,
        time: "Just now",
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);

      // Refresh list, patients, and stats
      const logsData = await api.getLogs();
      setStudentLogs(logsData);

      const backendPatients = await api.getPatients();
      const mapped = backendPatients.filter(p => !p.student || p.student === 'None').map(p => {
        const desc = `${p.condition} • ${p.student && p.student !== 'None' ? 'Student: ' + p.student : 'Waiting for Assessment'}`;
        const isApproved = p.status === 'Approved';
        return {
          id: p._id || p.id,
          name: p.name,
          desc,
          status: p.status,
          statusClass: isApproved ? 'status-active' : 'status-pending',
          style: isApproved ? { background: 'rgba(16, 185, 129, 0.2)', color: '#0d9488' } : null
        };
      });
      setPatients(mapped);

      const statsData = await api.getDashboardStats();
      setStats(statsData);
      alert(`Clinical case log for ${patientName} approved successfully.`);
    } catch (err) {
      if (!getBackendStatus()) {
        // Offline fallback
        const localPatients = JSON.parse(localStorage.getItem('patients_list') || '[]');
        const updatedPatients = localPatients.map(p => {
          if (p.id === id || p._id === id) {
            p.status = 'Approved';
            localStorage.setItem(`patient_status_${p.name}`, 'Approved');
          }
          return p;
        });
        localStorage.setItem('patients_list', JSON.stringify(updatedPatients));
        
        const mapped = updatedPatients.filter(p => !p.student || p.student === 'None').map(p => {
          const desc = `${p.condition} • ${p.student && p.student !== 'None' ? 'Student: ' + p.student : 'Waiting for Assessment'}`;
          const isApproved = p.status === 'Approved';
          return {
            id: p.id || p._id,
            name: p.name,
            desc,
            status: p.status,
            statusClass: isApproved ? 'status-active' : 'status-pending',
            style: isApproved ? { background: 'rgba(16, 185, 129, 0.2)', color: '#0d9488' } : null
          };
        });
        setPatients(mapped);

        setStudentLogs(prev => prev.map(log => {
          if (log.id === id) {
            log.status = 'Approved';
          }
          return log;
        }));

        const total = updatedPatients.length;
        const pending = updatedPatients.filter(p => p.student && p.student !== 'None' && p.status === 'Pending').length;
        const approved = updatedPatients.filter(p => p.status === 'Approved').length;
        const recovery = total > 0 ? Math.round((approved / total) * 100) : 0;
        
        setStats(prev => ({
          ...prev,
          pendingLogs: pending,
          recoveryRate: recovery
        }));

        const newNotif = {
          id: getUniqueId(),
          text: `Clinical case log for ${patientName} approved (Offline).`,
          time: "Just now",
          read: false
        };
        setNotifications(prev => [newNotif, ...prev]);
        alert(`Clinical case log for ${patientName} approved successfully (offline fallback).`);
      } else {
        alert(`Failed to approve case log: ${err.message}`);
      }
    }
  };

  const handleDeleteLog = async (id, patientName) => {
    try {
      await api.deleteLog(id);
      
      const newNotif = {
        id: getUniqueId(),
        text: `Clinical case log for ${patientName} has been dismissed.`,
        time: "Just now",
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);

      // Refresh list, patients, and stats
      const logsData = await api.getLogs();
      setStudentLogs(logsData);

      const backendPatients = await api.getPatients();
      const mapped = backendPatients.filter(p => !p.student || p.student === 'None').map(p => {
        const desc = `${p.condition} • ${p.student && p.student !== 'None' ? 'Student: ' + p.student : 'Waiting for Assessment'}`;
        const isApproved = p.status === 'Approved';
        return {
          id: p._id || p.id,
          name: p.name,
          desc,
          status: p.status,
          statusClass: isApproved ? 'status-active' : 'status-pending',
          style: isApproved ? { background: 'rgba(16, 185, 129, 0.2)', color: '#0d9488' } : null
        };
      });
      setPatients(mapped);

      const statsData = await api.getDashboardStats();
      setStats(statsData);
      
    } catch (err) {
      if (!getBackendStatus()) {
        const localPatients = JSON.parse(localStorage.getItem('patients_list') || '[]');
        const updatedPatients = localPatients.map(p => {
          if (p.id === id || p._id === id) {
            p.student = 'None';
            p.status = 'Pending';
          }
          return p;
        });
        localStorage.setItem('patients_list', JSON.stringify(updatedPatients));
        
        setStudentLogs(prev => prev.filter(log => log.id !== id));
        
        const mapped = updatedPatients.filter(p => !p.student || p.student === 'None').map(p => {
          const desc = `${p.condition} • ${p.student && p.student !== 'None' ? 'Student: ' + p.student : 'Waiting for Assessment'}`;
          const isApproved = p.status === 'Approved';
          return {
            id: p.id || p._id,
            name: p.name,
            desc,
            status: p.status,
            statusClass: isApproved ? 'status-active' : 'status-pending',
            style: isApproved ? { background: 'rgba(16, 185, 129, 0.2)', color: '#0d9488' } : null
          };
        });
        setPatients(mapped);
        
        const pending = updatedPatients.filter(p => p.student && p.student !== 'None' && p.status === 'Pending').length;
        setStats(prev => ({ ...prev, pendingLogs: pending }));
      } else {
        alert(`Failed to delete case log: ${err.message}`);
      }
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchTerm.trim() !== '') {
      const updatedHistory = [searchTerm, ...searchHistory.filter(item => item !== searchTerm)].slice(0, 5);
      setSearchHistory(updatedHistory);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      setShowHistory(false);
    }
  };

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.desc.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredLogs = studentLogs.filter(l => l.topic.toLowerCase().includes(searchTerm.toLowerCase()) || l.patient.toLowerCase().includes(searchTerm.toLowerCase()) || l.student.toLowerCase().includes(searchTerm.toLowerCase()));

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };
  return (
    <div className="main-content">
      <header className="dashboard-header">
        <div>
          <h1>Welcome, {doctorName} 👋</h1>
          <p>Here is your clinic's overview for today.</p>
        </div>
        
        <div className="header-actions" style={{ position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input 
              type="text" 
              className="search-bar" 
              placeholder="Search patients, logs..." 
              style={{ paddingLeft: '38px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchSubmit}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            />
            {showHistory && (searchTerm.trim() !== '' ? (
              filteredPatients.length > 0 && (
                <div className="glass-panel" style={{ position: 'absolute', top: '45px', left: 0, right: 0, zIndex: 100, padding: '10px 0', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 8px', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Patient Matches</span>
                  </div>
                  {filteredPatients.slice(0, 5).map((p, index) => (
                    <div key={index} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '0.9rem' }} className="nav-item" onClick={() => { setSearchTerm(p.name); setShowHistory(false); }}>
                      <Users size={16} color="var(--primary)" />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                         <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{p.name}</span>
                         <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              searchHistory.length > 0 && (
                <div className="glass-panel" style={{ position: 'absolute', top: '45px', left: 0, right: 0, zIndex: 100, padding: '10px 0', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 8px', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Recent Searches</span>
                    <span onClick={clearHistory} style={{ cursor: 'pointer', color: 'var(--primary)' }}>Clear</span>
                  </div>
                  {searchHistory.map((item, index) => (
                    <div key={index} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }} className="nav-item" onClick={() => setSearchTerm(item)}>
                      <Clock size={16} color="var(--text-muted)" />
                      {item}
                    </div>
                  ))}
                </div>
              )
            ))}
          </div>
          {/* Bell Notification Button & Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              className="glass-button" 
              style={{ 
                padding: '8px', 
                display: 'flex', 
                borderRadius: '50%', 
                cursor: 'pointer', 
                position: 'relative',
                border: 'none',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))'
              }}
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
            >
              <Bell size={20} />
              {/* Red Badge for Unread Notifications */}
              {notifications.some(n => !n.read) && (
                <span style={{
                  position: 'absolute',
                  top: '0px',
                  right: '0px',
                  width: '10px',
                  height: '10px',
                  background: 'var(--danger)',
                  borderRadius: '50%',
                  border: '1.5px solid white'
                }} />
              )}
            </button>

            {showNotifications && (
              <div className="glass-panel notification-dropdown">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <h4 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--text-main)' }}>Notifications</h4>
                  {notifications.length > 0 && (
                    <button 
                      onClick={markAllNotificationsAsRead}
                      style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div key={n.id} style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: n.read ? 'transparent' : 'rgba(13, 148, 136, 0.05)',
                        borderLeft: n.read ? 'none' : '3px solid var(--primary)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                      }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, fontWeight: n.read ? 'normal' : '500', lineHeight: '1.4' }}>{n.text}</p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.time}</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0' }}>No notifications</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Dropdown */}
          <div style={{ position: 'relative' }}>
            <div 
              className="user-profile" 
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
            >
              <div className="avatar" style={{ background: 'var(--primary)', color: 'white' }}>{getInitials(doctorName)}</div>
            </div>

            {showProfileMenu && (
              <div className="glass-panel" style={{
                position: 'absolute',
                top: '50px',
                right: '0px',
                width: '240px',
                padding: '16px',
                zIndex: 1000,
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '1rem', background: 'var(--primary)', color: 'white' }}>{getInitials(doctorName)}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <h4 style={{ fontSize: '0.9rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-main)' }}>{doctorName}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doctorName === 'Dr. Sharma' ? 'ID: DR-DEFAULT' : 'Clinic Owner'}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button 
                    onClick={() => { navigate('/appointments'); setShowProfileMenu(false); }} 
                    className="nav-item" 
                    style={{ background: 'transparent', border: 'none', padding: '10px 12px', borderRadius: '8px', fontSize: '0.85rem', width: '100%', justifyContent: 'flex-start', margin: 0 }}
                  >
                    View Schedule
                  </button>
                  <button 
                    onClick={() => { navigate('/recycle-bin'); setShowProfileMenu(false); }} 
                    className="nav-item" 
                    style={{ background: 'transparent', border: 'none', padding: '10px 12px', borderRadius: '8px', fontSize: '0.85rem', width: '100%', justifyContent: 'flex-start', margin: 0 }}
                  >
                    Recycle Bin
                  </button>
                </div>

                <button 
                  onClick={handleLogout} 
                  className="glass-button" 
                  style={{
                    background: 'var(--danger)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    marginTop: '4px'
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Metrics */}
      <div className="metrics-grid">
        <div className="glass-panel metric-card">
          <div className="metric-header">
            <span>Total Patients</span>
            <Users size={20} color="var(--primary)" />
          </div>
          <div className="metric-value">{stats.totalPatients.toLocaleString()}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
            {stats.newPatientsThisMonth > 0 ? `+${stats.newPatientsThisMonth} this month` : 'No new patients'}
          </p>
        </div>

        <div className="glass-panel metric-card" onClick={() => navigate('/appointments')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span>Today's Sessions</span>
            <ActivitySquare size={20} color="var(--secondary)" />
          </div>
          <div className="metric-value">{stats.todaySessions}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
            {stats.todaySessions > 0 ? 'Next session active' : 'No sessions scheduled'}
          </p>
        </div>
      </div>

      <div className="dashboard-content-grid">
        <div className="glass-panel recent-patients-list" style={{ display: 'flex', flexDirection: 'column', maxHeight: '500px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <h3 
                onClick={() => setActiveListTab('patients')} 
                style={{ 
                  margin: 0, 
                  cursor: 'pointer', 
                  color: activeListTab === 'patients' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: activeListTab === 'patients' ? '2px solid var(--primary)' : 'none',
                  paddingBottom: '4px',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}
              >
                Recent Patients
              </h3>
              <h3 
                onClick={() => setActiveListTab('logs')} 
                style={{ 
                  margin: 0, 
                  cursor: 'pointer', 
                  color: activeListTab === 'logs' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: activeListTab === 'logs' ? '2px solid var(--primary)' : 'none',
                  paddingBottom: '4px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Student Logs 
              </h3>
            </div>
            
            {activeListTab === 'patients' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="glass-button" 
                  onClick={handleSyncOfflineData} 
                  disabled={isSyncing}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.85rem', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                >
                  {isSyncing ? 'Syncing...' : 'Sync Offline'}
                </button>
                <button 
                  className="glass-button" 
                  onClick={() => setShowAddModal(true)} 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.85rem', background: 'var(--primary)', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)' }}
                >
                  <Plus size={14} /> Add Patient
                </button>
              </div>
            )}
            {activeListTab === 'logs' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="glass-button" 
                  onClick={() => setShowAddModal(true)} 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.85rem', background: 'var(--primary)', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)' }}
                >
                  <Plus size={14} /> Add Log
                </button>
              </div>
            )}
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeListTab === 'patients' ? (
              filteredPatients.length > 0 ? (
                filteredPatients.map((p, index) => (
                  <div key={index} className="list-item">
                    <div className="patient-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0 }}>{p.name}</h4>
                        {p.phone && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--border)', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={10} />
                            {p.phone}
                          </span>
                        )}
                      </div>
                      <p>{p.desc}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className={`status-badge ${p.statusClass}`} style={p.style || undefined}>
                        {p.status}
                      </div>
                      <button 
                        onClick={(e) => handleDeletePatient(p.id, p.name, e)} 
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--danger)', opacity: 0.7, padding: '4px', borderRadius: '4px', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                        title="Move to Recycle Bin"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p>No patients registered yet. Schedule an appointment to register a patient in real-time.</p>
                </div>
              )
            ) : (
              filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <div key={log.id} style={{ background: 'var(--glass-bg)', padding: '16px', borderRadius: '12px', borderLeft: log.status === 'Pending' ? '4px solid var(--secondary)' : '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {log.patient}
                          <span style={{ fontSize: '0.75rem', background: log.status === 'Approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(2, 132, 199, 0.15)', color: log.status === 'Approved' ? '#0d9488' : 'var(--secondary)', padding: '2px 8px', borderRadius: '8px', fontWeight: 'bold' }}>
                            {log.status}
                          </span>
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Topic: <strong>{log.topic}</strong> • Student: <strong>{log.student}</strong>
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {log.status === 'Pending' && (
                          <button 
                            onClick={() => handleApproveStudentCase(log.id, log.patient)}
                            className="glass-button"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--primary)', color: 'white', display: 'flex', gap: '4px', alignItems: 'center' }}
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteLog(log.id, log.patient)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--danger)', opacity: 0.7, padding: '4px', borderRadius: '4px', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                          title="Dismiss Log"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic', background: 'rgba(255,255,255,0.4)', padding: '8px 12px', borderRadius: '8px' }}>
                      "{log.notes}"
                    </p>
                  </div>
                ))
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p>No student logs submitted for review.</p>
                </div>
              )
            )}
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3>AI Assistant Quick Actions</h3>
          <p style={{ margin: '12px 0', fontSize: '0.9rem' }}>Use AI to speed up your workflow.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
            <button className="quick-action-btn" onClick={() => navigate('/voice-notes')}>
              <Mic size={20} /> Record Voice Note
            </button>

            <button className="quick-action-btn" onClick={() => navigate('/treatment-planner')}>
              <BrainCircuit size={20} /> Generate Treatment Plan
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {patientToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px', position: 'relative', textAlign: 'center', animation: 'scaleIn 0.3s ease' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Trash2 size={22} /> Move to Recycle Bin
            </h3>
            <p style={{ color: 'var(--text-main)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Are you sure you want to move patient <strong>{patientToDelete.name}</strong> to the Recycle Bin?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                className="glass-button" 
                onClick={executeDeletePatient}
                style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '10px 20px', fontWeight: '600', borderRadius: '8px' }}
              >
                Yes, Delete
              </button>
              <button 
                className="glass-button" 
                onClick={() => setPatientToDelete(null)}
                style={{ background: 'var(--glass-bg)', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: '8px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', margin: '0 16px', padding: '24px', position: 'relative', animation: 'scaleIn 0.3s ease' }}>
            <button onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h2 style={{ margin: '0 0 20px 0' }}>
              {activeListTab === 'logs' ? 'Add Student Log' : 'Add New Patient'}
            </h2>
            {formError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{formError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Patient Name</label>
                <input 
                  type="text" 
                  className="search-bar" 
                  style={{ width: '100%', borderRadius: '8px' }} 
                  placeholder="Enter name" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              {activeListTab === 'patients' && (
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Age</label>
                    <input 
                      type="number" 
                      className="search-bar" 
                      style={{ width: '100%', borderRadius: '8px' }} 
                      placeholder="Age" 
                      value={newAge}
                      onChange={(e) => setNewAge(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Gender</label>
                    <select 
                      className="search-bar" 
                      style={{ width: '100%', borderRadius: '8px', cursor: 'pointer' }}
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}
              {activeListTab === 'patients' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Phone Number</label>
                  <input 
                    type="tel" 
                    className="search-bar" 
                    style={{ width: '100%', borderRadius: '8px' }} 
                    placeholder="Phone number"
                    maxLength={10} 
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
              )}
              {activeListTab === 'logs' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Student Name</label>
                  <input 
                    type="text" 
                    className="search-bar" 
                    style={{ width: '100%', borderRadius: '8px' }} 
                    placeholder="Attending student name" 
                    value={newStudent}
                    onChange={(e) => setNewStudent(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
                  {activeListTab === 'logs' ? 'Condition / Topic' : 'Condition / Diagnosis'}
                </label>
                <input 
                  type="text" 
                  className="search-bar" 
                  style={{ width: '100%', borderRadius: '8px' }} 
                  placeholder={activeListTab === 'logs' ? 'e.g. Knee Flexion Improvement' : 'e.g. ACL Tear, Frozen Shoulder'} 
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                />
              </div>
              {activeListTab === 'logs' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Log Details / Notes</label>
                  <textarea 
                    className="search-bar" 
                    style={{ width: '100%', borderRadius: '8px', minHeight: '80px', resize: 'vertical' }} 
                    placeholder="What treatment was provided?" 
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
                </div>
              )}
              <button 
                className="glass-button" 
                onClick={handleAddPatient} 
                style={{ width: '100%', background: 'var(--primary)', color: 'white', border: 'none', padding: '12px', marginTop: '10px', fontWeight: '600', fontSize: '1rem' }}
              >
                {activeListTab === 'logs' ? 'Save Log' : 'Save Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
