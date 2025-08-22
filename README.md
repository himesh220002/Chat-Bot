# 🤖 ChatbotAI

ChatbotAI is a full-stack AI chatbot application built with **React (frontend)** and **Vercel Serverless Functions (backend)**.  
It allows users to chat with an AI assistant, with features like session titles and chat history.

---

## 🚀 Tech Stack

- **Frontend**
  - React + TailwindCSS
  - Apollo Client (GraphQL integration)
  - Nhost (auth & database)
- **Backend**
  - Render Serverless Functions (`api/` folder)
  - OpenAI API for generating replies & titles
- **Deployment**
  - Frontend → Netlify
  - Backend → Render

---


## ⚙️ Setup & Installation

### 1️⃣ Clone the repo
```bash```  
git clone https://github.com/your-username/chatbotai.git  
cd chatbotai


## Install dependencies
```bash```  
npm install

For backend (inside api/):  
cd api  
npm install


---

## Configure environment variables
Frontend (.env):  
REACT_APP_NHOST_SUBDOMAIN=your-nhost-subdomain  
REACT_APP_NHOST_REGION=your-nhost-region  

Backend (.env):  
OPENAI_API_KEY=sk-xxxxxx

```bash```  
npm start

---

## Deployment
Frontend (React)  
  1. Push repo to GitHub  
  2. Deploy on Netlify  
  3. Configure env vars in Netlify dashboard  

Backend (API)  
  1. Push api/ folder to its own repo (or same repo with correct root)  
  2. Import to Vercel  
  3. Add OPENAI_API_KEY in Vercel environment settings  
  4. Your endpoints will be:    
      https://your-backend.render.app/api/generate-reply  
      https://your-backend.render.app/api/generate-title

---

## Example API Usage

Request  

POST https://your-backend.render.app/api/generate-reply  
Content-Type: application/json  

{  
  "message": "Hello chatbot!"  
}  

Responce  

{  
  "reply": "Hello! How can I assist you today?"  
}

--- 

## ✨ Features

- ✅ **User Authentication with Nhost** – secure login and session management  
- ✅ **Real-time Chat** – powered by GraphQL subscriptions  
- ✅ **AI-generated Responses** – using OpenAI GPT models  
- ✅ **Automatic Chat Title Generation** – titles created dynamically from chat context  
- ✅ **Seamless Deployment** – frontend on Netlify & backend on Render  

---

## 🤝 Contributing

We welcome contributions from the community! 🚀  

1. 🍴 **Fork** the project  
2. 🌱 Create a new branch → `feature/awesome-feature`  
3. 💾 Commit your changes → `git commit -m "Add awesome feature"`  
4. 📤 Push to your branch → `git push origin feature/awesome-feature`  
5. 🔀 Open a **Pull Request**  

---

     
