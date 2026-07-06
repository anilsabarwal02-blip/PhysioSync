import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff, 
  Share, Clock, Activity, RotateCcw, 
  User, CheckCircle, Award, ChevronLeft, Plus, X
} from 'lucide-react';
import { api, getBackendStatus } from '../utils/api';

const TeleRehab = () => {
  const navigate = useNavigate();

  // Call states
  const [callState, setCallState] = useState('idle'); // 'idle' | 'ringing' | 'connected' | 'ended'
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [duration, setDuration] = useState(0);
  const localStreamRef = useRef(null);

  // Dynamic Patient Selection
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doctorName] = useState(() => {
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      const user = JSON.parse(currentUserStr);
      return user.name || 'Dr. Sharma';
    }
    return 'Dr. Sharma';
  });
  
  // Exercise config
  const [exercise, setExercise] = useState('Knee Extension');
  const [customExercise, setCustomExercise] = useState('');
  const [reps, setReps] = useState(0);
  const repsRef = useRef(0);
  useEffect(() => {
    repsRef.current = reps;
  }, [reps]);

  // Add Patient form
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');
  const [newPatientGender, setNewPatientGender] = useState('Male');
  const [newPatientCondition, setNewPatientCondition] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const contractionRef = useRef(false);
  const animationFrameId = useRef(null);

  // Automated diagnosis exercise mapping
  const getDefaultExercise = (condition) => {
    if (!condition) return 'Knee Extension';
    const cond = condition.toLowerCase();
    if (cond.includes('shoulder') || cond.includes('rotator') || cond.includes('arm')) {
      return 'Shoulder Abduction';
    }
    if (cond.includes('back') || cond.includes('spine') || cond.includes('disc') || cond.includes('lumbar') || cond.includes('neck')) {
      return 'Spine Flexion';
    }
    return 'Knee Extension';
  };

  // Fetch patients list and doctor profile on mount
  useEffect(() => {
    const fetchPatients = async () => {
      let patientsList = [];
      try {
        patientsList = await api.getPatients();
      } catch {
        if (!getBackendStatus()) {
          patientsList = JSON.parse(localStorage.getItem('patients_list') || '[]');
        }
      }
      
      // Fallback patients database if empty
      if (!patientsList || patientsList.length === 0) {
        patientsList = [
          { id: 'p1', name: 'Rahul Verma', condition: 'Knee Ligament Post-Op Rehab', age: 28, gender: 'Male' },
          { id: 'p2', name: 'Aaryan Sharma', condition: 'Shoulder Rotator Cuff Tear', age: 34, gender: 'Male' },
          { id: 'p3', name: 'Priya Patel', condition: 'Lumbar Herniated Disc Rehab', age: 41, gender: 'Female' }
        ];
      }
      
      setPatients(patientsList);
      setSelectedPatient(patientsList[0]);
      setExercise(getDefaultExercise(patientsList[0].condition));
    };

    fetchPatients();
  }, []);

  // Update exercise when patient changes
  const handlePatientChange = (patientId) => {
    const patient = patients.find(p => (p._id || p.id) === patientId);
    if (patient) {
      setSelectedPatient(patient);
      setExercise(getDefaultExercise(patient.condition));
    }
  };

  // Ringing connecting timer
  useEffect(() => {
    let timer;
    if (callState === 'ringing') {
      timer = setTimeout(() => {
        setCallState('connected');
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [callState]);

  // Duration timer
  useEffect(() => {
    if (callState !== 'connected') {
      return;
    }
    const interval = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState]);

  // Media Stream Webcam handler
  useEffect(() => {
    let active = true;
    if (callState === 'connected' && cameraActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (active) {
            localStreamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          } else {
            stream.getTracks().forEach(track => track.stop());
          }
        })
        .catch(err => {
          console.warn("Webcam access blocked or unavailable, rendering simulator mode.", err);
        });
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    }

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [callState, cameraActive]);

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraActive(videoTrack.enabled);
      }
    } else {
      setCameraActive(!cameraActive);
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicActive(audioTrack.enabled);
      }
    } else {
      setMicActive(!micActive);
    }
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
  };

  const handleEndCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setCallState('ended');
    setDuration(0);
  };

  const handleStartCall = () => {
    setCallState('sending_link');
    setTimeout(() => {
      setCallState('ringing');
    }, 3000);
    setReps(0);
    setDuration(0);
    setCameraActive(true);
    setMicActive(true);
    setIsScreenSharing(false);
  };

  const handleAddPatient = async () => {
    if (!newPatientName.trim() || !newPatientCondition.trim()) {
      alert('Patient name and condition are required.');
      return;
    }

    const patientData = {
      name: newPatientName.trim(),
      age: newPatientAge ? parseInt(newPatientAge) : null,
      gender: newPatientGender,
      condition: newPatientCondition.trim()
    };

    try {
      const saved = await api.createPatient(patientData);
      const updatedPatients = [...patients, saved];
      setPatients(updatedPatients);
      setSelectedPatient(saved);
      setExercise(getDefaultExercise(saved.condition));
    } catch (err) {
      if (!getBackendStatus()) {
        const newP = {
          id: 'p-' + Date.now(),
          ...patientData
        };
        const updatedPatients = [...patients, newP];
        setPatients(updatedPatients);
        setSelectedPatient(newP);
        setExercise(getDefaultExercise(newP.condition));
        localStorage.setItem('patients_list', JSON.stringify(updatedPatients));
      } else {
        alert(err.message || 'Failed to add patient.');
        return;
      }
    }

    // Reset form
    setNewPatientName('');
    setNewPatientAge('');
    setNewPatientGender('Male');
    setNewPatientCondition('');
    setShowAddPatient(false);
  };

  // Draw simulated skeleton based on active exercise
  const drawSkeleton = useCallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);

    // Dark grid pattern background
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Animation cycle calculation
    const cycle = (Date.now() / 1500) % (2 * Math.PI);
    const progress = Math.abs(Math.sin(cycle));
    
    // Responsive scaling
    const scale = Math.min(width / 400, height / 400) * 0.9;
    const offsetX = width / 2;
    const offsetY = height / 2;

    if (exercise === 'Shoulder Abduction') {
      // 1. STANDING SHOULDER ABDUCTION (FRONT PROFILE)
      const theta = Math.PI / 2 - (150 * Math.PI / 180) * progress; // Arm raises from 90° straight down to -60° overhead
      const shoulderAngleDeg = Math.round(progress * 150);

      const getCoord = (x, y) => ({
        x: offsetX + (x - 200) * scale,
        y: offsetY + (y - 200) * scale
      });

      const head = getCoord(200, 110);
      const neck = getCoord(200, 145);
      const hip = getCoord(200, 270);
      
      const leftShoulder = getCoord(170, 170);
      const leftElbow = getCoord(170, 225);
      const leftHand = getCoord(170, 270);

      const rightShoulder = getCoord(230, 170);
      const armLength = 65;
      const rightElbow = {
        x: rightShoulder.x + armLength * scale * Math.cos(theta),
        y: rightShoulder.y + armLength * scale * Math.sin(theta)
      };
      const rightHand = {
        x: rightElbow.x + 55 * scale * Math.cos(theta),
        y: rightElbow.y + 55 * scale * Math.sin(theta)
      };

      const leftHip = getCoord(185, 270);
      const leftAnkle = getCoord(185, 350);
      const rightHip = getCoord(215, 270);
      const rightAnkle = getCoord(215, 350);

      // Draw bones
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 5 * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Spine & Torso
      ctx.beginPath(); ctx.moveTo(neck.x, neck.y); ctx.lineTo(hip.x, hip.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(leftShoulder.x, leftShoulder.y); ctx.lineTo(rightShoulder.x, rightShoulder.y); ctx.stroke();

      // Left Arm (Static down)
      ctx.beginPath(); ctx.moveTo(leftShoulder.x, leftShoulder.y); ctx.lineTo(leftElbow.x, leftElbow.y); ctx.lineTo(leftHand.x, leftHand.y); ctx.stroke();
      // Right Arm (Active Abduction)
      ctx.beginPath(); ctx.moveTo(rightShoulder.x, rightShoulder.y); ctx.lineTo(rightElbow.x, rightElbow.y); ctx.lineTo(rightHand.x, rightHand.y); ctx.stroke();

      // Legs
      ctx.beginPath(); ctx.moveTo(leftHip.x, leftHip.y); ctx.lineTo(leftAnkle.x, leftAnkle.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rightHip.x, rightHip.y); ctx.lineTo(rightAnkle.x, rightAnkle.y); ctx.stroke();

      // Head
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath(); ctx.arc(head.x, head.y, 18 * scale, 0, 2 * Math.PI); ctx.fill();

      // Joints
      const joints = [neck, leftShoulder, leftElbow, leftHand, rightShoulder, leftHip, leftAnkle, rightHip, rightAnkle];
      ctx.fillStyle = 'var(--primary)';
      joints.forEach(j => {
        ctx.beginPath(); ctx.arc(j.x, j.y, 5 * scale, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5 * scale; ctx.stroke();
      });

      // Highlight active Right Shoulder Abduction
      ctx.fillStyle = 'var(--accent)';
      ctx.beginPath(); ctx.arc(rightShoulder.x, rightShoulder.y, 7 * scale, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2 * scale; ctx.stroke();
      ctx.beginPath(); ctx.arc(rightElbow.x, rightElbow.y, 5 * scale, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(rightHand.x, rightHand.y, 5 * scale, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();

      // Draw active angle arc indicator
      ctx.strokeStyle = 'var(--accent)';
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.arc(rightShoulder.x, rightShoulder.y, 25 * scale, Math.PI / 2, Math.PI / 2 + (theta - Math.PI / 2), true);
      ctx.stroke();

      // HUD text overlay labels
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(14 * scale)}px 'Outfit', sans-serif`;
      ctx.fillText(`Shoulder Abduction: ${shoulderAngleDeg}°`, rightShoulder.x + 20 * scale, rightShoulder.y - 10 * scale);
      
      ctx.fillStyle = 'var(--accent)';
      ctx.font = `bold ${Math.round(10 * scale)}px 'Outfit', sans-serif`;
      ctx.fillText(`TARGET: 150° | REPS: ${repsRef.current}/15`, 24 * scale, height - 38 * scale);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(11 * scale)}px 'Outfit', sans-serif`;
      ctx.fillText(`EXERCISE: Shoulder Abduction`, 24 * scale, height - 56 * scale);

      return { angleVal: shoulderAngleDeg, threshold: 120, recovery: 40 };

    } else if (exercise === 'Spine Flexion') {
      // 2. STANDING SPINE FLEXION (SIDE PROFILE FORWARD BEND)
      const flexionAngle = (80 * Math.PI / 180) * progress; // Bend forward from 0 to 80 deg
      const flexionAngleDeg = Math.round(progress * 80);

      const getCoord = (x, y) => ({
        x: offsetX + (x - 200) * scale,
        y: offsetY + (y - 180) * scale
      });

      const foot = getCoord(190, 340);
      const knee = getCoord(190, 275);
      const hip = getCoord(190, 210);

      // Spine bends forward relative to hip
      const neck = {
        x: hip.x - 70 * scale * Math.sin(flexionAngle),
        y: hip.y - 70 * scale * Math.cos(flexionAngle)
      };
      const head = {
        x: neck.x - 18 * scale * Math.sin(flexionAngle),
        y: neck.y - 18 * scale * Math.cos(flexionAngle)
      };

      // Arms hang straight down from shoulder
      const shoulder = neck;
      const hand = {
        x: shoulder.x,
        y: shoulder.y + 60 * scale
      };

      // Draw bones
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 5 * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Legs
      ctx.beginPath(); ctx.moveTo(foot.x, foot.y); ctx.lineTo(knee.x, knee.y); ctx.lineTo(hip.x, hip.y); ctx.stroke();
      // Torso / Spine Bended
      ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(neck.x, neck.y); ctx.stroke();
      // Arm hanging down
      ctx.beginPath(); ctx.moveTo(shoulder.x, shoulder.y); ctx.lineTo(hand.x, hand.y); ctx.stroke();

      // Head
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath(); ctx.arc(head.x, head.y, 18 * scale, 0, 2 * Math.PI); ctx.fill();

      // Joints
      const joints = [foot, knee, neck, hand];
      ctx.fillStyle = 'var(--primary)';
      joints.forEach(j => {
        ctx.beginPath(); ctx.arc(j.x, j.y, 5 * scale, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5 * scale; ctx.stroke();
      });

      // Highlight active Hip joint
      ctx.fillStyle = 'var(--accent)';
      ctx.beginPath(); ctx.arc(hip.x, hip.y, 7 * scale, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2 * scale; ctx.stroke();

      // Draw hip flexion arc
      ctx.strokeStyle = 'var(--accent)';
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.arc(hip.x, hip.y, 25 * scale, -Math.PI / 2, -Math.PI / 2 - flexionAngle, true);
      ctx.stroke();

      // HUD text labels
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(14 * scale)}px 'Outfit', sans-serif`;
      ctx.fillText(`Spine Flexion: ${flexionAngleDeg}°`, hip.x + 20 * scale, hip.y - 15 * scale);
      
      ctx.fillStyle = 'var(--accent)';
      ctx.font = `bold ${Math.round(10 * scale)}px 'Outfit', sans-serif`;
      ctx.fillText(`TARGET: 70° | REPS: ${repsRef.current}/15`, 24 * scale, height - 38 * scale);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(11 * scale)}px 'Outfit', sans-serif`;
      ctx.fillText(`EXERCISE: Spine Flexion`, 24 * scale, height - 56 * scale);

      return { angleVal: flexionAngleDeg, threshold: 60, recovery: 20 };

    } else {
      // 3. SITTING KNEE EXTENSION (DEFAULT)
      const theta = Math.PI / 2 - (Math.PI / 2 - 0.15) * progress; // Knee extension angle
      const kneeAngleDeg = Math.round(180 - (theta * 180 / Math.PI));

      const getCoord = (x, y) => ({
        x: offsetX + (x - 200) * scale,
        y: offsetY + (y - 180) * scale
      });

      const head = getCoord(170, 110);
      const neck = getCoord(170, 150);
      const shoulder = getCoord(170, 175);
      const elbow = getCoord(200, 205);
      const hand = getCoord(215, 190);
      const hip = getCoord(180, 260);
      const knee = getCoord(265, 260);
      
      const shinLength = 85;
      const ankle = {
        x: knee.x + shinLength * scale * Math.cos(theta),
        y: knee.y + shinLength * scale * Math.sin(theta)
      };
      const foot = {
        x: ankle.x + 20 * scale,
        y: ankle.y
      };

      // Draw reference circular target
      ctx.strokeStyle = 'rgba(13, 148, 136, 0.15)';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath(); ctx.arc(knee.x, knee.y, 60 * scale, 0, 2 * Math.PI); ctx.stroke();

      // Draw main bones
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 5 * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Spine
      ctx.beginPath(); ctx.moveTo(neck.x, neck.y); ctx.lineTo(shoulder.x, shoulder.y); ctx.lineTo(hip.x, hip.y); ctx.stroke();
      // Femur
      ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(knee.x, knee.y); ctx.stroke();
      // Shin
      ctx.beginPath(); ctx.moveTo(knee.x, knee.y); ctx.lineTo(ankle.x, ankle.y); ctx.stroke();
      // Foot
      ctx.beginPath(); ctx.moveTo(ankle.x, ankle.y); ctx.lineTo(foot.x, foot.y); ctx.stroke();
      // Arm
      ctx.beginPath(); ctx.moveTo(shoulder.x, shoulder.y); ctx.lineTo(elbow.x, elbow.y); ctx.lineTo(hand.x, hand.y); ctx.stroke();

      // Draw Head
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath(); ctx.arc(head.x, head.y, 20 * scale, 0, 2 * Math.PI); ctx.fill();

      // Draw joints
      const joints = [neck, shoulder, elbow, hand, hip, ankle];
      ctx.fillStyle = 'var(--primary)';
      joints.forEach(j => {
        ctx.beginPath(); ctx.arc(j.x, j.y, 5 * scale, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5 * scale; ctx.stroke();
      });

      // Highlight active Knee tracking joint
      ctx.fillStyle = 'var(--accent)';
      ctx.beginPath(); ctx.arc(knee.x, knee.y, 7 * scale, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2 * scale; ctx.stroke();

      // Draw active joint angle arc
      ctx.strokeStyle = 'var(--accent)';
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.arc(knee.x, knee.y, 30 * scale, Math.PI, Math.PI + (Math.PI - theta));
      ctx.stroke();

      // Text Overlay Labels
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(14 * scale)}px 'Outfit', sans-serif`;
      ctx.fillText(`Knee Flexion: ${kneeAngleDeg}°`, knee.x + 15 * scale, knee.y - 15 * scale);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = `${Math.round(11 * scale)}px 'Outfit', sans-serif`;
      ctx.fillText(`Hip Angle: 90°`, hip.x - 30 * scale, hip.y - 12 * scale);

      ctx.fillStyle = 'var(--accent)';
      ctx.font = `bold ${Math.round(10 * scale)}px 'Outfit', sans-serif`;
      ctx.fillText(`TARGET: 170° | REPS: ${repsRef.current}/15`, 24 * scale, height - 38 * scale);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(11 * scale)}px 'Outfit', sans-serif`;
      ctx.fillText(`EXERCISE: Knee Extension`, 24 * scale, height - 56 * scale);

      return { angleVal: kneeAngleDeg, threshold: 155, recovery: 110 };
    }
  }, [exercise]);

  // Canvas loop
  useEffect(() => {
    if (callState !== 'connected') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const handleResize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const { angleVal, threshold, recovery } = drawSkeleton(ctx, canvas.width, canvas.height);
      
      // Automatic reps counter based on dynamic thresholding
      if (angleVal > threshold) {
        if (!contractionRef.current) {
          contractionRef.current = true;
          setReps(r => r + 1);
        }
      } else if (angleVal < recovery) {
        contractionRef.current = false;
      }

      animationFrameId.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [callState, drawSkeleton]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const getInitials = (name) => {
    if (!name) return 'DS';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="main-content">
      {/* Header */}
      <header className="dashboard-header" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        {callState === 'idle' && (
          <button 
            className="glass-button" 
            onClick={() => navigate('/dashboard')} 
            style={{ padding: '8px', display: 'flex', borderRadius: '50%' }}
            title="Back to Dashboard"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div>
          <h1>Tele-Rehab Video Consult 🌐</h1>
          <p>Remote physiotherapy sessions with live AI movement tracking.</p>
        </div>
      </header>

      {/* CALL STATE: IDLE */}
      {callState === 'idle' && (
        <div style={{ padding: '28px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderBottom: '1px solid var(--border)', paddingBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={22} color="var(--primary)" /> Setup Tele-Rehab Session
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              Host: {doctorName}
            </span>
          </div>

          <div className="responsive-grid-2" style={{ gap: '20px', width: '100%' }}>
            
            {/* Left: Patient Select */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Select Patient</label>
                  <button 
                    onClick={() => setShowAddPatient(!showAddPatient)}
                    style={{ 
                      background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', 
                      fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' 
                    }}
                  >
                    {showAddPatient ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Patient</>}
                  </button>
                </div>
                <select 
                  className="search-bar" 
                  value={selectedPatient ? (selectedPatient._id || selectedPatient.id) : ''} 
                  onChange={(e) => handlePatientChange(e.target.value)}
                  style={{ width: '100%', borderRadius: '8px', padding: '10px', color: '#000', fontSize: '0.95rem', boxSizing: 'border-box' }}
                >
                  {patients.map(p => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Patient Inline Form */}
              {showAddPatient && (
                <div style={{ padding: '16px', borderRadius: '12px', border: '1px dashed var(--primary)', background: 'rgba(13, 148, 136, 0.03)', display: 'flex', flexDirection: 'column', gap: '10px', boxSizing: 'border-box' }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> New Patient
                  </h4>
                  <input 
                    type="text" placeholder="Patient Name *" value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="number" placeholder="Age" value={newPatientAge} onChange={(e) => setNewPatientAge(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', flex: 1, minWidth: 0, boxSizing: 'border-box' }}
                    />
                    <select 
                      value={newPatientGender} onChange={(e) => setNewPatientGender(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', flex: 1, minWidth: 0, boxSizing: 'border-box' }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <input 
                    type="text" placeholder="Clinical Condition *" value={newPatientCondition} onChange={(e) => setNewPatientCondition(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
                  />
                  <button 
                    onClick={handleAddPatient}
                    className="glass-button"
                    style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', width: '100%' }}
                  >
                    Add Patient
                  </button>
                </div>
              )}

              {selectedPatient && !showAddPatient && (
                <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Age / Gender</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{selectedPatient.age || 'N/A'} Yrs / {selectedPatient.gender || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Clinical Diagnosis</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '2px' }}>{selectedPatient.condition}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Exercise and Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Target Bio-Feedback Exercise</label>
                <select 
                  className="search-bar" 
                  value={exercise} 
                  onChange={(e) => setExercise(e.target.value)}
                  style={{ width: '100%', borderRadius: '8px', padding: '10px', color: '#000', fontSize: '0.95rem' }}
                >
                  <option value="Knee Extension">Knee Extension (Leg / Knee Rehab)</option>
                  <option value="Shoulder Abduction">Shoulder Abduction (Shoulder Raise)</option>
                  <option value="Spine Flexion">Spine Flexion (Back Flexion)</option>
                  <option value="Other">Other (Custom)</option>
                </select>
                {exercise === 'Other' && (
                  <input
                    type="text"
                    className="search-bar"
                    placeholder="Enter custom exercise..."
                    value={customExercise}
                    onChange={(e) => setCustomExercise(e.target.value)}
                    style={{ width: '100%', borderRadius: '8px', padding: '10px', color: '#000', fontSize: '0.95rem', marginTop: '10px', boxSizing: 'border-box' }}
                  />
                )}
              </div>


            </div>

          </div>

          <button 
            onClick={handleStartCall}
            className="glass-button" 
            style={{ 
              padding: '14px 40px', 
              fontSize: '1.05rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '10px', 
              borderRadius: '30px', 
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              marginTop: '10px'
            }}
          >
            <Phone size={18} /> Connect Video Consult
          </button>
        </div>
      )}

      {/* CALL STATE: SENDING LINK */}
      {callState === 'sending_link' && selectedPatient && (
        <div className="glass-panel" style={{ padding: '60px', height: '550px', background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '30px', position: 'relative' }}>
          <div className="ringing-indicator" style={{ position: 'relative' }}>
            <div className="avatar" style={{ width: '100px', height: '100px', fontSize: '2.5rem', background: 'var(--secondary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%', boxShadow: '0 0 0 10px rgba(14, 165, 233, 0.2)' }}>
              <Phone size={40} />
            </div>
            {/* Pulsing visual circles */}
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '-10px',
              right: '-10px',
              bottom: '-10px',
              border: '2px solid var(--secondary)',
              borderRadius: '50%',
              animation: 'pulse 1.5s infinite',
              opacity: 0.5
            }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'white', marginBottom: '8px' }}>Sending secure invite link...</h2>
            <p style={{ color: '#94a3b8' }}>An SMS link has been dispatched to {selectedPatient.name}'s mobile device.</p>
            <p style={{ color: 'var(--accent)', fontSize: '0.9rem', marginTop: '10px' }}>Waiting for patient to click the link...</p>
          </div>
          <button 
            onClick={() => setCallState('idle')}
            className="glass-button" 
            style={{ 
              background: 'var(--danger)', 
              color: 'white', 
              borderRadius: '30px', 
              padding: '12px 30px', 
              border: 'none', 
              fontWeight: '600', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}
          >
            <PhoneOff size={18} /> Cancel Call
          </button>
        </div>
      )}

      {/* CALL STATE: RINGING */}
      {callState === 'ringing' && selectedPatient && (
        <div className="glass-panel" style={{ padding: '60px', height: '550px', background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '30px', position: 'relative' }}>
          <div className="ringing-indicator" style={{ position: 'relative' }}>
            <div className="avatar" style={{ width: '100px', height: '100px', fontSize: '2.5rem', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%', boxShadow: '0 0 0 10px rgba(13, 148, 136, 0.2)' }}>
              {getInitials(selectedPatient.name)}
            </div>
            {/* Pulsing visual circles */}
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '-10px',
              right: '-10px',
              bottom: '-10px',
              border: '2px solid var(--primary)',
              borderRadius: '50%',
              animation: 'pulse 1.5s infinite',
              opacity: 0.5
            }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'white', marginBottom: '8px' }}>Calling {selectedPatient.name}...</h2>
            <p style={{ color: '#94a3b8' }}>Establishing secure connection with live AI visual tracking</p>
          </div>
          <button 
            onClick={() => setCallState('idle')}
            className="glass-button" 
            style={{ 
              background: 'var(--danger)', 
              color: 'white', 
              borderRadius: '30px', 
              padding: '12px 30px', 
              border: 'none', 
              fontWeight: '600', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}
          >
            <PhoneOff size={18} /> Cancel Call
          </button>
        </div>
      )}

      {/* CALL STATE: CONNECTED */}
      {callState === 'connected' && selectedPatient && (
        <div className="glass-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '580px', overflow: 'hidden', position: 'relative', background: '#090d16' }}>
          
          {/* Main Video Stream Window */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', width: '100%', minHeight: 0 }}>
            
            {/* Canvas for Patient Stick-Skeleton Simulation */}
            <div style={{ flex: 1, position: 'relative', background: 'radial-gradient(circle, #101625 0%, #080a10 100%)', width: '100%', height: '100%', minHeight: 0 }}>
              <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block' }} />
              
              {/* AI Overlay status tag */}
              <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(9, 13, 22, 0.8)', padding: '10px 16px', borderRadius: '12px', borderLeft: '3px solid var(--accent)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={14} color="var(--accent)" />
                  <p style={{ margin: 0, color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 'bold' }}>AI Tracking Active</p>
                </div>
                <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>Confidence: 98% | Joints: 17/17</p>
              </div>

              {/* Call Stats header overlay */}
              <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px', alignItems: 'center', zIndex: 10 }}>
                {isScreenSharing && (
                  <span style={{ background: 'rgba(14, 165, 233, 0.2)', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600' }}>
                    Sharing Screen
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(9, 13, 22, 0.8)', padding: '6px 12px', borderRadius: '12px', backdropFilter: 'blur(8px)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                  <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '600', fontFamily: 'monospace' }}>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Doctor Local Webcam Picture-in-Picture PIP */}
            <div className="tele-rehab-pip" style={{ 
              position: 'absolute', 
              bottom: '20px', 
              right: '20px', 
              width: '180px', 
              height: '135px', 
              background: '#0f172a', 
              borderRadius: '12px', 
              border: '2px solid rgba(255,255,255,0.15)', 
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              overflow: 'hidden', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              zIndex: 20 
            }}>
              {cameraActive ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', color: '#94a3b8' }}>
                  <div className="avatar" style={{ width: '36px', height: '36px', background: 'var(--secondary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%', fontSize: '0.85rem' }}>
                    {getInitials(doctorName)}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Camera Off</span>
                </div>
              )}
              {/* Tiny bottom label */}
              <div style={{ position: 'absolute', bottom: '6px', left: '8px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', color: '#fff' }}>
                You ({doctorName})
              </div>
            </div>
          </div>

          {/* Connected Call Bottom Control Bar */}
          <div style={{ 
            padding: '16px 12px', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '12px', 
            flexWrap: 'wrap',
            background: '#0b101c', 
            borderTop: '1px solid rgba(255,255,255,0.08)' 
          }}>
            <button 
              onClick={toggleMic}
              style={{ 
                borderRadius: '50%', 
                width: '46px', 
                height: '46px', 
                border: 'none',
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                background: micActive ? 'rgba(255,255,255,0.08)' : 'var(--danger)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title={micActive ? "Mute Microphone" : "Unmute Microphone"}
            >
              {micActive ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            <button 
              onClick={toggleCamera}
              style={{ 
                borderRadius: '50%', 
                width: '46px', 
                height: '46px', 
                border: 'none',
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                background: cameraActive ? 'rgba(255,255,255,0.08)' : 'var(--danger)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title={cameraActive ? "Turn Camera Off" : "Turn Camera On"}
            >
              {cameraActive ? <Video size={18} /> : <VideoOff size={18} />}
            </button>

            <button 
              onClick={handleEndCall}
              style={{ 
                borderRadius: '24px', 
                padding: '0 24px', 
                height: '46px',
                border: 'none',
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '8px',
                background: 'var(--danger)',
                color: '#fff',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
              }}
            >
              <PhoneOff size={16} /> End Call
            </button>

            <button 
              onClick={toggleScreenShare}
              style={{ 
                borderRadius: '50%', 
                width: '46px', 
                height: '46px', 
                border: 'none',
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                background: isScreenSharing ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
            >
              <Share size={18} />
            </button>
          </div>
        </div>
      )}

      {/* CALL STATE: ENDED */}
      {callState === 'ended' && selectedPatient && (
        <div className="glass-panel" style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '2px solid var(--primary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--primary)' }}>
            <Award size={40} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Session Completed</h2>
            <p style={{ color: 'var(--text-muted)' }}>{selectedPatient.name} • {selectedPatient.condition}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={18} color="var(--primary)" />
                <span style={{ fontSize: '0.9rem' }}>Call Duration</span>
              </div>
              <span style={{ fontWeight: 'bold' }}>{formatTime(duration)}</span>
            </div>
            
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={18} color="var(--accent)" />
                <span style={{ fontSize: '0.9rem' }}>AI Tracking Accuracy</span>
              </div>
              <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>96% Avg</span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={18} style={{ color: '#10b981' }} />
                <span style={{ fontSize: '0.9rem' }}>{exercise} Completed</span>
              </div>
              <span style={{ fontWeight: 'bold', color: '#10b981' }}>{reps} Reps / 1 Set</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button 
              onClick={handleStartCall}
              className="glass-button" 
              style={{ 
                padding: '12px 24px', 
                fontSize: '0.9rem', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                border: 'none',
                cursor: 'pointer' 
              }}
            >
              <RotateCcw size={16} /> Restart Session
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="glass-button" 
              style={{ 
                padding: '12px 24px', 
                fontSize: '0.9rem', 
                borderRadius: '8px', 
                background: 'rgba(255,255,255,0.08)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                cursor: 'pointer' 
              }}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeleRehab;
