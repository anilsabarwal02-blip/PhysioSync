import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, MapPin, User, Video, Plus, Search, FileText, ChevronDown, ChevronUp, CheckCircle, X, Trash2,
  Stethoscope, BedDouble, AlertTriangle, Home, Activity, HeartPulse, Smile 
} from 'lucide-react';
import { api, getBackendStatus } from '../utils/api';

const APPOINTMENT_TYPES = [
  'OPD',
  'IPD',
  'Emergency',
  'Clinic Session',
  'Tele Rehab',
  'Home Visit',
  'Diagnostic',
  'Antenatal',
  'Paediatric'
];

const getTypeIcon = (type) => {
  switch (type) {
    case 'Tele Rehab':
    case 'Tele-Rehab':
      return <Video size={16} />;
    case 'Home Visit':
      return <Home size={16} />;
    case 'OPD':
      return <Stethoscope size={16} />;
    case 'IPD':
      return <BedDouble size={16} />;
    case 'Emergency':
      return <AlertTriangle size={16} />;
    case 'Diagnostic':
      return <Activity size={16} />;
    case 'Antenatal':
      return <HeartPulse size={16} />;
    case 'Paediatric':
      return <Smile size={16} />;
    case 'Clinic Session':
    default:
      return <CalendarIcon size={16} />;
  }
};

