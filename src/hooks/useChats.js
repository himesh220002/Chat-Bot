//src/hooks/useChats.js
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { GET_CHATS, CREATE_CHAT, CHATS_SUBSCRIPTION  } from '../graphql/chat.js';

export default function useChats(userId) {
  const { data, loading, error, refetch } = useQuery(GET_CHATS);
  const [createChatMutation] = useMutation(CREATE_CHAT);

  const createChat = async () => {
    try {
      await createChatMutation({ variables: { user_id: String(userId) } });
      await refetch();
    } catch (err) {
      console.error('Create chat error', err);
    }
  };

  return {
    chats: data?.chats ?? [],
    loading,
    error,
    createChat,
  };
}

export default function useChats() {
  const { data, loading, error } = useSubscription(CHATS_SUBSCRIPTION);

  return {
    chats: data?.chats ?? [],
    loading,
    error,
  };
}