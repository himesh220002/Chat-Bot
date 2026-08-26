import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, Bot, User as UserIcon } from "lucide-react";

const API_URL = "http://localhost:4000/api";

const ChatWindow = ({ chatId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const userMessageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    const optimisticUserMsg = {
      _id: Date.now().toString(),
      message: userMessageContent,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: userMessageContent })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          const filtered = prev.filter(m => m._id !== optimisticUserMsg._id);
          return [...filtered, data.userMessage, data.botMessage];
        });
      } else {
         setMessages((prev) => prev.filter(m => m._id !== optimisticUserMsg._id));
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => prev.filter(m => m._id !== optimisticUserMsg._id));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-zinc-400 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-200 bg-white flex items-center sticky top-0 z-10">
        <div className="flex flex-col">
          <h3 className="font-semibold text-zinc-900 text-lg tracking-tight flex items-center gap-2">
            AI Assistant
          </h3>
          <p className="text-xs text-zinc-500 font-medium">Powered by NVIDIA Llama 3.1 70B</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
             <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 border border-zinc-200">
               <Bot size={32} />
             </div>
             <p className="text-zinc-500 text-sm">Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg._id || index} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in-up`}>
                <div className={`flex max-w-[85%] lg:max-w-[75%] ${isUser ? "flex-row-reverse" : "flex-row"} gap-3 items-end`}>
                  
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${
                    isUser ? "bg-zinc-100 border-zinc-200 text-zinc-600" : "bg-zinc-900 border-zinc-900 text-white"
                  }`}>
                    {isUser ? <UserIcon size={16} /> : <Bot size={16} />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`px-5 py-3.5 rounded-2xl ${
                    isUser 
                      ? "bg-zinc-100 text-zinc-900 rounded-br-sm border border-zinc-200" 
                      : "bg-white text-zinc-800 rounded-bl-sm border border-zinc-200 shadow-sm"
                  } whitespace-pre-wrap leading-relaxed text-[15px]`}>
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {sending && (
          <div className="flex justify-start animate-pulse">
             <div className="flex gap-3 items-end">
               <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-900 text-white flex items-center justify-center">
                 <Bot size={16} />
               </div>
               <div className="px-5 py-3.5 rounded-2xl bg-white text-zinc-800 rounded-bl-sm border border-zinc-200 shadow-sm flex gap-1 items-center h-[52px]">
                 <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"></span>
                 <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                 <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-zinc-200">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="relative flex items-end bg-zinc-50 border border-zinc-300 rounded-2xl focus-within:ring-2 focus-within:ring-zinc-900 focus-within:border-zinc-900 transition-all shadow-sm">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Message AI Assistant..."
              className="w-full bg-transparent border-0 text-zinc-900 rounded-2xl pl-4 pr-12 py-3.5 focus:ring-0 resize-none max-h-32 min-h-[52px] scrollbar-hide text-[15px]"
              disabled={sending}
              rows={1}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="absolute right-2 bottom-2 p-1.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors flex items-center justify-center h-8 w-8"
            >
              <Send size={16} className={sending ? "opacity-0" : "opacity-100 ml-0.5"} />
              {sending && <Loader2 size={16} className="absolute inset-0 m-auto animate-spin" />}
            </button>
          </form>
          <p className="text-center text-xs text-zinc-400 mt-2">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
