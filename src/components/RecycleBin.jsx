import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, RotateCcw, Calendar, Users, Clock, ArrowLeft, AlertTriangle } from 'lucide-react';
import { api, getBackendStatus } from '../utils/api';

const RecycleBin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('patients'); // 'patients' or 'appointments'
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletePatientModal, setDeletePatientModal] = useState(null); // { id, name }
  const [deleteAppointmentModal, setDeleteAppointmentModal] = useState(null); // { id, name }
  const [emptyBinModal, setEmptyBinModal] = useState(false); // boolean

  const fetchDeletedItems = async () => {
    // Load from localStorage immediately so UI renders instantly (0ms delay)
    const localAppointmentsBin = JSON.parse(localStorage.getItem('appointments_bin') || '[]');
    const localPatientsBin = JSON.parse(localStorage.getItem('patients_bin') || '[]');
    setAppointments(localAppointmentsBin);
    setPatients(localPatientsBin);

    setIsLoading(true);
    try {
      const data = await api.getRecycleBin();
      const apps = data.appointments || [];
      const pats = data.patients || [];
      setAppointments(apps);
      setPatients(pats);
      localStorage.setItem('appointments_bin', JSON.stringify(apps));
      localStorage.setItem('patients_bin', JSON.stringify(pats));
    } catch (err) {
      console.warn("[API] Failed to fetch recycle bin from backend, using local data. Error:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedItems();
  }, []);

  const handleRestoreAppointment = async (id, name) => {
    try {
      await api.restoreAppointment(id);
      alert(`Appointment for ${name} restored successfully.`);
      fetchDeletedItems();
    } catch (err) {
      if (!getBackendStatus()) {
        const localAppointmentsBin = JSON.parse(localStorage.getItem('appointments_bin') || '[]');
        const itemToRestore = localAppointmentsBin.find(a => a.id === id);
        if (itemToRestore) {
          const updatedBin = localAppointmentsBin.filter(a => a.id !== id);
          localStorage.setItem('appointments_bin', JSON.stringify(updatedBin));
          
          const activeAppointments = JSON.parse(localStorage.getItem('appointments_list') || '[]');
          itemToRestore.deleted = false;
          activeAppointments.push(itemToRestore);
          localStorage.setItem('appointments_list', JSON.stringify(activeAppointments));
          
          alert(`Appointment for ${name} restored successfully (offline mode).`);
          fetchDeletedItems();
        }
      } else {
        alert(`Failed to restore appointment: ${err.message}`);
      }
    }
  };

  const handleRestorePatient = async (id, name) => {
    try {
      await api.restorePatient(id);
      alert(`Patient profile for ${name} restored successfully.`);
      fetchDeletedItems();
    } catch (err) {
      if (!getBackendStatus()) {
        const localPatientsBin = JSON.parse(localStorage.getItem('patients_bin') || '[]');
        const itemToRestore = localPatientsBin.find(p => p.id === id);
        if (itemToRestore) {
          const updatedBin = localPatientsBin.filter(p => p.id !== id);
          localStorage.setItem('patients_bin', JSON.stringify(updatedBin));
          
          const activePatients = JSON.parse(localStorage.getItem('patients_list') || '[]');
          itemToRestore.deleted = false;
          activePatients.push(itemToRestore);
          localStorage.setItem('patients_list', JSON.stringify(activePatients));
          
          // Also restore patient's associated appointments in localStorage
          const localAppointmentsBin = JSON.parse(localStorage.getItem('appointments_bin') || '[]');
          const appointmentsToRestore = localAppointmentsBin.filter(a => a.patient === itemToRestore.name);
          const remainingBinAppointments = localAppointmentsBin.filter(a => a.patient !== itemToRestore.name);
          
          if (appointmentsToRestore.length > 0) {
            const activeAppointments = JSON.parse(localStorage.getItem('appointments_list') || '[]');
            const appointmentsWithFlag = appointmentsToRestore.map(a => ({
              ...a,
              deleted: false,
              deleted_at: undefined
            }));
            activeAppointments.push(...appointmentsWithFlag);
            localStorage.setItem('appointments_list', JSON.stringify(activeAppointments));
            localStorage.setItem('appointments_bin', JSON.stringify(remainingBinAppointments));
          }

          alert(`Patient profile for ${name} restored successfully (offline mode).`);
          fetchDeletedItems();
        }
      } else {
        alert(`Failed to restore patient: ${err.message}`);
      }
    }
  };

  const executePermanentDeleteAppointment = async () => {
    if (!deleteAppointmentModal) return;
    const { id, name } = deleteAppointmentModal;
    setDeleteAppointmentModal(null);
    try {
      await api.permanentDeleteAppointment(id);
      fetchDeletedItems();
    } catch (err) {
      if (!getBackendStatus()) {
        const localAppointmentsBin = JSON.parse(localStorage.getItem('appointments_bin') || '[]');
        const updatedBin = localAppointmentsBin.filter(a => a.id !== id);
        localStorage.setItem('appointments_bin', JSON.stringify(updatedBin));
        fetchDeletedItems();
      } else {
        alert(`Failed to delete appointment permanently: ${err.message}`);
      }
    }
  };

  const executePermanentDeletePatient = async () => {
    if (!deletePatientModal) return;
    const { id, name } = deletePatientModal;
    setDeletePatientModal(null);
    try {
      await api.permanentDeletePatient(id);
      fetchDeletedItems();
    } catch (err) {
      if (!getBackendStatus()) {
        const localPatientsBin = JSON.parse(localStorage.getItem('patients_bin') || '[]');
        const updatedBin = localPatientsBin.filter(p => p.id !== id);
        localStorage.setItem('patients_bin', JSON.stringify(updatedBin));

        // Also permanently delete patient's associated appointments in localStorage
        const localAppointmentsBin = JSON.parse(localStorage.getItem('appointments_bin') || '[]');
        const remainingBinAppointments = localAppointmentsBin.filter(a => a.patient !== name);
        localStorage.setItem('appointments_bin', JSON.stringify(remainingBinAppointments));

        fetchDeletedItems();
      } else {
        alert(`Failed to delete patient permanently: ${err.message}`);
      }
    }
  };

  const executeEmptyBin = async () => {
    setEmptyBinModal(false);
    try {
      await api.emptyRecycleBin();
      fetchDeletedItems();
    } catch (err) {
      if (!getBackendStatus()) {
        localStorage.setItem('appointments_bin', '[]');
        localStorage.setItem('patients_bin', '[]');
        fetchDeletedItems();
      } else {
        alert(`Failed to empty Recycle Bin: ${err.message}`);
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Just Deleted';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const hasItems = appointments.length > 0 || patients.length > 0;

  return (
    <div className="main-content">
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="glass-button" 
            onClick={() => navigate('/dashboard')} 
            style={{ padding: '8px', display: 'flex', borderRadius: '50%' }}
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Recycle Bin 🗑️</h1>
            <p>Restore or permanently delete patient files and clinical sessions.</p>
          </div>
        </div>
        
        {hasItems && (
          <div className="header-actions">
            <button 
              className="glass-button" 
              onClick={() => setEmptyBinModal(true)} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--danger)', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)', transition: 'all 0.3s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Trash2 size={18} /> Empty Recycle Bin
            </button>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <button 
          onClick={() => setActiveTab('patients')}
          style={{
            background: activeTab === 'patients' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'patients' ? 'white' : 'var(--text-muted)',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '20px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          Patients ({patients.length})
        </button>
        <button 
          onClick={() => setActiveTab('appointments')}
          style={{
            background: activeTab === 'appointments' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'appointments' ? 'white' : 'var(--text-muted)',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '20px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          Appointments ({appointments.length})
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Loading items...</p>
        </div>
      ) : activeTab === 'patients' ? (
        <div className="glass-panel" style={{ padding: '24px' }}>
          {patients.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {patients.map(p => (
                <div key={p._id || p.id} className="list-item" style={{ justifyContent: 'space-between', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(13, 148, 136, 0.1)', color: 'var(--primary)', padding: '10px', borderRadius: '8px' }}>
                      <Users size={24} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{p.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Condition: {p.condition} | Age: {p.age || 'N/A'} | Gender: {p.gender || 'N/A'}
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> Deleted at: {formatDate(p.deleted_at)}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => handleRestorePatient(p._id || p.id, p.name)}
                      className="glass-button" 
                      style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', borderColor: 'var(--primary)', background: 'transparent' }}
                    >
                      <RotateCcw size={16} /> Restore
                    </button>
                    <button 
                      onClick={() => setDeletePatientModal({ id: p._id || p.id, name: p.name })}
                      className="glass-button" 
                      style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', borderColor: 'var(--danger)', background: 'transparent' }}
                    >
                      <Trash2 size={16} /> Delete Permanently
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Trash2 size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
              <p style={{ fontSize: '1.1rem' }}>No deleted patients in the Recycle Bin.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '24px' }}>
          {appointments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {appointments.map(a => (
                <div key={a._id || a.id} className="list-item" style={{ justifyContent: 'space-between', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--secondary)', padding: '10px', borderRadius: '8px' }}>
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{a.patient}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Session: {a.type} | Treatment: {a.treatment} | Duration: {a.duration}
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> Deleted at: {formatDate(a.deleted_at)}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => handleRestoreAppointment(a._id || a.id, a.patient)}
                      className="glass-button" 
                      style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', borderColor: 'var(--primary)', background: 'transparent' }}
                    >
                      <RotateCcw size={16} /> Restore
                    </button>
                    <button 
                      onClick={() => setDeleteAppointmentModal({ id: a._id || a.id, name: a.patient })}
                      className="glass-button" 
                      style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', borderColor: 'var(--danger)', background: 'transparent' }}
                    >
                      <Trash2 size={16} /> Delete Permanently
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Trash2 size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
              <p style={{ fontSize: '1.1rem' }}>No deleted appointments in the Recycle Bin.</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Patient Confirmation Modal */}
      {deletePatientModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '450px', padding: '24px', position: 'relative', textAlign: 'center', animation: 'scaleIn 0.3s ease' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Trash2 size={22} /> Delete Patient Profile Permanently
            </h3>
            <p style={{ color: 'var(--text-main)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Are you sure you want to permanently delete patient profile for <strong>{deletePatientModal.name}</strong>? This action cannot be undone and all clinical history will be purged.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                className="glass-button" 
                onClick={executePermanentDeletePatient}
                style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '10px 20px', fontWeight: '600', borderRadius: '8px' }}
              >
                Yes, Delete Permanently
              </button>
              <button 
                className="glass-button" 
                onClick={() => setDeletePatientModal(null)}
                style={{ background: 'var(--glass-bg)', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: '8px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Appointment Confirmation Modal */}
      {deleteAppointmentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '450px', padding: '24px', position: 'relative', textAlign: 'center', animation: 'scaleIn 0.3s ease' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Trash2 size={22} /> Delete Appointment Permanently
            </h3>
            <p style={{ color: 'var(--text-main)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Are you sure you want to permanently delete the appointment for <strong>{deleteAppointmentModal.name}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                className="glass-button" 
                onClick={executePermanentDeleteAppointment}
                style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '10px 20px', fontWeight: '600', borderRadius: '8px' }}
              >
                Yes, Delete Permanently
              </button>
              <button 
                className="glass-button" 
                onClick={() => setDeleteAppointmentModal(null)}
                style={{ background: 'var(--glass-bg)', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: '8px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Recycle Bin Confirmation Modal */}
      {emptyBinModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '450px', padding: '24px', position: 'relative', textAlign: 'center', animation: 'scaleIn 0.3s ease' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Trash2 size={22} /> Empty Recycle Bin
            </h3>
            <p style={{ color: 'var(--text-main)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Are you sure you want to permanently empty the entire Recycle Bin? This action is irreversible and all soft-deleted items will be purged forever.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                className="glass-button" 
                onClick={executeEmptyBin}
                style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '10px 20px', fontWeight: '600', borderRadius: '8px' }}
              >
                Yes, Empty Bin
              </button>
              <button 
                className="glass-button" 
                onClick={() => setEmptyBinModal(false)}
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

export default RecycleBin;
