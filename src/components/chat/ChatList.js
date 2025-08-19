// src/components/ChatList.js
import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_CHATS, CREATE_CHAT } from '../../graphql/chat.js';
import nhost from '../../nhost.js';
import { LogOut, DiamondPlus, MessageCircleCode } from 'lucide-react';

export default function ChatList({ onSelectChat, user }) {
  const { data, loading, error, refetch } = useQuery(GET_CHATS);
  const [createChat, { loading: creatingChat, error: createError }] = useMutation(CREATE_CHAT);

  if (loading) return <p>Loading chats...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const handleCreateChat = async () => {
    try {
      const res = await createChat({ variables: { user_id: String(user.id) } });
      if (res.data?.insert_chats?.returning.length > 0) {
        const newChat = res.data.insert_chats.returning[0];
        onSelectChat(newChat.id);
        await refetch();
      }
    } catch (err) {
      console.error('Error creating chat:', err);
    }
  };

  const handleLogout = async () => {
    await nhost.auth.signOut();
  };

  const chats = data?.chats || [];

  return (
    <div className="flex flex-col h-full w-full max-w-full">
      {/* Top Section: Create button + Chat list */}
      <div className="flex-grow overflow-y-auto">
        <button
          onClick={handleCreateChat}
          disabled={creatingChat}
          className={`mb-6 w-full text-sm sm:text-base rounded-md py-2 font-semibold transition-colors shadow-md ${
            creatingChat
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-gray-900 hover:bg-blue-700 cursor-pointer'
          } text-white`}
        >
          {creatingChat ? 'Creating...' : (
            <div className="flex gap-3 items-center justify-center">
              <DiamondPlus /> New Chat
            </div>
          )}
        </button>

        {createError && (
          <p className="text-red-600 mb-2">
            Failed to create chat: {createError.message}
          </p>
        )}

        <ul className="space-y-2 overflow-y-auto max-h-[65vh] scrollbar-hide pr-1">
          {chats.map((chat) => (
            <li
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className="cursor-pointer bg-cyan-900 hover:bg-cyan-700 rounded-md p-2 text-xs sm:text-sm md:text-base text-white transition"
            >
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <MessageCircleCode /> {chat.title ? chat.title : chat.id.slice(0, 8)}
                </div>
                <div className="ml-2 text-[10px] opacity-70">
                  {new Date(chat.created_at).toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom Section: Logout (always pinned bottom) */}
      <div className="pt-4 border-t border-gray-600 mt-4">
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-300 mb-2">
          <span>Signed in as</span>
          <span className="font-medium text-gray-100 truncate max-w-[120px]">
            {user.email}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full p-2 text-white hover:text-red-600 bg-gray-600 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
