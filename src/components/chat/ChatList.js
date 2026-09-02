import React, { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, LogOut, Loader2, MessageSquareText, Cpu, Hash, Shield, Zap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const ChatList = ({ onSelectChat, currentChatId }) => {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchChats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
    const handleTitleUpdate = (e) => {
      const { chatId, title } = e.detail || {};
      if (chatId && title) {
        setChats(prev => prev.map(c => c._id === chatId ? { ...c, title } : c));
      }
    };
    window.addEventListener('chat_title_updated', handleTitleUpdate);
    return () => window.removeEventListener('chat_title_updated', handleTitleUpdate);
  }, [fetchChats]);

  const createChat = async () => {
    setCreating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/chats`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const newChat = await res.json();
        setChats([newChat, ...chats]);
        onSelectChat(newChat._id);
      }
    } catch (err) {
      console.error("Failed to create chat:", err);
    } finally {
      setCreating(false);
    }
  };

  const deleteChat = async (id, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/chats/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setChats(chats.filter((c) => c._id !== id));
        if (currentChatId === id) {
          onSelectChat(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Valorant INIT button */}
      <div className="p-4 pb-3">
        <button
          onClick={createChat}
          disabled={creating}
          className="w-full bg-[#ff4655] text-[#ece8e1] valorant-header text-[13px] tracking-[0.08em] py-3 flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-[#e03a4a] transition-colors border border-[#ff6b7a]/30"
          style={{clipPath:'polygon(8px 0,100% 0,100% calc(100% - 8px), calc(100% - 8px) 100%,0 100%,0 8px)'}}
        >
          {creating ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus size={14} />}
          <span>INIT NEW LINK</span>
          <span className="ml-1 valorant-label text-[8px] opacity-70 tracking-widest hidden xl:inline">CLASS-A</span>
        </button>
        <div className="mt-3 h-[1px] bg-[#ff4655]/20" />
        <div className="mt-2.5 flex items-center justify-between valorant-label text-[9px] tracking-[0.16em] text-[#ece8e1]/45">
          <span className="flex items-center gap-1.5"><Hash size={10} className="text-[#ff4655]" /> TRANSMISSIONS • {chats.length.toString().padStart(2,'0')}</span>
          <span className="flex items-center gap-1"><Shield size={10} className="text-[#ff4655]/70" /> ENC</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 scrollbar-thin min-h-0">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border border-white/10" style={{clipPath:'polygon(5px 0,100% 0,100% calc(100% - 5px), calc(100% - 5px) 100%,0 100%,0 5px)'}} />
              <div className="absolute inset-1 border-t-[#ff4655] border-r-transparent border-2 animate-spin" style={{clipPath:'polygon(5px 0,100% 0,100% calc(100% - 5px), calc(100% - 5px) 100%,0 100%,0 5px)'}} />
            </div>
            <span className="valorant-label text-[10px] tracking-[0.14em] text-[#ece8e1]/40 animate-pulse">SCANNING MEMORY CORE...</span>
          </div>
        ) : chats.length === 0 ? (
          <div className="bg-[#0a0e13] border border-white/10 p-5 text-center" style={{clipPath:'polygon(8px 0,100% 0,100% calc(100% - 8px), calc(100% - 8px) 100%,0 100%,0 8px)'}}>
            <div className="w-10 h-10 mx-auto bg-[#1a242e] border border-[#ff4655]/20 flex items-center justify-center mb-3" style={{clipPath:'polygon(5px 0,100% 0,100% calc(100% - 5px), calc(100% - 5px) 100%,0 100%,0 5px)'}}>
              <Cpu size={16} className="text-[#ff4655]/70" />
            </div>
            <p className="valorant-header text-[11px] tracking-[0.08em] text-[#ece8e1]/70">NO ACTIVE LINKS</p>
            <p className="valorant-label text-xs text-[#ece8e1]/35 mt-1">Initialize a new holo-link.</p>
          </div>
        ) : (
          chats.map((chat, idx) => {
            const isActive = currentChatId === chat._id;
            return (
              <div
                key={chat._id}
                onClick={() => onSelectChat(chat._id)}
                className={`group relative flex items-center justify-between p-3 cursor-pointer transition-all overflow-hidden border
                  ${isActive
                    ? "bg-[#ff4655] border-[#ff4655] text-[#ece8e1] shadow-[0_8px_22px_rgba(255,70,85,0.22)]"
                    : "bg-[#0a0e13] border-white/10 hover:bg-[#1a242e] hover:border-[#ff4655]/20 text-[#ece8e1]/80"
                  }`}
                style={{clipPath:'polygon(8px 0,100% 0,100% calc(100% - 8px), calc(100% - 8px) 100%,0 100%,0 8px)'}}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#ece8e1]" />}
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                  <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 border transition-colors ${isActive ? 'bg-[#ece8e1] text-[#ff4655] border-white' : 'bg-[#1a242e] text-[#ece8e1]/50 border-white/10 group-hover:border-[#ff4655]/20 group-hover:text-[#ff4655]'}`} style={{clipPath:'polygon(4px 0,100% 0,100% calc(100% - 4px), calc(100% - 4px) 100%,0 100%,0 4px)'}}>
                    <MessageSquareText size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className={`truncate valorant-header text-[11px] tracking-[0.04em] ${isActive ? 'text-[#ece8e1]' : 'text-[#ece8e1]/80 group-hover:text-[#ece8e1]'}`}>
                      {chat.title || `LINK-${idx + 1}`}
                    </div>
                    <div className="flex items-center gap-2 valorant-label text-[9px] tracking-[0.08em] mt-0.5">
                      <span className={`${isActive ? 'text-[#ece8e1]/80' : 'text-white/25'}`}>ID:{chat._id.slice(-4).toUpperCase()}</span>
                      <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-[#ece8e1] animate-pulse' : 'bg-white/20'}`} />
                      <span className={`${isActive ? 'text-[#ece8e1]' : 'text-white/25'}`}>{isActive ? 'ACTIVE' : 'STANDBY'}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => deleteChat(chat._id, e)}
                  className={`w-7 h-7 flex items-center justify-center border transition-all ml-2 flex-shrink-0
                    ${isActive ? 'bg-black/10 border-white/20 text-white hover:bg-black/20 opacity-100' : 'opacity-0 group-hover:opacity-100 bg-[#1a242e] border-white/10 text-white/30 hover:bg-[#ff4655] hover:text-white'}`}
                  style={{clipPath:'polygon(4px 0,100% 0,100% calc(100% - 4px), calc(100% - 4px) 100%,0 100%,0 4px)'}}
                  title="Terminate Link"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Valorant Crew footer */}
      <div className="p-3 border-t border-[#ff4655]/15 bg-[#0a0e13]">
        <div className="bg-[#1a242e] border border-white/5 p-3 flex items-center justify-between" style={{clipPath:'polygon(8px 0,100% 0,100% calc(100% - 8px), calc(100% - 8px) 100%,0 100%,0 8px)'}}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-9 h-9 flex-shrink-0">
              <div className="absolute inset-0 bg-[#ff4655] flex items-center justify-center text-[#ece8e1] valorant-header text-sm" style={{clipPath:'polygon(5px 0,100% 0,100% calc(100% - 5px), calc(100% - 5px) 100%,0 100%,0 5px)'}}>
                {user?.email?.[0]?.toUpperCase() || 'C'}
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#ece8e1] rounded-full border-2 border-[#0f1923]" />
            </div>
            <div className="min-w-0">
              <div className="valorant-label text-[10px] tracking-[0.1em] text-[#ff4655]">CREW • COMMANDER</div>
              <div className="valorant-header text-sm text-[#ece8e1] truncate leading-none max-w-[150px] tracking-wide">{user?.email}</div>
              <div className="valorant-label text-[9px] text-[#ece8e1]/50 flex items-center gap-1 mt-0.5"><Zap size={8} className="text-[#ff4655]" /> CLEARANCE • ALPHA</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-8 h-8 bg-[#0f1923] border border-[#ff4655]/20 text-[#ece8e1] hover:bg-[#ff4655] hover:text-white flex items-center justify-center transition-colors"
            style={{clipPath:'polygon(4px 0,100% 0,100% calc(100% - 4px), calc(100% - 4px) 100%,0 100%,0 4px)'}}
            title="Eject & Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
        <div className="valorant-label text-[8px] tracking-[0.14em] text-white/20 text-center mt-2">BIO-SCAN • VERIFIED ▸ QUANTUM ID LOCKED</div>
      </div>
    </div>
  );
};

export default ChatList;
