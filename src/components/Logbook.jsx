import React, { useState } from 'react';
import { BookOpen, CheckCircle, Clock, X } from 'lucide-react';

const initialLogs = [
  { id: 101, student: 'Anjali M.', patient: 'Rahul Verma', topic: 'ROM Assessment - Knee', time: '2 hours ago', status: 'Pending', notes: 'Patient showed 15 degrees improvement in knee flexion. Pain scale 4/10.' },
  { id: 102, student: 'Rohan K.', patient: 'Priya Sharma', topic: 'Manual Therapy & Tens', time: '5 hours ago', status: 'Pending', notes: 'Applied TENS for 15 mins. Muscle spasms reduced significantly.' },
  { id: 103, student: 'Kavya S.', patient: 'Neha Gupta', topic: 'Core Strengthening Protocol', time: '1 day ago', status: 'Approved', notes: 'Patient successfully completed 3 sets of planks and bird-dogs.' },
];

const Logbook = () => {
  const [logs, setLogs] = useState(initialLogs);
  const [selectedLog, setSelectedLog] = useState(null);

  const handleApprove = (id) => {
    setLogs(logs.map(log => log.id === id ? { ...log, status: 'Approved' } : log));
    setSelectedLog(null);
  };
  return (
    <div className="main-content">
      <header className="dashboard-header">
        <div>
          <h1>Clinical Logbook 📖</h1>
          <p>Review and grade student clinical case logs.</p>
        </div>
      </header>

      <div className="metrics-grid">
        <div className="glass-panel metric-card">
          <div className="metric-header">
            <span>Pending Approvals</span>
            <Clock size={20} color="#f59e0b" />
          </div>
          <div className="metric-value">34</div>
        </div>
        <div className="glass-panel metric-card">
          <div className="metric-header">
            <span>Approved Today</span>
            <CheckCircle size={20} color="var(--accent)" />
          </div>
          <div className="metric-value">12</div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3>Recent Submissions</h3>
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {logs.map(log => (
            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--glass-bg)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div>
                <h4 style={{ marginBottom: '4px' }}>{log.student} <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 'normal' }}>logged case for</span> {log.patient}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Topic: {log.topic} • {log.time}</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span className={`status-badge ${log.status === 'Approved' ? 'status-active' : 'status-pending'}`}>
                  {log.status}
                </span>
                {log.status === 'Pending' && (
                  <button className="glass-button" onClick={() => setSelectedLog(log)} style={{ padding: '6px 16px', fontSize: '0.85rem' }}>Review</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedLog && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="glass-panel" style={{ width: '500px', padding: '30px', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Review Log</h2>
              <X size={24} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setSelectedLog(null)} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
              <div><strong>Student:</strong> {selectedLog.student}</div>
              <div><strong>Patient:</strong> {selectedLog.patient}</div>
              <div><strong>Topic:</strong> {selectedLog.topic}</div>
              <div><strong>Clinical Notes:</strong></div>
              <div style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.95rem' }}>
                {selectedLog.notes}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="glass-button" style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }} onClick={() => setSelectedLog(null)}>Reject</button>
              <button className="glass-button" style={{ background: 'var(--primary)' }} onClick={() => handleApprove(selectedLog.id)}>Approve Log</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logbook;
