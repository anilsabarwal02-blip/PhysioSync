import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Users, FileText, Calendar, Settings, MessageSquare, Mic, Video, Gamepad2, BrainCircuit, Watch, MonitorSmartphone, LogOut } from 'lucide-react';

const Sidebar = ({ onLogout, onToggleAI, isAIAssistantOpen }) => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Activity className="logo-icon" size={32} />
        <h2>Physio<span style={{ color: 'var(--primary)' }}>Sync</span></h2>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Activity size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/logbook" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          <span>Clinical Logbook</span>
        </NavLink>
        <NavLink to="/appointments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Calendar size={20} />
          <span>Appointments</span>
        </NavLink>
        <NavLink to="/voice-notes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Mic size={20} />
          <span>Voice Notes</span>
        </NavLink>
        <NavLink to="/posture" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Video size={20} />
          <span>Posture Analysis</span>
        </NavLink>
        <NavLink to="/gamified-rehab" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Gamepad2 size={20} />
          <span>Gamified Rehab</span>
        </NavLink>
        <NavLink to="/treatment-planner" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BrainCircuit size={20} />
          <span>AI Rx Planner</span>
        </NavLink>
        <NavLink to="/wearable-sync" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Watch size={20} />
          <span>Wearable Sync</span>
        </NavLink>
        <NavLink to="/tele-rehab" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MonitorSmartphone size={20} />
          <span>Tele-Rehab</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto' }}>
        <div className="nav-item" onClick={() => setShowSettingsMenu(!showSettingsMenu)} style={{ cursor: 'pointer' }}>
          <Settings size={20} />
          <span>Settings</span>
        </div>
        {showSettingsMenu && (
          <div className="nav-item" onClick={onLogout} style={{ color: 'var(--danger)', cursor: 'pointer', paddingLeft: '40px', fontSize: '0.9rem', marginTop: '4px' }}>
            <LogOut size={16} />
            <span>Logout</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
