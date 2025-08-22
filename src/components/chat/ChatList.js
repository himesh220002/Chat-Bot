// src/components/ChatList.js
import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_CHATS, CREATE_CHAT, DELETE_CHAT } from "../../graphql/chat.js";
import nhost from "../../nhost.js";
import { LogOut, DiamondPlus, MessageCircleCode, Trash, CircleX } from "lucide-react";
export default function ChatList({ onSelectChat, user, currentChatId }) {
  const { data, loading, error, refetch } = useQuery(GET_CHATS);
  const [createChat, { loading: creatingChat, error: createError }] =
    useMutation(CREATE_CHAT);
  const [deleteChat] = useMutation(DELETE_CHAT);

  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (loading) return <p>Loading chats...</p>;
  if (error) return <p>Error: {error.message}</p>;

  // ✅ Create Chat
  const handleCreateChat = async () => {
    try {
      const res = await createChat({ variables: { user_id: String(user?.id) } });
      if (res.data?.insert_chats?.returning.length > 0) {
        const newChat = res.data.insert_chats.returning[0];
        onSelectChat(newChat.id);
        await refetch();
      }
    } catch (err) {
      console.error("Error creating chat:", err);
    }
  };

  // Delete Selected Chats
  const handleDeleteSelected = async () => {
    if (selectedChats.length === 0) return;

    try {
      await Promise.all(
        selectedChats.map((chatId) =>
          deleteChat({ variables: { id: chatId } })
        )
      );

      if (selectedChats.includes(currentChatId)) {
        const remainingChats = data?.chats?.filter(
          (c) => !selectedChats.includes(c.id)
        ) || [];

        if (remainingChats.length > 0) {
          onSelectChat(remainingChats[0].id);
        } else {
          onSelectChat(null); // no chats left
        }
      }

      setSelectedChats([]);
      setDeleteMode(false);
      setConfirmDelete(false);
      await refetch();
    } catch (err) {
      console.error("Error deleting chats:", err);
    }
  };

  const handleLogout = async () => {
    await nhost.auth.signOut();
  };

  const chats = data?.chats || [];

  return (
    <div className="flex flex-col h-full w-full max-w-full">
      {/* Top Section */}
      <div className="flex-grow overflow-y-auto">
        {/* Create Chat Button */}
        <button
          onClick={handleCreateChat}
          disabled={creatingChat}
          className={`mb-4 w-full text-sm sm:text-base rounded-md py-2 font-semibold transition-colors shadow-md ${creatingChat
            ? "bg-blue-300 cursor-not-allowed"
            : "bg-gray-900 hover:bg-blue-700 cursor-pointer"
            } text-white`}
        >
          {creatingChat ? "Creating..." : (
            <div className="flex gap-3 items-center justify-center">
              <DiamondPlus /> New Chat
            </div>
          )}
        </button>


        <div className="flex gap-5 justify-end">
          {/* Toggle Delete Mode */}
          <button
            onClick={() => {
              if (deleteMode) {
                // cancel delete directly
                setSelectedChats([]);
                setDeleteMode(false);
                setConfirmDelete(false);
              } else {
                setDeleteMode(true);
              }
            }}
            className="my-2 px-2 py-1 rounded-md text-gray-200 bg-gray-600 hover:bg-gray-700"
          >
            {deleteMode ? "Cancel Delete" : "Action"}
          </button>

          {/* Confirm Delete */}
          {deleteMode && selectedChats.length > 0 && (
            <div className="flex gap-2 my-2">
              <button
                onClick={() => setConfirmDelete((prev) => !prev)}
                className="px-3 py-1 bg-red-600 text-white rounded-md"
              >
                Delete
              </button>
              {confirmDelete && (
                <div className="absolute  mt-0 bg-gray-700 text-white rounded-md shadow-lg p-2 flex gap-2">
                  <button
                    onClick={handleDeleteSelected}
                    className="px-3 py-1 bg-red-500 hover:bg-red-700 rounded-md"
                  >
                    <Trash />
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDelete(false)
                      setSelectedChats([]);
                      setDeleteMode(false);
                    }}
                    className="px-3 py-1 bg-gray-500 hover:bg-gray-600 rounded-md"
                  >
                    <CircleX />
                  </button>
                </div>
              )}

              {/* <button
                onClick={() => {
                  setSelectedChats([]);
                  setDeleteMode(false);
                }}
                className="px-3 py-1 bg-gray-500 text-white rounded-md"
              >
                Cancel
              </button> */}
            </div>
          )}
        </div>

        {createError && (
          <p className="text-red-600 mb-2">
            Failed to create chat: {createError.message}
          </p>
        )}

        {/* Chat List */}
        <ul className="space-y-2 overflow-y-auto max-h-[65vh] scrollbar-hide pr-1">
          {chats.map((chat) => (
            <li
              key={chat.id}
              onClick={() => !deleteMode && onSelectChat(chat.id)}
              className="flex justify-between items-center cursor-pointer bg-cyan-900 hover:bg-cyan-700 rounded-md p-2 text-xs sm:text-sm md:text-base text-white transition"
            >
              <div className="flex gap-2 items-center">
                <MessageCircleCode />{" "}
                {chat.title ? chat.title : chat.id.slice(0, 8)}
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] opacity-70">
                  {new Date(chat.created_at).toLocaleString()}
                </span>
                {deleteMode && (
                  <input
                    type="checkbox"
                    checked={selectedChats.includes(chat.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedChats((prev) => [...prev, chat.id]);
                      } else {
                        setSelectedChats((prev) =>
                          prev.filter((id) => id !== chat.id)
                        );
                      }
                    }}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom Section */}
      <div className="pt-4 border-t border-gray-600 mt-4">
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-300 mb-2">
          <span>Signed in as</span>
          <span className="font-medium text-gray-100 truncate max-w-[120px]">
            {user?.email || "Guest"}
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
