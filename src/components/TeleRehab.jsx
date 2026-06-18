import React from 'react';
import { PhoneCall, PhoneOff, Video, Mic, Share, Maximize } from 'lucide-react';

const TeleRehab = () => {
  return (
    <div className="main-content">
      <header className="dashboard-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1>Tele-Rehab Video Consult 🌐</h1>
          <p>Remote physiotherapy sessions with live AI movement tracking.</p>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '600px', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative', background: '#000', display: 'flex' }}>
          
          {/* Main Remote Video (Patient) */}
          <div style={{ flex: 1, background: 'linear-gradient(45deg, #1e1b4b, #0f172a)', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <Video size={48} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
              <p>Waiting for patient (Rahul Verma) to join...</p>
            </div>

            {/* AI Overlay Box on Video */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.6)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
              <p style={{ margin: 0, color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 'bold' }}>AI Tracking Active</p>
              <p style={{ margin: 0, color: 'white', fontSize: '0.8rem' }}>Angles will appear here once connected.</p>
            </div>
          </div>

          {/* Local Video (Doctor PIP) */}
          <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '200px', height: '150px', background: '#1e293b', borderRadius: '12px', border: '2px solid var(--border)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Doctor Camera</span>
          </div>
        </div>

        {/* Video Call Controls */}
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', gap: '20px', background: 'var(--bg-sidebar)' }}>
          <button className="glass-button" style={{ borderRadius: '50%', width: '50px', height: '50px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--glass-bg)' }}>
            <Mic size={20} />
          </button>
          <button className="glass-button" style={{ borderRadius: '50%', width: '50px', height: '50px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--glass-bg)' }}>
            <Video size={20} />
          </button>
          <button className="glass-button" style={{ borderRadius: '30px', padding: '0 30px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#ef4444' }}>
            <PhoneOff size={20} style={{ marginRight: '10px' }} /> End Call
          </button>
          <button className="glass-button" style={{ borderRadius: '50%', width: '50px', height: '50px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--glass-bg)' }}>
            <Share size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeleRehab;