const getTagColor = (type) => {
  switch (type) {
    case 'Tele Rehab':
    case 'Tele-Rehab':
      return 'var(--secondary)';
    case 'Emergency':
      return 'var(--danger)';
    case 'Home Visit':
      return '#10b981';
    case 'OPD':
      return 'var(--primary)';
    case 'IPD':
      return '#3b82f6';
    case 'Antenatal':
      return '#ec4899';
    case 'Paediatric':
      return '#84cc16';
    default:
      return 'var(--text-muted)';
  }
};

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await api.getAppointments();
        setAppointments(data);
      } catch (err) {
        if (!getBackendStatus()) {
          const saved = localStorage.getItem('appointments_list');
          if (saved) {
            setAppointments(JSON.parse(saved));
          } else {
            setAppointments([]);
          }
        }
      }
    };
    fetchAppointments();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All'); // 'All', 'In-Clinic', 'Tele-Rehab'
  const [expandedId, setExpandedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form input states
  const [newPatientName, setNewPatientName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState('OPD');
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  const formatTime12Hour = (timeStr) => {
    if (!timeStr) return '';
    const [hoursStr, minutesStr] = timeStr.split(':');
    let hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const handleSaveAppointment = async () => {
    if (!newPatientName.trim() || !newDate) {
      alert("Please fill in all fields (Name and Date) to schedule the appointment.");
      return;
    }
    
    // Auto-assign current time of creation as default time
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const defaultTimeFormatted = formatTime12Hour(`${currentHours}:${currentMinutes}`);

    // Create a local optimistic version of the appointment immediately
    const tempId = 'temp-' + Date.now();
    const newApp = {
      id: tempId,
      patient: newPatientName,
      type: newType,
      treatment: 'General Physiotherapy',
      time: defaultTimeFormatted || '10:00 AM',
      date: newDate,
      duration: '45 min',
      status: 'Confirmed',
      notes: 'Scheduled appointment. Initial clinical notes pending session execution.'
    };

    // Update UI state instantly
    const updatedApps = [newApp, ...appointments];
    setAppointments(updatedApps);

    // Save to localStorage instantly as a fallback
    localStorage.setItem('appointments_list', JSON.stringify(updatedApps));

    // Reset form states and close modal instantly
    setNewPatientName('');
    setNewDate('');
    setNewType('OPD');
    setShowAddModal(false);

    // Sync with the backend in the background
    try {
      const savedApp = await api.createAppointment({
        patient: newApp.patient,
        type: newApp.type,
        treatment: newApp.treatment,
        time: newApp.time,
        date: newApp.date,
        duration: newApp.duration,
        status: newApp.status,
        notes: newApp.notes
      });
      
      // If server successfully saved, replace the temporary item with the server version
      setAppointments(prev => {
        const finalApps = prev.map(app => app.id === tempId ? savedApp : app);
        localStorage.setItem('appointments_list', JSON.stringify(finalApps));
        return finalApps;
      });
    } catch (err) {
      console.warn("[API] Background appointment sync failed. Stored locally. Error:", err.message);
      // We don't block the user with an alert here because it has already been saved locally
    }
  };



  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = app.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.treatment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' || app.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'var(--primary)';
      case 'Pending': return '#f59e0b';
      case 'Cancelled': return 'var(--danger)';
      default: return 'var(--text-muted)';
    }
  };

  const toggleExpand = (id, e) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const handleStatusChange = (id, newStatus, e) => {
    e.stopPropagation();
    setAppointments(appointments.map(app => app.id === id ? { ...app, status: newStatus } : app));
  };

  return (
    <div className="main-content">
      <header className="dashboard-header">
        <div>
          <h1>Appointments & Schedule 📅</h1>
          <p>Manage your daily clinic sessions and tele-rehab meetings.</p>
        </div>
        <div className="header-actions">
          <button className="glass-button" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(13, 148, 136, 0.3)', transition: 'all 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <Plus size={18} /> New Appointment
          </button>
        </div>
      </header>

      <div className="dashboard-content-grid grid-1-3" style={{ alignItems: 'start' }}>
        
        {/* Left Column: Mini Calendar & Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--primary)', padding: '12px', borderRadius: '12px', color: 'white', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', textAlign: 'center' }}>18</h2>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>June</span>
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Today</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{appointments.length} Sessions Scheduled</p>
              </div>
            </div>
            <div className="stats-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
              {APPOINTMENT_TYPES.map(type => {
                const count = appointments.filter(app => app.type === type || (type === 'Tele Rehab' && app.type === 'Tele-Rehab')).length;
                const isSelected = filterType === type || (type === 'Tele Rehab' && filterType === 'Tele-Rehab');
                
                return (
                  <div 
                    key={type}
                    onClick={() => setFilterType(isSelected ? 'All' : type)}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '0.85rem', 
                      padding: '8px 12px', 
                      background: isSelected ? 'rgba(13, 148, 136, 0.15)' : 'var(--glass-bg)', 
                      border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    title={`Click to filter by ${type}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getTypeIcon(type)}
                      <span style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)', fontWeight: isSelected ? '600' : 'normal' }}>
                        {type}
                      </span>
                    </div>
                    <span style={{ fontWeight: '700', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Appointment List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3>Today's Schedule {filterType !== 'All' ? `(${filterType})` : ''}</h3>
            <div style={{ position: 'relative' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
              <input 
                type="text" 
                className="search-bar" 
                placeholder="Search patient or treatment..." 
                style={{ paddingLeft: '38px', borderRadius: '20px', border: '1px solid var(--border)', transition: 'all 0.3s' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map(app => (
                <div key={app.id} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    padding: '0', 
                    background: expandedId === app.id ? 'var(--bg-card)' : 'var(--glass-bg)', 
                    borderRadius: '12px',
                    borderLeft: `5px solid ${getStatusColor(app.status)}`,
                    borderTop: '1px solid var(--border)',
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    boxShadow: expandedId === app.id ? '0 8px 24px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.3s ease',
                    cursor: 'default',
                    overflow: 'hidden'
                  }} 
                  onMouseEnter={(e) => { if(expandedId !== app.id) e.currentTarget.style.transform = 'translateX(4px)' }} 
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)' }}>
                  
                  {/* Card Header (Always Visible) */}
                  <div 
                    onClick={(e) => toggleExpand(app.id, e)}
                    className="appointment-card-header"
                  >
                    <div className="appointment-card-left">
                      <div className="appointment-time-col">
                        <p style={{ margin: 0, fontWeight: '700', color: 'var(--text-main)', fontSize: '1.05rem' }}>{app.time}</p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{app.date ? `${app.date} • ` : ''}{app.duration}</p>
                      </div>
                      
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={18} color="var(--primary)" /> {app.patient}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{app.treatment}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.85rem', color: getTagColor(app.type), fontWeight: '600' }}>
                          {getTypeIcon(app.type)} 
                          {app.type}
                        </div>
                      </div>
                    </div>

                    <div className="appointment-card-right">
                      <span style={{ 
                        padding: '6px 14px', 
                        borderRadius: '20px', 
                        fontSize: '0.8rem', 
                        fontWeight: '600',
                        background: `${getStatusColor(app.status)}15`,
                        color: getStatusColor(app.status),
                        border: `1px solid ${getStatusColor(app.status)}40`
                      }}>
                        {app.status}
                      </span>
                      <button className="glass-button" style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', borderColor: 'var(--primary)', background: 'transparent' }}>
                        View Details {expandedId === app.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedId === app.id && (
                    <div onClick={(e) => e.stopPropagation()} style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'var(--glass-bg)', display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <FileText size={18} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                        <div>
                          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)' }}>Clinical Notes</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{app.notes}</p>
                        </div>
                      </div>
                      
                      <div className="appointment-actions">
                        {app.status === 'Pending' && (
                          <button onClick={(e) => handleStatusChange(app.id, 'Confirmed', e)} className="glass-button" style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle size={16} /> Confirm Appointment
                          </button>
                        )}
                        <button className="glass-button" style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                          Start Session
                        </button>
                        <button className="glass-button" style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                          Reschedule
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setAppointmentToDelete(app);
                          }} 
                          className="glass-button" 
                          style={{ 
                            padding: '8px 16px', 
                            background: 'transparent', 
                            border: '1px solid var(--danger)', 
                            color: 'var(--danger)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            fontWeight: '500' 
                          }}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                <CalendarIcon size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <p style={{ fontSize: '1.1rem' }}>No appointments found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Appointment Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', margin: '0 16px', padding: '24px', position: 'relative', animation: 'scaleIn 0.3s ease' }}>
            <button onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h2 style={{ margin: '0 0 20px 0' }}>Add New Appointment</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Patient Name</label>
                <input 
                  type="text" 
                  className="search-bar" 
                  style={{ width: '100%', borderRadius: '8px' }} 
                  placeholder="Enter name" 
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Date</label>
                <input 
                  type="date" 
                  className="search-bar" 
                  style={{ width: '100%', borderRadius: '8px' }} 
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Treatment Type</label>
                <select 
                  className="search-bar" 
                  style={{ width: '100%', borderRadius: '8px', cursor: 'pointer' }}
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                >
                  {APPOINTMENT_TYPES.map(type => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </div>
              <button 
                className="glass-button" 
                onClick={handleSaveAppointment} 
                style={{ width: '100%', background: 'var(--primary)', color: 'white', border: 'none', padding: '12px', marginTop: '10px', fontWeight: '600', fontSize: '1rem' }}
              >
                Save Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {appointmentToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', margin: '0 16px', padding: '24px', position: 'relative', textAlign: 'center', animation: 'scaleIn 0.3s ease' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Trash2 size={22} /> Delete Appointment
            </h3>
            <p style={{ color: 'var(--text-main)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Are you sure you want to delete the appointment for <strong>{appointmentToDelete.patient}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                className="glass-button" 
                onClick={async () => {
                  try {
                    await api.deleteAppointment(appointmentToDelete.id);
                    setAppointments(appointments.filter(a => a.id !== appointmentToDelete.id));
                  } catch (err) {
                    if (!getBackendStatus()) {
                      const updatedApps = appointments.filter(a => a.id !== appointmentToDelete.id);
                      setAppointments(updatedApps);
                      localStorage.setItem('appointments_list', JSON.stringify(updatedApps));

                      // Push to appointments_bin for Recycle Bin availability
                      const localAppointmentsBin = JSON.parse(localStorage.getItem('appointments_bin') || '[]');
                      const appWithDeletedFlag = { 
                        ...appointmentToDelete, 
                        deleted: true, 
                        deleted_at: new Date().toISOString() 
                      };
                      localAppointmentsBin.push(appWithDeletedFlag);
                      localStorage.setItem('appointments_bin', JSON.stringify(localAppointmentsBin));
                    }
                  }
                  setAppointmentToDelete(null);
                  setExpandedId(null);
                }}
                style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '10px 20px', fontWeight: '600', borderRadius: '8px' }}
              >
                Yes, Delete
              </button>
              <button 
                className="glass-button" 
                onClick={() => setAppointmentToDelete(null)}
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

export default Appointments;
