import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { ShieldAlert, Clock, User, FileText, Search, Trash2 } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Modals State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', id: null, title: '', message: '' });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    const { type, id } = confirmModal;
    setConfirmModal({ isOpen: false, type: '', id: null, title: '', message: '' });
    
    try {
      if (type === 'DELETE_LOG') {
        await api.deleteAuditLog(id);
        setLogs(logs.filter(log => (log._id || log.id) !== id));
      } else if (type === 'CLEAR_ALL') {
        await api.clearAuditLogs();
        setLogs([]);
      } else if (type === 'EMPTY_BIN') {
        await api.emptyRecycleBin();
        alert("Recycle Bin emptied successfully.");
      }
    } catch (err) {
      console.error(`Failed to execute ${type}:`, err);
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      type: 'DELETE_LOG',
      id,
      title: 'Delete Audit Log',
      message: 'Are you sure you want to delete this log?'
    });
  };

  const handleClearAll = () => {
    setConfirmModal({
      isOpen: true,
      type: 'CLEAR_ALL',
      title: 'Clear All Logs',
      message: 'WARNING: Are you sure you want to delete ALL audit logs? This cannot be undone.'
    });
  };

  const handleEmptyRecycleBin = () => {
    setConfirmModal({
      isOpen: true,
      type: 'EMPTY_BIN',
      title: 'Empty Recycle Bin',
      message: 'WARNING: Are you sure you want to completely empty the Recycle Bin? This action is irreversible.'
    });
  };

  const filteredLogs = logs.filter(log => {
    const s = searchTerm.toLowerCase();
    return (
      (log.performed_by && log.performed_by.toLowerCase().includes(s)) ||
      (log.target_patient && log.target_patient.toLowerCase().includes(s)) ||
      (log.action && log.action.toLowerCase().includes(s)) ||
      (log.details && log.details.toLowerCase().includes(s))
    );
  });

  return (
    <div className="dashboard-content">
      <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2><ShieldAlert size={24} style={{ marginRight: '10px', verticalAlign: 'middle', color: 'var(--primary)' }} /> Audit Logs</h2>
          <p style={{ color: 'var(--text-muted)' }}>Monitor data access and security events across the hospital</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
            {/* Hidden dummy input to catch Chrome's aggressive username autofill */}
            <input type="text" name="fakeusernameremembered" style={{ display: 'none' }} />
            <input 
              type="text" 
              name="audit_search_field"
              id="audit_search_field"
              autoComplete="off"
              placeholder="Search logs..." 
              className="search-bar"
              style={{ width: '100%', paddingLeft: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="glass-button" onClick={handleEmptyRecycleBin} style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--danger)', color: 'white', border: 'none' }}>
              <Trash2 size={16} /> Empty Recycle Bin
            </button>
            <button className="delete-button" onClick={handleClearAll} style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={16} /> Clear All Logs
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>Time</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>User</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>Action</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>Target Name</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>Details</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  const date = new Date(log.timestamp);
                  const logId = log._id || log.id;
                  return (
                    <tr key={logId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} />
                          {date.toLocaleDateString()} {date.toLocaleTimeString()}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                          <User size={16} color="var(--primary)" />
                          {log.performed_by}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '0.8rem', 
                          fontWeight: 'bold',
                          backgroundColor: log.action.includes('EDIT') ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                          color: log.action.includes('EDIT') ? '#d97706' : '#2563eb'
                        }}>
                          {log.action ? log.action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'Unknown Action'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontWeight: '500' }}>{log.target_patient || '-'}</td>
                      <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FileText size={14} />
                          {log.details}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleDelete(logId)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                          title="Delete Log"
                        >
                          <Trash2 size={18} className="icon-btn delete-icon" style={{ color: '#ef4444' }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            width: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1f2937' }}>{confirmModal.title}</h3>
            <p style={{ color: '#4b5563', marginBottom: '24px', lineHeight: '1.5' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setConfirmModal({ isOpen: false, type: '', id: null, title: '', message: '' })}
                style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'white', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
