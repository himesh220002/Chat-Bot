// src/App.js
import React, { useState, useEffect } from 'react';
import nhost from './nhost.js';
import AuthForm from './components/AuthForm.js';
import ChatList from './components/chat/ChatList.js';
import ChatWindow from './components/chat/ChatWindow.js';
import { SquareChevronRight, X } from "lucide-react";

function App() {
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const session = nhost.auth.getSession();
    if (session) setUser(session.user);
    setLoadingAuth(false);

    return nhost.auth.onAuthStateChanged((event, session) => {
      if (session) setUser(session.user);
      else setUser(null);
      setLoadingAuth(false);
    });
  }, []);

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={setUser} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* Sidebar (Chat List) */}
      <aside
        className={`fixed lg:static top-0 left-0 h-screen lg:h-auto lg:min-h-screen w-3/4 max-w-xs bg-gray-800 shadow-lg p-4 flex flex-col transform transition-transform duration-300 z-50
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Close button (only on mobile) */}
        <div className="lg:hidden flex justify-end mb-2">
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-white">
            <X size={24} />
          </button>
        </div>

        <h2 className="text-xl font-bold mb-4 text-cyan-400 flex items-center gap-2">
          ✨ ChatVerse
        </h2>

        <ChatList
          onSelectChat={(id) => {
            setSelectedChat(id);
            setIsSidebarOpen(false);
          }}
          user={user}
          currentChatId={selectedChat}
        />
      </aside>

      {/* Main chat window */}
      <main className="flex-grow bg-cyan-900 shadow-inner  p-0 md:p-3 w-full lg:w-3/4">
      
        {selectedChat ? (
          <ChatWindow chatId={selectedChat} user={user} />
        ) : (
          <div className="text-center text-gray-200 space-y-2 p-6">
            <p className="text-2xl font-semibold">💬 Welcome to ChatApp</p>
            <p className="text-lg">Select a chat from the sidebar to start</p>
            <p className="text-sm opacity-70">or create a new one!</p>
          </div>
        )}
      </main>

      {/* Floating open button (mobile only) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed top-2 md:top-4 left-2 md:left-4 bg-gray-600 text-white p-1 px-2 rounded-md shadow-lg"
        >
          <div className='flex gap-2'>Menu <SquareChevronRight size={24} /> </div>
        </button>
      )}
    </div>
  );
}

export default App;
