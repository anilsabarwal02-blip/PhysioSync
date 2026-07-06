import { useState, useRef, useEffect } from 'react';
import { Rotate3D, ZoomIn, ZoomOut, Layers, Info } from 'lucide-react';
import AnatomyCanvas from './AnatomyCanvas';
import { api } from '../utils/api';

const SYSTEM_INFO = {
  Skeletal: {
    description: "The skeletal system provides the structural framework for the body. It consists of bones, cartilage, ligaments, and joints that protect vital organs and enable locomotion.",
    keyStructures: [
      "Skull (Cranial Vault)",
      "Vertebrae (Cervical, Thoracic, Lumbar)",
      "Ribcage & Sternum",
      "Pelvis (Girdle)",
      "Upper Extremity (Humerus, Radius, Clavicle)",
      "Lower Extremity (Femur, Patella, Tibia)"
    ]
  },
  Muscular: {
    description: "The muscular system facilitates voluntary movement, maintains posture, and circulates blood. It includes skeletal muscles, tendons, and integrated visceral organs.",
    keyStructures: [
      "Deltoids & Pectorals",
      "Rectus Abdominis (Core)",
      "Biceps Brachii",
      "Quadriceps Femoris",
      "Gastrocnemius (Calves)",
      "Internal Organs (Heart, Lungs, Liver, Stomach, Intestines)"
    ]
  },
  Nervous: {
    description: "The nervous and circulatory systems coordinate rapid responses to internal and external stimuli, while managing metabolic transport and electrical impulses.",
    keyStructures: [
      "Cerebral Cortex (Brain)",
      "Spinal Cord (CNS)",
      "Brachial Plexus (Shoulder/Arm)",
      "Sciatic Nerve (Lower Limb)",
      "Central Vessels (Aorta & Vena Cava)",
      "Peripheral Vessels (Jugular, Axillary, Femoral)"
    ]
  }
};

const REGION_INFO = {
  'Full Body': "Complete overview of all anatomical structures. Rotate and zoom to inspect the relative position of bones, muscles, and nerve networks.",
  'Shoulder Joint': "Focuses on the glenohumeral complex, including the clavicle, scapula, and upper humerus. Shows the attachment of the deltoids, pectorals, brachial plexus, and axillary blood vessels.",
  'Lumbar Spine': "Focuses on the lower back vertebrae (L1-L5), intervertebral discs, spinous processes, and core abdominal stabilizers. Shows the origin of the lumbar spinal cord.",
  'Knee Joint': "Focuses on the tibiofemoral joint, including the patella, patellar ligament, quads, calves, sciatic nerve, and femoral blood vessels.",
  'Cervical Spine': "Focuses on the neck vertebrae (C1-C7), intervertebral discs, brain stem, and upper carotid/jugular blood supply pathways."
};

const getPatientRom = (patient) => {
  if (!patient) return { joint: 'Full Body', metrics: [] };
  const name = patient.name;
  const condition = (patient.condition || '').toLowerCase();
  
  if (name === 'Rahul Verma' || condition.includes('knee') || condition.includes('ligament')) {
    return {
      joint: 'Knee Joint',
      metrics: [
        { name: 'Knee Flexion', current: 95, target: 135, unit: '°' },
        { name: 'Extension Deficit', current: 5, target: 0, unit: '°', inverse: true }
      ]
    };
  }
  if (name === 'Vikram Singh' || condition.includes('shoulder') || condition.includes('rotator')) {
    return {
      joint: 'Shoulder Joint',
      metrics: [
        { name: 'Shoulder Abduction', current: 120, target: 180, unit: '°' },
        { name: 'External Rotation', current: 40, target: 90, unit: '°' }
      ]
    };
  }
  if (name === 'Priya Sharma' || condition.includes('cervical') || condition.includes('neck') || condition.includes('spondylosis')) {
    return {
      joint: 'Cervical Spine',
      metrics: [
        { name: 'Cervical Rotation', current: 45, target: 80, unit: '°' },
        { name: 'Cervical Flexion', current: 35, target: 50, unit: '°' }
      ]
    };
  }
  if (name === 'Neha Gupta' || condition.includes('lumbar') || condition.includes('back') || condition.includes('disc') || condition.includes('sciatica')) {
    return {
      joint: 'Lumbar Spine',
      metrics: [
        { name: 'Lumbar Flexion', current: 40, target: 90, unit: '°' },
        { name: 'Lumbar Extension', current: 15, target: 30, unit: '°' }
      ]
    };
  }
  return {
    joint: 'Full Body',
    metrics: [
      { name: 'General Mobility', current: 75, target: 100, unit: '%' }
    ]
  };
};

