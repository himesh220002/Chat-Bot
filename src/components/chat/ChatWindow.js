import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, Bot, User as UserIcon, ChevronDown, Copy, Check, ZoomIn, Cpu, Radio, Activity, ShieldCheck, Orbit, Sparkles, Terminal, Crosshair, Paperclip, Image as ImageIcon, X, AlertCircle, Home, FileText, FileJson, Plus } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';
import ChecklistRenderer from './ChecklistRenderer';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const extractResourcesFromMessages = (messages) => {
  const resources = [];
  const seen = new Set();
  const inferTags = (url, label, section) => {
    const tags = [];
    const u = url.toLowerCase();
    const l = (label + ' ' + (section || '')).toLowerCase();
    if (u.includes('github.com')) tags.push('CODE');
    else if (u.includes('amazon')) tags.push('SHOP');
    else if (u.includes('nostarch')) tags.push('PUBLISHER');
    else if (u.includes('oreilly')) tags.push('PUBLISHER');
    else if (l.includes('official site') || l.includes('free to read')) tags.push('FREE');
    else if (l.includes('publisher')) tags.push('PUBLISHER');
    else if (l.includes('author') || l.includes('github')) tags.push('AUTHOR');
    else if (l.includes('shop') || l.includes('buy')) tags.push('SHOP');
    else tags.push('RESOURCE');
    if (tags.length < 2) {
      if (section && /python|ai|book/i.test(section) && !tags.includes('BOOK')) tags.push('BOOK');
      else if (u.includes('automatetheboringstuff')) tags.push('FREE');
    }
    return tags.slice(0, 2);
  };
  const cleanSection = (s) => String(s).replace(/^[#\d.\s*]+/, '').replace(/[*_`"'`]+/g, '').replace(/\s*\(by\s+[^)]+\)$/i, '').replace(/\s*-\s*[A-Za-z].*$/, '').trim().slice(0, 40);
  messages.forEach(msg => {
    if (msg.role !== 'assistant') return;
    const text = msg.message || '';
    const lines = text.split('\n');
    let currentSection = '';
    lines.forEach(line => {
      const raw = line.trim();
      const mNum = raw.match(/^\s*\d+\.\s+(.+)/);
      if (mNum) {
        let t = mNum[1].replace(/^[*"`']+|[*"`']+$/g, '').trim();
        t = t.split(' - ')[0].split(' (by')[0].replace(/[*_`"'`]+/g, '').trim();
        if (t.length > 5) currentSection = cleanSection(t);
      } else if (/^#{1,3}\s+/.test(raw)) {
        currentSection = cleanSection(raw.replace(/^#+\s+/, ''));
      }
      // Markdown links in this line
      const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
      let m;
      while ((m = mdLinkRegex.exec(line)) !== null) {
        let linkText = m[1].trim();
        const url = m[2].trim().replace(/[.,;!?]+$/, '');
        if (seen.has(url)) continue;
        seen.add(url);
        try {
          const domain = new URL(url).hostname.replace(/^www\./, '');
          let displayTitle = linkText;
          let snippet = '';
          // If linkText is a URL, use preceding label or section as name
          if (/^https?:\/\//.test(linkText)) {
            const prefix = line.split(url)[0] || line;
            const labelMatch = prefix.match(/([A-Za-z][A-Za-z\s()/-]+):\s*[^:]*$/);
            const label = labelMatch ? labelMatch[1].trim() : '';
            const sec = currentSection || '';
            displayTitle = label ? `${sec ? sec + ' • ' : ''}${label}` : (sec || domain);
            snippet = label && label.toLowerCase().includes('free') ? 'Free to read online' : (sec ? `About ${sec}` : `Visit ${domain}`);
          } else {
            snippet = currentSection ? `From ${currentSection}` : `Resource • ${domain}`;
            // Try to get Best for line nearby
            const bestIdx = lines.indexOf(line);
            const nextLine = lines[bestIdx + 1] || '';
            const bestMatch = nextLine.match(/Best for:\s*(.+)/i) || line.match(/Best for:\s*(.+)/i);
            if (bestMatch) snippet = bestMatch[1].trim().slice(0, 80);
          }
          displayTitle = displayTitle.replace(/^\d+\.\s*/, '').replace(/^["'`]+|["'`]+$/g, '').trim();
          if (displayTitle.includes('•')) {
            const p = displayTitle.split('•');
            const secP = cleanSection(p[0]);
            let labP = p[1].trim().split('(')[0].trim().replace(/^["'`]+|["'`]+$/g, '');
            displayTitle = labP ? `${secP} • ${labP}` : secP;
          } else {
            displayTitle = displayTitle.split('(')[0].trim();
          }
          displayTitle = displayTitle.replace(/\s+/g, ' ').trim().slice(0, 48);
          const tags = inferTags(url, displayTitle, currentSection);
          resources.push({ title: displayTitle || domain, url, domain, msgId: msg._id, snippet: snippet.slice(0, 80), tags, type: tags[0] });
        } catch { }
      }
      // Bare URLs not in markdown
      const bareRegex = /(?<!\]\()https?:\/\/[^\s)\]]+/g;
      const bareMatches = line.match(bareRegex) || [];
      bareMatches.forEach(rawUrl => {
        const url = rawUrl.trim().replace(/[.,;!?]+$/, '').replace(/\)$/, '');
        if (seen.has(url)) return;
        // Skip if already captured as markdown on same line (check if url was in md link)
        if (line.includes(`](${url}`)) return;
        seen.add(url);
        try {
          const domain = new URL(url).hostname.replace(/^www\./, '');
          const prefix = line.split(url)[0] || '';
          const labelMatch = prefix.match(/([A-Za-z][A-Za-z\s()/-]+):\s*[^:]*$/);
          const label = labelMatch ? labelMatch[1].trim() : currentSection || domain;
          let dispTitle = currentSection ? `${cleanSection(currentSection)} • ${label.split('(')[0].trim()}` : label;
          dispTitle = dispTitle.replace(/^\d+\.\s*/, '').replace(/^["'`]+|["'`]+$/g, '').replace(/\s+/g, ' ').trim().slice(0, 48);
          const snippet = /free/i.test(label) ? 'Free to read online' : (currentSection ? `About ${cleanSection(currentSection)}` : `Visit ${domain}`);
          const tags = inferTags(url, dispTitle, currentSection);
          resources.push({ title: dispTitle || domain, url, domain, msgId: msg._id, snippet: snippet.slice(0, 80), tags, type: tags[0] });
        } catch { }
      });
    });
  });
  return resources;
};

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
    padding: 8,
    nodeSpacing: 26,
    rankSpacing: 44,
    wrappingWidth: 170,
    diagramPadding: 10,
    useMaxWidth: false
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
    fontSize: '13px'
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

const sanitizeMermaid = (raw) => {
  let s = String(raw).replace(/^mermaid\s+/i, '').trim();
  // Normalize graph directive
  s = s.replace(/^graph\s+(TD|LR|BT|RL)\s*/i, 'graph $1\n');
  // Strip style/classDef that fast models hallucinate – theme handles styling
  s = s.replace(/^\s*style\s+.*$/gm, '');
  s = s.replace(/^\s*classDef\s+.*$/gm, '');
  s = s.replace(/^\s*class\s+.*$/gm, '');
  // Fix arrow typos: --| -> -->|
  s = s.replace(/--\s*\|/g, '-->|');
  // Fix double label: D -- Yes -->|Slow down| E  -> D -->|Yes| E (keep first)
  s = s.replace(/(\w+)\s*--\s*([^|\n-]+?)\s*-->\s*\|([^|]+)\|/g, '$1 -->|$2|');
  // Fix duplicate pipe close: -->|label|> -> -->|label|
  s = s.replace(/-+>\s*\|([^|]+)\|\s*>/g, '-->|$1| ');
  s = s.replace(/-\.+>/g, '-.->');
  // Sanitize diamond labels containing > < & to avoid parser breaking on "Speed > threshold?"
  s = s.replace(/\{([^}]*)\}/g, (m, inner) => {
    if (/[><&]/.test(inner)) {
      const cleaned = inner.replace(/>/g, ' greater than ').replace(/</g, ' less than ').replace(/&/g, ' and ').replace(/\s+/g, ' ').trim();
      if (cleaned !== inner) return `{"${cleaned}"}`;
    }
    return m;
  });
  s = s.replace(/<br\s*\/?>/gi, '<br/>');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
};

const aggressiveFix = (raw) => {
  const sanitized = sanitizeMermaid(raw);
  // If still fails, extract only graph + arrows, drop everything else
  const lines = sanitized.split('\n').map(l => l.trim()).filter(Boolean);
  const keep = [];
  for (const l of lines) {
    if (/^graph\s+(TD|LR|BT|RL)/i.test(l)) keep.push(l);
    else if (l.includes('-->') && !l.startsWith('style')) {
      keep.push(l.split('//')[0].trim()); // strip inline comments
    }
  }
  if (keep.length < 2) return `graph TD\n  A[Start] --> B[End]`;
  return keep.join('\n');
};

const MermaidDiagram = ({ chart, isStreaming }) => {
  const [svg, setSvg] = useState('');
  const [hasError, setHasError] = useState(false);
  const [sanitizedPreview, setSanitizedPreview] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [id] = useState(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`);

  const handleCopy = () => {
    navigator.clipboard.writeText(chart);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    if (isStreaming) return;
    const sanitizedChart = sanitizeMermaid(chart);
    setSanitizedPreview(sanitizedChart);
    let isMounted = true;
    const renderDiagram = async () => {
      const tryRender = async (code) => {
        await mermaid.parse(code);
        const { svg: renderedSvg } = await mermaid.render(id + '-' + Date.now(), code);
        return renderedSvg.replace(/<svg/, '<svg preserveAspectRatio="xMidYMid meet"');
      };
      try {
        const svgOut = await tryRender(sanitizedChart);
        if (isMounted) {
          setSvg(svgOut);
          setHasError(false);
        }
      } catch (err) {
        // fallback aggressive fix (handles Nemotron double-label hallucinations)
        try {
          const fixed = aggressiveFix(chart);
          setSanitizedPreview(fixed);
          const svgOut2 = await tryRender(fixed);
          if (isMounted) {
            setSvg(svgOut2);
            setHasError(false);
          }
        } catch (err2) {
          if (isMounted) setHasError(true);
        }
      }
    };
    renderDiagram();
    return () => { isMounted = false; };
  }, [chart, id, isStreaming]);

  if (hasError) {
    return (
      <div className="relative my-4 sci-panel sci-panel-cut-sm border-red-500/30 bg-[#081e28]/90 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-red-500/10 border-b border-red-500/20">
          <span className="mono text-[10px] tracking-[0.18em] text-red-300 flex items-center gap-1.5"><AlertCircle size={12} className="text-red-400" /> INVALID DIAGRAM • SYNAPTIC ERROR</span>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="mono text-[10px] tracking-widest px-2 py-1 bg-black/20 border border-white/10 text-white/70 hover:text-white hover:border-red-400/30 transition-colors flex items-center gap-1 cursor-pointer">
              {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />} {isCopied ? 'COPIED' : 'COPY SOURCE'}
            </button>
          </div>
        </div>
        <div className="p-3 mono text-[10px] leading-relaxed text-red-200/70 bg-red-950/20 border-b border-red-500/10">
          Fast models (e.g. Nemotron) sometimes emit <span className="text-white font-bold">D -- Yes --&gt;|label|</span> or <span className="text-white font-bold">style</span> hallucinations. Auto-fix attempted – showing source for manual correction.
          {sanitizedPreview && sanitizedPreview !== chart && (
            <div className="mt-2 text-cyan-300/60">Auto-fixed preview differs – retry will use sanitized version.</div>
          )}
        </div>
        <SyntaxHighlighter
          language="mermaid"
          style={vscDarkPlus}
          PreTag="div"
          className="!m-0 !bg-[#081e28] border-0"
          customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '12px' }}
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
    <div className="group relative w-full my-5 bg-[#081e28] border border-cyan-400/20 hover:border-cyan-400/30 shadow-[0_0_24px_rgba(0,234,255,0.14)] hover:shadow-[0_0_32px_rgba(0,234,255,0.20)] overflow-hidden transition-all duration-300" style={{ clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px), calc(100% - 8px) 100%,0 100%,0 8px)' }}>
      <div className="flex items-center justify-between px-3 py-2.5 bg-cyan-400/10 border-b border-cyan-400/15 mono text-[10px] tracking-[0.18em] text-cyan-200">
        <span className="flex items-center gap-1.5"><Sparkles size={12} className="text-cyan-400" /> HOLO • DIAGRAM MATRIX</span>
        <span className="flex items-center gap-2">
          <span className="hidden sm:inline mono text-[8px] text-white/30 opacity-60">AUTO FIT • DRAG PAN</span>
          <span className="hidden sm:inline opacity-60">VECTOR NODE</span>
          <button onClick={handleCopy} className="ml-2 mono text-[9px] tracking-widest px-2 py-1 bg-black/20 border border-cyan-400/20 text-cyan-200/70 hover:text-cyan-200 hover:border-cyan-400/40 hover:bg-cyan-400/10 transition-colors flex items-center gap-1 cursor-pointer">
            {isCopied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />} {isCopied ? 'COPIED' : 'COPY'}
          </button>
        </span>
      </div>
      <div className="relative w-full bg-[#061a24] min-h-[160px] h-fit max-h-[80vh] overflow-auto">
        <div className="w-full min-h-[160px] flex justify-center items-start p-2 md:p-3 mermaid-viewport bg-[radial-gradient(ellipse_at_center,rgba(0,234,255,0.04),transparent_70%)] overflow-visible">
          <div
            dangerouslySetInnerHTML={{ __html: svg }}
            className="mermaid-svg-wrap w-full flex justify-center items-start [&>svg]:!max-w-none [&>svg]:!w-auto [&>svg]:!h-auto [&>svg]:block [&>svg]:mx-auto [&>svg]:min-w-[320px] md:[&>svg]:min-w-[420px]"
            style={{ maxWidth: 'none', minWidth: '0' }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#061a24] border-t border-cyan-400/10 mono text-[8px] tracking-widest text-white/25">
        <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> RENDERED • HOLO ENGINE</span>
        <span className="hidden sm:inline text-cyan-300/40">PINCH • SCROLL TO EXPLORE</span>
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
        const rawStr = String(children);
        let config;
        const parseLoose = (s) => {
          try { return JSON.parse(s); } catch (e) { }
          const m = s.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          const c = m ? m[0] : s;
          try { return JSON.parse(c); } catch (e) { }
          try {
            const r = c
              .replace(/([a-zA-Z0-9_$]+)':/g, '"$1":')
              .replace(/:\s*([^'"\r\n{}[\],]+)'\s*([,}])/g, ': "$1"$2')
              .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')
              .replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":')
              .replace(/,\s*([}\]])/g, '$1');
            return JSON.parse(r);
          } catch (e) { }
          try {
            const jr = c.replace(/([a-zA-Z0-9_$]+)':/g, '$1:').replace(/:\s*([^'"\r\n{}[\],]+)'\s*([,}])/g, ': "$1"$2');
            if (/^\s*[{[]/.test(jr)) {
              // eslint-disable-next-line no-new-func
              return (new Function(`"use strict"; return (${jr});`))();
            }
          } catch (e) { }
          return null;
        };
        config = parseLoose(rawStr);
        if (config && config.type && Array.isArray(config.data) && config.xAxisKey) {
          return <ChartRenderer configStr={rawStr} />;
        }
        // Auto-detect checklist/report JSON in generic json block
        if (config && (config.branches || config.sections || config.categories || config.checklist)) {
          return <ChecklistRenderer raw={rawStr} isStreaming={isStreaming} />;
        }
      } catch (e) { }
    } else {
      return <ChartRenderer configStr={String(children)} />;
    }
  }
  if (!inline && match) {
    if (['checklist', 'form', 'todo'].includes(match[1].toLowerCase())) {
      return <ChecklistRenderer raw={String(children)} isStreaming={isStreaming} />;
    }
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

const InteractiveTaskItem = ({ node, children, ...props }) => {
  const initialChecked = node?.properties?.checked ?? false;
  const [checked, setChecked] = useState(initialChecked);
  const content = React.Children.toArray(children).filter(child => {
    if (React.isValidElement(child) && child.props?.type === 'checkbox') return false;
    if (React.isValidElement(child) && child.type === 'input') return false;
    return true;
  });
  const taskText = content.map(c => typeof c === 'string' ? c : (c?.props?.children ? String(c.props.children).replace(/\n/g, ' ') : '')).join('').trim().slice(0, 120);
  return (
    <li
      onClick={() => setChecked(!checked)}
      data-checked={checked ? 'true' : 'false'}
      data-task-text={taskText}
      className={`pl-1 pr-2 py-2 raj text-white font-medium text-[13px] lg:text-[14px] leading-6 flex gap-2.5 items-start rounded-[10px] border cursor-pointer select-none transition-all ${checked ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.06]'}`}
      {...props}
    >
      <span className={`w-5 h-5 rounded-[6px] border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${checked ? 'bg-emerald-400 border-emerald-400 text-black shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-transparent border-white/20 hover:border-cyan-400/40'}`}>
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      <span className={`flex-1 flex flex-wrap gap-1 ${checked ? 'line-through text-white/40' : 'text-white'}`}>{content}</span>
    </li>
  );
};

const AssistantMessageActions = ({ message }) => {
  const hasChecklist = /- \[[ x]\]/i.test(message) || /Preparation Checklist/i.test(message) || /Guest Tracking/i.test(message);
  const hasJson = /"event_name"/.test(message) || /```json/.test(message);
  const isChecklistBlock = /```checklist/i.test(message);
  if (isChecklistBlock) return null;
  if (!hasChecklist && !hasJson) return null;
  const download = (ext, content, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guest-list-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleCopy = () => navigator.clipboard.writeText(message);
  const handleDownloadMD = (e) => {
    const bubble = e.currentTarget.closest('.holo-msg');
    let finalMd = message;
    let liveSection = '';
    if (bubble) {
      const formInputs = bubble.querySelectorAll('input[data-form-field]');
      if (formInputs.length) {
        const hasValues = Array.from(formInputs).some(inp => inp.value.trim());
        if (hasValues) {
          liveSection += `\n\n---\n## ✏️ Edited Event Overview (Live)\n`;
          formInputs.forEach(inp => {
            const label = inp.getAttribute('data-form-field') || 'Field';
            const val = inp.value.trim();
            liveSection += `- **${label}** ${val || '_(empty)_'}\n`;
          });
        }
      }
      const taskLis = bubble.querySelectorAll('li[data-checked]');
      if (taskLis.length) {
        liveSection += `\n## ✅ Edited Checklist (Live State)\n`;
        taskLis.forEach(li => {
          const checked = li.getAttribute('data-checked') === 'true';
          const text = li.getAttribute('data-task-text') || li.textContent.trim().replace(/\n/g, ' ').slice(0, 120);
          liveSection += `- [${checked ? 'x' : ' '}] ${text}\n`;
        });
      }
      const guestTable = bubble.querySelector('[data-editable-guest-table]');
      if (guestTable) {
        const rows = guestTable.querySelectorAll('tbody tr');
        const hasRows = Array.from(rows).some(tr => Array.from(tr.querySelectorAll('input[data-guest-field]')).some(inp => inp.value.trim()));
        if (hasRows) {
          liveSection += `\n## 👥 Guest Tracking Table (Edited)\n`;
          liveSection += `| Guest Name | Category | RSVP Status | Meal Preference | Notes |\n|---|---|---|---|---|\n`;
          rows.forEach(tr => {
            const inputs = tr.querySelectorAll('input[data-guest-field]');
            if (inputs.length) {
              const vals = Array.from(inputs).map(inp => inp.value.trim() || ' ');
              if (vals.some(v => v.trim())) liveSection += `| ${vals.join(' | ')} |\n`;
            }
          });
        }
      }
    }
    if (liveSection) finalMd += liveSection;
    download('md', finalMd, 'text/markdown');
  };
  const handleDownloadJSON = (e) => {
    const bubble = e.currentTarget.closest('.holo-msg');
    let jsonObj = null;
    const match = message.match(/```json\s*\n([\s\S]*?)\n```/);
    try { jsonObj = match ? JSON.parse(match[1].trim()) : JSON.parse(message); } catch { jsonObj = { raw: message }; }
    if (bubble) {
      const formInputs = bubble.querySelectorAll('input[data-form-field]');
      const formData = {};
      formInputs.forEach(inp => { const k = inp.getAttribute('data-form-field')?.replace(':', '').trim(); if (k) formData[k] = inp.value; });
      const taskLis = bubble.querySelectorAll('li[data-checked]');
      const checklist = Array.from(taskLis).map(li => ({ text: li.getAttribute('data-task-text') || li.textContent.trim().slice(0, 120), checked: li.getAttribute('data-checked') === 'true' }));
      const guestRows = [];
      const guestTable = bubble.querySelector('[data-editable-guest-table]');
      if (guestTable) {
        guestTable.querySelectorAll('tbody tr').forEach(tr => {
          const inputs = tr.querySelectorAll('input[data-guest-field]');
          if (inputs.length) {
            const vals = Array.from(inputs).map(i => i.value.trim());
            if (vals.some(v => v)) guestRows.push({ guestName: vals[0] || '', category: vals[1] || '', rsvp: vals[2] || '', meal: vals[3] || '', notes: vals[4] || '' });
          }
        });
      }
      jsonObj = {
        ...jsonObj,
        _editedAt: new Date().toISOString(),
        _liveState: {
          formFields: formData,
          checklist,
          guestTable: guestRows
        }
      };
      // If original had guests array, merge
      if (jsonObj.guests && guestRows.length) {
        jsonObj.guests = guestRows.map(r => ({ name: r.guestName, category: r.category, rsvp: r.rsvp, meal: r.meal, notes: r.notes }));
      }
    }
    download('json', JSON.stringify(jsonObj, null, 2), 'application/json');
  };
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 p-2.5 rounded-[10px] bg-white/[0.04] border border-cyan-400/10">
      <span className="mono text-[9px] tracking-[0.16em] text-cyan-300/50">CHECKLIST ACTIONS:</span>
      <button onClick={handleCopy} className="mono text-[10px] tracking-widest px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/30 text-white/70 hover:text-cyan-200 flex items-center gap-1.5 cursor-pointer transition-colors"><Copy size={12} /> COPY</button>
      <button onClick={handleDownloadMD} className="mono text-[10px] tracking-widest px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/30 text-white/70 hover:text-cyan-200 flex items-center gap-1.5 cursor-pointer transition-colors"><FileText size={12} /> DOWNLOAD MD (LIVE)</button>
      <button onClick={handleDownloadJSON} className="mono text-[10px] tracking-widest px-3 py-1.5 rounded-full bg-cyan-400/15 hover:bg-cyan-400/25 border border-cyan-400/30 text-cyan-200 flex items-center gap-1.5 cursor-pointer transition-colors"><FileJson size={12} /> DOWNLOAD JSON (LIVE)</button>
    </div>
  );
};


const EditableFormFieldLi = ({ label, ...props }) => {
  const [value, setValue] = useState('');
  return (
    <li className="list-none pl-0 flex items-center gap-3 w-full py-1.5" data-form-field={label} {...props}>
      <span className="mono text-[11px] tracking-[0.14em] text-cyan-300 min-w-[130px] shrink-0">{label}</span>
      <input
        data-form-field={label}
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Type here..."
        className="flex-1 bg-[#061a24] border border-white/10 focus:border-cyan-400/30 rounded px-3 py-1.5 mono text-xs text-white placeholder:text-white/25 outline-none"
      />
    </li>
  );
};

const EditableGuestTable = (props) => {
  const columns = ["Guest Name", "Category", "RSVP Status", "Meal Preference", "Notes"];
  const [rows, setRows] = useState([]);
  const addRow = () => setRows(prev => [...prev, { id: Date.now() + Math.random(), values: Array(columns.length).fill('') }]);
  const updateCell = (rowIdx, colIdx, val) => setRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, values: r.values.map((v, j) => j === colIdx ? val : v) } : r));
  const removeRow = (rowIdx) => setRows(prev => prev.filter((_, i) => i !== rowIdx));
  return (
    <div className="overflow-x-auto mb-4 sci-panel sci-panel-cut-sm border-cyan-400/20" data-editable-guest-table>
      <table className="w-full text-left border-collapse text-sm raj">
        <thead className="bg-cyan-400/10 border-b border-cyan-400/20">
          <tr>
            {columns.map(col => <th key={col} className="p-2.5 mono text-[11px] tracking-widest text-cyan-200 whitespace-nowrap">{col}</th>)}
            <th className="p-2.5 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length + 1} className="p-6 text-center mono text-xs tracking-widest text-white/20 border-t border-white/5">NO GUESTS • ADD BELOW</td></tr>
          ) : (
            rows.map((row, rIdx) => (
              <tr key={row.id} className="border-t border-white/5">
                {row.values.map((val, cIdx) => (
                  <td key={cIdx} className="p-1.5">
                    <input
                      data-guest-field={`${rIdx}-${cIdx}`}
                      value={val}
                      onChange={e => updateCell(rIdx, cIdx, e.target.value)}
                      placeholder={columns[cIdx].slice(0, 6)}
                      className="w-full bg-[#061a24] border border-white/10 focus:border-cyan-400/30 rounded px-2 py-1.5 mono text-xs text-white placeholder:text-white/20 outline-none"
                    />
                  </td>
                ))}
                <td className="p-1.5">
                  <button onClick={() => removeRow(rIdx)} className="w-7 h-7 rounded-full bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-300 hover:text-white flex items-center justify-center cursor-pointer"><X size={12} /></button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="p-2 bg-black/10 border-t border-white/5 flex justify-center">
        <button onClick={addRow} className="mono text-[11px] tracking-widest px-4 py-1.5 rounded-full bg-cyan-400/15 hover:bg-cyan-400/25 border border-cyan-400/30 text-cyan-200 flex items-center gap-1.5 cursor-pointer"><Plus size={12} /> ADD GUEST</button>
      </div>
    </div>
  );
};

const MarkdownComponents = {
  code: CodeBlock,
  h1: ({ node, children, ...props }) => <h1 className="display text-[18px] lg:text-[22px] font-extrabold mt-5 lg:mt-7 mb-3 lg:mb-4 text-white border-b border-white/10 pb-2 lg:pb-3 tracking-wide leading-tight" {...props}>{children}</h1>,
  h2: ({ node, children, ...props }) => <h2 className="display text-[15px] lg:text-[18px] font-bold mt-4 lg:mt-6 mb-2 lg:mb-3 text-white tracking-wide leading-snug" {...props}>{children}</h2>,
  h3: ({ node, children, ...props }) => <h3 className="display text-[14px] lg:text-[16px] font-bold mt-4 lg:mt-5 mb-2 lg:mb-3 text-white tracking-wide" {...props}>{children}</h3>,
  p: ({ node, children, ...props }) => <p className="mb-3 lg:mb-4 last:mb-0 leading-6 lg:leading-7 text-white raj text-[13px] lg:text-[15.5px] font-medium tracking-[0.01em]" {...props}>{children}</p>,
  ul: ({ node, children, ...props }) => {
    const isTaskList = node?.properties?.className?.includes('contains-task-list');
    return <ul className={`${isTaskList ? 'list-none pl-0 space-y-2' : 'list-none pl-0 mb-4 lg:mb-5 space-y-1.5 lg:space-y-2'}`} {...props}>{children}</ul>;
  },
  ol: ({ node, children, ...props }) => <ol className="list-decimal pl-5 lg:pl-6 mb-4 lg:mb-5 space-y-1.5 lg:space-y-2 marker:text-white marker:font-bold text-[13px] lg:text-[14px]" {...props}>{children}</ol>,
  li: ({ node, children, ...props }) => {
    const isTask = node?.properties?.className?.includes('task-list-item');
    if (isTask) return <InteractiveTaskItem node={node} {...props}>{children}</InteractiveTaskItem>;
    const text = React.Children.toArray(children).map(c => typeof c === 'string' ? c : (c?.props?.children ? String(c.props.children) : '')).join('').trim();
    const isFormField = /^(Event Name|Date & Time|Venue|Target Capacity|Budget per Guest|Event Name:|Date & Time:|Venue:|Target Capacity:|Budget per Guest:)/i.test(text) || (text.includes(':') && /_/.test(text));
    if (isFormField) {
      const label = text.split(':')[0].trim() + ':';
      if (text.includes('_')) return <EditableFormFieldLi label={label} {...props} />;
    }
    return <li className="pl-1 raj text-white font-medium text-[13px] lg:text-[15px] leading-6 lg:leading-7 flex flex-wrap gap-2 lg:gap-2.5 before:content-['▸'] before:text-white before:font-bold before:mono before:text-xs lg:before:text-sm before:mt-0.5" {...props}>{children}</li>;
  },
  input: ({ node, checked, ...props }) => {
    if (props.type === 'checkbox') return null;
    return <input {...props} />;
  },
  a: ({ node, children, ...props }) => <a className="text-cyan-300 hover:text-white hover:underline decoration-white/30 underline-offset-4 font-semibold" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
  blockquote: ({ node, ...props }) => <blockquote className="border-l-[3px] border-white pl-5 py-3 my-5 bg-white/[0.06] mono text-[14px] leading-6 text-white font-medium" style={{ clipPath: 'polygon(4px 0,100% 0,100% calc(100% - 4px), calc(100% - 4px) 100%,0 100%,0 4px)' }} {...props} />,
  table: ({ node, ...props }) => {
    const getText = (children) => {
      let t = '';
      const walk = (c) => {
        if (typeof c === 'string') t += c + ' ';
        else if (Array.isArray(c)) c.forEach(walk);
        else if (React.isValidElement(c) && c.props?.children) walk(c.props.children);
        else if (c && typeof c === 'object' && c.props?.children) walk(c.props.children);
      };
      walk(children);
      return t;
    };
    try {
      const headerText = getText(props.children) + ' ' + getText(node?.children);
      if (/guest\s*name/i.test(headerText) || /rsvp/i.test(headerText) || /meal/i.test(headerText) || /category/i.test(headerText)) {
        return <EditableGuestTable {...props} />;
      }
    } catch { }
    // Fallback: treat any table with 4+ columns as editable guest-like if previous heading was Guest Tracking
    return <div className="overflow-x-auto mb-4 sci-panel sci-panel-cut-sm border-cyan-400/20"><table className="w-full text-left border-collapse text-sm raj" {...props} /></div>;
  },
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
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const lastScrollTopRef = useRef(0);
  const [, setIsAtBottom] = useState(true);
  const [isFollowing, setIsFollowing] = useState(true);
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

  // Smart auto-scroll: allow slight scroll-up while generating without snapping back
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    lastScrollTopRef.current = el.scrollTop;
    const onScroll = () => {
      const current = el.scrollTop;
      const prev = lastScrollTopRef.current;
      const delta = current - prev;
      const atBottom = el.scrollHeight - current - el.clientHeight < 48; // tight threshold
      // User scrolled up even slightly -> pause follow, even if still near bottom
      if (delta < -3) {
        shouldAutoScrollRef.current = false;
      } else if (delta > 3 && atBottom) {
        shouldAutoScrollRef.current = true;
      } else {
        shouldAutoScrollRef.current = atBottom;
      }
      setIsAtBottom(atBottom);
      setIsFollowing(shouldAutoScrollRef.current);
      lastScrollTopRef.current = current;
    };
    // Also catch wheel/touch intent immediately
    const onWheel = (e) => {
      if (e.deltaY < 0) {
        shouldAutoScrollRef.current = false;
        setIsFollowing(false);
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: true });
    onScroll();
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    const el = messagesContainerRef.current;
    if (!el) return;
    const isStreamingChunk = !!streamingMessage;
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: isStreamingChunk ? 'auto' : 'smooth', block: 'end' });
      } else {
        el.scrollTo({ top: el.scrollHeight, behavior: isStreamingChunk ? 'auto' : 'smooth' });
      }
    });
  }, [messages, sending, streamingMessage]);

  const scrollToBottom = useCallback(() => {
    shouldAutoScrollRef.current = true;
    setIsFollowing(true);
    setIsAtBottom(true);
    const el = messagesContainerRef.current;
    if (el) {
      lastScrollTopRef.current = el.scrollHeight;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  // Broadcast resources to dashboard (Image 2 style sticky per-chat)
  useEffect(() => {
    const resources = extractResourcesFromMessages(messages);
    window.dispatchEvent(new CustomEvent('chat_resources_update', { detail: { resources, activeMsgId: messages.length ? messages[messages.length - 1]._id : null } }));
  }, [messages]);

  // Sticky per-message: highlight resource group for currently visible assistant message
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !messages.length) return;
    const msgEls = container.querySelectorAll('[data-message-id][data-role="assistant"]');
    if (!msgEls.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) {
          const msgId = visible[0].target.getAttribute('data-message-id');
          window.dispatchEvent(new CustomEvent('chat_visible_resources', { detail: { activeMsgId: msgId } }));
        }
      },
      { root: container, rootMargin: '-10% 0px -60% 0px', threshold: 0.1 }
    );
    msgEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [messages]);



  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && pendingImages.length === 0) || sending) return;

    const userMessageContent = newMessage.trim() || (pendingImages.length > 0 ? "Analyze attached image(s)." : "");
    const imagePayloads = pendingImages.map(img => img.base64);
    const imageMetaPayloads = pendingImages.map(img => img.meta);

    setNewMessage("");
    setSending(true);
    setStreamingMessage("");
    // Re-enable auto-follow when user sends — then smart scroll takes over
    shouldAutoScrollRef.current = true;
    setIsFollowing(true);
    setIsAtBottom(true);
    lastScrollTopRef.current = 1e9;
    // Ensure container jumps to bottom instantly for new user message
    requestAnimationFrame(() => {
      messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
    });

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
                } else if (data.type === 'title_updated') {
                  window.dispatchEvent(new CustomEvent('chat_title_updated', { detail: { chatId: data.chatId, title: data.title } }));
                } else if (data.type === 'chunk') {
                  currentStreamText += data.text;
                  setStreamingMessage(currentStreamText);
                } else if (data.type === 'done') {
                  const botMsg = { ...data.botMessage, model: data.botMessage?.model || selectedModel };
                  setMessages((prev) => [...prev, botMsg]);
                  setStreamingMessage("");
                  currentStreamText = '';
                } else if (data.type === 'error') {
                  isAbortedOrErrored = true;
                  const botMsg = { ...data.botMessage, model: data.botMessage?.model || selectedModel };
                  setMessages((prev) => [...prev, botMsg]);
                  setStreamingMessage("");
                  currentStreamText = '';
                } else if (data.type === 'error_fatal') {
                  isAbortedOrErrored = true;
                  setMessages((prev) => [...prev, {
                    _id: Date.now().toString(),
                    message: "⚠️ **Fatal Error**\n\nSomething went wrong while generating the response. This may be due to the context limit being reached or an API error. Please start a new chat.",
                    role: 'assistant',
                    model: selectedModel,
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
      <div className="relative z-40 px-3 lg:px-5 lg:py-1 border-b border-white/20 bg-gradient-to-r from-white/[0.04] via-transparent to-white/[0.02] backdrop-blur-md flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 rounded-t-[22px]">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex items-center gap-4 min-w-0">
          <div className="hidden lg:flex w-10 h-10 rounded-[12px] bg-cyan-400/15 border border-white/10 items-center justify-center backdrop-blur">
            <Crosshair size={16} className="text-cyan-300" />
          </div>
          <div className="min-w-0">
            {/* <h3 className="display font-bold text-white tracking-[0.12em] text-sm flex items-center gap-2">
              <span className="text-cyan-400">&gt;_</span> INPUTCHAT <span className="hidden sm:inline mono text-[9px] tracking-[0.2em] text-cyan-300/60 border border-cyan-400/20 px-1.5 py-0.5 sci-panel-cut-sm bg-cyan-400/10">COCKPIT LINK</span>
            </h3> */}
            <div className="hidden lg:flex flex-wrap items-center gap-2 sm:mt-1">
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
        <div className="flex items-center justify-center sm:justify-start gap-2 shrink-0">
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
              <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 lg:left-auto lg:right-0 lg:translate-x-0 mt-2 w-[calc(100vw-24px)] sm:w-[320px] max-w-[320px] max-h-[380px] overflow-y-auto rounded-[14px] bg-[#07131e] border border-cyan-400/50 shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-[100] py-1.5 scrollbar-thin divide-y divide-white/5">
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
                        const isLocalModel = model.id.startsWith('local-') || cat === "🏠 Local Integration";
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
                              } ${isLocalModel ? "opacity-60 lg:opacity-100 grayscale-[0.3] lg:grayscale-0" : ""}`}
                          >
                            <span className="truncate pr-2 flex items-center gap-2">
                              <span className="truncate">{model.name}</span>
                              {isLocalModel && (
                                <span className="lg:hidden shrink-0 mono text-[7px] tracking-[0.12em] bg-white/10 border border-white/10 text-white/40 px-1.5 py-0.5 rounded-full">GRAY • LOCAL</span>
                              )}
                            </span>
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

      {/* Messages Area — responsive — stable scroll */}
      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 lg:p-4 scrollbar-thin relative" style={{ scrollbarGutter: 'stable', transformStyle: 'flat', overscrollBehavior: 'contain' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(600px 300px at 50% 42%, rgba(0,234,255,0.04), transparent 70%)' }} />
        <div className="w-full max-w-7xl mx-auto space-y-5 min-h-full flex flex-col relative z-10">
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
                <div key={msg._id || index} data-message-id={msg._id} data-role={msg.role} className={`flex ${isUser ? "justify-end" : "justify-start"} gap-4 items-start animate-fade-in-up`} style={{ transformStyle: 'preserve-3d' }}>
                  <div className={` min-w-0 flex ${isUser ? "max-w-[100%] lg:max-w-[90%] flex-col 2xl:flex-row-reverse items-end ml-auto" : "max-w-[100%] lg:max-w-[90%] flex-col 2xl:flex-row w-full items-start 2xl:items-end"} gap-3 `} style={{ transformStyle: 'preserve-3d' }}>
                    {/* Avatar – floating hologram marker */}
                    <div className={`w-8 h-8 rounded-[10px] flex-shrink-0 flex items-center justify-center border relative overflow-hidden backdrop-blur ${isUser ? "bg-cyan-400 text-black border-cyan-300 shadow-[0_0_16px_rgba(0,234,255,0.5)]" : "bg-white/[0.06] border-white/10 text-cyan-200 shadow-[0_0_16px_rgba(0,234,255,0.12)]"
                      }`}>
                      {isUser ? <UserIcon size={14} /> : <Orbit size={14} className="animate-spin" style={{ animationDuration: '6s' }} />}
                      {!isUser && <span className="absolute inset-0 bg-cyan-400/8 animate-pulse" />}
                    </div>

                    {/* Message Bubble — responsive sharp */}
                    <div data-index={index % 4} className={`holo-msg relative w-fit max-w-full px-3 lg:px-5 py-2.5 lg:py-3.5 leading-relaxed text-[12.5px] lg:text-[14.5px] overflow-auto min-w-0
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
                        <>
                          <div className="markdown-sci">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={MarkdownComponents}
                            >
                              {preprocessMarkdown(msg.message)}
                            </ReactMarkdown>
                          </div>
                          <AssistantMessageActions message={msg.message} />
                        </>
                      )}

                      {/* msg meta */}
                      <div className={`mt-2 flex items-center gap-2 mono text-[9px] tracking-[0.14em] ${isUser ? 'text-[#00131a]/60 justify-end user-meta' : 'text-cyan-300/45'}`}>
                        <span>{isUser ? 'PILOT • TX' : (() => {
                          const m = msg.model || '';
                          if (!m) return 'ORBITAL • RX';
                          const clean = String(m).toLowerCase();
                          if (clean.includes('qwen')) return 'ORBITAL • QWEN 2.5 CODER 7B';
                          if (clean.includes('llava')) return 'ORBITAL • LLaVA 7B VISION';
                          if (clean.includes('nemotron')) return 'ORBITAL • NEMOTRON 3.5 ULTRA';
                          if (clean.includes('llama-3.2-11b') || clean.includes('vision')) return 'ORBITAL • LLAMA 3.2 11B VISION';
                          if (clean.includes('local')) return 'ORBITAL • LOCAL OLLAMA';
                          const shortName = String(m).replace(/^[^/]+\//, '').toUpperCase().slice(0, 24);
                          return `ORBITAL • ${shortName || 'RX'}`;
                        })()}</span>
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
              <div className="flex max-w-[100%] lg:max-w-[90%] flex-col 2xl:flex-row w-full items-start 2xl:items-end gap-3" style={{ transformStyle: 'preserve-3d' }}>
                <div className="w-8 h-8 rounded-[10px] bg-white/[0.06] border border-white/10 text-cyan-200 flex items-center justify-center flex-shrink-0 relative overflow-hidden backdrop-blur">
                  <Bot size={14} className="animate-ping" style={{ animationDuration: '6s' }} />
                  <span className="absolute inset-0 bg-cyan-400/8 animate-pulse" />
                </div>
                <div className="w-full 2xl:flex-1 holo-msg sci-msg-bot px-5 py-4 min-h-[56px] flex items-start overflow-visible relative" style={{ transform: 'translateZ(0px)', contain: 'layout paint' }}>

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
                  <div className="mt-2 flex items-center gap-2 mono text-[9px] tracking-[0.14em] text-cyan-300/45">
                    <span>{(() => {
                      const clean = String(selectedModel || '').toLowerCase();
                      if (clean.includes('qwen')) return 'ORBITAL • QWEN 2.5 CODER 7B';
                      if (clean.includes('llava')) return 'ORBITAL • LLaVA 7B VISION';
                      if (clean.includes('nemotron')) return 'ORBITAL • NEMOTRON 3.5 ULTRA';
                      if (clean.includes('llama-3.2-11b') || clean.includes('vision')) return 'ORBITAL • LLAMA 3.2 11B VISION';
                      if (clean.includes('local')) return 'ORBITAL • LOCAL OLLAMA';
                      const shortName = String(selectedModel || '').replace(/^[^/]+\//, '').toUpperCase().slice(0, 24);
                      return `ORBITAL • ${shortName || 'RX'}`;
                    })()}</span>
                    <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                    <span>GENERATING...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {!isFollowing && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 mono text-[10px] tracking-[0.18em] px-4 py-1.5 rounded-full bg-[#0a1f2a]/90 backdrop-blur border border-cyan-400/30 text-cyan-200 shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:bg-cyan-400/15 hover:border-cyan-400/50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronDown size={12} className="animate-bounce" /> {sending ? 'FOLLOWING PAUSED • TAP TO RESUME' : 'JUMP TO BOTTOM'}
          </button>
        )}
      </div>

      {/* Input Deck — floating glass console */}
      <div className="relative p-1 lg:p-0 shrink-0 pb-[env(safe-area-inset-bottom,0px)] pb-2 lg:pb-0">
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
