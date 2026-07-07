const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'RecycleBin.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add telemetry state
content = content.replace(
  "  const [patients, setPatients] = useState(() => {",
  "  const [telemetry, setTelemetry] = useState(() => {\n    return JSON.parse(localStorage.getItem('telemetry_bin') || '[]');\n  });\n  const [patients, setPatients] = useState(() => {"
);

content = content.replace(
  "  const [deletePatientModal, setDeletePatientModal] = useState(null); // { id, name }",
  "  const [deletePatientModal, setDeletePatientModal] = useState(null); // { id, name }\n  const [deleteTelemetryModal, setDeleteTelemetryModal] = useState(null); // { id, exercise }"
);

// 2. Add telemetry in fetch
content = content.replace(
  "      const pats = data.patients || [];",
  "      const pats = data.patients || [];\n      const telems = JSON.parse(localStorage.getItem('telemetry_bin') || '[]');"
);
content = content.replace(
  "      setPatients(pats);",
  "      setPatients(pats);\n      setTelemetry(telems);"
);

content = content.replace(
  /const pats = data\.patients \|\| \[\];\s*setAppointments\(apps\);\s*setPatients\(pats\);\s*localStorage\.setItem\('appointments_bin', JSON\.stringify\(apps\)\);\s*localStorage\.setItem\('patients_bin', JSON\.stringify\(pats\)\);/g,
  "const pats = data.patients || [];\n          const telems = JSON.parse(localStorage.getItem('telemetry_bin') || '[]');\n          setAppointments(apps);\n          setPatients(pats);\n          setTelemetry(telems);\n          localStorage.setItem('appointments_bin', JSON.stringify(apps));\n          localStorage.setItem('patients_bin', JSON.stringify(pats));"
);

// 3. Add handleRestoreTelemetry
const restoreFunc = `
  const handleRestoreTelemetry = (id, exercise) => {
    const localTelemetryBin = JSON.parse(localStorage.getItem('telemetry_bin') || '[]');
    const itemToRestore = localTelemetryBin.find(t => t.id === id);
    if (itemToRestore) {
      const updatedBin = localTelemetryBin.filter(t => t.id !== id);
      localStorage.setItem('telemetry_bin', JSON.stringify(updatedBin));
      
      const activeTelemetry = JSON.parse(localStorage.getItem('telemetry_logs') || '[]');
      delete itemToRestore.deleted_at;
      activeTelemetry.push(itemToRestore);
      localStorage.setItem('telemetry_logs', JSON.stringify(activeTelemetry));
      
      alert(\`Telemetry log for \${exercise} restored successfully.\`);
      fetchDeletedItems();
    }
  };
`;
content = content.replace(
  "  const executePermanentDeleteAppointment = async () => {",
  restoreFunc + "\n  const executePermanentDeleteAppointment = async () => {"
);

// 4. Add executePermanentDeleteTelemetry
const deleteFunc = `
  const executePermanentDeleteTelemetry = async () => {
    if (!deleteTelemetryModal) return;
    const { id } = deleteTelemetryModal;
    setDeleteTelemetryModal(null);
    const localTelemetryBin = JSON.parse(localStorage.getItem('telemetry_bin') || '[]');
    const updatedBin = localTelemetryBin.filter(t => t.id !== id);
    localStorage.setItem('telemetry_bin', JSON.stringify(updatedBin));
    fetchDeletedItems();
  };
`;
content = content.replace(
  "  const executeEmptyBin = async () => {",
  deleteFunc + "\n  const executeEmptyBin = async () => {"
);

// 5. Update executeEmptyBin
content = content.replace(
  "        localStorage.setItem('patients_bin', '[]');",
  "        localStorage.setItem('patients_bin', '[]');\n        localStorage.setItem('telemetry_bin', '[]');"
);
content = content.replace(
  "    await api.emptyRecycleBin();",
  "    await api.emptyRecycleBin();\n      localStorage.setItem('telemetry_bin', '[]');"
);

// 6. Update hasItems
content = content.replace(
  "const hasItems = appointments.length > 0 || patients.length > 0;",
  "const hasItems = appointments.length > 0 || patients.length > 0 || telemetry.length > 0;"
);

// 7. Add Telemetry tab
const tabCode = `
        <button 
          onClick={() => setActiveTab('telemetry')}
          style={{
            background: activeTab === 'telemetry' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'telemetry' ? 'white' : 'var(--text-muted)',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '20px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          Telemetry Logs ({telemetry.length})
        </button>
      </div>`;
content = content.replace(
  "      </div>\n\n      {isLoading ? (",
  tabCode + "\n\n      {isLoading ? ("
);

// 8. Add telemetry render logic
const renderCode = `
          ) : activeTab === 'telemetry' ? (
        <div className="glass-panel" style={{ padding: '24px' }}>
          {telemetry.length > 0 ? (
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Exercise Name</th>
                    <th>Deleted On</th>
                    <th>Reps Completed</th>
                    <th>Avg Heart Rate</th>
                    <th>Peak EMG Voltage</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {telemetry.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: '600' }}>{log.exercise}</td>
                      <td>{formatDate(log.deleted_at)}</td>
                      <td>{log.reps} reps</td>
                      <td>{log.hrAvg} BPM</td>
                      <td>{log.maxEmg} mV</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="glass-button" 
                            title="Restore Log"
                            onClick={() => handleRestoreTelemetry(log.id, log.exercise)}
                            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--accent)', border: 'none' }}
                          >
                            <RotateCcw size={16} /> Restore
                          </button>
                          <button 
                            className="glass-button" 
                            title="Delete Permanently"
                            onClick={() => setDeleteTelemetryModal({ id: log.id, exercise: log.exercise })}
                            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Trash2 size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
              <p style={{ fontSize: '1.1rem' }}>No deleted telemetry logs in the Recycle Bin.</p>
            </div>
          )}
        </div>
`;
content = content.replace(
  "      )}",
  renderCode + "\n      )}"
);

// 9. Add Telemetry delete modal
const modalCode = `
      {/* Delete Telemetry Confirmation Modal */}
      {deleteTelemetryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '450px', padding: '24px', position: 'relative', textAlign: 'center', animation: 'scaleIn 0.3s ease' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Trash2 size={22} /> Delete Telemetry Log Permanently
            </h3>
            <p style={{ color: 'var(--text-main)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Are you sure you want to permanently delete the telemetry log for <strong>{deleteTelemetryModal.exercise}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                className="glass-button" 
                onClick={executePermanentDeleteTelemetry}
                style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '10px 20px', fontWeight: '600', borderRadius: '8px' }}
              >
                Yes, Delete Permanently
              </button>
              <button 
                className="glass-button" 
                onClick={() => setDeleteTelemetryModal(null)}
                style={{ background: 'var(--glass-bg)', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: '8px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(
  "      {/* Empty Recycle Bin Confirmation Modal */}",
  modalCode + "\n      {/* Empty Recycle Bin Confirmation Modal */}"
);

fs.writeFileSync(filePath, content);
console.log("RecycleBin.jsx updated successfully!");
