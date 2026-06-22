import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Watch, Heart, Zap, SignalHigh, RefreshCw, 
  Play, Square, Save, RotateCcw, Bluetooth, HardDrive, 
  Trash2, ShieldCheck, BatteryCharging, AlertCircle 
} from 'lucide-react';

const WearableSync = () => {
  const navigate = useNavigate();

  // Call states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [pairingStep, setPairingStep] = useState('scanning'); // 'scanning' | 'found' | 'connecting' | 'connected'
  
  // Real-time telemetry values
  const [hr, setHr] = useState(72);
  const [emgText, setEmgText] = useState(0);

  // Exercise config
  const [exercise, setExercise] = useState('Squats');
  const [isRecording, setIsRecording] = useState(false);
  const [reps, setReps] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [maxEmg, setMaxEmg] = useState(0);

  // Math totals for average HR
  const [hrSum, setHrSum] = useState(0);
  const [hrCount, setHrCount] = useState(0);

  // Saved Logs
  const [telemetryLogs, setTelemetryLogs] = useState(() => {
    const saved = localStorage.getItem('telemetry_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Refs for canvas scrolling buffers
  const ecgCanvasRef = useRef(null);
  const emgCanvasRef = useRef(null);
  const ecgBufferRef = useRef(Array(200).fill(0));
  const emgBufferRef = useRef(Array(200).fill(0));
  
  // Simulation triggers
  const contractionRef = useRef(false);
  const maxEmgRef = useRef(0);
  const animationFrameId = useRef(null);

  // Load saved logs into state
  useEffect(() => {
    localStorage.setItem('telemetry_logs', JSON.stringify(telemetryLogs));
  }, [telemetryLogs]);

  // Session duration timer
  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setSessionTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Bluetooth scanning phase simulation
  useEffect(() => {
    let timer;
    if (isPairing && pairingStep === 'scanning') {
      timer = setTimeout(() => {
        setPairingStep('found');
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [isPairing, pairingStep]);

  // ECG standard heartbeat signal wave generator
  const getEcgValue = (phase) => {
    if (phase < 0.1) {
      // P wave (bump)
      return 0.15 * Math.sin((phase / 0.1) * Math.PI);
    } else if (phase >= 0.12 && phase < 0.15) {
      // Q wave (drop)
      return -0.2 * Math.sin(((phase - 0.12) / 0.03) * Math.PI / 2);
    } else if (phase >= 0.15 && phase < 0.19) {
      // R wave (QRS spike)
      const rPhase = (phase - 0.15) / 0.04;
      if (rPhase < 0.5) return -0.2 + 1.4 * (rPhase / 0.5);
      return 1.2 - 1.4 * ((rPhase - 0.5) / 0.5);
    } else if (phase >= 0.19 && phase < 0.22) {
      // S wave (drop)
      return -0.3 * Math.sin(((0.22 - phase) / 0.03) * Math.PI / 2);
    } else if (phase >= 0.3 && phase < 0.45) {
      // T wave (medium bump)
      return 0.3 * Math.sin(((phase - 0.3) / 0.15) * Math.PI);
    }
    return 0; // Baseline flatline
  };

  // Signal generators & Canvas rendering loop
  useEffect(() => {
    if (!isSyncing) return;

    const renderLoop = () => {
      const now = Date.now();

      // 1. ECG Signal buffer logic
      const ecgPeriod = 60000 / hr; // interval in ms
      const ecgPhase = (now % ecgPeriod) / ecgPeriod;
      const ecgVal = getEcgValue(ecgPhase) + (Math.random() * 0.04 - 0.02);
      ecgBufferRef.current.shift();
      ecgBufferRef.current.push(ecgVal);

      // 2. EMG Signal buffer logic (Contraction simulation)
      let emgVal = Math.random() * 2 - 1; // resting noise
      if (isRecording) {
        const emgPeriod = 4000; // 4s squat rep loop
        const emgPhase = now % emgPeriod;
        
        if (emgPhase >= 1000 && emgPhase < 2600) {
          // Muscle contraction burst
          const progress = (emgPhase - 1000) / 1600;
          const amplitude = Math.sin(progress * Math.PI);
          const rawBurst = amplitude * 36 * (0.35 + 0.65 * Math.random());
          emgVal = rawBurst + (Math.random() * 5 - 2.5);
        }
      }
      emgBufferRef.current.shift();
      emgBufferRef.current.push(emgVal);

      // Threshold based Rep Counter (Spike filter)
      const absEmg = Math.abs(emgVal);
      if (absEmg > 30) {
        if (!contractionRef.current) {
          contractionRef.current = true;
          setReps(r => r + 1);
        }
      } else if (absEmg < 15) {
        contractionRef.current = false;
      }

      // Live Peak EMG tracker
      if (absEmg > maxEmgRef.current) {
        maxEmgRef.current = Math.round(absEmg);
        setMaxEmg(maxEmgRef.current);
      }

      // 3. Render ECG Canvas
      const ecgCanvas = ecgCanvasRef.current;
      if (ecgCanvas) {
        const ecgCtx = ecgCanvas.getContext('2d');
        drawCanvasGrid(ecgCanvas, ecgCtx, 'rgba(239, 68, 68, 0.08)');
        plotWave(ecgCanvas, ecgCtx, ecgBufferRef.current, '#ef4444', 2.2, 0.35);
      }

      // 4. Render EMG Canvas
      const emgCanvas = emgCanvasRef.current;
      if (emgCanvas) {
        const emgCtx = emgCanvas.getContext('2d');
        drawCanvasGrid(emgCanvas, emgCtx, 'rgba(251, 191, 36, 0.08)');
        plotWave(emgCanvas, emgCtx, emgBufferRef.current, '#fbbf24', 1.5, 0.45, 50);
      }

      animationFrameId.current = requestAnimationFrame(renderLoop);
    };

    const drawCanvasGrid = (canvas, ctx, color) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      const step = 15;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
    };

    const plotWave = (canvas, ctx, buffer, color, lineWidth, heightScale, maxVal = 1) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      
      const midY = canvas.height / 2;
      const xStep = canvas.width / (buffer.length - 1);
      
      for (let i = 0; i < buffer.length; i++) {
        const x = i * xStep;
        const normalizedVal = buffer[i] / maxVal;
        const y = midY - normalizedVal * (canvas.height * heightScale);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    // Canvas size initialization
    const handleResize = () => {
      [ecgCanvasRef.current, emgCanvasRef.current].forEach(canvas => {
        if (canvas) {
          const rect = canvas.parentElement.getBoundingClientRect();
          canvas.width = rect.width;
          canvas.height = rect.height;
        }
      });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    renderLoop();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [isSyncing, hr, isRecording]);

  // HR drift and statistics calculator
  useEffect(() => {
    if (!isSyncing) return;

    const interval = setInterval(() => {
      let targetHr = 72;
      if (isRecording) {
        if (exercise === 'Squats') targetHr = 105;
        else if (exercise === 'Knee Extension') targetHr = 92;
        else targetHr = 88;
      }
      
      setHr(prev => {
        const diff = targetHr - prev;
        const step = Math.sign(diff) * Math.min(Math.abs(diff), 2) + (Math.floor(Math.random() * 3) - 1);
        const next = Math.max(60, Math.min(140, prev + step));
        
        if (isRecording) {
          setHrSum(s => s + next);
          setHrCount(c => c + 1);
        }
        return next;
      });

      // Update display text value for EMG
      const buffer = emgBufferRef.current;
      const latestAbsEmg = Math.round(Math.abs(buffer[buffer.length - 1]));
      setEmgText(latestAbsEmg);
    }, 500);

    return () => clearInterval(interval);
  }, [isSyncing, isRecording, exercise]);

  // Trigger BLE modal connection
  const handleConnectDevices = () => {
    setIsPairing(true);
    setPairingStep('scanning');
  };

  // Perform secure pairing
  const handlePairSensors = () => {
    setPairingStep('connecting');
    setTimeout(() => {
      setPairingStep('connected');
      setTimeout(() => {
        setIsPairing(false);
        setIsSyncing(true);
      }, 1000);
    }, 1500);
  };

  // Disconnect telemetry
  const handleDisconnect = () => {
    setIsSyncing(false);
    setIsRecording(false);
    setHr(72);
    setEmgText(0);
    setReps(0);
    setSessionTime(0);
    setMaxEmg(0);
    maxEmgRef.current = 0;
    setHrSum(0);
    setHrCount(0);
  };

  // Save active telemetry log
  const handleSaveTelemetry = () => {
    if (reps === 0) {
      alert("No movement reps detected yet. Try performing an exercise first.");
      return;
    }
    const finalAvgHr = hrCount > 0 ? Math.round(hrSum / hrCount) : hr;
    const newLog = {
      id: Date.now(),
      exercise,
      reps,
      duration: formatDuration(sessionTime),
      peakEmg: maxEmg,
      avgHr: finalAvgHr,
      date: new Date().toLocaleDateString()
    };
    setTelemetryLogs(prev => [newLog, ...prev]);

    // Reset session metrics
    setIsRecording(false);
    setReps(0);
    setSessionTime(0);
    setMaxEmg(0);
    maxEmgRef.current = 0;
    setHrSum(0);
    setHrCount(0);
    alert("Telemetry session data saved successfully.");
  };

  // Clear a saved log
  const handleDeleteLog = (id) => {
    setTelemetryLogs(prev => prev.filter(log => log.id !== id));
  };

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="main-content">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1>IoT Wearable Sync ⌚</h1>
          <p>Live telemetry from Apple Watch & EMG sensors during clinic exercises.</p>
        </div>
        {!isSyncing ? (
          <button 
            className="glass-button" 
            onClick={handleConnectDevices}
            style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
          >
            <Bluetooth size={18} /> Connect Patient Devices
          </button>
        ) : (
          <button 
            className="glass-button" 
            onClick={handleDisconnect}
            style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--danger)' }}
          >
            <SignalHigh size={18} /> Disconnect Sensors
          </button>
        )}
      </header>

      {/* BLE PAIRING MODAL */}
      {isPairing && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', margin: '0 16px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
            <h3 style={{ margin: 0, display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
              <Bluetooth size={22} color="var(--primary)" /> Wearable BLE Setup
            </h3>

            {/* SCANNING */}
            {pairingStep === 'scanning' && (
              <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <RefreshCw className="image-3d-move" size={32} color="var(--primary)" style={{ animation: 'spin 2s infinite linear' }} />
                <p style={{ color: 'var(--text-muted)' }}>Scanning for nearby BLE clinical sensors...</p>
              </div>
            )}

            {/* FOUND DEVICES */}
            {pairingStep === 'found' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', margin: '10px 0' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Devices Found nearby:</p>
                <div className="glass-panel" style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Watch size={20} color="var(--primary)" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Apple Watch Ultra</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>BLE Telemetry Channel • Signal: -45dBm</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(13, 148, 136, 0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>Ready</span>
                </div>

                <div className="glass-panel" style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '3px solid var(--secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Zap size={20} color="var(--secondary)" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9rem' }}>BioEMG Muscle Patch</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quadriceps Sensor • Signal: -48dBm</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--secondary)', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>Ready</span>
                </div>

                <button className="glass-button" onClick={handlePairSensors} style={{ marginTop: '15px', width: '100%' }}>
                  Establish Secure Pairing
                </button>
              </div>
            )}

            {/* CONNECTING PROGRESS */}
            {pairingStep === 'connecting' && (
              <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <Activity size={32} color="var(--accent)" style={{ animation: 'pulse 1s infinite' }} />
                <p style={{ color: 'var(--text-muted)' }}>Synchronizing BLE timestamps...</p>
                <div style={{ width: '100%', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '60%', height: '100%', background: 'var(--accent)', animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>
            )}

            {/* CONNECTED SUCCESS */}
            {pairingStep === 'connected' && (
              <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--primary)' }}>
                <ShieldCheck size={40} />
                <h4 style={{ margin: 0 }}>Sync Successful!</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Duct channels linked securely at 20Hz.</p>
              </div>
            )}

            <button 
              className="glass-button" 
              onClick={() => setIsPairing(false)} 
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border)', width: '100%' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD CHARTS SECTION */}
      <div className="dashboard-content-grid grid-1-1" style={{ marginBottom: '24px' }}>
        
        {/* Apple Watch HR Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Heart 
                size={28} 
                color="#ef4444" 
                style={{ 
                  animation: isSyncing ? `pulse ${60 / hr}s infinite` : 'none',
                  transformOrigin: 'center' 
                }} 
              />
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Heart Rate Monitor</span>
            </div>
            {isSyncing && (
              <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                Apple Watch Active
              </span>
            )}
          </div>

          <div style={{ textAlign: 'center', margin: '15px 0' }}>
            <h2 style={{ fontSize: '3rem', margin: 0, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '6px' }}>
              {isSyncing ? hr : '--'}
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>BPM</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Real-time Heart Rate (Bluetooth Watch Telemetry)</p>
          </div>

          {/* Scrolling ECG waveform Canvas */}
          <div style={{ height: '110px', width: '100%', background: '#0a0d16', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            {isSyncing ? (
              <canvas ref={ecgCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Devices Disconnected. Connect watch to stream.
              </div>
            )}
          </div>
        </div>

        {/* Quadriceps EMG Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap size={28} color="#fbbf24" style={{ animation: (isRecording && emgText > 25) ? 'pulse 0.3s infinite' : 'none' }} />
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Quadriceps EMG Patch</span>
            </div>
            {isSyncing && (
              <span style={{ fontSize: '0.75rem', background: 'rgba(2, 132, 199, 0.15)', color: 'var(--secondary)', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                Surface EMG Patch Active
              </span>
            )}
          </div>

          <div style={{ textAlign: 'center', margin: '15px 0' }}>
            <h2 style={{ fontSize: '3rem', margin: 0, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '6px' }}>
              {isSyncing ? emgText : '--'}
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>mV</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Active Muscle Recruitment (Quad Surface EMG)</p>
          </div>

          {/* Scrolling Raw EMG spikes Canvas */}
          <div style={{ height: '110px', width: '100%', background: '#0a0d16', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            {isSyncing ? (
              <canvas ref={emgCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Devices Disconnected. Connect patch to stream.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EXERCISE CONTROLLER & SIGNAL STATUS */}
      {isSyncing && (
        <div className="dashboard-content-grid grid-3-2" style={{ marginBottom: '24px' }}>
          
          {/* Active Session Controller */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0 }}>Active Session Recording</h3>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Target Exercise Profile</label>
                <select 
                  className="search-bar" 
                  value={exercise} 
                  onChange={(e) => setExercise(e.target.value)}
                  disabled={isRecording}
                  style={{ width: '100%', borderRadius: '8px', color: '#000', padding: '10px' }}
                >
                  <option value="Squats">Squats (Quad Dominated)</option>
                  <option value="Knee Extension">Knee Extensions (Isolated Quad)</option>
                  <option value="Leg Press">Leg Press (Lower Body Flexion)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-end' }}>
                {!isRecording ? (
                  <button 
                    onClick={() => { setIsRecording(true); setReps(0); }}
                    className="glass-button" 
                    style={{ background: 'var(--primary)', color: 'white', display: 'flex', gap: '8px', alignItems: 'center', borderRadius: '8px' }}
                  >
                    <Play size={16} /> Start Recording
                  </button>
                ) : (
                  <button 
                    onClick={handleSaveTelemetry}
                    className="glass-button" 
                    style={{ background: 'var(--danger)', color: 'white', display: 'flex', gap: '8px', alignItems: 'center', borderRadius: '8px' }}
                  >
                    <Square size={16} /> Stop & Save Data
                  </button>
                )}
              </div>
            </div>

            {/* Rep counter and Metrics */}
            <div className="grid-1-1-1" style={{ marginTop: '10px' }}>
              <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rep Count (Auto Detected)</span>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '4px 0 0 0', color: 'var(--primary)' }}>{reps}</p>
              </div>
              <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Session Time</span>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '4px 0 0 0', color: 'var(--secondary)' }}>{formatDuration(sessionTime)}</p>
              </div>
              <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Peak EMG Voltage</span>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '4px 0 0 0', color: '#fbbf24' }}>{maxEmg} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>mV</span></p>
              </div>
            </div>
          </div>

          {/* BLE Channels status panel */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0 }}>Sensor Status & Diagnostics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <Watch size={16} /> Apple Watch Signal
                </span>
                <span style={{ display: 'flex', gap: '6px', alignItems: 'center', fontWeight: '600' }}>
                  <BatteryCharging size={16} color="var(--primary)" /> 82% | 98% RSSI
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <Zap size={16} /> EMG Patch Signal
                </span>
                <span style={{ display: 'flex', gap: '6px', alignItems: 'center', fontWeight: '600' }}>
                  <BatteryCharging size={16} color="var(--secondary)" /> 90% | 92% RSSI
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <Activity size={16} /> Data Link Latency
                </span>
                <span style={{ fontWeight: '600', color: 'var(--primary)' }}>12ms (Excellent)</span>
              </div>

              {isRecording && (
                <div className="glass-panel" style={{ display: 'flex', gap: '8px', padding: '10px', alignItems: 'center', borderLeft: '3px solid var(--accent)', background: 'rgba(14, 165, 233, 0.05)' }}>
                  <AlertCircle size={16} color="var(--accent)" />
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Auto reps detection is threshold active. Maximize quad flexion to register reps.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SAVED HISTORICAL LOGS */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HardDrive size={20} color="var(--primary)" /> Saved Telemetry Database
        </h3>
        
        {telemetryLogs.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>Exercise Name</th>
                  <th style={{ padding: '12px' }}>Date</th>
                  <th style={{ padding: '12px' }}>Reps Completed</th>
                  <th style={{ padding: '12px' }}>Avg Heart Rate</th>
                  <th style={{ padding: '12px' }}>Peak EMG Recruitment</th>
                  <th style={{ padding: '12px' }}>Session Duration</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {telemetryLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }}>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{log.exercise}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{log.date}</td>
                    <td style={{ padding: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>{log.reps} reps</td>
                    <td style={{ padding: '12px' }}>{log.avgHr} BPM</td>
                    <td style={{ padding: '12px', color: '#fbbf24', fontWeight: 'bold' }}>{log.peakEmg} mV</td>
                    <td style={{ padding: '12px' }}>{log.duration}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDeleteLog(log.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px', borderRadius: '4px', opacity: 0.7 }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                        title="Delete Session Log"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No saved telemetry logs in the database. Pair devices and record a session to save logs.
          </div>
        )}
      </div>
    </div>
  );
};

export default WearableSync;
