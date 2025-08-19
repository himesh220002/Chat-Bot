//src/components/chat/Chatbot.jsx
import React, { useState } from 'react';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Welcome! Ask me anything.', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');

  // Append message to chat
  function addMessage(text, sender) {
    setMessages(prev => [...prev, { id: Date.now(), text, sender }]);
  }

  // Send user message and get bot reply from backend
  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message locally
    addMessage(input, 'user');

    try {
      const response = await fetch(`${API_URL}/generate-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      if (response.ok) {
        addMessage(data.reply, 'bot');
      } else {
        addMessage(`Error: ${data.error}`, 'bot');
      }
    } catch (err) {
      addMessage('Error: Failed to connect to server', 'bot');
    }

    setInput('');
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ height: 400, overflowY: 'auto', border: '1px solid #ccc', padding: 10, marginBottom: 10 }}>
        {messages.map(({ id, text, sender }) => (
          <div key={id} style={{ margin: '10px 0', textAlign: sender === 'user' ? 'right' : 'left' }}>
            <div style={{
              display: 'inline-block',
              padding: '8px 12px',
              borderRadius: 15,
              backgroundColor: sender === 'user' ? '#007bff' : '#e5e5ea',
              color: sender === 'user' ? 'white' : 'black',
              maxWidth: '80%',
              wordBreak: 'break-word',
            }}>
              {text}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} style={{ display: 'flex' }}>
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ flexGrow: 1, padding: '10px', fontSize: '1rem' }}
        />
        <button type="submit" style={{ padding: '10px 20px', fontSize: '1rem' }}>Send</button>
      </form>
    </div>
  );
}
