import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, Bot, User as UserIcon, ChevronDown, Copy, Check, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const preprocessLaTeX = (content) => {
  if (!content) return content;
  let processed = content;
  // Convert \[ ... \] to $$ ... $$
  processed = processed.replace(/\\\[(.*?)\\\]/gs, '$$$$$1$$$$');
  // Convert \( ... \) to $ ... $
  processed = processed.replace(/\\\((.*?)\\\)/gs, '$$$1$$');
  // Convert multiline [ ... ] to $$ ... $$ (common for local models)
  processed = processed.replace(/^\[\s*\n(.*?)\n\s*\]/gm, '$$$$\n$1\n$$$$');
  return processed;
};

const AI_MODELS = [
  { id: "local-gguf", name: "Local Model (LM Studio/Ollama)" },
  { id: "meta/llama-3.2-11b-vision-instruct", name: "Llama 3.2 11B Vision" },
  { id: "deepseek-ai/deepseek-v4-flash-0731", name: "DeepSeek V4 Flash" },
  { id: "nvidia/nemotron-3.5-lightning-30b-a3b", name: "Nemotron 3.5 Lightning" },
  { id: "meta/muse-glimmer-30b", name: "Muse Glimmer 30B" },
  { id: "minimaxai/minimax-m3", name: "MiniMax M3 Preview" },
  { id: "stepfun-ai/step-3.7-flash", name: "Step 3.7 Flash" },
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning", name: "Nemotron 3 Nano Omni" },
  { id: "nvidia/ising-calibration-1.5-31b", name: "Ising Calibration 1.5" },
  { id: "poolside/laguna-xs-2.1", name: "Laguna XS 2.1" },
  { id: "google/diffusiongemma-26b-a4b-it", name: "DiffusionGemma 26B" }
];

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    darkMode: true,
    background: '#1e1e1e',
    primaryColor: '#3b82f6',
    primaryTextColor: '#f4f4f5',
    lineColor: '#52525b',
    fontFamily: 'arial, sans-serif'
  }
});

const TerminalLoader = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 12 ? '' : prev + '_[>]');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-mono text-zinc-500 font-bold tracking-widest flex items-center h-full text-[15px]">
      &gt;{dots}
    </div>
  );
};

const MermaidDiagram = ({ chart, isStreaming }) => {
  const [svg, setSvg] = useState('');
  const [id] = useState(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (isStreaming) return;

    let isMounted = true;
    const renderDiagram = async () => {
      try {
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        if (isMounted) {
          setSvg(renderedSvg);
        }
      } catch (err) {
        console.error("Mermaid syntax error:", err);
      }
    };
    renderDiagram();
    return () => { isMounted = false; };
  }, [chart, id, isStreaming]);

  if (isStreaming || !svg) {
    return <div className="animate-pulse flex p-4 bg-[#1e1e1e] rounded-lg my-4 h-32 items-center justify-center text-zinc-400 text-sm">Drawing Diagram...</div>;
  }

  return (
    <div className="relative my-4 rounded-lg overflow-hidden border border-zinc-800 bg-[#1e1e1e] shadow-md group">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => zoomIn()} className="p-1.5 bg-zinc-700/80 hover:bg-zinc-600 text-white rounded-md shadow-sm backdrop-blur-sm transition-colors" title="Zoom In">
                <ZoomIn size={16} />
              </button>
              <button onClick={() => zoomOut()} className="p-1.5 bg-zinc-700/80 hover:bg-zinc-600 text-white rounded-md shadow-sm backdrop-blur-sm transition-colors" title="Zoom Out">
                <ZoomOut size={16} />
              </button>
              <button onClick={() => resetTransform()} className="p-1.5 bg-zinc-700/80 hover:bg-zinc-600 text-white rounded-md shadow-sm backdrop-blur-sm transition-colors" title="Reset Zoom">
                <Maximize size={16} />
              </button>
            </div>
            <div className="w-full h-full overflow-hidden flex justify-center bg-[#1e1e1e] p-1 cursor-move min-h-[200px]">
              <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                <div dangerouslySetInnerHTML={{ __html: svg }} className="w-full flex justify-center" />
              </TransformComponent>
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};

