import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Import Models
import User from './src/models/User.js';
import Chat from './src/models/Chat.js';
import Message from './src/models/Message.js';

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://chat-bot-cypher.netlify.app' // Added the main URL as well just in case
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json());

let activeDbEcosystem = 'disconnected';
let dbStatuses = { global: 'checking', local: 'checking' };

const pingDatabases = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  const LOCAL_MONGODB_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://localhost:27017/chatbot';

  if (MONGODB_URI) {
    try {
      const conn = await mongoose.createConnection(MONGODB_URI).asPromise();
      await conn.close();
      dbStatuses.global = 'online';
    } catch (e) {
      dbStatuses.global = 'offline';
    }
  } else {
    dbStatuses.global = 'offline';
  }

  try {
    const conn = await mongoose.createConnection(LOCAL_MONGODB_URI).asPromise();
    await conn.close();
    dbStatuses.local = 'online';
  } catch (e) {
    dbStatuses.local = 'offline';
  }
};

// Initial ping
pingDatabases();
setInterval(pingDatabases, 15000); // Check every 15 seconds

// MongoDB Connection
const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  const LOCAL_MONGODB_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://localhost:27017/chatbot';

  try {
    if (MONGODB_URI) {
      console.log('Attempting to connect to global MongoDB Atlas...');
      await mongoose.connect(MONGODB_URI);
      activeDbEcosystem = 'global';
      console.log('✅ Connected to global MongoDB');
    } else {
      throw new Error('No global MONGODB_URI provided');
    }
  } catch (err) {
    console.error(`❌ Global MongoDB connection failed: ${err.message}`);
    console.log('🔌 Falling back to local MongoDB (Ghost Mode)...');
    try {
      await mongoose.connect(LOCAL_MONGODB_URI);
      activeDbEcosystem = 'local';
      console.log('✅ Connected to local MongoDB (Ghost Mode)');
    } catch (localErr) {
      activeDbEcosystem = 'disconnected';
      console.error('❌ Local MongoDB connection also failed. Please ensure MongoDB is installed and running locally:', localErr.message);
    }
  }
};
connectDB();

// NVIDIA API Integration via OpenAI SDK
const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || 'dummy_key_to_prevent_crash_during_startup',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

// Middleware for JWT Verification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_local_dev', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.get('/', (req, res) => res.send('Backend API is running 🚀'));

