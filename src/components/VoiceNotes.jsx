import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Copy, Save, FileText } from 'lucide-react';
import { api, getBackendStatus } from '../utils/api';

const VoiceNotes = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [savedNotes, setSavedNotes] = useState([]);
  const lastProcessedIndexRef = useRef(-1);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await api.getNotes();
        setSavedNotes(data);
      } catch (err) {
        if (!getBackendStatus()) {
          const saved = localStorage.getItem('emr_notes_list');
          if (saved) {
            setSavedNotes(JSON.parse(saved));
          }
        }
      }
    };
    fetchNotes();
  }, []);
  const [micBlocked, setMicBlocked] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const recognitionRef = useRef(null);
  const simulationIntervalRef = useRef(null);

  useEffect(() => {
    // Initialize SpeechRecognition if available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal && i > lastProcessedIndexRef.current) {
            currentTranscript += event.results[i][0].transcript + ' ';
            lastProcessedIndexRef.current = i;
          }
        }
        if (currentTranscript) {
          setTranscript(prev => prev + currentTranscript);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setMicBlocked(true);
        }
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  const startSimulation = () => {
    setMicBlocked(false);
    setIsSimulating(true);
    setIsRecording(true);
    setTranscript('');
    
    const sampleText = "Patient complains of persistent right knee pain, particularly during deep flexion. On physical examination, there is mild joint effusion and tenderness along the medial joint line. Active range of motion is limited to 95 degrees. I recommend starting physical therapy twice a week, focusing on quadriceps strengthening and hamstring flexibility. Plan approved.";
    
    let index = 0;
    const words = sampleText.split(' ');
    
    simulationIntervalRef.current = setInterval(() => {
      if (index < words.length) {
        setTranscript(prev => prev + (prev ? ' ' : '') + words[index]);
        index++;
      } else {
        clearInterval(simulationIntervalRef.current);
        setIsRecording(false);
        setIsSimulating(false);
      }
    }, 350);
  };

  const stopSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }
    setIsRecording(false);
    setIsSimulating(false);
  };

  const toggleRecording = () => {
    if (isSimulating) {
      stopSimulation();
      return;
    }

    if (!recognitionRef.current) {
      setMicBlocked(true);
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setMicBlocked(false);
      try {
        lastProcessedIndexRef.current = -1;
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
        setIsRecording(false);
      }
    }
  };

  const handleSave = async () => {
    if (!transcript.trim()) return;
    const noteData = {
      text: transcript,
      date: new Date().toLocaleString()
    };
    try {
      const data = await api.saveNote(noteData);
      setSavedNotes(data);
    } catch (err) {
      if (!getBackendStatus()) {
        const localNewNote = {
          id: Date.now(),
          ...noteData
        };
        const updatedNotes = [localNewNote, ...savedNotes];
        setSavedNotes(updatedNotes);
        localStorage.setItem('emr_notes_list', JSON.stringify(updatedNotes));
      }
    }
    setTranscript('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcript);
  };

  return (
    <div className="main-content">
      <header className="dashboard-header">
        <div>
          <h1>Voice-to-Text EMR Notes 🎙️</h1>
          <p>Dictate your clinical notes hands-free and save them instantly.</p>
        </div>
      </header>

      <div className="dashboard-content-grid">
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h3>New Note Dictation</h3>
            <button 
              className="glass-button" 
              onClick={toggleRecording}
              style={{ 
                background: isRecording ? 'rgba(239, 68, 68, 0.2)' : 'var(--primary)',
                color: isRecording ? '#ef4444' : 'white',
                border: isRecording ? '1px solid #ef4444' : 'none',
                display: 'flex', gap: '8px', alignItems: 'center'
              }}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              {isRecording ? 'Stop Recording' : 'Start Dictation'}
            </button>
          </div>

          {micBlocked && (
            <div style={{ 
              padding: '16px', 
              background: 'rgba(239, 68, 68, 0.06)', 
              border: '1px solid rgba(239, 68, 68, 0.15)', 
              borderRadius: '12px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px' 
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.95rem' }}>Microphone Access Required</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>
                Dictation requires browser microphone access. Please allow mic permissions in your browser address bar, or click below to run a clinical voice simulation demo.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="glass-button" 
                  onClick={toggleRecording} 
                  style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'var(--primary)' }}
                >
                  Retry Mic Permission
                </button>
                <button 
                  className="glass-button" 
                  onClick={startSimulation} 
                  style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'var(--glass-bg)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
                >
                  Simulate Dictation (Demo)
                </button>
              </div>
            </div>
          )}

          <textarea 
            className="search-bar"
            style={{ 
              width: '100%', 
              height: '250px', 
              resize: 'none', 
              borderRadius: '12px',
              padding: '16px',
              fontFamily: 'inherit',
              lineHeight: '1.6'
            }}
            placeholder="Click 'Start Dictation' and begin speaking, or type your notes here..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button 
              className="glass-button" 
              style={{ 
                background: 'var(--glass-bg)', 
                color: 'var(--text-main)', 
                border: '1px solid var(--border)', 
                display: 'flex', 
                gap: '8px', 
                alignItems: 'center' 
              }} 
              onClick={copyToClipboard}
            >
              <Copy size={16} /> Copy
            </button>
            <button className="glass-button" style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={handleSave}>
              <Save size={16} /> Save to EMR
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3>Recently Saved Notes</h3>
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {savedNotes.length === 0 ? (
              <p style={{ textAlign: 'center', marginTop: '40px' }}>No notes saved yet.</p>
            ) : (
              savedNotes.map(note => (
                <div key={note.id} style={{ background: 'var(--glass-bg)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>{note.date}</span>
                    <FileText size={16} color="var(--text-muted)" />
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{note.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceNotes;
