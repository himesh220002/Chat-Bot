import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, Bot, User as UserIcon, ChevronDown, Copy, Check, ZoomIn, Cpu, Radio, Activity, ShieldCheck, Orbit, Sparkles, Terminal, Crosshair } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const preprocessMarkdown = (content) => {
  if (!content) return content;
  let processed = content;

  // LaTeX preprocessing
  processed = processed.replace(/\\\[(.*?)\\\]/gs, '$$$$$1$$$$');
  processed = processed.replace(/\\\((.*?)\\\)/gs, '$$$1$$');
  processed = processed.replace(/^\[\s*\n(.*?)\n\s*\]/gm, '$$$$\n$1\n$$$$');

  // Fix for local models wrapping tables in markdown code blocks
  processed = processed.replace(/```(?:markdown|md)\s*\n([\s\S]*?)\n```/gi, (match, p1) => {
    if (p1.trim().startsWith('|') && p1.includes('|-')) {
      return `\n\n${p1}\n\n`;
    }
    return match;
  });

  // Fix for missing blank lines before tables
  processed = processed.replace(/([^\n|])\n(\s*\|.*?\|\s*(?:\n|$))/g, '$1\n\n$2');

  return processed;
};

const AI_MODELS = [
  { id: "local-gguf", name: "Local Model (LM Studio/Ollama)" },
  { id: "meta/llama-3.2-11b-vision-instruct", name: "Llama 3.2 11B Vision" },
  { id: "deepseek-ai/deepseek-v4-flash-0731", name: "DeepSeek V4 Flash" },
  { id: "deepseek-ai/deepseek-v4-pro-0813", name: "DeepSeek V4 Pro" },
  { id: "kimi-k3", name: "Kimi K3" },
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
  securityLevel: 'loose',
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    padding: 4,
    nodeSpacing: 18,
    rankSpacing: 32,
    wrappingWidth: 220
  },
  themeVariables: {
    darkMode: true,
    background: '#0a1f2a',
    primaryColor: '#00eaff',
    primaryTextColor: '#00131a',
    primaryBorderColor: '#00b6d6',
    secondaryColor: '#0f2a36',
    secondaryTextColor: '#c8f4ff',
    tertiaryColor: '#11202a',
    lineColor: '#2ad4ea',
    textColor: '#e6fdff',
    mainBkg: '#00eaff',
    nodeBorder: '#00b6d6',
    clusterBkg: 'rgba(0,234,255,0.06)',
    clusterBorder: 'rgba(0,234,255,0.22)',
    edgeLabelBackground: '#ff4655',
    tertiaryTextColor: '#ffffff',
    fontFamily: 'Rajdhani, JetBrains Mono, sans-serif',
    fontSize: '12px'
  }
});

const TerminalLoader = () => {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % 4), 220);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-3 mono text-xs tracking-widest">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(0,234,255,0.9)]" />
        <span className="text-cyan-300 font-semibold tracking-[0.2em]">LINKING</span>
        <span className="text-cyan-400/70 animate-pulse">▊</span>
      </div>
      <div className="hidden sm:flex gap-[2px] items-end h-4">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <span key={i} className="w-[3px] bg-gradient-to-t from-cyan-600 to-cyan-300 rounded-full transition-all duration-200" style={{ height: `${6 + Math.abs(Math.sin((frame + i) * 0.9)) * 12}px`, opacity: 0.7 + Math.random() * 0.3 }} />
        ))}
      </div>
      <span className="text-cyan-100/50 tracking-[0.18em] hidden md:inline">NEURAL CORE SYNAPTIC BURST</span>
    </div>
  );
};