const CodeBlock = ({ node, inline, className, children, isStreaming, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!inline && match) {
    if (match[1].toLowerCase() === 'mermaid') {
      return <MermaidDiagram chart={String(children)} isStreaming={isStreaming} />;
    }

    return (
      <div className="relative my-4 rounded-lg overflow-hidden border border-zinc-800 bg-[#1e1e1e] shadow-md">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">{match[1]}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {isCopied ? 'Copied!' : 'Copy code'}
          </button>
        </div>
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: 0, padding: '1.25rem', background: 'transparent', fontSize: '14px', lineHeight: '1.5' }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  }
  return (
    <code className={`${className} bg-zinc-200 text-zinc-800 px-1.5 py-0.5 rounded text-[13px] font-mono`} {...props}>
      {children}
    </code>
  );
};

const MarkdownComponents = {
  code: CodeBlock,
  h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-zinc-900 border-b border-zinc-200 pb-2" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3 text-zinc-900" {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2 text-zinc-900" {...props} />,
  p: ({ node, ...props }) => <p className="mb-4 last:mb-0 leading-relaxed" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
  li: ({ node, ...props }) => <li className="pl-1" {...props} />,
  a: ({ node, ...props }) => <a className="text-blue-600 hover:text-blue-700 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-zinc-300 pl-4 py-1 my-4 text-zinc-600 bg-zinc-50 rounded-r-lg italic" {...props} />,
  table: ({ node, ...props }) => <div className="overflow-x-auto mb-4 border border-zinc-200 rounded-lg shadow-sm"><table className="w-full text-left border-collapse text-sm" {...props} /></div>,
  thead: ({ node, ...props }) => <thead className="bg-zinc-100/80 border-b border-zinc-200" {...props} />,
  th: ({ node, ...props }) => <th className="p-3 font-semibold text-zinc-700 whitespace-nowrap" {...props} />,
  td: ({ node, ...props }) => <td className="p-3 border-t border-zinc-100" {...props} />
};

const ChatWindow = ({ chatId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem("selectedModelId") || AI_MODELS[0].id);
  const [localServerStatus, setLocalServerStatus] = useState('checking');
  const [dbEcosystem, setDbEcosystem] = useState('checking');
  const [globalDbStatus, setGlobalDbStatus] = useState('checking');
  const [localDbStatus, setLocalDbStatus] = useState('checking');
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Calculate approximate tokens of last 10 messages (matching backend limit)
  const last10Messages = messages.slice(-10);
  const tokenCount = Math.ceil(last10Messages.reduce((acc, msg) => acc + (msg.message || '').split(/\s+/).length, 0) * 1.3);
  const tokenPercentage = Math.min((tokenCount / 4096) * 100, 100);

  useEffect(() => {
    const fetchDbStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/ecosystem/status`);
        const data = await res.json();
        setDbEcosystem(data.active);
        setGlobalDbStatus(data.globalStatus);
        setLocalDbStatus(data.localStatus);
      } catch (e) {
        setDbEcosystem('offline');
        setGlobalDbStatus('offline');
        setLocalDbStatus('offline');
      }
    };

    fetchDbStatus();
    const interval = setInterval(fetchDbStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const switchDb = async (target) => {
    try {
      const res = await fetch(`${API_URL}/ecosystem/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });
      if (res.ok) {
        const data = await res.json();
        setDbEcosystem(data.active);
      }
    } catch (e) {
      console.error('Failed to switch DB:', e);
    }
  };

  useEffect(() => {
    localStorage.setItem("selectedModelId", selectedModel);

    if (selectedModel === 'local-gguf') {
      const checkStatus = async () => {
        try {
          const res = await fetch(`${API_URL}/ollama/status`);
          const data = await res.json();
          setLocalServerStatus(data.status);
        } catch (e) {
          setLocalServerStatus('offline');
        }
      };

      setLocalServerStatus('checking');
      checkStatus();
      const interval = setInterval(checkStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedModel]);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const userMessageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);
    setStreamingMessage("");

    abortControllerRef.current = new AbortController();

    const optimisticUserMsg = {
      _id: Date.now().toString(),
      message: userMessageContent,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: userMessageContent, model: selectedModel }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let partialLine = '';
      let currentStreamText = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkString = decoder.decode(value, { stream: true });
          const lines = (partialLine + chunkString).split('\n');

          partialLine = lines.pop(); // Keep the last incomplete line for the next chunk

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (!dataStr) continue;

              try {
                const data = JSON.parse(dataStr);

                if (data.type === 'user_message') {
                  setMessages((prev) => {
                    const filtered = prev.filter(m => m._id !== optimisticUserMsg._id);
                    return [...filtered, data.userMessage];
                  });
                } else if (data.type === 'chunk') {
                  currentStreamText += data.text;
                  setStreamingMessage(currentStreamText);
                } else if (data.type === 'done' || data.type === 'error') {
                  setMessages((prev) => [...prev, data.botMessage]);
                  setStreamingMessage("");
                  currentStreamText = '';
                } else if (data.type === 'error_fatal') {
                  setMessages((prev) => [...prev, {
                    _id: Date.now().toString(),
                    message: "⚠️ **Fatal Error**\n\nSomething went wrong while generating the response. This may be due to the context limit being reached or an API error. Please start a new chat.",
                    role: 'assistant',
                    createdAt: new Date().toISOString()
                  }]);
                  setStreamingMessage("");
                  currentStreamText = '';
                }
              } catch (e) {
                console.error("Error parsing SSE JSON:", e, "Data string:", dataStr);
              }
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log("Stream aborted by user.");
        // Make the partial streaming message permanent
        setMessages((prev) => {
          const newMsg = {
            _id: Date.now().toString(),
            message: streamingMessage || "*(aborted)*",
            role: 'assistant',
            createdAt: new Date().toISOString()
          };
          return [...prev, newMsg];
        });
      } else {
        console.error("Failed to send message:", err);
        setMessages((prev) => [...prev, {
          _id: Date.now().toString(),
          message: "⚠️ **Network Error**\n\nCould not reach the backend server. If you are using a free cloud service, it might be waking up (this can take up to 50 seconds). Please try again.",
          role: 'assistant',
          createdAt: new Date().toISOString()
        }]);
      }
    } finally {
      setSending(false);
      setStreamingMessage("");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-zinc-400 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">

      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-200 bg-white flex items-center justify-between sticky top-0 z-10">
        <div className="flex flex-col">
          <h3 className="font-semibold text-zinc-900 text-lg tracking-tight flex items-center gap-2">
            &gt;_ inputchat
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-xs text-zinc-500 font-medium">
              Powered by {AI_MODELS.find(m => m.id === selectedModel)?.name || "NVIDIA AI"}
            </p>
            {/* Dual DB Visualizer & Switcher */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-50 border border-zinc-200" title="Database Ecosystem Status">
              <div className="flex items-center gap-1.5 border-r border-zinc-200 pr-2">
                <span className="relative flex h-2 w-2">
                  {globalDbStatus === 'online' && <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>}
                  {globalDbStatus === 'offline' && <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>}
                  {globalDbStatus === 'checking' && <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400 animate-pulse"></span>}
                </span>
                <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Global</span>
              </div>
              <div className="flex items-center gap-1.5 border-r border-zinc-200 pr-2">
                <span className="relative flex h-2 w-2">
                  {localDbStatus === 'online' && <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>}
                  {localDbStatus === 'offline' && <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>}
                  {localDbStatus === 'checking' && <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400 animate-pulse"></span>}
                </span>
                <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Local</span>
              </div>
              <div className="flex items-center pl-1">
                <button
                  onClick={() => {
                    if (dbEcosystem === 'global' && localDbStatus === 'online') {
                      switchDb('local');
                    } else if (dbEcosystem === 'local' && globalDbStatus === 'online') {
                      switchDb('global');
                    }
                  }}
                  disabled={
                    (dbEcosystem === 'global' && localDbStatus !== 'online') ||
                    (dbEcosystem === 'local' && globalDbStatus !== 'online') ||
                    dbEcosystem === 'checking' || dbEcosystem === 'offline' || dbEcosystem === 'disconnected'
                  }
                  className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${dbEcosystem === 'global'
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer'
                    : dbEcosystem === 'local'
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer'
                      : 'bg-zinc-100 text-zinc-500 cursor-not-allowed'
                    }`}
                  title={dbEcosystem === 'global' ? "Active: Global. Click to switch to Local" : "Active: Local. Click to switch to Global"}
                >
                  ACTIVE: {dbEcosystem === 'global' ? 'GLOBAL' : dbEcosystem === 'local' ? 'LOCAL' : 'NONE'}
                </button>
              </div>
            </div>

            {selectedModel === 'local-gguf' && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200" title="Local Model Server Status">
                <span className="relative flex h-2 w-2">
                  {localServerStatus === 'online' && (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </>
                  )}
                  {localServerStatus === 'offline' && (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  )}
                  {localServerStatus === 'checking' && (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-pulse"></span>
                  )}
                </span>
                <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                  AI Local: {localServerStatus === 'online' ? 'Online' : localServerStatus === 'offline' ? 'Offline' : 'Checking'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Model Selector */}
        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="appearance-none bg-zinc-50 border border-zinc-200 text-zinc-700 py-1.5 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all cursor-pointer font-medium shadow-sm"
          >
            {AI_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 border border-zinc-200">
              <Bot size={32} />
            </div>
            <p className="text-zinc-500 text-sm">Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg._id || index} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in-up`}>
                <div className={`flex max-w-[85%] lg:max-w-[75%] ${isUser ? "flex-row-reverse" : "flex-row"} gap-3 items-end`}>

                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${isUser ? "bg-zinc-100 border-zinc-200 text-zinc-600" : "bg-zinc-900 border-zinc-900 text-white"
                    }`}>
                    {isUser ? <UserIcon size={16} /> : <Bot size={16} />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`px-5 py-3.5 rounded-2xl ${isUser
                    ? "bg-zinc-100 text-zinc-900 rounded-br-sm border border-zinc-200"
                    : "bg-white text-zinc-800 rounded-bl-sm border border-zinc-200 shadow-sm markdown-body"
                    } leading-relaxed text-[15px] overflow-hidden`}>
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{msg.message}</div>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={MarkdownComponents}
                      >
                        {preprocessLaTeX(msg.message)}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {sending && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="flex max-w-[85%] lg:max-w-[75%] gap-3 items-end">
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-900 text-white flex items-center justify-center flex-shrink-0">
                <Bot size={16} />
              </div>
              <div className={`px-5 py-3.5 rounded-2xl bg-white text-zinc-800 rounded-bl-sm border border-zinc-200 shadow-sm leading-relaxed text-[15px] min-h-[52px] overflow-hidden markdown-body w-full ${!streamingMessage ? 'flex items-center' : ''}`}>
                {streamingMessage ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      ...MarkdownComponents,
                      code: (props) => <CodeBlock {...props} isStreaming={true} />
                    }}
                  >
                    {preprocessLaTeX(streamingMessage)}
                  </ReactMarkdown>
                ) : (
                  <TerminalLoader />
                )}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-zinc-200">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="relative flex items-end bg-zinc-50 border border-zinc-300 rounded-2xl focus-within:ring-2 focus-within:ring-zinc-900 focus-within:border-zinc-900 transition-all shadow-sm">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Message inputchat..."
              className="w-full bg-transparent border-0 text-zinc-900 rounded-2xl pl-4 pr-12 py-3.5 focus:ring-0 resize-none max-h-32 min-h-[52px] scrollbar-hide text-[15px]"
              disabled={sending}
              rows={1}
            />
            {sending ? (
              <button
                type="button"
                onClick={() => abortControllerRef.current?.abort()}
                className="absolute right-2 bottom-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center h-8 px-3 text-xs font-medium shadow-sm"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="absolute right-2 bottom-2 p-1.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors flex items-center justify-center h-8 w-8 shadow-sm"
              >
                <Send size={16} className="ml-0.5" />
              </button>
            )}
          </form>

          {/* Footer with Context Burner */}
          <div className="flex items-center justify-between mt-3 px-1">
            <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-400">
              <div className="w-24 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${tokenPercentage > 80 ? 'bg-red-400' : tokenPercentage > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${tokenPercentage}%` }}
                />
              </div>
              <span>Context: ~{tokenCount} / 4096 tokens</span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
