import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileClock, ActivitySquare, TrendingUp, Bell, Mic, Search, Clock, X, Video, BrainCircuit } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setSearchHistory(history);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchTerm.trim() !== '') {
      const updatedHistory = [searchTerm, ...searchHistory.filter(item => item !== searchTerm)].slice(0, 5);
      setSearchHistory(updatedHistory);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      setShowHistory(false);
      setSearchTerm('');
      alert(`Searching for: ${searchTerm}`);
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };
  return (
    <div className="main-content">
      <header className="dashboard-header">
        <div>
          <h1>Welcome, Dr. Sharma 👋</h1>
          <p>Here is your clinic's overview for today.</p>
        </div>
        
        <div className="header-actions" style={{ position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input 
              type="text" 
              className="search-bar" 
              placeholder="Search patients, logs..." 
              style={{ paddingLeft: '38px', width: '300px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchSubmit}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            />
            {showHistory && searchHistory.length > 0 && (
              <div className="glass-panel" style={{ position: 'absolute', top: '45px', left: 0, right: 0, zIndex: 100, padding: '10px 0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 8px', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Recent Searches</span>
                  <span onClick={clearHistory} style={{ cursor: 'pointer', color: 'var(--primary)' }}>Clear</span>
                </div>
                {searchHistory.map((item, index) => (
                  <div key={index} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }} className="nav-item" onClick={() => setSearchTerm(item)}>
                    <Clock size={16} color="var(--text-muted)" />
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="glass-button" style={{ padding: '8px', display: 'flex', borderRadius: '50%' }}>
            <Bell size={20} />
          </button>
          <div className="user-profile">
            <div className="avatar">DS</div>
          </div>
        </div>
      </header>

      {/* Metrics */}
      <div className="metrics-grid">
        <div className="glass-panel metric-card">
          <div className="metric-header">
            <span>Total Patients</span>
            <Users size={20} color="var(--primary)" />
          </div>
          <div className="metric-value">1,248</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>+12% this month</p>
        </div>
        
        <div className="glass-panel metric-card" onClick={() => navigate('/dashboard')}>
          <div className="metric-header">
            <span>Pending Logs</span>
            <FileClock size={20} color="#f59e0b" />
          </div>
          <div className="metric-value">34</div>
          <p style={{ fontSize: '0.8rem' }}>Student clinical logs to review</p>
        </div>

        <div className="glass-panel metric-card" onClick={() => navigate('/schedule')}>
          <div className="metric-header">
            <span>Today's Sessions</span>
            <ActivitySquare size={20} color="var(--secondary)" />
          </div>
          <div className="metric-value">18</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>Next in 15 mins</p>
        </div>
        
        <div className="glass-panel metric-card" onClick={() => navigate('/dashboard')}>
          <div className="metric-header">
            <span>Recovery Rate</span>
            <TrendingUp size={20} color="var(--accent)" />
          </div>
          <div className="metric-value">94%</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avg. across clinic</p>
        </div>
      </div>

      <div className="dashboard-content-grid">
        <div className="glass-panel recent-patients-list">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3>Recent Patients</h3>
          </div>
          
          <div className="list-item">
            <div className="patient-info">
              <h4>Rahul Verma</h4>
              <p>Post-Op ACL Rehab • Student: Anjali M.</p>
            </div>
            <div className="status-badge status-active">In Progress</div>
          </div>
          
          <div className="list-item">
            <div className="patient-info">
              <h4>Priya Sharma</h4>
              <p>Cervical Spondylosis • Session 4/10</p>
            </div>
            <div className="status-badge status-active">In Progress</div>
          </div>
          
          <div className="list-item">
            <div className="patient-info">
              <h4>Vikram Singh</h4>
              <p>Frozen Shoulder • Waiting for Assesment</p>
            </div>
            <div className="status-badge status-pending">Pending</div>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3>AI Assistant Quick Actions</h3>
          <p style={{ margin: '12px 0', fontSize: '0.9rem' }}>Use AI to speed up your workflow.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
            <button className="quick-action-btn" onClick={() => navigate('/voice-notes')}>
              <Mic size={20} /> Record Voice Note
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/posture')}>
              <Video size={20} /> Analyze Posture Video
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/treatment-planner')}>
              <BrainCircuit size={20} /> Generate Treatment Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
