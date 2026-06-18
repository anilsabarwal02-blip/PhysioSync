import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Appointments from './components/Appointments';
import Logbook from './components/Logbook';
import AIAssistant from './components/AIAssistant';
import VoiceNotes from './components/VoiceNotes';
import Posture from './components/Posture';
import GamifiedRehab from './components/GamifiedRehab';
import TreatmentPlanner from './components/TreatmentPlanner';
import WearableSync from './components/WearableSync';
import TeleRehab from './components/TeleRehab';
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

  const handleLogin = (user) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
  };

  // Temporarily disable login screen
  // if (!isAuthenticated) {
  //   return <Auth onLogin={handleLogin} />;
  // }

  return (
    <Router>
      <div className="app-container">
        <Sidebar onLogout={handleLogout} onToggleAI={toggleAIAssistant} isAIAssistantOpen={isAIOpen} />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/logbook" element={<Logbook />} />
          <Route path="/voice-notes" element={<VoiceNotes />} />
          <Route path="/posture" element={<Posture />} />
          <Route path="/gamified-rehab" element={<GamifiedRehab />} />
          <Route path="/treatment-planner" element={<TreatmentPlanner />} />
          <Route path="/wearable-sync" element={<WearableSync />} />
          <Route path="/tele-rehab" element={<TeleRehab />} />
        </Routes>
        
        {/* Global AI Assistant Drawer */}
        <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />

        {/* Floating AI Button */}
        <button 
          onClick={toggleAIAssistant}
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
            boxShadow: '0 8px 24px rgba(13, 148, 136, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(13, 148, 136, 0.6)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(13, 148, 136, 0.4)'; }}
        >
          <MessageSquare size={28} />
        </button>
      </div>
    </Router>
  );
}

export default App;
