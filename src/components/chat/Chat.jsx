//src/components/chat.jsx
import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';

const SEND_MESSAGE = gql`
  mutation SendMessage($message: String!, $user_id: uuid!) {
    insert_chats(objects: { message: $message, user_id: $user_id }) {
      returning {
        id
        message
        user_id
      }
    }
  }
`;

function Chat(user) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const userId = user?.id;
   

  const [sendMessage, { loading, error }] = useMutation(SEND_MESSAGE, {
    onCompleted: (data) => {
      const newMessage = data.insert_chats.returning[0];
      setMessages((prev) => [...prev, newMessage]);
      setInput('');
      
      fetchBotReply(newMessage.message);
    },
  });

  // New function to call backend API and add bot reply to messages
  const fetchBotReply = async (userMessage) => {
    try {
      const response = await fetch('/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await response.json();
      const botMessage = { id: Date.now(), message: data.reply, user_id: 'bot' };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Error fetching bot reply:', err);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage({ variables: { message: input, user_id: userId } });
  };

  return (
    <div>
      <div style={{ border: '1px solid #ccc', padding: '10px', height: '300px', overflowY: 'auto' }}>
        {messages.map((msg) => (
          <div key={msg.id}>
            <b>{msg.user_id === 'bot' ? 'Bot' : msg.user_id}</b>: {msg.message}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message"
      />
      <button onClick={handleSend} disabled={loading}>
        Send
      </button>
      {error && <p style={{ color: 'red' }}>Error sending message.</p>}
    </div>
  );
}

export default Chat;
