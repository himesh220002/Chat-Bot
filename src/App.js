import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import AuthForm from './components/AuthForm';
import ChatList from './components/chat/ChatList';
import ChatWindow from './components/chat/ChatWindow';
import { Menu, X } from "lucide-react";

function App() {
  const { user, loading } = useAuth();
  const [selectedChat, setSelectedChat] = useState(() => localStorage.getItem("selectedChatId") || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Update localStorage when chat changes
  React.useEffect(() => {
    if (selectedChat) {
      localStorage.setItem("selectedChatId", selectedChat);
    } else {
      localStorage.removeItem("selectedChatId");
    }
  }, [selectedChat]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="flex h-screen bg-white text-zinc-900 font-sans overflow-hidden">

      {/* Sidebar (Chat List) */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full w-72 bg-zinc-50 border-r border-zinc-200 flex flex-col transform transition-transform duration-300 ease-in-out z-40
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-5 flex items-center justify-between border-b border-zinc-200">
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">&gt;_</span>
            inputchat
          </h2>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 text-zinc-500 hover:text-zinc-900 rounded-md hover:bg-zinc-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <ChatList
          onSelectChat={(id) => {
            setSelectedChat(id);
            setIsSidebarOpen(false);
          }}
          currentChatId={selectedChat}
        />
      </aside>

      {/* Main chat window */}
      <main className="flex-1 flex flex-col relative h-full">
        {/* Mobile Header */}
        {!isSidebarOpen && (
          <div className="lg:hidden flex items-center p-3 border-b border-zinc-200 bg-white sticky top-0 z-30">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <span className="ml-2 font-medium">Menu</span>
          </div>
        )}

        {selectedChat ? (
          <ChatWindow chatId={selectedChat} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white animate-fade-in">
            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-zinc-200 text-zinc-400">
              <Menu size={32} />
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-2">How can I help you today?</h3>
            <p className="text-zinc-500 max-w-sm">Select an existing conversation from the sidebar or start a new chat to begin.</p>
          </div>
        )}
      </main>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
