import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, User, Video, Plus, Search, FileText, ChevronDown, ChevronUp, CheckCircle, X } from 'lucide-react';

const Appointments = () => {
  const [appointments, setAppointments] = useState([
    { id: 1, patient: 'Rahul Verma', type: 'In-Clinic', treatment: 'Post-Op ACL Rehab', time: '10:00 AM', duration: '45 min', status: 'Confirmed', notes: 'Patient has reported mild swelling after last session. Focus on gentle ROM today.' },
    { id: 2, patient: 'Priya Sharma', type: 'Tele-Rehab', treatment: 'Cervical Spondylosis', time: '11:30 AM', duration: '30 min', status: 'Pending', notes: 'Needs link for video call. Review ergonomic setup at home.' },
    { id: 3, patient: 'Vikram Singh', type: 'In-Clinic', treatment: 'Frozen Shoulder Assessment', time: '02:00 PM', duration: '60 min', status: 'Confirmed', notes: 'First visit. Complete initial assessment forms.' },
    { id: 4, patient: 'Anjali Desai', type: 'In-Clinic', treatment: 'Lumbar Strain', time: '04:15 PM', duration: '45 min', status: 'Cancelled', notes: 'Cancelled due to personal emergency.' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredAppointments = appointments.filter(app => 
    app.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.treatment.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <div className="dashboard-content-grid" style={{ gridTemplateColumns: '1fr 3fr', alignItems: 'start' }}>
        
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
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>4 Sessions Scheduled</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '8px', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>In-Clinic:</span>
                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>3</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '8px', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tele-Rehab:</span>
                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Appointment List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Today's Schedule</h3>
            <div style={{ position: 'relative' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
              <input 
                type="text" 
                className="search-bar" 
                placeholder="Search patient or treatment..." 
                style={{ paddingLeft: '38px', width: '280px', borderRadius: '20px', border: '1px solid var(--border)', transition: 'all 0.3s' }}
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
                  onClick={(e) => toggleExpand(app.id, e)}
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
                    cursor: 'pointer',
                    overflow: 'hidden'
                  }} 
                  onMouseEnter={(e) => { if(expandedId !== app.id) e.currentTarget.style.transform = 'translateX(4px)' }} 
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)' }}>
                  
                  {/* Card Header (Always Visible) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div style={{ minWidth: '85px', textAlign: 'center', borderRight: '1px solid var(--border)', paddingRight: '20px' }}>
                        <p style={{ margin: 0, fontWeight: '700', color: 'var(--text-main)', fontSize: '1.05rem' }}>{app.time}</p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{app.duration}</p>
                      </div>
                      
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={18} color="var(--primary)" /> {app.patient}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{app.treatment}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.85rem', color: app.type === 'Tele-Rehab' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: '500' }}>
                          {app.type === 'Tele-Rehab' ? <Video size={16} /> : <MapPin size={16} />} 
                          {app.type}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
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
                    <div style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'var(--glass-bg)', display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <FileText size={18} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                        <div>
                          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)' }}>Clinical Notes</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{app.notes}</p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
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
          <div className="glass-panel" style={{ width: '450px', padding: '24px', position: 'relative', animation: 'scaleIn 0.3s ease' }}>
            <button onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h2 style={{ margin: '0 0 20px 0' }}>Add New Appointment</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Patient Name</label>
                <input type="text" className="search-bar" style={{ width: '100%', borderRadius: '8px' }} placeholder="Enter name" />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Date</label>
                  <input type="date" className="search-bar" style={{ width: '100%', borderRadius: '8px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Time</label>
                  <input type="time" className="search-bar" style={{ width: '100%', borderRadius: '8px' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Treatment Type</label>
                <select className="search-bar" style={{ width: '100%', borderRadius: '8px', cursor: 'pointer' }}>
                  <option>In-Clinic Session</option>
                  <option>Tele-Rehab (Video)</option>
                  <option>Home Visit</option>
                </select>
              </div>
              <button className="glass-button" onClick={() => setShowAddModal(false)} style={{ width: '100%', background: 'var(--primary)', color: 'white', border: 'none', padding: '12px', marginTop: '10px', fontWeight: '600', fontSize: '1rem' }}>
                Save Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
