import React, { useState } from 'react';
import { Camera, Video, ActivitySquare, AlertTriangle, Upload } from 'lucide-react';

const Posture = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  return (
    <div className="main-content">
      <header className="dashboard-header">
        <div>
          <h1>AI Posture & Movement Analysis 📹</h1>
          <p>Real-time computer vision to detect ROM and postural anomalies.</p>
        </div>
      </header>

      <div className="dashboard-content-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        
        {/* Camera / Analysis Canvas */}
        <div className="glass-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Live Camera Feed</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="glass-button" style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', gap: '8px', background: 'var(--glass-bg)' }}><Upload size={16} /> Upload Video</button>
            </div>
          </div>

          <div style={{ height: '450px', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            {isAnalyzing ? (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(59, 130, 246, 0.1)', border: '2px solid var(--primary)' }}>
                {/* Simulated Pose Skeleton Overlay */}
                <svg width="100%" height="100%" style={{ position: 'absolute' }}>
                  <line x1="50%" y1="20%" x2="50%" y2="50%" stroke="#10b981" strokeWidth="4" />
                  <line x1="50%" y1="20%" x2="40%" y2="40%" stroke="#ef4444" strokeWidth="4" strokeDasharray="5,5" />
                  <line x1="50%" y1="20%" x2="60%" y2="40%" stroke="#10b981" strokeWidth="4" />
                  <circle cx="50%" cy="20%" r="8" fill="var(--primary)" />
                  <circle cx="40%" cy="40%" r="6" fill="#ef4444" />
                  <circle cx="60%" cy="40%" r="6" fill="#10b981" />
                </svg>
                <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.7)', padding: '10px 16px', borderRadius: '8px' }}>
                  <p style={{ color: '#10b981', margin: 0, fontWeight: 'bold' }}>Model: TensorFlow PoseNet</p>
                  <p style={{ color: 'white', margin: 0, fontSize: '0.85rem' }}>Tracking 17 keypoints @ 30fps</p>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <Camera size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
                <p>Camera is offline.</p>
              </div>
            )}
          </div>

          <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
            <button 
              className="glass-button" 
              style={{ padding: '12px 32px', display: 'flex', gap: '10px', alignItems: 'center', background: isAnalyzing ? '#ef4444' : 'var(--primary)' }}
              onClick={() => setIsAnalyzing(!isAnalyzing)}
            >
              <Video size={20} /> {isAnalyzing ? 'Stop Analysis' : 'Start Live Analysis'}
            </button>
          </div>
        </div>

        {/* Real-time Metrics Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
              <ActivitySquare size={20} color="var(--primary)" />
              <h3 style={{ margin: 0 }}>Metrics Engine</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cervical Flexion</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: isAnalyzing ? '#ef4444' : 'white' }}>{isAnalyzing ? '32°' : '--'}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--glass-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: isAnalyzing ? '32%' : '0%', height: '100%', background: '#ef4444', transition: 'width 1s ease' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Shoulder Abduction (R)</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: isAnalyzing ? '#10b981' : 'white' }}>{isAnalyzing ? '145°' : '--'}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--glass-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: isAnalyzing ? '80%' : '0%', height: '100%', background: '#10b981', transition: 'width 1s ease' }}></div>
                </div>
              </div>
            </div>
          </div>

          {isAnalyzing && (
            <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <AlertTriangle size={18} color="#ef4444" />
                <h4 style={{ margin: 0, color: '#ef4444' }}>Anomaly Detected</h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                Forward head posture detected. Cervical flexion angle (32°) exceeds normal resting parameters. Recommend postural correction exercises.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Posture;
