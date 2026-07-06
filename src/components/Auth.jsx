import { useState } from 'react';
import { Activity, Lock, User } from 'lucide-react';
import { api, getBackendStatus } from '../utils/api';

const hashPassword = async (password) => {
  if (!password) return '';
  try {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('Hashing failed, using fallback', err);
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return 'fallback-' + hash;
  }
};

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', doctorId: '', password: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.password || !formData.name) {
      setError('Please fill all required fields');
      return;
    }

    try {
      if (isLogin) {
        try {
          const res = await api.login(formData.name, formData.password);
          onLogin(res.user);
        } catch (backendErr) {
          if (!getBackendStatus()) {
            // Local fallback logic
            const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
            const hashedPassword = await hashPassword(formData.password);
            const userIdx = storedUsers.findIndex(u => u.name === formData.name);
            if (userIdx !== -1) {
              const user = storedUsers[userIdx];
              if (user.password !== hashedPassword) {
                user.password = hashedPassword;
                localStorage.setItem('users', JSON.stringify(storedUsers));
              }
              localStorage.setItem('isAuthenticated', 'true');
              localStorage.setItem('currentUser', JSON.stringify(user));
              onLogin(user);
            } else {
              setError('Invalid name or password (Offline Mode)');
            }
          } else {
            setError(backendErr.message || 'Invalid name or password');
          }
        }
      } else {
        try {
          const res = await api.register(formData.name, formData.password);
          setSuccessMsg(`Account created! You can now log in.`);
          setError('');
          setIsLogin(true);
          setFormData({ name: formData.name, doctorId: res.doctor.doctorId, password: formData.password });
        } catch (backendErr) {
          if (!getBackendStatus()) {
            // Local fallback registration
            const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
            const newId = 'DR-' + Math.floor(1000 + Math.random() * 9000);
            const hashedPassword = await hashPassword(formData.password);
            const newUser = { name: formData.name, doctorId: newId, password: hashedPassword };
            storedUsers.push(newUser);
            localStorage.setItem('users', JSON.stringify(storedUsers));
            
            setSuccessMsg(`Account created! You can now log in. (Offline Mode)`);
            setError('');
            setIsLogin(true);
            setFormData({ name: formData.name, doctorId: newId, password: formData.password });
          } else {
            setError(backendErr.message || 'Registration failed');
          }
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: 'var(--bg-main)', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0, left: 0, zIndex: 1000 }}>
      <div className="glass-panel" style={{ width: '400px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-card)' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Activity size={48} color="var(--primary)" style={{ marginBottom: '10px' }} />
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>{isLogin ? 'Login to access your clinic dashboard' : 'Sign up to start managing your patients'}</p>
        </div>

        {error && <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
        {successMsg && <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>{successMsg}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input 
              type="text" 
              className="search-bar" 
              placeholder="Full Name (Dr. ...)" 
              style={{ width: '100%', paddingLeft: '40px', boxSizing: 'border-box' }}
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input 
              type="password" 
              className="search-bar" 
              placeholder="Password" 
              style={{ width: '100%', paddingLeft: '40px', boxSizing: 'border-box' }}
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button type="submit" className="glass-button" style={{ marginTop: '10px', padding: '14px', width: '100%' }}>
            {isLogin ? 'Login Securely' : 'Register Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <span 
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }} 
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }}
          >
            {isLogin ? 'Register' : 'Login'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
