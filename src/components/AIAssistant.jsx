import React, { useState, useEffect } from 'react';
import { Send, Bot, User, Sparkles, KeyRound, Check, X } from 'lucide-react';

const AIAssistant = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Namaste! Main aapka Asli AI Assistant hoon (Groq Powered). Aap mujhse physiotherapy, health ya kisi bhi bimari ke baare mein sawal pooch sakte hain. Kaise madad karun aapki?' }
  ]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('groq_api_key') || '');
  const [keyInput, setKeyInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const saveApiKey = () => {
    localStorage.setItem('groq_api_key', keyInput);
    setApiKey(keyInput);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !apiKey) return;

    const userText = input;
    const newUserMsg = { id: Date.now(), sender: 'user', text: userText };
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are a highly intelligent and helpful Indian physiotherapist and doctor assistant. Answer in Hinglish or English based on the user prompt. Be concise and professional.' },
            { role: 'user', content: userText }
          ]
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'API Error');
      }

      const aiResponse = { 
        id: Date.now() + 1, 
        sender: 'ai', 
        text: data.choices[0].message.content
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: '⚠️ Error: Groq API connect nahi ho paya. Kripya check karein ki aapki API Key sahi hai ya nahi. (Error: ' + error.message + ')' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`ai-assistant-drawer ${isOpen ? 'open' : ''}`}>
      <header style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-sidebar)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            AI Assistant <Sparkles size={20} color="var(--secondary)" />
          </h2>
        </div>
        <button onClick={onClose} style={{ padding: '8px', background: 'var(--glass-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} />
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-main)' }}>
        
        {!apiKey && (
          <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.1)', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <KeyRound size={24} color="var(--danger)" />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 5px 0', color: 'var(--danger)' }}>Groq API Key Required</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>AI ko active karne ke liye apni Groq API key daalein. Yeh browser mein securely save hogi.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="password" 
                value={keyInput} 
                onChange={(e) => setKeyInput(e.target.value)} 
                placeholder="gsk_..." 
                className="search-bar"
                style={{ padding: '8px 12px' }}
              />
              <button onClick={saveApiKey} className="glass-button" style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px' }}>Save Key</button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ 
              display: 'flex', 
              gap: '16px',
              flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' 
            }}>
              <div className="avatar" style={{ 
                background: msg.sender === 'user' ? 'var(--primary)' : 'var(--secondary)',
                width: '36px', height: '36px'
              }}>
                {msg.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div style={{ 
                background: msg.sender === 'user' ? 'var(--primary)' : 'var(--glass-bg)',
                padding: '12px 16px',
                borderRadius: '16px',
                borderTopRightRadius: msg.sender === 'user' ? '4px' : '16px',
                borderTopLeftRadius: msg.sender === 'ai' ? '4px' : '16px',
                maxWidth: '75%',
                lineHeight: '1.5'
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ display: 'flex', gap: '16px', flexDirection: 'row' }}>
              <div className="avatar" style={{ background: 'var(--secondary)', width: '36px', height: '36px' }}>
                <Bot size={18} />
              </div>
              <div style={{ background: 'var(--glass-bg)', padding: '12px 16px', borderRadius: '16px', borderTopLeftRadius: '4px', fontStyle: 'italic', opacity: 0.7 }}>
                AI is thinking...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', opacity: apiKey ? 1 : 0.5 }}>
          <input 
            type="text" 
            className="search-bar" 
            style={{ width: '100%', borderRadius: '8px' }} 
            placeholder={apiKey ? "Type your query here..." : "Pehle upar API key save karein..."} 
            value={input}
            disabled={!apiKey}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', padding: '0', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
