import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Users, FileText, Calendar, Settings, MessageSquare, Mic, Video, Gamepad2, BrainCircuit, Watch, MonitorSmartphone, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = ({ onLogout, onToggleAI, isAIAssistantOpen }) => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    
    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setIsCollapsed(true);
    }
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="collapse-btn"
        aria-label="Toggle Sidebar"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="sidebar-header">
        <Activity className="logo-icon" size={32} style={{ minWidth: '32px' }} />
        {!isCollapsed && <h2 style={{ whiteSpace: 'nowrap' }}>Physio<span style={{ color: 'var(--primary)' }}>Sync</span></h2>}
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" onClick={handleNavClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Activity size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/logbook" onClick={handleNavClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          <span>Clinical Logbook</span>
        </NavLink>
        <NavLink to="/appointments" onClick={handleNavClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Calendar size={20} />
          <span>Appointments</span>
        </NavLink>
        <NavLink to="/voice-notes" onClick={handleNavClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Mic size={20} />
          <span>Voice Notes</span>
        </NavLink>
        <NavLink to="/posture" onClick={handleNavClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Video size={20} />
          <span>Posture Analysis</span>
        </NavLink>
        <NavLink to="/gamified-rehab" onClick={handleNavClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Gamepad2 size={20} />
          <span>Gamified Rehab</span>
        </NavLink>
        <NavLink to="/treatment-planner" onClick={handleNavClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BrainCircuit size={20} />
          <span>AI Rx Planner</span>
        </NavLink>
        <NavLink to="/wearable-sync" onClick={handleNavClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Watch size={20} />
          <span>Wearable Sync</span>
        </NavLink>
        <NavLink to="/tele-rehab" onClick={handleNavClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MonitorSmartphone size={20} />
          <span>Tele-Rehab</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto' }}>
        <div className="nav-item" onClick={() => setShowSettingsMenu(!showSettingsMenu)} style={{ cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <Settings size={20} style={{ minWidth: '20px' }} />
          {!isCollapsed && <span>Settings</span>}
        </div>
        {showSettingsMenu && !isCollapsed && (
          <div className="nav-item" onClick={onLogout} style={{ color: 'var(--danger)', cursor: 'pointer', paddingLeft: '40px', fontSize: '0.9rem', marginTop: '4px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <LogOut size={16} style={{ minWidth: '16px' }} />
            <span>Logout</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