// --- AUTH ROUTES ---
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || 'fallback_secret_for_local_dev', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || 'fallback_secret_for_local_dev', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- CHAT ROUTES ---
app.get('/api/chats', authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.find({ user_id: req.user.userId }).sort({ createdAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

app.post('/api/chats', authenticateToken, async (req, res) => {
  try {
    const chat = new Chat({ user_id: req.user.userId, title: 'New Chat' });
    await chat.save();
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

app.delete('/api/chats/:id', authenticateToken, async (req, res) => {
  try {
    await Chat.findOneAndDelete({ _id: req.params.id, user_id: req.user.userId });
    await Message.deleteMany({ chat_id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

app.put('/api/chats/:id', authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.userId },
      { title: req.body.title },
      { new: true }
    );
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update chat' });
  }
});

// --- MESSAGE ROUTES ---
app.get('/api/chats/:id/messages', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({ chat_id: req.params.id, user_id: req.user.userId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/chats/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { content, model } = req.body;
    const chatId = req.params.id;
    console.log(`[DEBUG] Received chat request for model: ${model}`);

    // Save user message
    const userMessage = new Message({
      chat_id: chatId,
      user_id: req.user.userId,
      message: content,
      role: 'user'
    });
    await userMessage.save();

    // Generate Title if it's the first message
    const messageCount = await Message.countDocuments({ chat_id: chatId });
    if (messageCount === 1) {
      try {
        let titleCompletion;
        if (model === 'local-gguf') {
          const localOpenAI = new OpenAI({
            apiKey: 'ollama',
            baseURL: 'http://localhost:11434/v1'
          });
          titleCompletion = await localOpenAI.chat.completions.create({
            model: "qwen2.5-coder:7b",
            messages: [
              { role: "system", content: "Generate a short, descriptive title for a chat (max 5 words). Do not use quotes." },
              { role: "user", content: content },
            ],
          });
        } else {
          titleCompletion = await openai.chat.completions.create({
            model: "meta/llama-3.2-11b-vision-instruct",
            messages: [
              { role: "system", content: "Generate a short, descriptive title for a chat (max 5 words). Do not use quotes." },
              { role: "user", content: content },
            ],
          });
        }
        const title = titleCompletion.choices[0].message.content.trim();
        await Chat.findByIdAndUpdate(chatId, { title });
      } catch (err) {
        console.error('Failed to generate title', err);
      }
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send user message confirmation immediately
    res.write(`data: ${JSON.stringify({ type: 'user_message', userMessage })}\n\n`);

    // Fetch previous context
    const recentMessages = await Message.find({ chat_id: chatId }).sort({ createdAt: 1 }).limit(10);
    const messagesForAI = [
      {
        role: 'system',
        content: `You are an advanced AI assistant. You must strictly follow these formatting guidelines:
1. Code Blocks: Use Markdown fenced code blocks with the specific language identifier (e.g., \`\`\`python).
2. Structured Data: Wrap JSON, YAML, or CSV in language-specific markdown code blocks. No decorative emojis inside blocks.
3. Professional Correspondence (Emails & Letters): Use standard blocked paragraph text. Structure with Subject, Salutation, Body (left-aligned, single blank lines between paragraphs), and Sign-off.
4. Technical Documentation & Guides: Use hierarchical Markdown headers (#, ##, ###), bolding (**text**) for emphasis, inline code variables (\`variable\`), and horizontal rules (---).
5. Lyrics & Poetry: Output lyrics with clean, single line breaks between lines, and double line breaks between verses/choruses.
6. Diagrams: Use mermaid.js syntax wrapped in \`\`\`mermaid code blocks to draw flowcharts, state diagrams, and other visual graphs when requested.
7. Math & Formulas: Always use $$ ... $$ for block math equations and $ ... $ for inline math. NEVER use \\[ \\] or \\( \\).`
      },
      ...recentMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.message
      }))
    ];

    // Call AI Model
    let completion;
    try {
      if (model === 'local-gguf') {
        console.log(`[DEBUG] Routing to local LM Studio for model: ${model}`);
        const localOpenAI = new OpenAI({
          apiKey: 'ollama',
          baseURL: 'http://localhost:11434/v1' // Ollama default port
        });
        completion = await localOpenAI.chat.completions.create({
          model: "qwen2.5-coder:7b", // Ollama requires the exact model name including the tag
          messages: messagesForAI,
          stream: true,
        });
      } else {
        const targetModel = model || "meta/llama-3.2-11b-vision-instruct";
        console.log(`[DEBUG] Routing to NVIDIA API for model: ${targetModel}`);

        completion = await openai.chat.completions.create({
          model: targetModel,
          messages: messagesForAI,
          stream: true,
        });
      }

      let botReply = '';
      for await (const chunk of completion) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          botReply += delta;
          res.write(`data: ${JSON.stringify({ type: 'chunk', text: delta })}\n\n`);
        }
      }

      // Handle empty bot reply without crashing
      if (!botReply || botReply.trim() === '') {
        console.warn(`[WARNING] Empty response from model ${model}. Probably context limit.`);
        res.write(`data: ${JSON.stringify({ type: 'error_fatal' })}\n\n`);
        return res.end();
      }

      // Log snippet to terminal
      const snippet = botReply.length > 50 ? botReply.substring(0, 50).replace(/\n/g, ' ') + '...' : botReply.replace(/\n/g, ' ');
      const logModelName = model || "meta/llama-3.2-11b-vision-instruct";
      console.log(`\n🤖 [AI GENERATED] ${logModelName}: ${snippet} generated\n`);

      // Save bot message
      const botMessage = new Message({
        chat_id: chatId,
        user_id: req.user.userId,
        message: botReply,
        role: 'assistant'
      });
      await botMessage.save();

      res.write(`data: ${JSON.stringify({ type: 'done', botMessage })}\n\n`);
      res.end();

    } catch (apiError) {
      if (apiError.status === 404) {
        console.error(`[DEBUG] Model ${model} is currently unavailable on NVIDIA API (404)`);
        const botMessage = new Message({
          chat_id: chatId,
          user_id: req.user.userId,
          message: `⚠️ **Model Unavailable**\n\nThe AI model \`${model}\` is currently offline or unavailable on the NVIDIA API servers. Please try selecting a different model from the dropdown.`,
          role: 'assistant'
        });
        await botMessage.save();
        res.write(`data: ${JSON.stringify({ type: 'error', botMessage })}\n\n`);
        res.end();
      } else if (apiError.code === 'ECONNREFUSED' && model === 'local-gguf') {
        const botMessage = new Message({
          chat_id: chatId,
          user_id: req.user.userId,
          message: `⚠️ **Local Server Not Running**\n\nCould not connect to Ollama on \`http://localhost:11434\`. Please make sure Ollama is running and your model is loaded.`,
          role: 'assistant'
        });
        await botMessage.save();
        res.write(`data: ${JSON.stringify({ type: 'error', botMessage })}\n\n`);
        res.end();
      } else {
        console.error("API Error during streaming:", apiError);
        res.write(`data: ${JSON.stringify({ type: 'error_fatal' })}\n\n`);
        res.end();
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI reply generation failed' });
  }
});

app.get('/api/ollama/status', async (req, res) => {
  try {
    // The native fetch API is available in Node.js 18+
    const response = await fetch('http://localhost:11434/');
    if (response.ok) {
      return res.json({ status: 'online' });
    }
    return res.json({ status: 'offline' });
  } catch (error) {
    return res.json({ status: 'offline' });
  }
});

// Endpoint to check current DB ecosystem status
app.get('/api/ecosystem/status', (req, res) => {
  res.json({
    active: activeDbEcosystem,
    globalStatus: dbStatuses.global,
    localStatus: dbStatuses.local
  });
});

app.post('/api/ecosystem/switch', async (req, res) => {
  try {
    const { target } = req.body;
    if (target !== 'global' && target !== 'local') {
      return res.status(400).json({ error: 'Invalid target' });
    }

    if (target === activeDbEcosystem) {
      return res.json({ success: true, active: activeDbEcosystem });
    }

    const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
    const LOCAL_MONGODB_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://localhost:27017/chatbot';

    const uri = target === 'global' ? MONGODB_URI : LOCAL_MONGODB_URI;
    if (!uri) {
      return res.status(400).json({ error: `No URI configured for ${target}` });
    }

    await mongoose.disconnect();
    await mongoose.connect(uri);
    activeDbEcosystem = target;
    console.log(`✅ Manually switched to ${target} MongoDB`);

    res.json({ success: true, active: activeDbEcosystem });
  } catch (error) {
    console.error(`Failed to switch to ${req.body.target} DB:`, error);
    res.status(500).json({ error: 'Failed to switch database' });
  }
});

const port = process.env.BACKEND_PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});