import React, { useState, useEffect } from 'react';
import { Activity, Watch, Heart, Zap, SignalHigh } from 'lucide-react';

const WearableSync = () => {
  const [hr, setHr] = useState(72);
  const [emg, setEmg] = useState(15);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let interval;
    if (isSyncing) {
      interval = setInterval(() => {
        setHr(prev => prev + (Math.floor(Math.random() * 5) - 2));
        setEmg(Math.floor(Math.random() * 40) + 10);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSyncing]);

  return (
    <div className="main-content">
      <header className="dashboard-header">
        <div>
          <h1>IoT Wearable Sync ⌚</h1>
          <p>Live telemetry from Apple Watch & EMG sensors during clinic exercises.</p>
        </div>
        <button 
          className="glass-button" 
          onClick={() => setIsSyncing(!isSyncing)}
          style={{ background: isSyncing ? '#ef4444' : 'var(--primary)', display: 'flex', gap: '8px', alignItems: 'center' }}
        >
          <SignalHigh size={18} /> {isSyncing ? 'Disconnect Sensors' : 'Connect Patient Devices'}
        </button>
      </header>

      <div className="dashboard-content-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Heart size={48} color="#ef4444" style={{ marginBottom: '20px', animation: isSyncing ? 'bounce 1s infinite' : 'none' }} />
          <h2 style={{ fontSize: '3rem', margin: 0 }}>{isSyncing ? hr : '--'} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>BPM</span></h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Real-time Heart Rate (Apple Watch)</p>
          
          {isSyncing && (
            <div style={{ width: '100%', height: '60px', marginTop: '30px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
              {[...Array(20)].map((_, i) => (
                <div key={i} style={{ flex: 1, background: '#ef4444', height: `${Math.random() * 100}%`, transition: 'height 0.2s', borderRadius: '2px' }}></div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={48} color="#fbbf24" style={{ marginBottom: '20px' }} />
          <h2 style={{ fontSize: '3rem', margin: 0 }}>{isSyncing ? emg : '--'} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>mV</span></h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Quadriceps Surface EMG</p>
          
          {isSyncing && (
            <div style={{ width: '100%', height: '60px', marginTop: '30px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
              {[...Array(20)].map((_, i) => (
                <div key={i} style={{ flex: 1, background: '#fbbf24', height: `${Math.random() * 100}%`, transition: 'height 0.2s', borderRadius: '2px' }}></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WearableSync;
