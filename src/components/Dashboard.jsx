import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ActivitySquare, TrendingUp, Bell, Mic, Search, Clock, X, BrainCircuit, Trash2 } from 'lucide-react';
import { api, getBackendStatus } from '../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctorName, setDoctorName] = useState('Doctor');
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
  const [stats, setStats] = useState({
    totalPatients: 0,
    pendingLogs: 0,
    todaySessions: 0,
    recoveryRate: 0,
    newPatientsThisMonth: 0
  });

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setSearchHistory(history);

    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      const user = JSON.parse(currentUserStr);
      setDoctorName(user.name || 'Dr. Sharma');
    } else {
      setDoctorName('Dr. Sharma');
    }

    // Load from localStorage immediately so UI renders instantly (0ms delay)
    const localPatientsList = JSON.parse(localStorage.getItem('patients_list') || '[]');
    const localAppointments = JSON.parse(localStorage.getItem('appointments_list') || '[]');
    
    const initialMapped = localPatientsList.map(p => {
      const desc = `${p.condition} • ${p.student && p.student !== 'None' ? 'Student: ' + p.student : 'Waiting for Assessment'}`;
      const isApproved = p.status === 'Approved' || localStorage.getItem(`patient_status_${p.name}`) === 'Approved';
      return {
        id: p.id,
        name: p.name,
        desc,
        status: isApproved ? 'Approved' : p.status,
        statusClass: isApproved ? 'status-active' : 'status-pending',
        style: isApproved ? { background: 'rgba(16, 185, 129, 0.2)', color: '#0d9488' } : null
      };
    });
    setPatients(initialMapped);

    const total = localPatientsList.length;
    const pending = localPatientsList.filter(p => p.student && p.student !== 'None' && p.status === 'Pending').length;
    const today = localAppointments.length;
    const approved = localPatientsList.filter(p => p.status === 'Approved').length;
    const recovery = total > 0 ? Math.round((approved / total) * 100) : 0;
    
    setStats({
      totalPatients: total,
      pendingLogs: pending,
      todaySessions: today,
      recoveryRate: recovery,
      newPatientsThisMonth: total
    });

    const fetchPatients = async () => {
      try {
        const backendPatients = await api.getPatients();
        const mapped = backendPatients.map(p => {
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

    fetchPatients();
    fetchStats();
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
      const mapped = backendPatients.map(p => {
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
          const mapped = updatedPatients.map(p => {
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

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchTerm.trim() !== '') {
      const updatedHistory = [searchTerm, ...searchHistory.filter(item => item !== searchTerm)].slice(0, 5);
      setSearchHistory(updatedHistory);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      setShowHistory(false);
      setSearchTerm('');
      alert(`Searching for: ${searchTerm}`);
    }
  };

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
            {showHistory && searchHistory.length > 0 && (
              <div className="glass-panel" style={{ position: 'absolute', top: '45px', left: 0, right: 0, zIndex: 100, padding: '10px 0', display: 'flex', flexDirection: 'column' }}>
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
            )}
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
                  {notifications.some(n => !n.read) && (
                    <button 
                      onClick={markAllNotificationsAsRead}
                      style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                    >
                      Mark all read
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
        
        <div className="glass-panel metric-card" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <div className="metric-header">
            <span>Recovery Rate</span>
            <TrendingUp size={20} color="var(--accent)" />
          </div>
          <div className="metric-value">{stats.recoveryRate}%</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avg. across clinic</p>
        </div>
      </div>

      <div className="dashboard-content-grid">
        <div className="glass-panel recent-patients-list">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3>Recent Patients</h3>
          </div>
          
          {patients.length > 0 ? (
            patients.map((p, index) => (
              <div key={index} className="list-item">
                <div className="patient-info">
                  <h4>{p.name}</h4>
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
          )}
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
    </div>
  );
};

export default Dashboard;
