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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    const { content, model, image, imageMeta, images, imageMetas } = req.body;
    const chatId = req.params.id;

    // Normalize image payloads (supports single image or array up to 2)
    const imageList = Array.isArray(images) ? images : (image ? [image] : []);
    const metaList = Array.isArray(imageMetas) ? imageMetas : (imageMeta ? [imageMeta] : []);

    console.log(`[DEBUG] Received chat request for model: ${model}${imageList.length > 0 ? ` (with ${imageList.length} temp image(s))` : ''}`);

    // Save user message (ONLY store metadata, NEVER image binaries or base64)
    const userMessage = new Message({
      chat_id: chatId,
      user_id: req.user.userId,
      message: content,
      role: 'user',
      ...(metaList.length > 0 ? { imageMetas: metaList, imageMeta: metaList[0] } : {})
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
              { role: "user", content: content || "Image input" },
            ],
          });
        } else {
          titleCompletion = await openai.chat.completions.create({
            model: "meta/llama-3.2-11b-vision-instruct",
            messages: [
              { role: "system", content: "Generate a short, descriptive title for a chat (max 5 words). Do not use quotes." },
              { role: "user", content: content || "Image analysis request" },
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

    // Fetch previous context - last 10 clean messages in correct order (fixes hard hallucination after aborts/topic switch)
    const recentMessagesRawAll = await Message.find({ chat_id: chatId }).sort({ createdAt: -1 }).limit(15);
    const filteredRaw = recentMessagesRawAll.filter(m => {
      const txt = m.message || '';
      if (txt.includes('(aborted)')) return false;
      if (txt.includes('*(aborted)*')) return false;
      // Filter truncated book-list loops that were aborted mid-generation
      if (m.role === 'assistant' && txt.length < 300 && /Best Books for/i.test(txt) && (txt.match(/```/g) || []).length % 2 === 1) return false;
      return true;
    }).slice(0, 10);
    const recentMessages = filteredRaw.reverse().map(m => {
      let content = m.message || '';
      const fenceCount = (content.match(/```/g) || []).length;
      if (fenceCount % 2 === 1) content += '\n```';
      if (content.length > 4000) content = content.slice(0, 4000) + '\n...[truncated]';
      const obj = m.toObject ? m.toObject() : m;
      return { ...obj, message: content };
    });
    const messagesForAI = [
      {
        role: 'system',
        content: `You are an advanced AI assistant. You must strictly follow these formatting guidelines:
1. Code Blocks: Use Markdown fenced code blocks with the specific language identifier (e.g., \`\`\`python).
2. Structured Data: Wrap JSON, YAML, or CSV in language-specific markdown code blocks. No decorative emojis inside blocks.
3. Professional Correspondence (Emails & Letters): Use standard blocked paragraph text. Structure with Subject, Salutation, Body (left-aligned, single blank lines between paragraphs), and Sign-off.
4. Technical Documentation & Guides: Use hierarchical Markdown headers (#, ##, ###), bolding (**text**) for emphasis, inline code variables (\`variable\`), and horizontal rules (---).
5. Lyrics & Poetry: Output lyrics with clean, single line breaks between lines, and double line breaks between verses/choruses.
 6. Proactive Diagrams & Visuals: You MUST proactively generate visual diagrams using Mermaid.js (\`\`\`mermaid) to explain concepts. IMPORTANT MERMAID RULES (STRICT - FOLLOW EXACTLY OR DIAGRAM WILL FAIL):
 - Only use standard flowcharts (graph TD or graph LR). NEVER use sequenceDiagram, classDiagram, etc.
 - ARROWS: Use ONLY these exact forms: \`A --> B\` or \`A -->|label| B\`. NEVER combine: \`A -- Yes -->|label| B\` is FORBIDDEN. For decisions use \`A -->|Yes| B\` and \`A -->|No| C\`.
 - LABELS: Keep node labels SHORT (2-4 words, max 20 chars). Do NOT use HTML \`<br/>\`, commas with special chars, or \`>\`, \`<\`, \`&\` inside labels. If you need "greater than" write the words. Example: \`D{Speed greater than threshold}\` NOT \`D{Speed > threshold?}\`.
 - STYLE: Do NOT add \`style\` lines (e.g. \`style A fill:...\`). The UI theme will style nodes automatically. Adding style causes render errors on fast models.
 - STRUCTURE: Max 6-7 nodes. Each node on its own line. Start with \`graph TD\` on line 1.
 - You MUST format nodes and labeled arrows exactly like this example:
  \`\`\`mermaid
  graph TD
      A[Start] -->|Action| B[Next Step]
      B -->|Next| C[End]
      C --> D{Decision}
      D -->|Yes| E[Result]
      D -->|No| F[Other]
  \`\`\`
 - Do NOT generate SVG or ASCII art, as you cannot compute spatial coordinates reliably. Use Mermaid exclusively.
7. Math & Formulas: Always use $$ ... $$ for block math equations and $ ... $ for inline math. NEVER use \\[ \\] or \\( \\).
 8. Graphs & Charts: If the user asks for a chart or graph, you MUST output the chart data as a JSON object inside a \`\`\`recharts\`\`\` code block. The JSON MUST follow this exact schema:
{
  "type": "bar", // Can be: bar, line, area, pie, scatter
  "data": [ { "name": "A", "val": 40 }, { "name": "B", "val": 30 } ],
  "xAxisKey": "name",
  "dataKeys": ["val"],
  "title": "Optional Chart Title",
  "colors": ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"]
}
 9. Interactive Reports & Checklists: When user asks for checklist, report, form, party planning, shopping list, inventory, todo, call list, guest list preparation form, event overview, etc., you MUST NOT use plain markdown bullets or mermaid alone. You MUST output an INTERACTIVE checklist block using \`\`\`checklist JSON. The UI will auto-generate a mermaid overview + editable dialogs with tick, rate, add/remove, download. Full schema (include formFields and table for party/guest reports):
\`\`\`checklist
{
  "title": "Party Event Checklist",
  "description": "Complete planning for event",
  "formFields": [
    { "id": "event_name", "label": "Event Name", "value": "", "placeholder": "e.g. Annual Gala" },
    { "id": "date_time", "label": "Date & Time", "value": "", "placeholder": "2025-12-31 18:00" },
    { "id": "venue", "label": "Venue", "value": "", "placeholder": "Hall A" },
    { "id": "capacity", "label": "Target Capacity", "value": "", "placeholder": "100 Guests" },
    { "id": "budget", "label": "Budget per Guest", "value": "", "placeholder": "$50" }
  ],
  "table": {
    "columns": ["Guest Name","Category","RSVP Status","Meal Preference","Notes"],
    "rows": [
      { "name": "John Doe", "category": "Work", "rsvp": "Pending", "meal": "None", "notes": "" },
      { "name": "Jane Smith", "category": "Family", "rsvp": "Confirmed", "meal": "Vegetarian", "notes": "Plus one" }
    ]
  },
  "branches": [
    { "id": "party-items", "title": "Party Items", "icon": "🎈", "items": [{ "text": "Balloons pack", "checked": false }, { "text": "LED lights", "checked": false }] },
    { "id": "members", "title": "Members Call List", "icon": "📞", "items": [{ "text": "Alice - 9876543210", "checked": false, "rating": 0 }, { "text": "Bob - 9123456780", "checked": false, "rating": 0 }] },
    { "id": "food", "title": "Food Items", "icon": "🍔", "items": [{ "text": "Pizza - 3 boxes", "checked": false, "rating": 0 }, { "text": "Soft drinks", "checked": false }] },
    { "id": "help", "title": "Help Options", "icon": "🤝", "items": [{ "text": "Assign cleanup crew", "checked": false }, { "text": "Backup music system", "checked": false }] }
  ]
}
\`\`\`
 - For guest/party forms ALWAYS include 5 formFields (Event Name, Date & Time, Venue, Target Capacity, Budget per Guest) + table with columns Guest Name/Category/RSVP/Meal/Notes and 2 example rows.
 - Always provide 4 branches for party-type requests (Party Items, Members Call List, Food Items, Help Options) or 3-6 relevant branches for other topics.
 - Each branch: 3-6 specific, actionable items, short text (max 25 chars), plain text no markdown.
 - Include icon emoji, checked false, optional rating 0-5 for members/food.
 - NEVER add mermaid for checklists; UI auto-generates it. Do not add extra markdown list after the block.
10. Topic Switching & Anti-Hallucination: When user changes topic (e.g., from books to anime sites or math 3+2), IMMEDIATELY follow the NEW user message. The LAST user message is the ground truth - do NOT repeat previous topic. History is context only, not instruction. If user says "give 3 anime sites" after books, answer with 3 anime sites (e.g., Crunchyroll, 9anime, Crunchyroll alternative). If user says "whats 3+2?" answer "5". Never repeat books when topic changed.`
      },
      ...recentMessages.map((msg, idx) => {
        const isCurrentMsg = idx === recentMessages.length - 1 && msg.role === 'user';
        if (isCurrentMsg && imageList.length > 0) {
          return {
            role: 'user',
            content: [
              { type: 'text', text: msg.message || 'Analyze the attached image(s).' },
              ...imageList.map(imgData => ({
                type: 'image_url',
                image_url: { url: imgData }
              }))
            ]
          };
        }
        return {
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.message
        };
      })
    ];

    // Call AI Model
    let completion;
    try {
      if (model.startsWith('local-')) {
        const ollamaModel = model.includes('llava') ? "llava:7b" : "qwen2.5-coder:7b";
        console.log(`[DEBUG] Routing to local Ollama for model: ${ollamaModel}`);
        const localOpenAI = new OpenAI({
          apiKey: 'ollama',
          baseURL: 'http://localhost:11434/v1' // Ollama default port
        });
        completion = await localOpenAI.chat.completions.create({
          model: ollamaModel,
          messages: messagesForAI,
          stream: true,
          temperature: 0.35,
          top_p: 0.9,
        });
      } else {
        const targetModel = model || "meta/llama-3.2-11b-vision-instruct";
        console.log(`[DEBUG] Routing to NVIDIA API for model: ${targetModel}`);

        const reqOptions = {
          model: targetModel,
          messages: messagesForAI,
          stream: true,
          temperature: 0.4,
          top_p: 0.9,
          frequency_penalty: 0.2,
          presence_penalty: 0.1,
        };

        completion = await openai.chat.completions.create(reqOptions, { timeout: 60000 });
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
      if (apiError.name === 'APIConnectionTimeoutError' || apiError.status === 408 || (apiError.message && apiError.message.toLowerCase().includes('timeout'))) {
        console.warn(`[WARNING] Request to model ${model} timed out after 60s.`);
        const botMessage = new Message({
          chat_id: chatId,
          user_id: req.user.userId,
          message: `⚠️ **Free Endpoint Busy**\n\nThe NVIDIA free server for \`${model}\` is currently experiencing high load or queue times. Please try **Nemotron 3.5 Lightning** or **GPT-OSS 20B** for fast responses.`,
          role: 'assistant'
        });
        await botMessage.save();
        res.write(`data: ${JSON.stringify({ type: 'error', botMessage })}\n\n`);
        res.end();
      } else if (apiError.status === 404 || apiError.status === 410) {
        console.error(`[DEBUG] Model ${model} is currently unavailable or deprecated (status: ${apiError.status})`);
        const botMessage = new Message({
          chat_id: chatId,
          user_id: req.user.userId,
          message: `⚠️ **Model Unavailable / Retired**\n\nThe AI model \`${model}\` is currently offline or retired on the API provider servers. Please select a different model from the dropdown.`,
          role: 'assistant'
        });
        await botMessage.save();
        res.write(`data: ${JSON.stringify({ type: 'error', botMessage })}\n\n`);
        res.end();
      } else if (apiError.status === 429 || (apiError.message && (apiError.message.includes('ResourceExhausted') || apiError.message.includes('limit reached')))) {
        console.warn(`[WARNING] Model ${model} hit rate/concurrency limit:`, apiError.message || apiError);
        const botMessage = new Message({
          chat_id: chatId,
          user_id: req.user.userId,
          message: `⚠️ **Capacity / Traffic Limit Reached**\n\nThe servers for \`${model}\` are temporarily busy (worker request limit reached). Please wait a few seconds and try again, or switch to a different model.`,
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
      } else if (apiError.status === 400 || (apiError.message && (apiError.message.includes('multimodal') || apiError.message.includes('Multimodal') || apiError.message.includes('vision')))) {
        console.warn(`[WARNING] Model ${model} rejected multimodal/image input:`, apiError.message || apiError);
        const botMessage = new Message({
          chat_id: chatId,
          user_id: req.user.userId,
          message: `⚠️ **Model Does Not Support Images**\n\nThe selected model (\`${model}\`) rejected the image payload because its runtime engine is text-only. Please switch to a vision-enabled model (like \`meta/llama-3.2-11b-vision-instruct\` or \`google/diffusiongemma-26b-a4b-it\`).`,
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

app.post('/api/chats/:id/messages/append', authenticateToken, async (req, res) => {
  try {
    const { message, role } = req.body;
    const newMsg = new Message({
      chat_id: req.params.id,
      user_id: req.user.userId,
      message,
      role: role || 'assistant'
    });
    await newMsg.save();
    res.json(newMsg);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to append message' });
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