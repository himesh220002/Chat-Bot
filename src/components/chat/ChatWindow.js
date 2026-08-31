import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, Bot, User as UserIcon, ChevronDown, Copy, Check, ZoomIn, Cpu, Radio, Activity, ShieldCheck, Orbit, Sparkles, Terminal, Crosshair, Paperclip, Image as ImageIcon, X, AlertCircle, Home } from "lucide-react";
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
  // ⚡ FAST & RELIABLE (Primary Defaults)
  { id: "nvidia/nemotron-3.5-lightning-30b-a3b", name: "Nemotron 3.5 Lightning (⚡ Fast ~20s)", category: "⚡ Fast & Reliable", badge: "⚡ Fast" },
  { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B MoE (⚡ Fast ~10s)", category: "⚡ Fast & Reliable", badge: "⚡ Fast" },
  { id: "deepseek-ai/deepseek-v4-flash-0731", name: "DeepSeek V4 Flash (⚡ Fast MoE)", category: "⚡ Fast & Reliable", badge: "⚡ Fast MoE" },
  { id: "poolside/laguna-xs-2.1", name: "Laguna XS 2.1 (⚡ Fast Agentic)", category: "⚡ Fast & Reliable", badge: "💻 Code" },

  // 👁️ VISION & MULTIMODAL (Images & Screenshots)
  { id: "meta/llama-3.2-11b-vision-instruct", name: "Llama 3.2 11B Vision", category: "👁️ Vision & Multimodal", badge: "👁️ Vision" },
  { id: "google/diffusiongemma-26b-a4b-it", name: "DiffusionGemma 26B Vision", category: "👁️ Vision & Multimodal", badge: "👁️ Vision" },
  { id: "meta/muse-glimmer-30b", name: "Muse Glimmer 30B", category: "👁️ Vision & Multimodal", badge: "👁️ Vision" },
  { id: "nvidia/ising-calibration-1.5-31b", name: "Ising Quantum Calibration VLM", category: "👁️ Vision & Multimodal", badge: "👁️ VLM" },
  { id: "meta/llama-3.2-90b-vision-instruct", name: "Llama 3.2 90B Vision (⏳)", category: "👁️ Vision & Multimodal", badge: "👁️ Vision Heavy" },
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning", name: "Nemotron Omni Reasoning (⏳)", category: "👁️ Vision & Multimodal", badge: "👁️ Omni Vision" },
  { id: "moonshotai/kimi-k3", name: "Kimi K3 Multimodal (⏳)", category: "👁️ Vision & Multimodal", isVision: true, badge: "👁️ Vision MoE" },
  { id: "minimaxai/minimax-m3", name: "MiniMax M3 Preview (⏳)", category: "👁️ Vision & Multimodal", isVision: true, badge: "👁️ Vision" },

  // 💻 CODING & PRO MODELS
  { id: "deepseek-ai/deepseek-v4-pro-0813", name: "DeepSeek V4 Pro (1M Context)", category: "💻 Coding & Pro Models", badge: "💻 Code MoE" },
  { id: "mistralai/mistral-nemotron", name: "Mistral Nemotron Agentic", category: "💻 Coding & Pro Models", badge: "💻 Agentic" },

  // 🧠 DEEP THINKERS & HEAVY REASONING (High Load / Cold Start)
  { id: "google/gemma-4-31b-it", name: "Gemma 4 31B Reasoning (🧠)", category: "🧠 Deep Thinkers & Heavy Reasoning", badge: "🧠 Reasoning" },
  { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B MoE Reasoning (🧠)", category: "🧠 Deep Thinkers & Heavy Reasoning", badge: "🧠 Heavy MoE" },
  { id: "nvidia/nemotron-3-super-120b-a12b", name: "Nemotron 3 Super 120B", category: "🧠 Deep Thinkers & Heavy Reasoning", badge: "🧠 Deep Thinker" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b", name: "Nemotron 3 Ultra 550B", category: "🧠 Deep Thinkers & Heavy Reasoning", badge: "🧠 Deep Thinker" },

  // 🏠 LOCAL INTEGRATION
  { id: "local-llava", name: "Local LLaVA 7B (Vision)", category: "🏠 Local Integration", isVision: true, badge: "🏠 Local Vision" },
  { id: "local-gguf", name: "Local Qwen Coder 2.5 7B", category: "🏠 Local Integration", badge: "🏠 Local Code" }
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
      <div className="relative w-full bg-[#061a24] overflow-hidden" style={{ minHeight: '200px', height: '600px', maxHeight: '68vh' }}>
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
      const chartMargin = { top: 15, right: 15, left: -12, bottom: 5 };
      switch (type) {
        case 'bar':
          return (
            <BarChart data={data} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,234,255,0.15)" />
              <XAxis dataKey={xAxisKey} tick={{ fill: '#7dd3e0', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(0,234,255,0.2)' }} />
              <YAxis tick={{ fill: '#7dd3e0', fontSize: 10 }} axisLine={{ stroke: 'rgba(0,234,255,0.2)' }} width={32} />
              <Tooltip contentStyle={{ background: 'rgba(6,30,40,0.95)', border: '1px solid rgba(0,234,255,0.4)', borderRadius: '10px', color: '#e6fdff' }} />
              <Legend wrapperStyle={{ color: '#a5f3ff', fontSize: '11px' }} />
              {dataKeys?.map((key, i) => (
                <Bar key={key} dataKey={key} fill={activeColors[i % activeColors.length]} radius={[6, 6, 0, 0]} />
              ))}
            </BarChart>
          );
        case 'line':
          return (
            <LineChart data={data} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,234,255,0.15)" />
              <XAxis dataKey={xAxisKey} tick={{ fill: '#7dd3e0', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(0,234,255,0.2)' }} />
              <YAxis tick={{ fill: '#7dd3e0', fontSize: 10 }} axisLine={{ stroke: 'rgba(0,234,255,0.2)' }} width={32} />
              <Tooltip contentStyle={{ background: 'rgba(6,30,40,0.95)', border: '1px solid rgba(0,234,255,0.4)', borderRadius: '10px', color: '#e6fdff' }} />
              <Legend wrapperStyle={{ color: '#a5f3ff', fontSize: '11px' }} />
              {dataKeys?.map((key, i) => (
                <Line key={key} type="monotone" dataKey={key} stroke={activeColors[i % activeColors.length]} strokeWidth={2.5} dot={{ r: 3, fill: activeColors[i % activeColors.length] }} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          );
        case 'area':
          return (
            <AreaChart data={data} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,234,255,0.15)" />
              <XAxis dataKey={xAxisKey} tick={{ fill: '#7dd3e0', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(0,234,255,0.2)' }} />
              <YAxis tick={{ fill: '#7dd3e0', fontSize: 10 }} axisLine={{ stroke: 'rgba(0,234,255,0.2)' }} width={32} />
              <Tooltip contentStyle={{ background: 'rgba(6,30,40,0.95)', border: '1px solid rgba(0,234,255,0.4)', borderRadius: '10px', color: '#e6fdff' }} />
              <Legend wrapperStyle={{ color: '#a5f3ff', fontSize: '11px' }} />
              {dataKeys?.map((key, i) => (
                <Area key={key} type="monotone" dataKey={key} fill={activeColors[i % activeColors.length]} stroke={activeColors[i % activeColors.length]} fillOpacity={0.22} />
              ))}
            </AreaChart>
          );
        case 'pie':
          return (
            <PieChart>
              <Tooltip contentStyle={{ background: 'rgba(6,30,40,0.95)', border: '1px solid rgba(0,234,255,0.4)', borderRadius: '10px' }} />
              <Legend wrapperStyle={{ color: '#a5f3ff', fontSize: '11px' }} />
              <Pie data={data} dataKey={dataKeys?.[0]} nameKey={xAxisKey} cx="50%" cy="50%" outerRadius={100} label={{ fill: '#e6fdff', fontSize: 11 }}>
                {data?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={activeColors[index % activeColors.length]} />
                ))}
              </Pie>
            </PieChart>
          );
        case 'scatter':
          return (
            <ScatterChart margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,234,255,0.15)" />
              <XAxis dataKey={xAxisKey} type="number" name={xAxisKey} tick={{ fill: '#7dd3e0', fontSize: 10 }} />
              <YAxis dataKey={dataKeys?.[0]} type="number" name={dataKeys?.[0]} tick={{ fill: '#7dd3e0', fontSize: 10 }} width={32} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: 'rgba(6,30,40,0.95)', border: '1px solid rgba(0,234,255,0.4)', borderRadius: '10px' }} />
              <Legend wrapperStyle={{ color: '#a5f3ff', fontSize: '11px' }} />
              <Scatter name={dataKeys?.[0]} data={data} fill={activeColors[0]} />
            </ScatterChart>
          );
        default:
          return <div className="text-red-300 p-4 mono text-xs">UNSUPPORTED CHART TYPE: {type}</div>;
      }
    };
    return (
      <div className="w-full my-5 sci-panel sci-panel-cut-sm border-cyan-400/20 bg-[rgba(8,30,40,0.85)] p-2 sm:p-5 overflow-hidden relative">
        <span className="corners"><i /><i /><i /><i /></span>
        {title && <h3 className="display text-xs sm:text-sm tracking-[0.18em] text-wrap
         text-center text-cyan-200 mb-2 mt-1">{title.toUpperCase()}</h3>}
        <div className="w-full overflow-x-auto scrollbar-thin pl-1 pr-2 py-1 relative z-10">
          <div className="h-[340px] w-full min-w-[320px] sm:min-w-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
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

const AutoResizeTextarea = ({ newMessage, setNewMessage, handleSendMessage, sending, onPaste }) => {
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
      onPaste={onPaste}
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

const compressAndProcessImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX_DIM = 1600;
      let width = img.width;
      let height = img.height;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = file.type === 'image/gif' || file.type === 'image/png' ? file.type : 'image/jpeg';
      const base64 = canvas.toDataURL(mimeType, 0.85);

      const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      resolve({
        file,
        objectUrl,
        base64,
        meta: {
          imageId,
          originalName: file.name,
          mimeType: file.type,
          width,
          height,
          sizeBytes: file.size
        }
      });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });
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
  const [pendingImages, setPendingImages] = useState([]);
  const [imageError, setImageError] = useState("");

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pendingImagesRef = useRef([]);
  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  const clearPendingImages = useCallback(() => {
    pendingImagesRef.current.forEach(img => {
      if (img.objectUrl) URL.revokeObjectURL(img.objectUrl);
    });
    setPendingImages([]);
    setImageError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const removePendingImage = (indexToRemove) => {
    setPendingImages(prev => {
      const target = prev[indexToRemove];
      if (target?.objectUrl) {
        URL.revokeObjectURL(target.objectUrl);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  useEffect(() => {
    clearPendingImages();
  }, [chatId, clearPendingImages]);

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach(img => {
        if (img.objectUrl) URL.revokeObjectURL(img.objectUrl);
      });
    };
  }, []);

  const processImageFiles = async (files) => {
    if (!files || !files.length) return;

    setImageError("");

    if (pendingImages.length + files.length > 2) {
      setImageError("Maximum 2 images allowed per message.");
    }

    const availableSlots = 2 - pendingImages.length;
    const filesToProcess = files.slice(0, availableSlots);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const newProcessedImages = [];

    for (const file of filesToProcess) {
      if (!validTypes.includes(file.type)) {
        setImageError("Unsupported format. Please attach JPEG, PNG, WEBP, or GIF.");
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setImageError("File size exceeds 5MB limit.");
        continue;
      }

      try {
        const processed = await compressAndProcessImage(file);
        newProcessedImages.push(processed);
      } catch (err) {
        console.error("Failed to process image preview:", err);
      }
    }

    if (newProcessedImages.length > 0) {
      setPendingImages(prev => [...prev, ...newProcessedImages].slice(0, 2));
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    processImageFiles(files);
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items || !items.length) return;

    const pastedFiles = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type && item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        if (blob) {
          const ext = blob.type.split('/')[1] || 'png';
          const file = new File(
            [blob],
            `pasted_image_${Date.now()}.${ext}`,
            { type: blob.type || 'image/png' }
          );
          pastedFiles.push(file);
          break; // Extract 1 image per paste action to prevent duplicate formats
        }
      }
    }

    if (pastedFiles.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      await processImageFiles(pastedFiles);
    }
  };

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
    const isLocal = selectedModel.startsWith('local-') || selectedModel.includes('local');
    if (isLocal) {
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
    if ((!newMessage.trim() && pendingImages.length === 0) || sending) return;

    const userMessageContent = newMessage.trim() || (pendingImages.length > 0 ? "Analyze attached image(s)." : "");
    const imagePayloads = pendingImages.map(img => img.base64);
    const imageMetaPayloads = pendingImages.map(img => img.meta);

    setNewMessage("");
    setSending(true);
    setStreamingMessage("");

    // Revoke and clear pending images immediately from React state
    clearPendingImages();

    abortControllerRef.current = new AbortController();
    const optimisticUserMsg = {
      _id: Date.now().toString(),
      message: userMessageContent,
      role: 'user',
      createdAt: new Date().toISOString(),
      ...(imageMetaPayloads.length > 0 ? { imageMetas: imageMetaPayloads, imageMeta: imageMetaPayloads[0] } : {})
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);
    let currentStreamText = '';
    const responseStartTime = Date.now();
    let isAbortedOrErrored = false;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: userMessageContent,
          model: selectedModel,
          images: imagePayloads,
          imageMetas: imageMetaPayloads,
          image: imagePayloads[0] || null,
          imageMeta: imageMetaPayloads[0] || null
        }),
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
                } else if (data.type === 'done') {
                  setMessages((prev) => [...prev, data.botMessage]);
                  setStreamingMessage("");
                  currentStreamText = '';
                } else if (data.type === 'error') {
                  isAbortedOrErrored = true;
                  setMessages((prev) => [...prev, data.botMessage]);
                  setStreamingMessage("");
                  currentStreamText = '';
                } else if (data.type === 'error_fatal') {
                  isAbortedOrErrored = true;
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
      isAbortedOrErrored = true;
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
      if (!isAbortedOrErrored) {
        const elapsedSec = Math.max(1, Math.round((Date.now() - responseStartTime) / 1000));
        window.dispatchEvent(new CustomEvent("model_probe_update", {
          detail: { modelId: selectedModel, elapsedSec }
        }));
      }
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
      <div className="relative z-40 px-3 lg:px-5 py-3 border-b border-white/8 bg-gradient-to-r from-white/[0.04] via-transparent to-white/[0.02] backdrop-blur-md flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 rounded-t-[22px]">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex items-center gap-4 min-w-0">
          <div className="hidden lg:flex w-10 h-10 rounded-[12px] bg-cyan-400/15 border border-white/10 items-center justify-center backdrop-blur">
            <Crosshair size={16} className="text-cyan-300" />
          </div>
          <div className="min-w-0">
            {/* <h3 className="display font-bold text-white tracking-[0.12em] text-sm flex items-center gap-2">
              <span className="text-cyan-400">&gt;_</span> INPUTCHAT <span className="hidden sm:inline mono text-[9px] tracking-[0.2em] text-cyan-300/60 border border-cyan-400/20 px-1.5 py-0.5 sci-panel-cut-sm bg-cyan-400/10">COCKPIT LINK</span>
            </h3> */}
            <div className="hidden lg:flex flex-wrap items-center gap-2 mt-1">
              {/* DB cluster HUD — single row button toggle with status LED */}
              <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/[0.04] backdrop-blur border border-white/10 shadow-md">
                <button
                  onClick={() => switchDb('global')}
                  disabled={globalDbStatus !== 'online' || dbEcosystem === 'checking'}
                  className={`mono text-[9.5px] font-bold px-3 py-1 rounded-full transition-all border flex items-center gap-1.5 ${dbEcosystem === 'global'
                    ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                    : 'bg-transparent text-white/50 border-transparent hover:bg-white/[0.06] hover:text-white/80'
                    } ${globalDbStatus !== 'online' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${globalDbStatus === 'online'
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                    : globalDbStatus === 'offline'
                      ? 'bg-red-500'
                      : 'bg-amber-400 animate-pulse'
                    }`} />
                  globalDB
                </button>

                <button
                  onClick={() => switchDb('local')}
                  disabled={localDbStatus !== 'online' || dbEcosystem === 'checking'}
                  className={`mono text-[9.5px] font-bold px-3 py-1 rounded-full transition-all border flex items-center gap-1.5 ${dbEcosystem === 'local'
                    ? 'bg-orange-500/25 text-orange-300 border-orange-400/60 shadow-[0_0_12px_rgba(249,115,22,0.35)]'
                    : 'bg-transparent text-white/50 border-transparent hover:bg-white/[0.06] hover:text-white/80'
                    } ${localDbStatus !== 'online' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${localDbStatus === 'online'
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                    : localDbStatus === 'offline'
                      ? 'bg-red-500'
                      : 'bg-amber-400 animate-pulse'
                    }`} />
                  localDB
                </button>
              </div>

              {/* Local AI Server Status Badge with Home Icon */}
              {(selectedModel.startsWith('local-') || selectedModel.includes('local')) && (
                <span className={`flex items-center gap-1.5 mono text-[9.5px] font-bold tracking-widest px-3 py-1.5 rounded-full border backdrop-blur shadow-md ${localServerStatus === 'online'
                  ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.25)]'
                  : localServerStatus === 'offline'
                    ? 'bg-red-500/15 border-red-400/30 text-red-300'
                    : 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                  }`}>
                  <Home size={11} className={localServerStatus === 'online' ? 'text-emerald-400' : 'text-current'} />
                  <span>AI: {localServerStatus.toUpperCase()}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Custom Model Selector HUD — glass with dark blue hover traveler */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative" ref={modelDropdownRef}>
            {/* Trigger Button */}
            <button
              onClick={() => setIsModelDropdownOpen((prev) => !prev)}
              className="relative flex items-center justify-between rounded-[12px] bg-white/[0.06] backdrop-blur border border-white/10 hover:border-cyan-400/40 text-white py-2 pl-3.5 pr-9 mono text-[.8rem] tracking-wide focus:outline-none focus:border-cyan-400/50 cursor-pointer min-w-[250px] max-w-[340px] truncate transition-all shadow-md"
            >
              <span className="truncate pr-2 font-medium">
                {AI_MODELS.find((m) => m.id === selectedModel)?.name || "Select Model"}
              </span>
              <ChevronDown
                size={14}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition-transform duration-200 ${isModelDropdownOpen ? "rotate-180 text-cyan-400" : ""
                  }`}
              />
            </button>

            {/* Dropdown Menu Popup */}
            {isModelDropdownOpen && (
              <div className="absolute lg:right-0 mt-2 w-[320px] max-h-[380px] overflow-y-auto rounded-[14px] bg-[#07131e] border border-cyan-400/50 shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-[100] py-1.5 scrollbar-thin divide-y divide-white/5">
                {Array.from(new Set(AI_MODELS.map((m) => m.category))).map((cat) => (
                  <div key={cat} className="py-1">
                    {/* Category Header */}
                    <div className="px-3.5 py-1.5 mono text-[9.5px] font-extrabold tracking-widest text-cyan-400 uppercase bg-cyan-950/40 flex items-center justify-between">
                      <span>{cat}</span>
                    </div>

                    {/* Model Items */}
                    <div className="space-y-0.5 mt-0.5">
                      {AI_MODELS.filter((m) => m.category === cat).map((model) => {
                        const isSelected = model.id === selectedModel;
                        return (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model.id);
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 mono text-[11.5px] tracking-wide transition-colors flex items-center justify-between group ${isSelected
                              ? "bg-cyan-500/25 text-cyan-200 font-bold border-l-3 border-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
                              : "text-slate-300 hover:bg-[#0f2a3f] hover:text-cyan-200"
                              }`}
                          >
                            <span className="truncate pr-2">{model.name}</span>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area — responsive */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 lg:p-4 scrollbar-thin scroll-smooth relative" style={{ transformStyle: 'preserve-3d' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(600px 300px at 50% 42%, rgba(0,234,255,0.04), transparent 70%)' }} />
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

                      {isUser && (msg.imageMetas?.length > 0 || msg.imageMeta) && (
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {(msg.imageMetas || [msg.imageMeta]).map((meta, i) => (
                            <div key={meta.imageId || i} className="p-1.5 px-2 bg-[rgba(0,19,26,0.35)] border border-[#00eaff]/30 rounded flex items-center gap-1.5 mono text-[10px] text-[#00131a]">
                              <ImageIcon size={13} className="shrink-0 text-[#00131a]" />
                              <span className="font-bold">📷 image analyzed (not stored) • {meta.originalName || 'Image'} ({Math.round(meta.sizeBytes / 1024)}KB)</span>
                            </div>
                          ))}
                        </div>
                      )}

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
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
          />

          {/* Image Validation Error Alert */}
          {imageError && (
            <div className="mb-2 px-3 py-2 bg-red-950/80 border border-red-500/30 rounded-lg text-red-200 mono text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <span>{imageError}</span>
              </div>
              <button type="button" onClick={() => setImageError("")} className="text-red-400 hover:text-white">
                <X size={12} />
              </button>
            </div>
          )}

          <div className="relative group" style={{ transformStyle: 'preserve-3d' }}>
            <div className="deck-glow rounded-[16px]" />
            <form onSubmit={handleSendMessage} className="relative flex flex-col glass-holo bg-white/[0.06] border-white/10 focus-within:border-cyan-400/30 focus-within:shadow-[0_0_28px_rgba(0,234,255,0.18),0_12px_32px_rgba(0,0,0,0.42)] transition-all overflow-hidden" style={{ borderRadius: '8px', transform: 'translateZ(10px)' }}>

              {/* Image Box Preview Container Inside Message Box */}
              {pendingImages.length > 0 && (
                <div className="w-full p-2 bg-[#081822]/90 border-b border-cyan-400/20 flex items-center gap-2.5 overflow-x-auto">
                  {pendingImages.map((img, index) => (
                    <div key={img.meta.imageId || index} className="relative group shrink-0 rounded-lg overflow-hidden border border-cyan-400/40 bg-black/40 shadow-[0_0_12px_rgba(0,234,255,0.2)]">
                      <img src={img.objectUrl} alt={`Attachment ${index + 1}`} className="w-16 h-16 object-cover" />
                      <button
                        type="button"
                        onClick={() => removePendingImage(index)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-md hover:bg-red-500 transition-transform hover:scale-110 cursor-pointer"
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-black/75 px-1 py-0.5 text-center">
                        <span className="mono text-[8px] text-cyan-200 block truncate max-w-[60px]">{img.meta.originalName}</span>
                      </div>
                    </div>
                  ))}
                  {pendingImages.length < 2 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 rounded-lg border border-dashed border-cyan-400/30 hover:border-cyan-400/60 bg-white/[0.03] hover:bg-cyan-500/10 flex flex-col items-center justify-center gap-1 text-cyan-300/70 hover:text-cyan-200 transition-all cursor-pointer shrink-0"
                      title="Add 2nd image"
                    >
                      <Paperclip size={14} />
                      <span className="mono text-[8px] tracking-wider">+ ADD</span>
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-end w-full relative">
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
                  onPaste={handlePaste}
                />

                {/* action cluster */}
                <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending || pendingImages.length >= 2}
                    className="w-8 h-8 lg:w-10 lg:h-10 rounded-[12px] bg-white/[0.06] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/30 text-cyan-300 flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:opacity-40"
                    title={pendingImages.length >= 2 ? "Maximum 2 images attached" : "Attach temporary image (max 2 images, 5MB each)"}
                  >
                    <Paperclip size={16} />
                  </button>

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
                      disabled={(!newMessage.trim() && pendingImages.length === 0) || sending}
                      className="w-8 h-8 lg:w-10 lg:h-10 rounded-[12px] bg-cyan-400 text-black hover:bg-cyan-300 disabled:opacity-30 disabled:bg-white/10 disabled:text-white/30 border border-cyan-300 shadow-[0_0_16px_rgba(0,234,255,0.5)] flex items-center justify-center transition-all hover:scale-[1.03] active:scale-95"
                    >
                      <Send size={16} className="ml-0.5" />
                    </button>
                  )}
                </div>
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
                <ShieldCheck size={12} className="text-cyan-400/40" /> Images processed temporarily.
              </p>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
