import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();

// Define allowed origins for CORS
const allowedOrigins = [
  'https://chat-bot-lake-chi.vercel.app',
  'https://chat-bot-cypher.netlify.app',
  'http://localhost:3000' // for local development/testing
];

// Configure CORS middleware with dynamic origin checking
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('OpenAI Key:', process.env.OPENAI_API_KEY ? 'FOUND' : 'MISSING');

app.get('/', (req, res) => {
  res.send('Backend API is running 🚀');
});

// AI reply route
app.post('/generate-reply', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
    });

    const botReply = completion.choices[0].message.content;
    res.json({ reply: botReply });
  } catch (error) {
    if (error.code === 'insufficient_quota' || error.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    } else {
      console.error('Error during OpenAI API call:', error);
      res.status(500).json({ error: 'AI reply generation failed' });
    }
  }
});

app.post('/generate-title', async (req, res) => {
  const { chatId, firstMessage } = req.body;

  if (!chatId || !firstMessage) {
    return res.status(400).json({ error: 'chatId and firstMessage are required' });
  }

  try {
    // Generate a title
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Generate a short, descriptive title for a chat (max 5 words)." },
        { role: "user", content: firstMessage },
      ],
    });

    const title = completion.choices[0].message.content.trim();

    // Save the title in Hasura (GraphQL mutation)
    const mutation = `
      mutation UpdateChatTitle($chatId: uuid!, $title: String!) {
        update_chats_by_pk(pk_columns: { id: $chatId }, _set: { title: $title }) {
          id
          title
        }
      }
    `;

    const response = await fetch(process.env.HASURA_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { chatId, title },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error(result.errors);
      return res.status(500).json({ error: 'Failed to update chat title' });
    }

    res.json({ chatId, title });
  } catch (error) {
    console.error('Error generating chat title:', error);
    res.status(500).json({ error: 'Chat title generation failed' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const port = process.env.BACKEND_PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
