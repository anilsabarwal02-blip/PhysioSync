import React, { useState } from 'react';
import { Sparkles, FileSignature, CheckCircle, Clock, Bone, Layers, Rotate3D, ZoomIn, Info } from 'lucide-react';

const TreatmentPlanner = () => {
  const [diagnosis, setDiagnosis] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState(null);
  const [selectedPart, setSelectedPart] = useState('Full Body');

  const generatePlan = (e) => {
    e.preventDefault();
    if (!diagnosis) return;
    setIsGenerating(true);
    
    setTimeout(() => {
      setIsGenerating(false);
      const text = diagnosis.toLowerCase();
      let generatedPlan = [
        { day: 'Weeks 1-2', focus: 'Pain Relief & Mobility', exercises: 'Gentle rotations, Heat therapy' },
        { day: 'Weeks 3-4', focus: 'Isometric Strengthening', exercises: 'Static holds, Posture correction' },
        { day: 'Weeks 5-8', focus: 'Advanced Stability', exercises: 'Resistance band rows, Flexor training' },
      ];
      setPlan(generatedPlan);
    }, 1500);
  };

  return (
    <div className="main-content">
      <header className="dashboard-header">
        <div>
          <h1>AI Planner & 3D Anatomy 🧠🦴</h1>
          <p>Generate protocols and visualize anatomy in one unified workspace.</p>
        </div>
      </header>

      <div className="dashboard-content-grid" style={{ gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
        {/* Left Column: Treatment Planner */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3>Patient Diagnosis Input</h3>
            <form onSubmit={generatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <textarea 
                className="search-bar" 
                style={{ width: '100%', height: '100px', resize: 'none', borderRadius: '12px', padding: '16px' }}
                placeholder="e.g., 24yo male, Post-Op ACL Reconstruction (Right Knee), Week 1..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
              <button type="submit" className="glass-button" style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px' }}>
                <Sparkles size={18} /> {isGenerating ? 'Analyzing...' : 'Generate AI Protocol'}
              </button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '24px', minHeight: '300px' }}>
            <h3>Generated Protocol</h3>
            {isGenerating ? (
              <div style={{ marginTop: '30px', textAlign: 'center', color: 'var(--primary)' }}>
                <Clock size={32} style={{ animation: 'spin 2s linear infinite', margin: '0 auto 10px' }} />
                <p>Scanning thousands of protocols...</p>
              </div>
            ) : plan ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {plan.map((phase, idx) => (
                  <div key={idx} style={{ background: 'var(--glass-bg)', padding: '12px', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                    <h4 style={{ color: 'var(--primary)', margin: '0 0 4px 0', fontSize: '0.95rem' }}>{phase.day}</h4>
                    <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '0.9rem' }}>Focus: {phase.focus}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Exercises: {phase.exercises}</p>
                  </div>
                ))}
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <button className="glass-button" style={{ flex: 1, background: 'var(--accent)', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '0.85rem' }}>
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button className="glass-button" style={{ flex: 1, background: 'var(--glass-bg)', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '0.85rem' }}>
                    <FileSignature size={16} /> Edit
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', minHeight: '150px' }}>
                <p>Enter diagnosis to see the AI-generated plan.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 3D Anatomy Viewer (Sidebar + Canvas) */}
        <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
          
          {/* Anatomy Sidebar */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '220px' }}>
            <h3>Systems</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="glass-button" style={{ background: 'var(--primary)', textAlign: 'left', padding: '12px' }}>Muscular System</button>
              <button className="glass-button" style={{ background: 'var(--glass-bg)', textAlign: 'left', padding: '12px', color: 'var(--text-muted)' }}>Skeletal System</button>
              <button className="glass-button" style={{ background: 'var(--glass-bg)', textAlign: 'left', padding: '12px', color: 'var(--text-muted)' }}>Nervous System</button>
            </div>

            <h3 style={{ marginTop: '20px' }}>Regions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Shoulder Joint', 'Lumbar Spine', 'Knee Joint', 'Cervical Spine'].map(part => (
                <div 
                  key={part} 
                  style={{ 
                    padding: '10px', 
                    cursor: 'pointer', 
                    borderRadius: '8px',
                    background: selectedPart === part ? 'rgba(13, 148, 136, 0.1)' : 'transparent',
                    color: selectedPart === part ? 'var(--primary)' : 'var(--text-main)',
                    border: selectedPart === part ? '1px solid var(--primary)' : '1px solid transparent',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setSelectedPart(part)}
                >
                  {part}
                </div>
              ))}
            </div>
          </div>

          {/* Anatomy Canvas */}
          <div className="glass-panel" style={{ padding: '0', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-sidebar)' }}>
              <h3 style={{ margin: 0 }}>{selectedPart} 3D View</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="glass-button" style={{ padding: '6px', background: 'var(--glass-bg)', color: 'var(--text-main)' }}><Rotate3D size={16} /></button>
                <button className="glass-button" style={{ padding: '6px', background: 'var(--glass-bg)', color: 'var(--text-main)' }}><ZoomIn size={16} /></button>
                <button className="glass-button" style={{ padding: '6px', background: 'var(--glass-bg)', color: 'var(--text-main)' }}><Layers size={16} /></button>
              </div>
            </div>
            
            <div style={{ flex: 1, background: '#020617', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', minHeight: '450px' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bone size={48} style={{ opacity: 0.2, margin: '0 auto 20px' }} />
                <p>Interactive 3D WebGL Canvas</p>
              </div>
              
              <div style={{ position: 'absolute', bottom: '20px', right: '20px', left: '20px', background: 'rgba(255,255,255,0.95)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <Info size={16} color="var(--primary)" />
                  <h4 style={{ margin: 0, color: 'var(--text-main)' }}>Clinical Details</h4>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                  {selectedPart === 'Shoulder Joint' && 'Shoulder (Kandha) ek ball-and-socket joint hai. Yahan aam taur par Rotator Cuff tear, Frozen Shoulder (Kandha jaam hona), aur Dislocation jaisi dikkatien aati hain.'}
                  {selectedPart === 'Lumbar Spine' && 'Lumbar Spine (Kamar) mein 5 haddiyan hoti hain (L1-L5). Yahan Slip Disc, Sciatica aur Nas dabne jaisi samasyayein aam hain.'}
                  {selectedPart === 'Knee Joint' && 'Knee (Ghutna) ek hinge joint hai. Yahan ligament (ACL/PCL) tutne, Meniscus ghisne, ya Osteoarthritis (Ghutne ghisna) ki dikkat aati hai.'}
                  {selectedPart === 'Cervical Spine' && 'Cervical Spine (Gardan) mein 7 haddiyan hoti hain. Yahan Cervical Spondylosis aur gardan ki nas dabne (Radiculopathy) jaisi dikkat aati hai.'}
                  {selectedPart === 'Full Body' && 'Upar diye gaye options mein se koi hissa select kijiye taaki aap uski 3D anatomy aur aam bimariyon (Pathology) ko samajh sakein.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreatmentPlanner;
