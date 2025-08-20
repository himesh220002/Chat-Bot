import React, { useState, useRef, useEffect } from 'react';
import useChat from '../../hooks/useChat.js';
import { Loader } from 'lucide-react';

const BOT_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function ChatWindow({ chatId, user }) {
  const { messages: subscribedMessages, loading, error, addMessage: addMessageToDB } = useChat(chatId, user.id);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [botTyping, setBotTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesCache = useRef({});

  // Use environment variable with fallback for local dev
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  // Sync subscription messages to local state and add `sender` flag
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    if (messagesCache.current[chatId]) {
      setMessages(messagesCache.current[chatId]);
    } else if (!subscribedMessages || subscribedMessages.length === 0) {
      setMessages([{ id: 'welcome', text: 'Ask me anything...', sender: 'bot' }]);
    } else {
      const formatted = subscribedMessages.map(msg => ({
        id: msg.id,
        text: msg.message,
        sender: msg.user_id === BOT_USER_ID ? 'bot' : (msg.user_id === user.id ? 'user' : 'other'),
      }));
      messagesCache.current[chatId] = formatted;
      setMessages(formatted);
    }
  }, [chatId, subscribedMessages, user.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, botTyping]);

  // Add message locally and also send to backend DB
  async function addMessage(text, senderId) {
    const senderRole = senderId === BOT_USER_ID ? 'bot' : (senderId === user.id ? 'user' : 'other');

    setMessages(prev => {
      const newMessages = [...prev, { id: Date.now(), text, sender: senderRole }];
      messagesCache.current[chatId] = newMessages;
      return newMessages;
    });

    if (senderRole === 'user' || senderRole === 'bot') {
      await addMessageToDB(text, senderId);
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return;

    const firstMessage = input;

    await addMessage(firstMessage, user.id);

    // If this is the first real user message → generate title
    if (messages.filter(m => m.sender === 'user').length === 0) {
      try {
        await fetch(`${API_URL}/generate-title`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, firstMessage }),
        });
      } catch (err) {
        console.error('Error generating chat title:', err);
      }
    }

    // Show bot typing
    setBotTyping(true);

    try {
      const response = await fetch(`${API_URL}/generate-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: firstMessage }),
      });

      const data = await response.json();

      // Remove typing
      setBotTyping(false);
      await addMessage(data.reply, BOT_USER_ID);
    } catch (err) {
      console.error('Error fetching bot reply:', err);
      setBotTyping(false);
      await addMessage('Error: Failed to get reply from bot', BOT_USER_ID);
    }

    setInput('');
  };

  if (loading) return <div className='flex flex-col justify-center items-center gap-10'><p className="p-4 text-gray-200">Loading messages...</p> <Loader className='w-10 h-10' /></div>;
  if (error) return <p className="p-4 text-red-600">Error: {error.message}</p>;

  return (
    <div className="flex flex-col h-full max-h-[800px] p-4 border rounded-md shadow bg-white">
      <div className="overflow-y-auto flex-grow mb-4 max-h-[600px] scrollbar-hide ">
        {messages.map(({ id, text, sender }) => (
          <div
            key={id}
            className={`flex mb-2 ${sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {sender === 'bot' && (
              <div className="mr-2 text-2xl select-none" aria-label="Bot">
                🤖
              </div>
            )}
            <div
              className={`max-w-[75%] px-4 py-2 rounded-lg break-words ${sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none shadow'
                  : 'bg-gray-200 text-gray-900 rounded-bl-none'
                }`}
            >
              {text}
            </div>
            {sender === 'user' && (
              <div className="ml-2 text-2xl text-blue-600 select-none">🧑</div>
            )}
          </div>
        ))}

        {/* Bot typing */}
        {botTyping && (
          <div className="flex mb-2 justify-start">
            <div className="mr-2 text-2xl select-none">🤖</div>
            <div className="bg-gray-200 text-gray-500 italic px-4 py-2 rounded-lg rounded-tl-none max-w-[75%]">
              <span className="animate-pulse">...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="flex-grow border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-6 py-2 font-semibold transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
