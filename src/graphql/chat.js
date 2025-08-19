//graphql/chat.js
import { gql } from '@apollo/client';

// Fetch all chats
export const GET_CHATS = gql`
  query GetChats {
    chats(order_by: { created_at: asc }) {
      id
      created_at
      user_id
      
    }
  }
`;

// Create a new chat session
export const CREATE_CHAT = gql`
  mutation CreateChat($user_id: uuid!) {
    insert_chats(objects: { user_id: $user_id }) {
      returning {
        id
        created_at
        user_id
      }
    }
  }
`;

// Fetch messages for a given chat
export const GET_MESSAGES = gql`
  query GetMessages($chat_id: uuid!) {
    messages(where: { chat_id: { _eq: $chat_id } }, order_by: { created_at: asc }) {
      id
      chat_id
      user_id
      message
      created_at
    }
  }
`;

// Add a new message
export const CREATE_MESSAGE = gql`
  mutation CreateMessage($chat_id: uuid!, $user_id: uuid!, $message: String!) {
    insert_messages(objects: { chat_id: $chat_id, user_id: $user_id, message: $message }) {
      returning {
        id
        chat_id
        user_id
        message
        created_at
      }
    }
  }
`;

// Subscription for live messages
export const MESSAGES_SUBSCRIPTION = gql`
  subscription OnMessages($chat_id: uuid!) {
    messages(where: { chat_id: { _eq: $chat_id } }, order_by: { created_at: asc }) {
      id
      chat_id
      user_id
      message
      created_at
    }
  }
`;

