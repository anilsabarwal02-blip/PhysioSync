import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Copy, Save, FileText } from 'lucide-react';

const VoiceNotes = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [savedNotes, setSavedNotes] = useState([]);
  const recognitionRef = useRef(null);

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
          if (event.results[i].isFinal) {
            currentTranscript += event.results[i][0].transcript + ' ';
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
          alert('Microphone access was denied. Please allow microphone access in your browser settings.');
        }
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsRecording(!isRecording);
  };

  const handleSave = () => {
    if (!transcript.trim()) return;
    setSavedNotes([{ id: Date.now(), text: transcript, date: new Date().toLocaleString() }, ...savedNotes]);
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="glass-button" style={{ background: 'var(--glass-bg)', display: 'flex', gap: '8px', alignItems: 'center' }} onClick={copyToClipboard}>
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
