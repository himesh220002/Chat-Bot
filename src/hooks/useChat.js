//hooks/useChat.js
import { useSubscription, useMutation } from '@apollo/client';
import { MESSAGES_SUBSCRIPTION, CREATE_MESSAGE } from '../graphql/chat.js';

export default function useChat(chatId, userId) {
  const { data, loading, error } = useSubscription(MESSAGES_SUBSCRIPTION, {
    variables: { chat_id: chatId },
    skip: !chatId, // skip subscription if no chat is selected
  });

  const [createMessageMutation] = useMutation(CREATE_MESSAGE);

  const addMessage = async (message , senderId) => {
    if (!chatId || !senderId) {
      console.error('chatId or senderId missing for adding message');
      return;
    }
    console.log("Inserting message:", {
  chat_id: String(chatId),
  user_id: String(senderId),
  message,
});
    try {
      await createMessageMutation({
        variables: {
          chat_id: String(chatId),
          user_id: String(senderId),
          message,
        },
      });
    } catch (err) {
      console.error('Add message failed', err);
    }
  };

  return {
    messages: data?.messages ?? [],
    loading,
    error,
    addMessage,
  };
}