const MermaidDiagram = ({ chart, isStreaming }) => {
  const [svg, setSvg] = useState('');
  const [hasError, setHasError] = useState(false);
  const [id] = useState(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (isStreaming) return;
    const sanitizedChart = chart
      .replace(/^mermaid\s+/i, '')
      .replace(/-+>\s*\|([^|]+)\|\s*>/g, '-->|$1| ')
      .replace(/-\.+>/g, '-.->')
      .trim();
    let isMounted = true;
    const renderDiagram = async () => {
      try {
        await mermaid.parse(sanitizedChart);
        const { svg: renderedSvg } = await mermaid.render(id, sanitizedChart);
        if (isMounted) {
          setSvg(renderedSvg);
          setHasError(false);
        }
      } catch (err) {
        if (isMounted) setHasError(true);
      }
    };
    renderDiagram();
    return () => { isMounted = false; };
  }, [chart, id, isStreaming]);

  if (hasError) {
    return (
      <div className="relative my-4">
        <div className="absolute top-2 right-2 mono text-[10px] tracking-widest text-red-300 bg-red-950/60 px-2 py-1 sci-panel-cut-sm border border-red-500/30 z-10">
          INVALID DIAGRAM • SYNAPTIC ERROR
        </div>
        <SyntaxHighlighter
          language="mermaid"
          style={vscDarkPlus}
          PreTag="div"
          className="sci-panel sci-panel-cut-sm !m-0 !bg-[#081e28]/90 border border-red-500/20"
        >
          {chart}
        </SyntaxHighlighter>
      </div>
    );
  }

  if (isStreaming || !svg) {
    return <div className="bg-[#0a1f2a] border border-cyan-400/15 flex p-6 rounded-[12px] my-4 h-28 items-center justify-center mono text-xs tracking-widest text-cyan-300/70 gap-2" style={{ clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px), calc(100% - 8px) 100%,0 100%,0 8px)' }}><Loader2 className="animate-spin w-4 h-4" /> RENDERING HOLO-DIAGRAM...</div>;
  }

  return (
    <div className="relative w-full my-5 bg-[#081e28] border border-cyan-400/20 shadow-[0_0_24px_rgba(0,234,255,0.14)] overflow-hidden" style={{ clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px), calc(100% - 8px) 100%,0 100%,0 8px)' }}>
      <div className="flex items-center justify-between px-3 py-2.5 bg-cyan-400/10 border-b border-cyan-400/15 mono text-[10px] tracking-[0.18em] text-cyan-200">
        <span className="flex items-center gap-1.5"><Sparkles size={12} className="text-cyan-400" /> HOLO • DIAGRAM MATRIX</span>
        <span className="opacity-60 flex items-center gap-2">
          <span className="hidden sm:inline mono text-[8px] text-white/30">SCROLL • DRAG PAN</span>
          <span>VECTOR NODE</span>
        </span>
      </div>
      <div className="relative w-full bg-[#061a24] overflow-hidden" style={{ minHeight: '600px', height: '600px', maxHeight: '68vh' }}>
        <div className="absolute inset-0 overflow-auto flex items-start justify-center p-2 mermaid-viewport bg-[radial-gradient(ellipse_at_center,rgba(0,234,255,0.04),transparent_70%)]">
          <div
            dangerouslySetInnerHTML={{ __html: svg }}
            className="mermaid-svg-wrap w-full flex justify-center items-start [&>svg]:!max-w-full [&>svg]:!w-auto [&>svg]:!h-auto [&>svg]:block [&>svg]:mx-auto"
            style={{ maxWidth: '100%', minWidth: '0' }}
          />
        </div>
        <div className="absolute bottom-2 right-2 flex gap-1.5">
          <span className="mono text-[8px] tracking-widest bg-black/50 border border-white/10 px-2 py-1 rounded-full text-white/40 backdrop-blur">SCROLL TO PAN • 600PX MIN</span>
        </div>
      </div>
    </div>
  );
};

const SvgRenderer = ({ code }) => {
  const sanitized = String(code).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  return (
    <div className="relative my-4 sci-panel sci-panel-cut-sm border-cyan-400/20 bg-black/30 overflow-hidden">
      <span className="corners"><i /><i /><i /><i /></span>
      <div className="flex items-center justify-between px-3 py-2 bg-cyan-400/10 border-b border-cyan-400/15">
        <span className="mono text-[10px] tracking-[0.18em] text-cyan-200 flex items-center gap-1.5"><ZoomIn size={12} className="text-cyan-400" /> VECTOR • HOLO-RENDER</span>
        <span className="mono text-[9px] tracking-widest text-cyan-400/50">SVG CORE</span>
      </div>
      <div className="p-4 flex items-center justify-center overflow-auto max-h-[500px] w-full bg-black/20 [&>svg]:max-w-full [&>svg]:h-auto" dangerouslySetInnerHTML={{ __html: sanitized }} />
    </div>
  );
};

