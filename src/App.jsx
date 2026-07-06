import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MessageSquare, Trash2 } from 'lucide-react';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Appointments from './components/Appointments';
import AIAssistant from './components/AIAssistant';
import VoiceNotes from './components/VoiceNotes';

import TreatmentPlanner from './components/TreatmentPlanner';
import AnatomyViewer from './components/AnatomyViewer';
import WearableSync from './components/WearableSync';
import Posture from './components/Posture';
import RecycleBin from './components/RecycleBin';
import './App.css';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [isAIOpen, setIsAIOpen] = useState(false);

  const toggleAIAssistant = () => {
    setIsAIOpen(!isAIOpen);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  // Require authentication
  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar onLogout={handleLogout} onToggleAI={toggleAIAssistant} isAIAssistantOpen={isAIOpen} />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/voice-notes" element={<VoiceNotes />} />

          <Route path="/treatment-planner" element={<TreatmentPlanner />} />
          <Route path="/anatomy-viewer" element={<AnatomyViewer />} />
          <Route path="/wearable-sync" element={<WearableSync />} />
          <Route path="/posture" element={<Posture />} />
          <Route path="/recycle-bin" element={<RecycleBin />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        
        {/* Global AI Assistant Drawer */}
        <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />

        {/* Floating Buttons Group (AI Chat & Recycle Bin) */}
        <FloatingButtons onToggleAI={toggleAIAssistant} />
      </div>
    </Router>
  );
}

const FloatingButtons = ({ onToggleAI }) => {
  const navigate = useNavigate();
  const [isTrashHovered, setIsTrashHovered] = useState(false);
  const [isAIHovered, setIsAIHovered] = useState(false);

  return (
    <>
      {/* Floating Recycle Bin Button */}
      <button 
        onClick={() => navigate('/recycle-bin')}
        onMouseEnter={() => setIsTrashHovered(true)}
        onMouseLeave={() => setIsTrashHovered(false)}
        style={{
          position: 'fixed',
          bottom: '105px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: isTrashHovered ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-card)',
          color: isTrashHovered ? 'var(--danger)' : 'var(--text-main)',
          border: isTrashHovered ? '1px solid var(--danger)' : '1px solid var(--border)',
          boxShadow: isTrashHovered ? '0 12px 28px rgba(239, 68, 68, 0.3)' : '0 8px 24px rgba(0, 0, 0, 0.15)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999,
          transition: 'all 0.3s ease',
          transform: isTrashHovered ? 'scale(1.1)' : 'scale(1)',
          backdropFilter: 'blur(10px)'
        }}
        title="Recycle Bin"
      >
        <Trash2 size={24} />
      </button>

      {/* Floating AI Button */}
      <button 
        onClick={onToggleAI}
        onMouseEnter={() => setIsAIHovered(true)}
        onMouseLeave={() => setIsAIHovered(false)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'var(--primary)',
          color: 'white',
          border: 'none',
          boxShadow: isAIHovered ? '0 12px 28px rgba(13, 148, 136, 0.6)' : '0 8px 24px rgba(13, 148, 136, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999,
          transition: 'all 0.3s ease',
          transform: isAIHovered ? 'scale(1.1)' : 'scale(1)'
        }}
        title="AI Assistant"
      >
        <MessageSquare size={28} />
      </button>
    </>
  );
};

export default App;