const AnatomyViewer = () => {
  const [selectedSystem, setSelectedSystem] = useState('Skeletal');
  const [selectedPart, setSelectedPart] = useState('Full Body');
  const canvasRef = useRef(null);

  // Patient states
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Fetch patients from backend
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const list = await api.getPatients();
        setPatients(list);
        if (list.length > 0) {
          setSelectedPatient(list[0]);
        }
      } catch (err) {
        console.warn("[API] Failed to fetch patients in AnatomyViewer:", err.message);
        let localList = JSON.parse(localStorage.getItem('patients_list') || '[]');
        if (localList.length === 0) {
          localList = [
            { id: 'p1', name: 'Rahul Verma', condition: 'Knee Ligament Post-Op Rehab', age: 28, gender: 'Male' },
            { id: 'p2', name: 'Vikram Singh', condition: 'Shoulder Rotator Cuff Tear', age: 34, gender: 'Male' },
            { id: 'p3', name: 'Priya Sharma', condition: 'Cervical Spondylosis', age: 45, gender: 'Female' },
            { id: 'p4', name: 'Neha Gupta', condition: 'Lumbar Herniated Disc Rehab', age: 41, gender: 'Female' }
          ];
        }
        setPatients(localList);
        setSelectedPatient(localList[0]);
      }
    };
    fetchPatients();
  }, []);

  // Update focus joint based on patient condition
  useEffect(() => {
    if (!selectedPatient) return;
    const getFocusRegion = (condition) => {
      if (!condition) return { region: 'Full Body', system: 'Skeletal' };
      const cond = condition.toLowerCase();
      if (cond.includes('knee') || cond.includes('ligament')) {
        return { region: 'Knee Joint', system: 'Skeletal' };
      }
      if (cond.includes('shoulder') || cond.includes('rotator')) {
        return { region: 'Shoulder Joint', system: 'Muscular' };
      }
      if (cond.includes('cervical') || cond.includes('neck') || cond.includes('spondylosis')) {
        return { region: 'Cervical Spine', system: 'Nervous' };
      }
      if (cond.includes('lumbar') || cond.includes('back') || cond.includes('disc') || cond.includes('sciatica')) {
        return { region: 'Lumbar Spine', system: 'Skeletal' };
      }
      return { region: 'Full Body', system: 'Skeletal' };
    };

    const { region, system } = getFocusRegion(selectedPatient.condition);
    const timer = setTimeout(() => {
      setSelectedPart(region);
      setSelectedSystem(system);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedPatient]);

  return (
    <div className="main-content">
      <header className="dashboard-header">
        <div>
          <h1>3D Anatomy & Tissue Visualizer 🦴🧠</h1>
          <p>Inspect deep structural systems, clinical regions, and tissue layers in real-time.</p>
        </div>
      </header>

      <div
        className="dashboard-content-grid anatomy-grid"
        style={{
          gap: '24px',
          alignItems: 'stretch',
          minHeight: 'calc(100vh - 160px)'
        }}
      >
        {/* Left Column: Controls & Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Patient Selector */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '12px' }}>Clinical Patient ROM Focus</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <select 
                className="search-bar" 
                style={{ width: '100%', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', padding: '10px 14px' }}
                value={selectedPatient ? selectedPatient.id || selectedPatient._id : ''}
                onChange={(e) => {
                  const p = patients.find(pat => (pat.id || pat._id) === e.target.value);
                  if (p) setSelectedPatient(p);
                }}
              >
                {patients.map(p => (
                  <option key={p.id || p._id} value={p.id || p._id}>{p.name} ({p.condition})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Patient ROM Details Card */}
          {selectedPatient && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Range of Motion (ROM)</span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(13, 148, 136, 0.15)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                  {getPatientRom(selectedPatient).joint}
                </span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {getPatientRom(selectedPatient).metrics.map((metric, idx) => {
                  const progress = metric.inverse 
                    ? Math.max(0, 100 - (metric.current * 10)) 
                    : (metric.current / metric.target) * 100;
                  const isSevere = progress < 70;
                  const progressColor = isSevere ? 'var(--danger)' : 'var(--primary)';
                  
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{metric.name}</span>
                        <span style={{ fontWeight: 'bold', color: isSevere ? 'var(--danger)' : 'var(--text-main)' }}>
                          {metric.current}{metric.unit} / {metric.target}{metric.unit}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${Math.min(100, progress)}%`, 
                            height: '100%', 
                            background: progressColor, 
                            borderRadius: '4px',
                            transition: 'width 0.8s ease-in-out'
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Systems selector */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Anatomical Systems</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Skeletal', 'Muscular', 'Nervous'].map(sys => (
                <button
                  key={sys}
                  className="glass-button"
                  style={{
                    background: selectedSystem === sys ? 'var(--primary)' : 'var(--glass-bg)',
                    color: selectedSystem === sys ? 'white' : 'var(--text-main)',
                    border: selectedSystem === sys ? 'none' : '1px solid var(--border)',
                    textAlign: 'left',
                    padding: '12px 16px',
                    boxShadow: selectedSystem === sys ? '0 4px 15px var(--primary-glow)' : 'none',
                    fontWeight: selectedSystem === sys ? '600' : '500',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => setSelectedSystem(sys)}
                >
                  <span>{sys} System</span>
                  {selectedSystem === sys && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                </button>
              ))}
            </div>
          </div>

          {/* Regions selector */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '12px' }}>Focus Regions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {['Full Body', 'Shoulder Joint', 'Lumbar Spine', 'Knee Joint', 'Cervical Spine'].map(part => {
                const isActive = selectedPart === part;
                return (
                  <div
                    key={part}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(13, 148, 136, 0.1)' : 'transparent',
                      color: isActive ? 'var(--primary)' : 'var(--text-main)',
                      border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                      fontWeight: isActive ? '600' : 'normal',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onClick={() => setSelectedPart(part)}
                  >
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: isActive ? 'var(--primary)' : 'var(--text-muted)',
                      opacity: isActive ? 1 : 0.4
                    }} />
                    {part}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Card describing the selected system/region */}
          <div className="glass-panel" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255, 255, 255, 0.3)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', margin: 0 }}>
              <Info size={20} /> Clinical Summary
            </h3>

            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active System</span>
              <p style={{ fontSize: '0.82rem', margin: '4px 0 0 0', color: 'var(--text-main)', lineHeight: '1.45' }}>
                {SYSTEM_INFO[selectedSystem].description}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Focus Region</span>
              <p style={{ fontSize: '0.82rem', margin: '4px 0 0 0', color: 'var(--text-main)', lineHeight: '1.45' }}>
                {REGION_INFO[selectedPart]}
              </p>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Key Highlighted Structures</span>
              <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {SYSTEM_INFO[selectedSystem].keyStructures.map((structure, idx) => (
                  <li key={idx}>{structure}</li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Right Column: 3D Anatomy Viewport */}
        <div className="glass-panel anatomy-viewport-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>

          {/* Viewport Header with control buttons */}
          <div className="anatomy-viewport-header">
            <div>
              <h3 style={{ margin: 0 }}>{selectedPart} Viewport</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Drag to rotate, scroll/buttons to zoom</span>
            </div>
            <div className="anatomy-viewport-actions">
              <button
                className="glass-button"
                style={{ padding: '8px 14px', background: 'var(--glass-bg)', color: 'var(--text-main)', border: '1px solid var(--border)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => canvasRef.current?.toggleRotation()}
                title="Toggle Auto-Rotation"
              >
                <Rotate3D size={16} /> Spin
              </button>
              <button
                className="glass-button"
                style={{ padding: '8px', background: 'var(--glass-bg)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
                onClick={() => canvasRef.current?.zoomIn()}
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
              <button
                className="glass-button"
                style={{ padding: '8px', background: 'var(--glass-bg)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
                onClick={() => canvasRef.current?.zoomOut()}
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <button
                className="glass-button"
                style={{ padding: '8px 14px', background: 'var(--glass-bg)', color: 'var(--text-main)', border: '1px solid var(--border)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => canvasRef.current?.resetView()}
                title="Reset View"
              >
                <Layers size={16} /> Reset
              </button>
            </div>
          </div>

          {/* Actual WebGL Canvas */}
          <div
            className="anatomy-canvas-container"
            style={{
              flex: 1,
              background: '#020617',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              minHeight: '600px'
            }}
          >
            <AnatomyCanvas
              ref={canvasRef}
              activeRegion={selectedPart}
              activeSystem={selectedSystem}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnatomyViewer;
