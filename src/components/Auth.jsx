import { useState, useEffect } from 'react';
import { Activity, Lock, User, Mail, Phone, Users, Eye, EyeOff, RefreshCw } from 'lucide-react';
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
  const [formData, setFormData] = useState({ 
    name: '', // used for login
    firstName: '',
    lastName: '',
    email: '',
    contact: '',
    gender: 'Male',
    role: 'Junior Doctor',
    password: '',
    retypePassword: ''
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [userInputCaptcha, setUserInputCaptcha] = useState('');

  const generateCaptcha = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
      captcha += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaText(captcha);
    setUserInputCaptcha('');
  };

  useEffect(() => {
    if (!isLogin) {
      generateCaptcha();
    }
  }, [isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLogin) {
      if (!formData.password || !formData.name) {
        setError('Please fill all required fields');
        return;
      }
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
      // Registration validation
      if (!formData.firstName || !formData.lastName || !formData.password) {
        setError('First Name, Last Name, and Password are required');
        return;
      }
      if (formData.password !== formData.retypePassword) {
        setError('Passwords do not match');
        return;
      }
      if (userInputCaptcha !== captchaText) {
        setError('Incorrect security code. Please try again.');
        generateCaptcha();
        return;
      }

      try {
        const res = await api.register(formData);
        const combinedName = `${formData.firstName} ${formData.lastName}`.trim();
        setSuccessMsg(`Account created! You can now log in as ${combinedName}.`);
        setError('');
        setIsLogin(true);
        setFormData({ ...formData, name: combinedName, password: '' });
      } catch (backendErr) {
        if (!getBackendStatus()) {
          // Local fallback registration
          const combinedName = `${formData.firstName} ${formData.lastName}`.trim();
          const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
          const newId = 'DR-' + Math.floor(1000 + Math.random() * 9000);
          const hashedPassword = await hashPassword(formData.password);
          const newUser = { name: combinedName, doctorId: newId, password: hashedPassword };
          storedUsers.push(newUser);
          localStorage.setItem('users', JSON.stringify(storedUsers));
          
          setSuccessMsg(`Account created! You can now log in. (Offline Mode)`);
          setError('');
          setIsLogin(true);
          setFormData({ ...formData, name: combinedName, password: '' });
        } else {
          setError(backendErr.message || 'Registration failed');
        }
      }
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: 'var(--bg-main)', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0, left: 0, zIndex: 1000, overflowY: 'auto' }}>
      <div className="glass-panel" style={{ width: isLogin ? '450px' : '600px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-card)', margin: 'auto', transition: 'width 0.3s ease' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Activity size={48} color="var(--primary)" style={{ marginBottom: '10px' }} />
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
            {isLogin ? 'Login to access your clinic dashboard' : 'Sign up to start managing your patients'}
          </p>
        </div>

        {error && <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
        {successMsg && <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>{successMsg}</div>}

        <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {isLogin ? (
            // LOGIN FORM
            <>
              <div style={{ position: 'relative' }}>
                <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input 
                  type="text" 
                  className="search-bar" 
                  placeholder="Full Name (as registered)" 
                  autoComplete="off"
                  style={{ width: '100%', paddingLeft: '40px', boxSizing: 'border-box' }}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="search-bar" 
                  placeholder="Password" 
                  autoComplete="new-password"
                  style={{ width: '100%', paddingLeft: '40px', paddingRight: '40px', boxSizing: 'border-box' }}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
                <div 
                  style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>


              
              <button type="submit" className="glass-button" style={{ marginTop: '10px', padding: '14px', width: '100%' }}>
                Login Securely
              </button>
            </>
          ) : (
            // REGISTRATION FORM
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#555', marginBottom: '4px', display: 'block' }}>First Name:</label>
                  <input type="text" style={inputStyle} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#555', marginBottom: '4px', display: 'block' }}>Last Name:</label>
                  <input type="text" style={inputStyle} value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#555', marginBottom: '4px', display: 'block' }}>Email:</label>
                <input type="email" style={inputStyle} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#555', marginBottom: '4px', display: 'block' }}>Password:</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? "text" : "password"} style={{...inputStyle, paddingRight: '40px'}} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    <div style={{ position: 'absolute', right: '12px', top: '10px', cursor: 'pointer', color: '#999' }} onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#555', marginBottom: '4px', display: 'block' }}>Re-type Password:</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showRetypePassword ? "text" : "password"} style={{...inputStyle, paddingRight: '40px'}} value={formData.retypePassword} onChange={e => setFormData({...formData, retypePassword: e.target.value})} />
                    <div style={{ position: 'absolute', right: '12px', top: '10px', cursor: 'pointer', color: '#999' }} onClick={() => setShowRetypePassword(!showRetypePassword)}>
                      {showRetypePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#555', marginBottom: '4px', display: 'block' }}>Contact:</label>
                  <input 
                    type="tel" 
                    maxLength={10}
                    style={inputStyle} 
                    value={formData.contact} 
                    onChange={e => {
                      const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({...formData, contact: onlyNums});
                    }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#555', marginBottom: '4px', display: 'block' }}>Gender:</label>
                  <select style={inputStyle} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              


              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#555', marginBottom: '4px', display: 'block' }}>Security Code:</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ 
                    background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'40\'%3E%3Cpath d=\'M0,20 Q25,5 50,20 T100,20\' stroke=\'%23ccc\' fill=\'none\' stroke-width=\'2\'/%3E%3C/svg%3E") #f0f0f0',
                    padding: '8px 16px', 
                    borderRadius: '8px', 
                    letterSpacing: '5px',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    color: '#333',
                    fontFamily: 'monospace',
                    flex: '1',
                    textAlign: 'center',
                    userSelect: 'none'
                  }}>
                    {captchaText}
                  </div>
                  <button type="button" onClick={generateCaptcha} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '5px' }} title="Refresh Code">
                    <RefreshCw size={20} />
                  </button>
                </div>
                <input 
                  type="text" 
                  placeholder="Enter code above"
                  style={{...inputStyle, marginTop: '8px'}} 
                  value={userInputCaptcha} 
                  onChange={e => setUserInputCaptcha(e.target.value)} 
                />
              </div>

              <button type="submit" className="glass-button" style={{ marginTop: '10px', padding: '14px', width: '100%' }}>
                Register Account
              </button>
            </div>
          )}
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

const inputStyle = {
  width: '100%',
  padding: '12px 20px',
  borderRadius: '50px',
  border: 'none',
  boxSizing: 'border-box',
  fontSize: '0.95rem',
  background: 'rgba(255, 255, 255, 0.9)',
  color: 'var(--text-main)',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
  outline: 'none'
};

export default Auth;
