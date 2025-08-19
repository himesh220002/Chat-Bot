//components/chat/ChatApp.js
import React, { useState, useEffect } from 'react';
import nhost from './nhost';
import AuthForm from './components/AuthForm.js';
import Chat from './components/chat/Chat.jsx';  

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const session = nhost.auth.getSession();
    if (session) setUser(session.user);

    return nhost.auth.onAuthStateChanged((_event, session) => {
      if (session) setUser(session.user);
      else setUser(null);
    });
  }, []);

  if (!user) {
    return <AuthForm onAuthSuccess={setUser} />;
  }

  return (
    <div>
      <h1>Welcome to Chat</h1>
      <Chat user={user} />
    </div>
  );
}

export default App;