const ChartRenderer = ({ configStr }) => {
  try {
    const config = JSON.parse(configStr);
    const { type, data, xAxisKey, dataKeys, title, colors } = config;
    const defaultColors = ['#00eaff', '#00ffc6', '#ffb800', '#ff4d6a', '#7b61ff'];
    const activeColors = colors || defaultColors;
    const renderChart = () => {
      switch (type) {
        case 'bar':
          return (
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,234,255,0.15)" />
              <XAxis dataKey={xAxisKey} tick={{ fill: '#7dd3e0', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(0,234,255,0.2)' }} />
              <YAxis tick={{ fill: '#7dd3e0', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,234,255,0.2)' }} />
              <Tooltip contentStyle={{ background: 'rgba(6,30,40,0.92)', border: '1px solid rgba(0,234,255,0.35)', borderRadius: '10px', color: '#e6fdff' }} />
              <Legend wrapperStyle={{ color: '#a5f3ff' }} />
              {dataKeys?.map((key, i) => (
                <Bar key={key} dataKey={key} fill={activeColors[i % activeColors.length]} radius={[6, 6, 0, 0]} />
              ))}
            </BarChart>
          );
        case 'line':
          return (
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,234,255,0.15)" />
              <XAxis dataKey={xAxisKey} tick={{ fill: '#7dd3e0', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,234,255,0.2)' }} />
              <YAxis tick={{ fill: '#7dd3e0', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,234,255,0.2)' }} />
              <Tooltip contentStyle={{ background: 'rgba(6,30,40,0.92)', border: '1px solid rgba(0,234,255,0.35)', borderRadius: '10px', color: '#e6fdff' }} />
              <Legend wrapperStyle={{ color: '#a5f3ff' }} />
              {dataKeys?.map((key, i) => (
                <Line key={key} type="monotone" dataKey={key} stroke={activeColors[i % activeColors.length]} strokeWidth={2.5} dot={{ r: 3, fill: activeColors[i % activeColors.length] }} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          );
        case 'area':
          return (
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,234,255,0.15)" />
              <XAxis dataKey={xAxisKey} tick={{ fill: '#7dd3e0', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,234,255,0.2)' }} />
              <YAxis tick={{ fill: '#7dd3e0', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,234,255,0.2)' }} />
              <Tooltip contentStyle={{ background: 'rgba(6,30,40,0.92)', border: '1px solid rgba(0,234,255,0.35)', borderRadius: '10px', color: '#e6fdff' }} />
              <Legend wrapperStyle={{ color: '#a5f3ff' }} />
              {dataKeys?.map((key, i) => (
                <Area key={key} type="monotone" dataKey={key} fill={activeColors[i % activeColors.length]} stroke={activeColors[i % activeColors.length]} fillOpacity={0.22} />
              ))}
            </AreaChart>
          );
        case 'pie':
          return (
            <PieChart>
              <Tooltip contentStyle={{ background: 'rgba(6,30,40,0.92)', border: '1px solid rgba(0,234,255,0.35)', borderRadius: '10px' }} />
              <Legend wrapperStyle={{ color: '#a5f3ff' }} />
              <Pie data={data} dataKey={dataKeys?.[0]} nameKey={xAxisKey} cx="50%" cy="50%" outerRadius={110} label={{ fill: '#e6fdff', fontSize: 12 }}>
                {data?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={activeColors[index % activeColors.length]} />
                ))}
              </Pie>
            </PieChart>
          );
        case 'scatter':
          return (
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,234,255,0.15)" />
              <XAxis dataKey={xAxisKey} type="number" name={xAxisKey} tick={{ fill: '#7dd3e0' }} />
              <YAxis dataKey={dataKeys?.[0]} type="number" name={dataKeys?.[0]} tick={{ fill: '#7dd3e0' }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: 'rgba(6,30,40,0.92)', border: '1px solid rgba(0,234,255,0.35)', borderRadius: '10px' }} />
              <Legend wrapperStyle={{ color: '#a5f3ff' }} />
              <Scatter name={dataKeys?.[0]} data={data} fill={activeColors[0]} />
            </ScatterChart>
          );
        default:
          return <div className="text-red-300 p-4 mono text-xs">UNSUPPORTED CHART TYPE: {type}</div>;
      }
    };
    return (
      <div className="w-full my-6 sci-panel sci-panel-cut-sm border-cyan-400/20 bg-[rgba(8,30,40,0.75)] p-5 overflow-auto">
        <span className="corners"><i /><i /><i /><i /></span>
        {title && <h3 className="display text-sm tracking-[0.18em] text-center text-cyan-200 mb-4">{title.toUpperCase()}</h3>}
        <div className="h-[360px] w-full min-w-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </div>
    );
  } catch (err) {
    return (
      <div className="w-full my-6 sci-panel sci-panel-cut-sm border-cyan-400/20 bg-cyan-400/[0.06] p-8 flex flex-col items-center justify-center h-[260px]">
        <Loader2 className="w-7 h-7 animate-spin text-cyan-400 mb-3" />
        <p className="mono text-xs tracking-[0.2em] text-cyan-300/70">COMPILING DATASET...</p>
      </div>
    );
  }
};

const CodeBlock = ({ node, inline, className, children, isStreaming, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  if (!inline && match && (match[1] === 'recharts' || match[1] === 'json')) {
    if (match[1] === 'json') {
      try {
        const config = JSON.parse(String(children));
        if (config && config.type && Array.isArray(config.data) && config.xAxisKey) {
          return <ChartRenderer configStr={String(children)} />;
        }
      } catch (e) { }
    } else {
      return <ChartRenderer configStr={String(children)} />;
    }
  }
  if (!inline && match) {
    if (match[1].toLowerCase() === 'mermaid') {
      return <MermaidDiagram chart={String(children)} isStreaming={isStreaming} />;
    }
    const isSvgMatch = match[1].toLowerCase() === 'svg';
    const isXmlWithSvg = match[1].toLowerCase() === 'xml' && String(children).trim().startsWith('<svg');
    if (isSvgMatch || isXmlWithSvg) {
      return <SvgRenderer code={children} />;
    }
    return (
      <div className="relative my-4 sci-panel sci-panel-cut-sm overflow-hidden border-cyan-400/20 bg-[#0a1f2a]">
        <span className="corners"><i /><i /><i /><i /></span>
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-500/15 to-teal-500/10 border-b border-cyan-400/15">
          <span className="mono text-[10px] tracking-[0.18em] text-cyan-300 flex items-center gap-1.5"><Terminal size={12} /> {match[1].toUpperCase()} • CORE DUMP</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 mono text-[10px] tracking-widest text-cyan-200/70 hover:text-cyan-200 transition-colors cursor-pointer sci-panel-cut-sm px-2 py-1 bg-black/20 border border-cyan-400/15"
          >
            {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {isCopied ? 'COPIED' : 'COPY'}
          </button>
        </div>
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '13px', lineHeight: '1.6' }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  }
  const contentStr = String(children);
  if (inline && contentStr.trim().startsWith('mermaid graph')) {
    const rawChart = contentStr.trim().replace(/^mermaid\s+/i, '');
    const chartWithNewlines = rawChart
      .replace(/^graph\s+([A-Z]{2})\s+/i, 'graph $1\n')
      .replace(/\]\s+([A-Z])/g, ']\n$1');
    return <MermaidDiagram chart={chartWithNewlines} isStreaming={isStreaming} />;
  }
  return (
    <code className={`${className} bg-cyan-400/15 text-cyan-200 px-1.5 py-0.5 sci-panel-cut-sm border border-cyan-400/20 mono text-[12px]`} {...props}>
      {children}
    </code>
  );
};

const MarkdownComponents = {
  code: CodeBlock,
  h1: ({ node, children, ...props }) => <h1 className="display text-[18px] lg:text-[22px] font-extrabold mt-5 lg:mt-7 mb-3 lg:mb-4 text-white border-b border-white/10 pb-2 lg:pb-3 tracking-wide leading-tight" {...props}>{children}</h1>,
  h2: ({ node, children, ...props }) => <h2 className="display text-[15px] lg:text-[18px] font-bold mt-4 lg:mt-6 mb-2 lg:mb-3 text-white tracking-wide leading-snug" {...props}>{children}</h2>,
  h3: ({ node, children, ...props }) => <h3 className="display text-[14px] lg:text-[16px] font-bold mt-4 lg:mt-5 mb-2 lg:mb-3 text-white tracking-wide" {...props}>{children}</h3>,
  p: ({ node, children, ...props }) => <p className="mb-3 lg:mb-4 last:mb-0 leading-6 lg:leading-7 text-white raj text-[13px] lg:text-[15.5px] font-medium tracking-[0.01em]" {...props}>{children}</p>,
  ul: ({ node, children, ...props }) => <ul className="list-none pl-0 mb-4 lg:mb-5 space-y-1.5 lg:space-y-2" {...props}>{children}</ul>,
  ol: ({ node, children, ...props }) => <ol className="list-decimal pl-5 lg:pl-6 mb-4 lg:mb-5 space-y-1.5 lg:space-y-2 marker:text-white marker:font-bold text-[13px] lg:text-[14px]" {...props}>{children}</ol>,
  li: ({ node, children, ...props }) => <li className="pl-1 raj text-white font-medium text-[13px] lg:text-[15px] leading-6 lg:leading-7 flex flex-wrap gap-2 lg:gap-2.5 before:content-['▸'] before:text-white before:font-bold before:mono before:text-xs lg:before:text-sm before:mt-0.5" {...props}>{children}</li>,
  a: ({ node, children, ...props }) => <a className="text-cyan-300 hover:text-white hover:underline decoration-white/30 underline-offset-4 font-semibold" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
  blockquote: ({ node, ...props }) => <blockquote className="border-l-[3px] border-white pl-5 py-3 my-5 bg-white/[0.06] mono text-[14px] leading-6 text-white font-medium" style={{ clipPath: 'polygon(4px 0,100% 0,100% calc(100% - 4px), calc(100% - 4px) 100%,0 100%,0 4px)' }} {...props} />,
  table: ({ node, ...props }) => <div className="overflow-x-auto mb-4 sci-panel sci-panel-cut-sm border-cyan-400/20"><table className="w-full text-left border-collapse text-sm raj" {...props} /></div>,
  thead: ({ node, ...props }) => <thead className="bg-cyan-400/10 border-b border-cyan-400/20" {...props} />,
  th: ({ node, ...props }) => <th className="p-2.5 mono text-[11px] tracking-widest text-cyan-200 whitespace-nowrap" {...props} />,
  td: ({ node, ...props }) => <td className="p-2.5 border-t border-white/5 text-cyan-50/80" {...props} />
};

const AutoResizeTextarea = ({ newMessage, setNewMessage, handleSendMessage, sending }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // reset
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // set to content height
    }
  }, [newMessage]);

  return (
    <textarea
      ref={textareaRef}
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage(e);
        }
      }}
      placeholder="Transmit to orbital intelligence..."
      className="flex-1 bg-transparent border-0 text-white placeholder:text-cyan-100/35 pl-3 lg:pl-2 pr-12 lg:pr-14 py-2.5 lg:py-3.5 focus:ring-0 resize-none max-h-32 min-h-[44px] lg:min-h-[52px] scrollbar-thin mono text-[13px] lg:text-sm tracking-wide outline-none"
      disabled={sending}
      rows={1}
    />
  );
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
  }, [messages, sending, streamingMessage]);



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
    let currentStreamText = '';
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
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let partialLine = '';
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkString = decoder.decode(value, { stream: true });
          const lines = (partialLine + chunkString).split('\n');
          partialLine = lines.pop();
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
                console.error("Error parsing SSE JSON:", e);
              }
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        const abortedText = currentStreamText ? currentStreamText + "\n\n*(aborted)*" : "*(aborted)*";
        fetch(`${API_URL}/chats/${chatId}/messages/append`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ message: abortedText, role: 'assistant' })
        }).catch(console.error);
        setMessages((prev) => {
          const newMsg = {
            _id: Date.now().toString(),
            message: abortedText,
            role: 'assistant',
            createdAt: new Date().toISOString()
          };
          return [...prev, newMsg];
        });
        setStreamingMessage("");
        currentStreamText = '';
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
      <div className="flex-1 flex flex-col items-center justify-center gap-6 py-20">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border border-cyan-400/20" />
          <div className="absolute inset-2 rounded-full border-t-cyan-400 border-2 border-transparent animate-spin" />
          <div className="absolute inset-5 rounded-full border border-cyan-300/20 animate-ping" />
          <div className="absolute inset-0 flex items-center justify-center"><Cpu size={18} className="text-cyan-300 animate-pulse" /></div>
        </div>
        <div className="text-center mono text-xs tracking-[0.22em] text-cyan-300/70 animate-pulse">
          DECRYPTING TRANSMISSION • CHAIN {chatId.slice(-4).toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0">
      {/* Header – floating glass command bar */}
      <div className="relative px-3 lg:px-5 py-3 border-b border-white/8 bg-gradient-to-r from-white/[0.04] via-transparent to-white/[0.02] backdrop-blur-md flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 rounded-t-[22px]">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex items-center gap-4 min-w-0">
          <div className="hidden lg:flex w-10 h-10 rounded-[12px] bg-cyan-400/15 border border-white/10 items-center justify-center backdrop-blur">
            <Crosshair size={16} className="text-cyan-300" />
          </div>
          <div className="min-w-0">
            {/* <h3 className="display font-bold text-white tracking-[0.12em] text-sm flex items-center gap-2">
              <span className="text-cyan-400">&gt;_</span> INPUTCHAT <span className="hidden sm:inline mono text-[9px] tracking-[0.2em] text-cyan-300/60 border border-cyan-400/20 px-1.5 py-0.5 sci-panel-cut-sm bg-cyan-400/10">COCKPIT LINK</span>
            </h3> */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {/* <p className="mono text-[11px] text-cyan-100/60 flex items-center gap-1.5">
                <Cpu size={11} className="text-cyan-400" />
                {AI_MODELS.find(m => m.id === selectedModel)?.name || "NVIDIA AI"}
              </p> */}
              {/* DB cluster HUD — glass */}
              <div className="flex items-center gap-1.5 rounded-full bg-white/[0.05] border border-white/10 px-2.5 py-1 backdrop-blur">
                <span className="flex items-center gap-1 mono text-[.5rem] tracking-widest text-white/60"><span className={`w-1.5 h-1.5 rounded-full ${globalDbStatus === 'online' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : globalDbStatus === 'offline' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'}`} /> GLOBAL</span>
                <span className="w-px h-3 bg-white/10" />
                <span className="flex items-center gap-1 mono text-[.5rem] tracking-widest text-white/60"><span className={`w-1.5 h-1.5 rounded-full ${localDbStatus === 'online' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : localDbStatus === 'offline' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'}`} /> LOCAL</span>
                <button
                  onClick={() => {
                    if (dbEcosystem === 'global' && localDbStatus === 'online') switchDb('local');
                    else if (dbEcosystem === 'local' && globalDbStatus === 'online') switchDb('global');
                  }}
                  disabled={
                    (dbEcosystem === 'global' && localDbStatus !== 'online') ||
                    (dbEcosystem === 'local' && globalDbStatus !== 'online') ||
                    dbEcosystem === 'checking' || dbEcosystem === 'offline' || dbEcosystem === 'disconnected'
                  }
                  className={`mono text-[.5rem] font-bold px-2 py-0.5 rounded-full border ml-1 transition-colors backdrop-blur ${dbEcosystem === 'global'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/25'
                    : dbEcosystem === 'local'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-400/30 hover:bg-amber-500/25'
                      : 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed'
                    }`}
                >
                  {dbEcosystem === 'global' ? '● GLOBAL' : dbEcosystem === 'local' ? '● LOCAL' : '● OFF'}
                </button>
              </div>
              {selectedModel === 'local-gguf' && (
                <span className={`flex items-center gap-1 mono text-[9px] tracking-widest px-2.5 py-1 rounded-full border backdrop-blur ${localServerStatus === 'online' ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-300' : localServerStatus === 'offline' ? 'bg-red-500/10 border-red-400/20 text-red-300' : 'bg-amber-500/10 border-amber-400/20 text-amber-300'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${localServerStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-current'}`} />
                  LOCAL: {localServerStatus.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Model Selector HUD — glass */}
        <div className="flex items-center gap-2 shrink-0">
          {/* <div className="hidden lg:flex items-center gap-1.5 mono text-[.5rem] tracking-[0.18em] text-white/35">
            <Database size={10} /> MODEL CORE
          </div> */}
          <div className="relative group">
            <div className="absolute -inset-px bg-cyan-400/15 rounded-[12px] blur-[8px] opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="relative appearance-none rounded-[12px] bg-white/[0.06] backdrop-blur border border-white/10 text-white py-2 pl-3 pr-9 mono text-[.8rem] tracking-wide focus:outline-none focus:border-cyan-400/30 focus:bg-white/[0.08] cursor-pointer min-w-[200px]"
            >
              {AI_MODELS.map((model) => (
                <option key={model.id} value={model.id} className="bg-[#0a1f2a]">
                  {model.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Messages Area — responsive */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 lg:p-4 scrollbar-thin scroll-smooth relative" style={{ transformStyle: 'preserve-3d' }}>
        {/* subtle grid overlay + floating depth haze */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(0,234,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,234,255,0.6) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(600px 300px at 50% 42%, rgba(0,234,255,0.06), transparent 70%)' }} />
        <div className="w-full max-w-7xl mx-auto space-y-5 min-h-full flex flex-col relative z-10" style={{ transformStyle: 'preserve-3d' }}>
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16" style={{ transformStyle: 'preserve-3d' }}>
              <div className="relative w-40 h-40 rounded-[18px] bg-white/[0.06] backdrop-blur border border-white/10 flex items-center justify-center mb-5 shadow-[0_0_28px_rgba(0,234,255,0.16)]" style={{ transform: 'translateZ(18px)' }}>
                <Bot size={30} className="text-cyan-300" />
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 mono text-[8px] tracking-[0.2em] bg-cyan-400 text-black px-2 py-0.5 rounded-full font-bold shadow-[0_0_10px_rgba(0,234,255,0.6)]">AI CORE</div>
              </div>
              <p className="display text-[.5rem] tracking-[0.18em] text-white/90" style={{ transform: 'translateZ(14px)' }}>NEURAL CHANNEL OPEN</p>
              <p className="raj text-white/45 text-[14px] mt-2 max-w-sm" style={{ transform: 'translateZ(12px)' }}>Transmit your query to the orbital intelligence. Holographic responses will materialize as floating holo-text in mid-air.</p>
              <div className="mt-4 flex gap-2 mono text-[10px] tracking-widest" style={{ transform: 'translateZ(10px)' }}>
                <span className="px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300/70 text-[.5rem] backdrop-blur">VOICE • TEXT • VISION</span>
                <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/8 text-white/30 text-[.5rem] backdrop-blur">LAT 0.24ms</span>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg._id || index} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in-up`} style={{ transformStyle: 'preserve-3d' }}>
                  <div className={`flex ${isUser ? "max-w-[88%] lg:max-w-[90%] flex-col 2xl:flex-row-reverse items-end" : "max-w-[96%] lg:max-w-[90%] flex-col 2xl:flex-row w-full items-start 2xl:items-end"} gap-3 `} style={{ transformStyle: 'preserve-3d' }}>
                    {/* Avatar – floating hologram marker */}
                    <div className={`w-8 h-8 rounded-[10px] flex-shrink-0 flex items-center justify-center border relative overflow-hidden backdrop-blur ${isUser ? "bg-cyan-400 text-black border-cyan-300 shadow-[0_0_16px_rgba(0,234,255,0.5)]" : "bg-white/[0.06] border-white/10 text-cyan-200 shadow-[0_0_16px_rgba(0,234,255,0.12)]"
                      }`}>
                      {isUser ? <UserIcon size={14} /> : <Orbit size={14} className="animate-spin" style={{ animationDuration: '6s' }} />}
                      {!isUser && <span className="absolute inset-0 bg-cyan-400/8 animate-pulse" />}
                    </div>

                    {/* Message Bubble — responsive sharp */}
                    <div data-index={index % 4} className={`holo-msg relative px-3 lg:px-5 py-2.5 lg:py-3.5 leading-relaxed text-[12.5px] lg:text-[14.5px] overflow-auto max-w-full min-w-0
                      ${isUser
                        ? "sci-msg-user raj font-medium holo-msg-user"
                        : "sci-msg-bot"
                      }`} style={{ transform: `translateZ(${isUser ? 16 : 14}px)` }}>
                      {isUser && <div className="absolute top-0 left-6 right-6 h-px bg-white/55 hidden lg:block" />}
                      {!isUser && <div className="absolute left-0 top-3 bottom-3 w-px bg-cyan-400/40 hidden lg:block" />}

                      {isUser ? (
                        <div className="whitespace-pre-wrap break-words text-[#00131a] font-semibold">{msg.message}</div>
                      ) : (
                        <div className="markdown-sci">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={MarkdownComponents}
                          >
                            {preprocessMarkdown(msg.message)}
                          </ReactMarkdown>
                        </div>
                      )}

                      {/* msg meta */}
                      <div className={`mt-2 flex items-center gap-2 mono text-[9px] tracking-[0.14em] ${isUser ? 'text-[#00131a]/60 justify-end user-meta' : 'text-cyan-300/45'}`}>
                        <span>{isUser ? 'PILOT • TX' : 'ORBITAL • RX'}</span>
                        <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {sending && (
            <div className="flex justify-start animate-fade-in-up" style={{ transformStyle: 'preserve-3d' }}>
              <div className="flex max-w-[96%] gap-3 items-end w-full" style={{ transformStyle: 'preserve-3d' }}>
                <div className="w-8 h-8 rounded-[10px] bg-white/[0.06] border border-white/10 text-cyan-200 flex items-center justify-center flex-shrink-0 relative overflow-hidden backdrop-blur">
                  <Bot size={14} />
                  <span className="absolute inset-0 bg-cyan-400/8 animate-pulse" />
                </div>
                <div className="flex-1 holo-msg sci-msg-bot px-5 py-4 min-h-[56px] flex items-center overflow-hidden relative" style={{ transform: 'translateZ(14px)' }}>

                  {streamingMessage ? (
                    <div className="markdown-sci w-full">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          ...MarkdownComponents,
                          code: (props) => <CodeBlock {...props} isStreaming={true} />
                        }}
                      >
                        {preprocessMarkdown(streamingMessage)}
                      </ReactMarkdown>
                      <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse translate-y-1 shadow-[0_0_6px_rgba(0,234,255,0.8)]" />
                    </div>
                  ) : (
                    <TerminalLoader />
                  )}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Deck — floating glass console */}
      <div className="relative p-1 lg:p-0 shrink-0">
        <div className="max-w-5xl mx-auto">
          <div className="relative group" style={{ transformStyle: 'preserve-3d' }}>
            <div className="deck-glow rounded-[16px]" />
            <form onSubmit={handleSendMessage} className="relative flex items-end glass-holo bg-white/[0.06] border-white/10 focus-within:border-cyan-400/30 focus-within:shadow-[0_0_28px_rgba(0,234,255,0.18),0_12px_32px_rgba(0,0,0,0.42)] transition-all overflow-hidden" style={{ borderRadius: '8px', transform: 'translateZ(10px)' }}>

              {/* side sensor */}
              <div className="hidden lg:flex flex-col items-center gap-1 pl-3 pr-2 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                <div className="w-px flex-1 bg-gradient-to-b from-cyan-400/40 to-transparent min-h-[24px]" />
                <Radio size={10} className="text-cyan-400/60" />
              </div>

              <AutoResizeTextarea
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                handleSendMessage={handleSendMessage}
                sending={sending}
              />

              {/* action cluster */}
              <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
                {sending ? (
                  <button
                    type="button"
                    onClick={() => abortControllerRef.current?.abort()}
                    className="rounded-[12px] bg-red-500/15 border border-red-400/30 text-red-300 hover:bg-red-500/25 px-3 py-2 mono text-[11px] tracking-widest font-bold flex items-center gap-1.5 transition-colors backdrop-blur"
                  >
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" /> ABORT
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="w-10 h-10 rounded-[12px] bg-cyan-400 text-black hover:bg-cyan-300 disabled:opacity-30 disabled:bg-white/10 disabled:text-white/30 border border-cyan-300 shadow-[0_0_16px_rgba(0,234,255,0.5)] flex items-center justify-center transition-all hover:scale-[1.03] active:scale-95"
                  >
                    <Send size={16} className="ml-0.5" />
                  </button>
                )}
              </div>
            </form>

            {/* Footer HUD – Context & warnings */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-2.5 px-1">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 mono text-[10px] tracking-[0.14em] text-cyan-300/60">
                  <Activity size={12} className="text-cyan-400" />
                  <span>NEURAL BUFFER</span>
                </div>
                {/* segmented burn bar – like combat health from Image2 */}
                <div className="flex-1 sm:w-32 seg-bar">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const fillRatio = tokenPercentage / 100;
                    const filled = i < Math.ceil(fillRatio * 12);
                    let cls = '';
                    if (filled) {
                      if (tokenPercentage > 80) cls = 'danger active';
                      else if (tokenPercentage > 55) cls = 'warn active';
                      else cls = 'active';
                    }
                    return <span key={i} className={cls} />;
                  })}
                </div>
                <span className={`mono text-[10px] tracking-widest font-bold ${tokenPercentage > 80 ? 'text-red-300' : tokenPercentage > 55 ? 'text-amber-300' : 'text-emerald-300'}`}>~{tokenCount} / 4096</span>
              </div>
              {/* bottom deck wing line */}
              <div className="hidden lg:flex items-center gap-2 mt-3 opacity-30">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-400/30" />
                <div className="w-2 h-2 rotate-45 border border-cyan-400/40 bg-cyan-400/10" />
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-400/30" />
              </div>
              <p className="mono text-[10px] tracking-[0.12em] text-cyan-100/30 hidden lg:flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-cyan-400/40" /> QUANTUM ENCRYPTED • AI MAY HALLUCINATE
              </p>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
