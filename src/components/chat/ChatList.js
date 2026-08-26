import React, { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, LogOut, Loader2, MessageSquareText } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:4000/api";

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
    <div className="flex flex-col h-full bg-zinc-50">
      <div className="p-4">
        <button
          onClick={createChat}
          disabled={creating}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {creating ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus size={16} />}
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 scrollbar-hide">
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin text-zinc-400 h-5 w-5" />
          </div>
        ) : chats.length === 0 ? (
          <p className="text-zinc-500 text-center text-sm mt-4">No chats yet.</p>
        ) : (
          chats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => onSelectChat(chat._id)}
              className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                currentChatId === chat._id
                  ? "bg-zinc-200 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquareText size={16} className={currentChatId === chat._id ? "text-zinc-900" : "text-zinc-400 group-hover:text-zinc-600"} />
                <span className="truncate text-sm font-medium">
                  {chat.title}
                </span>
              </div>
              <button
                onClick={(e) => deleteChat(chat._id, e)}
                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 p-1 rounded transition-all"
                title="Delete Chat"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-zinc-200 bg-zinc-50 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-700 font-bold text-xs uppercase border border-zinc-300">
              {user?.email?.[0]}
            </div>
            <span className="text-sm font-medium text-zinc-700 truncate">{user?.email}</span>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatList;
