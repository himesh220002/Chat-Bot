# 🤖 InputChat — Advanced AI Cockpit & Local Ghost Mode Platform

InputChat is a high-performance, full-stack AI chat workspace built for speed, total privacy, and visual excellence. It features dual-database ecosystem connectivity (Global MongoDB Atlas + Local Ghost Mode), local AI model inference via Ollama, a zero-persistence memory image pipeline, interactive holo-checklist reports, live charting engines, and PWA mobile app support.

---

## ✨ Key Features & Architecture

- 🔒 **Local Ghost Mode**: Run 100% offline with local MongoDB (`mongodb://localhost:27017`) and local LLMs via Ollama on `localhost:11434`.
- 👁️ **Zero-Persistence Privacy Image Selector**: Converts uploaded images directly to Base64 in volatile memory. Sends payload to vision models (`LLaVA-7B` / `Llama 3.2 Vision`) and immediately discards the image buffer without writing to disk or database.
- ⚡ **Dual Database Ecosystem**: Real-time automatic failover and manual switching between MongoDB Atlas (Global Cloud) and Local Ghost MongoDB.
- 📊 **Dynamic Visualizations**: Auto-detects and renders interactive `recharts` graphs (Bar, Line, Area), `mermaid` vector flowcharts, and custom interactive `checklist` report widgets.
- 🏷️ **Immutable Model Badging**: Every response permanently records the exact AI model used (e.g., `ORBITAL • QWEN 2.5 CODER 7B`, `ORBITAL • LLaVA 7B VISION`).
- ⚡ **Real-Time SSE AI Titling**: Generates concise 3-5 word chat titles in the background on the first message and updates the left sidebar in real time without page reloads.
- 📱 **PWA Mobile App Optimization**: Standalone mobile PWA installation support with `100dvh` viewport height locking, safe-area insets, and elastic overscroll prevention.
- 📑 **Multi-Format Report Exports**: Export interactive reports to JSON, Markdown, CSV, or SVG vector diagrams named directly after your report title.

---

## 🚀 Tech Stack

- **Frontend**: React 18, TailwindCSS, ReactMarkdown, Recharts, Mermaid.js, Lucide Icons
- **Backend**: Node.js, Express (`server.mjs`), Mongoose, OpenAI SDK (NVIDIA API / Ollama endpoints)
- **Databases**: MongoDB Atlas (Cloud) & MongoDB Community (Local Ghost Mode)
- **Local AI Engine**: Ollama (`localhost:11434`)

---

## ⚙️ Setup & Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/Chat-Bot.git
cd Chat-Bot
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Configure Environment Variables
Create a `.env` file in the root directory:

```env
# Backend & Frontend Endpoints
BACKEND_PORT=4000
REACT_APP_API_URL=http://localhost:4000/api

# Database Ecosystem Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chatbot
LOCAL_MONGODB_URI=mongodb://localhost:27017/chatbot

# Authentication & Secrets
JWT_SECRET=your_jwt_secret_key_here

# Cloud Models API (NVIDIA / Public API)
NVIDIA_API_KEY=your_nvidia_api_key_here
```

### 4️⃣ Start the Application
Run both backend and frontend servers:

```bash
npm start
```
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000`

---

## 🏠 Setting Up Local Models with Ollama

You can run local AI models completely offline on your machine without transmitting data to external servers.

### Step 1: Install & Launch Ollama
Download and install Ollama from [ollama.com](https://ollama.com). Verify installation:
```bash
ollama --version
```

### Step 2: Download Local Inference Models
Pull the primary coding and vision models:

```bash
# Pull Qwen 2.5 Coder 7B (Primary Coding & Technical Assistant)
ollama pull qwen2.5-coder:7b

# Pull LLaVA 7B Vision (Multimodal Image Analysis Model)
ollama pull llava:7b
```

### Step 3: Architecture Strategies

#### 🛡️ Strategy 1: True Server-Proxy Ghost Mode (Default & Recommended)
In default local development (`http://localhost:3000`), InputChat's Node.js Express backend (`server.mjs` running on `localhost:4000`) proxies prompts server-side to Ollama (`localhost:11434`). 

**No CORS or `OLLAMA_ORIGINS` setup is required!**
1. Run `ollama serve` (or launch Ollama app).
2. Run `npm start`.
3. Select any local model in the dropdown. 100% offline, zero config needed.

#### 🌐 Strategy 2: Direct Browser Mode (Only for Cloud Hosted URLs)
If your frontend app is hosted on a public domain (e.g. `https://cyphertech.online`) and wants to connect directly to your laptop's local Ollama port 11434 from the browser, enable CORS:

- **Linux / macOS**:
  ```bash
  OLLAMA_ORIGINS="*" ollama serve
  ```
- **Windows**:
  ```cmd
  set OLLAMA_ORIGINS=*
  ollama serve
  ```

---

## ➕ How to Add Custom Local Models

You can add any GGUF or Ollama model (e.g., `deepseek-r1`, `llama3.1`, `mistral`, `gemma2`) to your model selector dropdown:

1. **Pull the Model**:
   ```bash
   ollama pull deepseek-r1:7b
   ```

2. **Register Model in Configuration**:
   Open `src/components/chat/ChatWindow.js` and add your model entry under `"🏠 Local Integration"`:

   ```javascript
   {
     id: "local-deepseek-r1",
     name: "DeepSeek R1 7B (Local)",
     category: "🏠 Local Integration",
     badge: "LOCAL",
     ollamaModel: "deepseek-r1:7b"
   }
   ```

3. **Use Offline**:
   Select your new model from the HUD dropdown menu at `http://localhost:3000` and start chatting offline!

---

## 📋 Features Specification (`features.json`)

```json
{
  "platformName": "InputChat AI Cockpit",
  "version": "4.7.2",
  "features": [
    { "id": "ghost-mode", "name": "Local Ghost Mode", "status": "Operational" },
    { "id": "privacy-image-selector", "name": "Zero-Persistence Base64 Image Selector", "status": "Operational" },
    { "id": "dual-db-failover", "name": "Dual Database Ecosystem (Global + Local)", "status": "Operational" },
    { "id": "realtime-model-ranking", "name": "5-Category Model Response Ranking Engine", "status": "Operational" },
    { "id": "interactive-checklist-renderer", "name": "Interactive Holo-Checklist Widget", "status": "Operational" },
    { "id": "dynamic-charting-recharts", "name": "Native Recharts & Mermaid Flowcharts", "status": "Operational" },
    { "id": "realtime-sse-titling", "name": "Real-Time AI Topic Titling", "status": "Operational" },
    { "id": "pwa-standalone", "name": "PWA Mobile App Viewport Lock (100dvh)", "status": "Operational" }
  ]
}
```

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
