import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, BookOpen, Copy, Check, Info, Cpu, Terminal, ShieldCheck, Zap, Sparkles, ChevronRight, Layers, Home, ExternalLink, Globe, HardDrive, Clock, Maximize2, ArrowRight, Server, MemoryStick as Memory } from 'lucide-react';

const SHOWCASE_PROMPTS = [
  {
    id: "prompt-1",
    title: "Prompt 1: Project Progress & Milestone Report",
    badge: "RECHARTS + MERMAID + CHECKLIST",
    badgeTheme: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    recommendedModel: "Nemotron 3.5 Ultra / GPT-OSS 20B",
    modelReasoning: "Best for structured JSON generation and high-accuracy Markdown report rendering.",
    triggers: ["Executive Overview", "Feature Table", "Mermaid Bracket", "Recharts Speed Graph", "Interactive Checklist"],
    text: `Give a full project progress report for our AI Chat Platform (60% complete). Include executive overview, feature status table, tournament/architecture bracket flowchart using mermaid, category latency chart using recharts, key highlights bullet points, and an interactive post-event checklist.`
  },
  {
    id: "prompt-2",
    title: "Prompt 2: Privacy-First Vision & Multimodal Image Analysis",
    badge: "LLAVA 7B / BASE64 PRIVACY",
    badgeTheme: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    recommendedModel: "LLaVA 7B Vision (Local) / Llama 3.2 11B Vision (Cloud)",
    modelReasoning: "Native multimodal support for image element extraction and zero-disk privacy guarantees.",
    triggers: ["Base64 Memory Processing", "LLaVA Vision Analysis", "Navigation Flowchart", "Privacy Callout"],
    text: `Analyze this attached image. Provide a detailed architectural breakdown of the layout, identify key UI elements, list potential UX improvements in a structured table, and generate a Mermaid diagram of the user navigation flow. Remind me of your zero-disk image privacy guarantee.`
  },
  {
    id: "prompt-3",
    title: "Prompt 3: Full-Stack Code Review & System Architecture",
    badge: "QWEN 2.5 CODER / SYNTAX",
    badgeTheme: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    recommendedModel: "Qwen 2.5 Coder 7B (Local) / DeepSeek V4 Pro (Cloud)",
    modelReasoning: "Trained specifically on code completion, AST parsing, and streaming SSE endpoints.",
    triggers: ["Qwen 2.5 Coder 7B", "Syntax Highlighter", "Mermaid Sequence Diagram", "Security Specs"],
    text: `Act as a Lead Systems Architect. Write an optimized Node.js Express streaming SSE endpoint for local AI model inference. Include syntax-highlighted code, a Mermaid sequence diagram showing the request-response lifecycle, and security recommendations for local ghost mode.`
  },
  {
    id: "prompt-4",
    title: "Prompt 4: Infrastructure Incident & Post-Mortem Analysis",
    badge: "TIMELINE + RECHARTS DOWNTIME",
    badgeTheme: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    recommendedModel: "Nemotron 3.5 Ultra / GPT-OSS 120B",
    modelReasoning: "Excels at root-cause analysis, chronological breakdown tables, and metrics graphs.",
    triggers: ["Incident Table", "Recharts Peak Load Chart", "Failure Flowchart", "Actionable Mitigation Checklist"],
    text: `Generate a complete Post-Mortem Incident Report for a database failover event. Include an incident summary, timeline table, peak load chart using recharts, failure flow using mermaid, and a post-incident mitigation checklist.`
  }
];

const HARDWARE_COMPATIBILITY_TIERS = [
  {
    tier: "Ultra-Lightweight Tier",
    range: "1B - 3B Parameters",
    badgeTheme: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    models: "Qwen2.5 1.5B • Llama 3.2 1B/3B • Gemma 2B",
    ram: "4GB - 8GB DDR4 / LPDDR4",
    gpu: "Integrated Intel Iris / AMD Radeon / GTX 1050",
    vram: "2GB - 4GB Dedicated VRAM",
    disk: "~1.2 GB - 2.5 GB (Q4_K_M)",
    context: "32k - 128k Tokens",
    targetHardware: "Low-end laptops, mini PCs, Raspberry Pi 5, older desktops.",
    useCase: "Lightweight chat, instant Q&A, low-power edge devices."
  },
  {
    tier: "Standard Local Tier (Recommended)",
    range: "4B - 8B Parameters",
    badgeTheme: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    models: "Qwen 2.5 Coder 7B • LLaVA 7B Vision • DeepSeek R1 7B • Llama 3.1 8B",
    ram: "8GB - 16GB DDR4 / DDR5",
    gpu: "NVIDIA RTX 3050 / 3060 / 4060 • Apple Silicon M1/M2/M3",
    vram: "4GB - 8GB Dedicated VRAM",
    disk: "~4.5 GB - 5.5 GB (Q4_K_M)",
    context: "32k - 64k Tokens",
    targetHardware: "Standard developer laptops, RTX 3060/4060, Apple MacBooks.",
    useCase: "High-accuracy code completion, vision processing, full chat assistant."
  },
  {
    tier: "Mid-Range Workstation Tier",
    range: "9B - 15B Parameters",
    badgeTheme: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    models: "Llama 3.2 11B Vision • Gemma 2 9B/12B • Qwen 2.5 14B • StarCoder 15B",
    ram: "16GB - 32GB DDR5 / Unified RAM",
    gpu: "NVIDIA RTX 3080 / 4070 • Apple M2/M3 Pro",
    vram: "8GB - 12GB Dedicated VRAM",
    disk: "~7.0 GB - 9.5 GB (Q4_K_M)",
    context: "64k - 128k Tokens",
    targetHardware: "Gaming laptops, mid-tier workstations, Mac Studio M2 Max.",
    useCase: "Advanced vision audits, multi-file code refactoring, complex reasoning."
  },
  {
    tier: "High-Performance Workstation Tier",
    range: "20B - 32B Parameters",
    badgeTheme: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    models: "GPT-OSS 20B MoE • DiffusionGemma 26B • Nemotron 30B • Qwen 2.5 32B",
    ram: "32GB - 64GB DDR5 / High-Bandwidth Unified",
    gpu: "NVIDIA RTX 3090 / 4090 • Apple M2/M3 Max",
    vram: "16GB - 24GB Dedicated VRAM",
    disk: "~14 GB - 20 GB (Q4_K_M)",
    context: "64k - 128k Tokens",
    targetHardware: "RTX 3090/4090 24GB GPUs, MacBook Pro M3 Max 36GB+.",
    useCase: "Near-cloud intelligence, complex mathematical analysis, deep CoT reasoning."
  },
  {
    tier: "Enterprise / Dual GPU Tier",
    range: "40B - 70B Parameters",
    badgeTheme: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    models: "Llama 3.1 70B • Qwen 2.5 72B • Command R+ 104B",
    ram: "64GB - 128GB DDR5 ECC / Mac Unified 64GB-128GB",
    gpu: "Dual RTX 3090/4090 • RTX 6000 Ada • Mac Studio Ultra",
    vram: "40GB - 48GB Dedicated VRAM",
    disk: "~38 GB - 45 GB (Q4_K_M)",
    context: "128k Tokens",
    targetHardware: "Dual GPU setups, Mac Studio M2/M3 Ultra (128GB), Cloud GPU nodes.",
    useCase: "Enterprise self-hosted LLMs, research-grade coding, full codebase analysis."
  },
  {
    tier: "Ultra Frontier / Cluster Tier",
    range: "100B+ Parameters",
    badgeTheme: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    models: "Nemotron 3 Ultra 550B MoE • DeepSeek V3 671B MoE • Llama 3.1 405B",
    ram: "256GB - 512GB System RAM",
    gpu: "8x NVIDIA H100 80GB Tensor Core GPU Node Cluster",
    vram: "80GB - 640GB Dedicated VRAM",
    disk: "200 GB - 800 GB (FP8 / FP16 Multi-Node)",
    context: "128k - 1M Tokens",
    targetHardware: "Multi-node Data Center Clusters, Cloud API Providers (NVIDIA / OpenAI).",
    useCase: "State-of-the-art frontier model inference, massive dataset synthesis."
  }
];

const MODELS_THEORY_CATEGORIES = [
  {
    id: "fast-models",
    title: "⚡ Fast Models (Low Latency & Quick Answers)",
    badge: "FAST INFERENCE (~6s - 15s)",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    borderColor: "border-emerald-500/30",
    accentColor: "text-emerald-400",
    description: "Optimized for rapid conversational response times, simple summaries, quick syntax queries, and instant data retrieval.",
    decisionRule: "Pick when you need instant responses under 10 seconds and high throughput without waiting for deep multi-step reasoning.",
    models: [
      {
        name: "GPT-OSS 20B MoE",
        version: "v2.1 Mixture-of-Experts",
        params: "20 Billion (3.5B active)",
        size: "Cloud API / 14GB VRAM",
        context: "128,000 Tokens (128k)",
        latency: "~6s - 10s",
        bestUseCase: "Quick Q&A, lightweight report outlines, fast text transformations.",
        whyPick: "Activates only 3.5B parameters per token via MoE routing, giving near-instant responses with high contextual recall."
      },
      {
        name: "Nemotron 3.5 Lightning 30B",
        version: "v3.5 Lightning Distill",
        params: "30 Billion Dense",
        size: "Cloud API / 22GB VRAM",
        context: "64,000 Tokens (64k)",
        latency: "~12s - 20s",
        bestUseCase: "Fast technical summaries, rapid chat conversations, quick document scanning.",
        whyPick: "Specially distilled for ultra-fast token generation speed while maintaining 90%+ dense model intelligence."
      }
    ]
  },
  {
    id: "vision-models",
    title: "👁️ Vision & Multimodal Models",
    badge: "IMAGE & DIAGRAM ANALYSIS",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    borderColor: "border-sky-500/30",
    accentColor: "text-sky-400",
    description: "Engineered with visual encoder projection layers to analyze UI designs, architecture diagrams, screenshots, and visual mockups.",
    decisionRule: "Pick whenever your prompt includes image attachments, wireframe mockups, or visual diagram extraction requests.",
    models: [
      {
        name: "LLaVA 7B Vision (Local)",
        version: "v1.6 / CLIP ViT-L/14",
        params: "7 Billion + Vision Tower",
        size: "Local GGUF (4.5GB VRAM)",
        context: "4,096 Tokens (4k)",
        latency: "~6s (Local GPU)",
        bestUseCase: "100% offline image analysis, UI component extraction, visual privacy guarantees.",
        whyPick: "Processes vision tokens locally on your laptop GPU with zero cloud network transmission or disk storage."
      },
      {
        name: "Llama 3.2 11B Vision Instruct",
        version: "v3.2 Vision-Instruct",
        params: "11 Billion Multimodal",
        size: "Cloud API / 18GB VRAM",
        context: "128,000 Tokens (128k)",
        latency: "~18s - 25s",
        bestUseCase: "Complex UI layout breakdown, UX audit tables, converting mockups to Mermaid flowcharts.",
        whyPick: "Leverages Meta's cross-attention vision layers to understand precise spatial UI positions and generate visual diagrams."
      }
    ]
  },
  {
    id: "code-models",
    title: "💻 Code Generative & Technical Models",
    badge: "AST PARSING & CODE SYNTAX",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    borderColor: "border-amber-500/30",
    accentColor: "text-amber-400",
    description: "Trained specifically on GitHub repositories, AST parsers, compiler diagnostics, SQL schemas, and regex logic.",
    decisionRule: "Pick when generating code endpoints (Express, SSE, React), writing complex algorithms, SQL queries, or technical blueprints.",
    models: [
      {
        name: "Qwen 2.5 Coder 7B (Local)",
        version: "v2.5-Coder-Instruct",
        params: "7.6 Billion Code-Trained",
        size: "Local GGUF (4.7GB VRAM)",
        context: "32,768 Tokens (32k)",
        latency: "~8s (Local GPU)",
        bestUseCase: "Node.js Express endpoints, React components, SQL queries, local code autocomplete.",
        whyPick: "Evaluated as the #1 7B coding model globally, surpassing many 33B models in HumanEval code generation benchmark."
      },
      {
        name: "DeepSeek V4 Pro",
        version: "v4-Pro-Coder",
        params: "67 Billion Dense",
        size: "Cloud API / 48GB VRAM",
        context: "64,000 Tokens (64k)",
        latency: "~25s - 45s",
        bestUseCase: "Full-stack architecture reviews, complex refactoring, multi-file code generator.",
        whyPick: "Includes deep AST code understanding and multi-stage syntax verification to prevent runtime execution errors."
      }
    ]
  },
  {
    id: "deep-models",
    title: "🧠 Deep Thinking & Reasoning Models",
    badge: "CHAIN-OF-THOUGHT LOGIC",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    borderColor: "border-purple-500/30",
    accentColor: "text-purple-400",
    description: "Uses multi-step chain-of-thought (CoT) reasoning to evaluate complex edge cases, mathematical proofs, and incident post-mortems.",
    decisionRule: "Pick for multi-component project reports, incident post-mortems, root cause analysis, and complex business logic.",
    models: [
      {
        name: "Nemotron 3 Ultra 550B",
        version: "v3-Ultra-550B MoE",
        params: "550 Billion MoE",
        size: "Enterprise Cloud Cluster",
        context: "128,000 Tokens (128k)",
        latency: "~35s - 50s",
        bestUseCase: "Full project progress reports, Recharts JSON generation, multi-stage Mermaid flowcharts.",
        whyPick: "Massive 550B parameter knowledge capacity ensures zero hallucinations on complex JSON structures and report schemas."
      },
      {
        name: "GPT-OSS 120B / DeepSeek R1",
        version: "v1.0 Chain-of-Thought",
        params: "120 Billion Reasoning",
        size: "Cloud API / 80GB VRAM",
        context: "64,000 Tokens (64k)",
        latency: "~40s - 55s",
        bestUseCase: "Infrastructure incident post-mortems, financial risk modeling, complex strategic planning.",
        whyPick: "Generates internal reasoning thoughts before outputting the final response, maximizing logical consistency."
      }
    ]
  },
  {
    id: "ghost-models",
    title: "🏠 Powerful Local Models (100% Offline Ghost Mode)",
    badge: "100% OFFLINE / ZERO CLOUD",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-400/40",
    borderColor: "border-cyan-500/30",
    accentColor: "text-cyan-400",
    description: "Executes directly on your local hardware via Ollama. Requires zero active internet connection or external API keys.",
    decisionRule: "Pick when working in air-gapped environments, strict privacy policies, or when offline without internet connection.",
    models: [
      {
        name: "Qwen 2.5 Coder 7B (Ollama)",
        version: "qwen2.5-coder:7b",
        params: "7.6B (4-bit Q4_K_M)",
        size: "Local Disk (4.7 GB)",
        context: "32,768 Tokens (32k)",
        latency: "~6s - 10s (Local RAM/VRAM)",
        bestUseCase: "Offline code generation, local privacy chat, instant code refactoring.",
        whyPick: "Runs 100% offline on consumer laptops (Apple Silicon M1/M2/M3, NVIDIA RTX 3060+) with near-zero latency."
      },
      {
        name: "LLaVA 7B Vision (Ollama)",
        version: "llava:7b",
        params: "7B (4-bit quantized)",
        size: "Local Disk (4.5 GB)",
        context: "4,096 Tokens (4k)",
        latency: "~6s - 12s",
        bestUseCase: "Offline image analysis, private document scanning, zero-disk memory Base64 processing.",
        whyPick: "Guarantees that uploaded images are processed in local volatile RAM and never sent over the public internet."
      }
    ]
  }
];

const FEATURES_LIST = [
  { name: "Local Ghost Mode", category: "Privacy & Infra", badgeTheme: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40", status: "Operational", desc: "100% offline-first operation with local MongoDB (localhost:27017) and Ollama on localhost:11434." },
  { name: "Zero-Persistence Memory Image Pipeline", category: "Security", badgeTheme: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", status: "Operational", desc: "Converts uploaded images directly to Base64 in volatile memory without writing to disk or database." },
  { name: "Dual Database Ecosystem", category: "Backend Reliability", badgeTheme: "bg-sky-500/20 text-sky-300 border-sky-500/40", status: "Operational", desc: "Real-time automatic failover and manual toggle between MongoDB Atlas (Cloud) and Local Ghost MongoDB." },
  { name: "Category-Wise Model Ranking Engine", category: "AI Inference", badgeTheme: "bg-amber-500/20 text-amber-300 border-amber-500/40", status: "Operational", desc: "Real-time telemetry tracking across 5 categories: Fast, Vision, Coding, Deep Reasoning, and Local." },
  { name: "Interactive Holo-Checklist Widget", category: "UI / Visualization", badgeTheme: "bg-purple-500/20 text-purple-300 border-purple-500/40", status: "Operational", desc: "Auto-detects report JSON and renders editable checklists, data matrices, and multi-format exports (JSON, MD, CSV, SVG)." },
  { name: "Native Recharts & Mermaid.js Engine", category: "UI / Visualization", badgeTheme: "bg-rose-500/20 text-rose-300 border-rose-500/40", status: "Operational", desc: "Parses ```recharts and ```mermaid code blocks into interactive charts and vector flowcharts." },
  { name: "Real-Time SSE AI Topic Titling", category: "Chat Core", badgeTheme: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40", status: "Operational", desc: "Asynchronously generates 3-5 word chat titles on the first message and streams updates to the sidebar live." },
  { name: "PWA Standalone Viewport Lock", category: "Mobile / Frontend", badgeTheme: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40", status: "Operational", desc: "Locks viewport to 100dvh with safe-area insets padding and overscroll-behavior suppression." }
];

export default function DocumentationModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedId, setCopiedId] = useState(null);

  if (!isOpen) return null;

  const handleCopyPrompt = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in-up select-text font-sans">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999]" onClick={onClose} />

      {/* Modal Shell — Saturated Dark Charcoal Aesthetic */}
      <div className="relative z-[100000] w-[95vw] max-w-[1600px] h-[90vh] rounded-xl bg-[#090d16] border border-cyan-500/30 shadow-[0_25px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-slate-200 select-text">

        {/* Top Navigation Bar / Breadcrumbs */}
        <div className="px-5 py-3.5 bg-[#060910] border-b border-cyan-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider">
            <span className="text-cyan-400 flex items-center gap-1.5"><BookOpen size={14} className="text-cyan-400" /> Documentation</span>
            <ChevronRight size={12} className="text-slate-600" />
            <span className="text-slate-300">InputChat</span>
            <ChevronRight size={12} className="text-slate-600" />
            <span className="text-cyan-300 font-bold uppercase">{activeTab.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://cyphertech.online"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex flex-row items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/20 hover:bg-cyan-400 hover:text-black text-cyan-300 border border-cyan-400/40 font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(0,234,255,0.2)] whitespace-nowrap"
            >
              <Globe size={13} className="shrink-0" />
              <span>cyphertech.online</span>
              <ExternalLink size={10} className="shrink-0" />
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-red-500/20 border border-slate-700 hover:border-red-400/40 text-slate-300 hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer"
              title="Close Documentation"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* Left Navigation Sidebar with Categorized Color Icons */}
          <div className="w-56 sm:w-64 bg-[#060910] border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto scrollbar-thin">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-xs font-bold font-mono tracking-wider text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-cyan-400 text-black flex items-center justify-center font-extrabold text-xs">IC</span>
                DOCUMENTATION
              </h3>
            </div>

            <nav className="p-2 space-y-1 text-xs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-all cursor-pointer font-medium ${activeTab === 'overview' ? 'bg-cyan-500/20 text-cyan-300 border-l-3 border-cyan-400 font-bold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
              >
                <Sparkles size={14} className="text-cyan-400 shrink-0" />
                <span>Platform Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('showcase-prompts')}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-all cursor-pointer font-medium ${activeTab === 'showcase-prompts' ? 'bg-amber-500/20 text-amber-300 border-l-3 border-amber-400 font-bold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
              >
                <Zap size={14} className="text-amber-400 shrink-0" />
                <span>Showcase Prompts (4)</span>
              </button>

              <button
                onClick={() => setActiveTab('models-theory')}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-all cursor-pointer font-medium ${activeTab === 'models-theory' ? 'bg-emerald-500/20 text-emerald-300 border-l-3 border-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
              >
                <Cpu size={14} className="text-emerald-400 shrink-0" />
                <span>Models Theory & Selection</span>
              </button>

              <button
                onClick={() => setActiveTab('feature-manifest')}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-all cursor-pointer font-medium ${activeTab === 'feature-manifest' ? 'bg-purple-500/20 text-purple-300 border-l-3 border-purple-400 font-bold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
              >
                <Layers size={14} className="text-purple-400 shrink-0" />
                <span>Feature Manifest</span>
              </button>

              <button
                onClick={() => setActiveTab('ollama-setup')}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-all cursor-pointer font-medium ${activeTab === 'ollama-setup' ? 'bg-sky-500/20 text-sky-300 border-l-3 border-sky-400 font-bold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
              >
                <Home size={14} className="text-sky-400 shrink-0" />
                <span>Local Ghost & Hardware</span>
              </button>
            </nav>

            <div className="mt-auto p-3.5 border-t border-slate-800 text-xs font-mono text-cyan-400/60 space-y-1">
              <div>STATUS: NOMINAL</div>
              <div>VER: 4.7.2 • CYPHER TECH</div>
            </div>
          </div>

          {/* Main Article Content Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 md:p-9 space-y-8 scrollbar-thin bg-[#080d16] flex flex-col justify-between">

            <div>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Meta Header */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 border-b border-slate-800 pb-3 font-mono">
                    <span className="flex items-center gap-1.5"><BookOpen size={13} className="text-cyan-400" /> Reading time 5m</span>
                    <span>•</span>
                    <span>Published Sep 2026</span>
                    <span>•</span>
                    <span className="text-cyan-300 font-bold">Level Advanced</span>
                  </div>

                  {/* Main Heading */}
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      Platform Overview / What is InputChat?
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
                      InputChat is a full-stack AI cockpit designed for offline privacy, real-time visual reports, and local inference. It seamlessly connects global cloud AI models with local ghost-mode Ollama engines.
                    </p>
                  </div>

                  {/* Clean Info Callout Box */}
                  <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Info size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold font-mono text-cyan-300 tracking-wide">LOCAL GHOST MODE ARCHITECTURE</h4>
                      <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                        Run 100% offline using <code className="font-mono text-cyan-300 px-1.5 py-0.5 rounded bg-slate-900 border border-cyan-500/30">mongodb://localhost:27017</code> and local Ollama inference on <code className="font-mono text-cyan-300 px-1.5 py-0.5 rounded bg-slate-900 border border-cyan-500/30">localhost:11434</code>. Zero telemetry leaves your computer in Ghost Mode.
                      </p>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="space-y-4 pt-2">
                    <h2 className="text-lg font-bold text-white tracking-tight border-b border-slate-800 pb-2">
                      Core Platform Capabilities
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-[#0d1522] border border-cyan-500/20 space-y-1.5">
                        <div className="text-xs font-bold text-cyan-300 flex items-center gap-2"><ShieldCheck size={15} /> Zero-Persistence Memory Images</div>
                        <p className="text-slate-400 text-xs leading-relaxed">Converts uploads directly to Base64 in volatile memory and immediately discards buffers without saving to disk.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#0d1522] border border-amber-500/20 space-y-1.5">
                        <div className="text-xs font-bold text-amber-300 flex items-center gap-2"><Layers size={15} /> Interactive Holo-Checklist Widget</div>
                        <p className="text-slate-400 text-xs leading-relaxed">Renders editable checklist reports with progress bars, data matrices, and exports (JSON, MD, CSV, SVG).</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#0d1522] border border-emerald-500/20 space-y-1.5">
                        <div className="text-xs font-bold text-emerald-300 flex items-center gap-2"><Cpu size={15} /> Realtime Model Ranking Engine</div>
                        <p className="text-slate-400 text-xs leading-relaxed">Telemetry engine tracking response speed and accuracy across Fast, Vision, Coding, Deep, and Local categories.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#0d1522] border border-purple-500/20 space-y-1.5">
                        <div className="text-xs font-bold text-purple-300 flex items-center gap-2"><Terminal size={15} /> Native Recharts & Mermaid Flowcharts</div>
                        <p className="text-slate-400 text-xs leading-relaxed">Parses ```recharts and ```mermaid blocks into interactive visual charts and vector flowcharts.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SHOWCASE PROMPTS */}
              {activeTab === 'showcase-prompts' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                      <Zap size={22} className="text-amber-400" /> Top 4 Showcase Prompts (For Screenshots & Demos)
                    </h1>
                    <p className="text-sm text-slate-300 mt-1">
                      Use these 4 prompts to trigger all visual UI widgets (Mermaid flowcharts, Recharts graphs, interactive checklists, tables, and code formatting).
                    </p>
                  </div>

                  <div className="space-y-5">
                    {SHOWCASE_PROMPTS.map((item) => (
                      <div key={item.id} className="p-5 rounded-xl bg-[#0d1522] border border-slate-800 space-y-3 relative group">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                          <h3 className="text-sm sm:text-base font-bold text-white">{item.title}</h3>
                          <span className={`font-mono text-xs tracking-wider px-2.5 py-1 rounded font-bold border ${item.badgeTheme}`}>{item.badge}</span>
                        </div>

                        {/* Triggers */}
                        <div className="flex flex-wrap gap-1.5">
                          {item.triggers.map(tr => (
                            <span key={tr} className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-300">✓ {tr}</span>
                          ))}
                        </div>

                        {/* Model Recommendation Box */}
                        <div className="p-3 rounded-lg bg-[#060910] border border-slate-800 text-xs space-y-1">
                          <div className="text-slate-200 font-semibold">
                            <span className="text-emerald-400 font-mono">RECOMMENDED MODEL: </span> {item.recommendedModel}
                          </div>
                          <p className="text-slate-400 text-xs leading-relaxed">{item.modelReasoning}</p>
                        </div>

                        {/* Prompt Content */}
                        <div className="relative bg-[#04060a] border border-slate-800 rounded-lg p-3.5 font-mono text-xs text-cyan-100 leading-relaxed">
                          <pre className="whitespace-pre-wrap">{item.text}</pre>
                          <button
                            onClick={() => handleCopyPrompt(item.text, item.id)}
                            className="absolute top-3 right-3 font-mono text-xs tracking-wider px-3 py-1.5 rounded-full bg-amber-400 text-black hover:bg-amber-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                          >
                            {copiedId === item.id ? <Check size={13} /> : <Copy size={13} />}
                            {copiedId === item.id ? 'COPIED!' : 'COPY PROMPT'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: MODELS THEORY & SELECTION MATRIX */}
              {activeTab === 'models-theory' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                      <Cpu size={24} className="text-emerald-400" /> Models Theory & Selection Framework
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
                      Understand model parameters, context window length, active layer routing, and decision rules to pick the best AI model for every scenario.
                    </p>
                  </div>

                  {/* Decision Flow Banner */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-emerald-950/40 border border-cyan-500/30 text-xs space-y-3">
                    <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold tracking-wide">
                      <Sparkles size={15} /> QUICK SELECTION DECISION FRAMEWORK
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
                      <div className="p-3 rounded-lg bg-[#060910] border border-emerald-500/30 space-y-1">
                        <div className="text-emerald-300 font-bold flex items-center gap-1.5"><Clock size={13} /> Instant Answers</div>
                        <div className="text-slate-300 text-xs">Select <strong className="text-white">Fast Models</strong> (GPT-OSS 20B).</div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#060910] border border-sky-500/30 space-y-1">
                        <div className="text-sky-300 font-bold flex items-center gap-1.5"><Layers size={13} /> Image / Mockups</div>
                        <div className="text-slate-300 text-xs">Select <strong className="text-white">Vision Models</strong> (LLaVA 7B).</div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#060910] border border-amber-500/30 space-y-1">
                        <div className="text-amber-300 font-bold flex items-center gap-1.5"><Terminal size={13} /> Code / Endpoints</div>
                        <div className="text-slate-300 text-xs">Select <strong className="text-white">Coder Models</strong> (Qwen Coder).</div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#060910] border border-purple-500/30 space-y-1">
                        <div className="text-purple-300 font-bold flex items-center gap-1.5"><Cpu size={13} /> Complex Reports</div>
                        <div className="text-slate-300 text-xs">Select <strong className="text-white">Deep Thinking</strong> (Nemotron 550B).</div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#060910] border border-cyan-500/30 space-y-1">
                        <div className="text-cyan-300 font-bold flex items-center gap-1.5"><Home size={13} /> 100% Offline</div>
                        <div className="text-slate-300 text-xs">Select <strong className="text-white">Local Ollama</strong> (qwen2.5-coder).</div>
                      </div>
                    </div>
                  </div>

                  {/* Categories Breakdown */}
                  <div className="space-y-6">
                    {MODELS_THEORY_CATEGORIES.map(cat => (
                      <div key={cat.id} className={`p-5 rounded-xl bg-[#0d1522] border ${cat.borderColor} space-y-4`}>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                          <div>
                            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                              <span>{cat.title}</span>
                            </h2>
                            <p className="text-xs text-slate-300 mt-0.5">{cat.description}</p>
                          </div>
                          <span className={`font-mono text-xs tracking-wider px-3 py-1 rounded font-bold border ${cat.badgeColor}`}>{cat.badge}</span>
                        </div>

                        {/* When to pick rule */}
                        <div className="p-3 rounded-lg bg-[#060910] border border-slate-800 text-xs flex items-start gap-2.5">
                          <ArrowRight size={14} className={`${cat.accentColor} shrink-0 mt-0.5`} />
                          <div>
                            <span className={`font-mono ${cat.accentColor} font-bold`}>WHEN TO PICK: </span>
                            <span className="text-slate-200">{cat.decisionRule}</span>
                          </div>
                        </div>

                        {/* Models Matrix Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {cat.models.map(m => (
                            <div key={m.name} className="p-4 rounded-xl bg-[#04060a] border border-slate-800 space-y-3 text-xs hover:border-slate-700 transition-all">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <h4 className="font-bold text-white text-sm">{m.name}</h4>
                                <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold border ${cat.badgeColor}`}>{m.version}</span>
                              </div>

                              {/* Specs Badges — Full Wrapped Text */}
                              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
                                <div className="flex items-start gap-1.5 bg-slate-900/80 p-2 rounded border border-slate-800">
                                  <Cpu size={13} className={`${cat.accentColor} shrink-0 mt-0.5`} />
                                  <span className="whitespace-normal break-words leading-snug"><strong>Params:</strong> {m.params}</span>
                                </div>
                                <div className="flex items-start gap-1.5 bg-slate-900/80 p-2 rounded border border-slate-800">
                                  <HardDrive size={13} className={`${cat.accentColor} shrink-0 mt-0.5`} />
                                  <span className="whitespace-normal break-words leading-snug"><strong>Size:</strong> {m.size}</span>
                                </div>
                                <div className="flex items-start gap-1.5 bg-slate-900/80 p-2 rounded border border-slate-800">
                                  <Maximize2 size={13} className={`${cat.accentColor} shrink-0 mt-0.5`} />
                                  <span className="whitespace-normal break-words leading-snug"><strong>Context:</strong> {m.context}</span>
                                </div>
                                <div className="flex items-start gap-1.5 bg-slate-900/80 p-2 rounded border border-slate-800">
                                  <Clock size={13} className={`${cat.accentColor} shrink-0 mt-0.5`} />
                                  <span className="whitespace-normal break-words leading-snug"><strong>Speed:</strong> {m.latency}</span>
                                </div>
                              </div>

                              {/* Best Use Case */}
                              <div className="space-y-1 pt-1 text-xs">
                                <div className="text-slate-200">
                                  <strong className={`font-mono ${cat.accentColor}`}>Best Use Case:</strong> {m.bestUseCase}
                                </div>
                                <div className="text-slate-400">
                                  <strong className="font-mono text-slate-300">Why It Works:</strong> {m.whyPick}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: FEATURE MANIFEST */}
              {activeTab === 'feature-manifest' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                      <Layers size={22} className="text-purple-400" /> System Feature Manifest (<code className="font-mono text-purple-300">features.json</code>)
                    </h1>
                    <p className="text-sm text-slate-300 mt-1">
                      Live platform specification manifest loaded directly from the system features registry.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {FEATURES_LIST.map(feat => (
                      <div key={feat.name} className="p-4 rounded-xl bg-[#0d1522] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white">{feat.name}</h4>
                            <span className="font-mono text-xs tracking-wider px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">{feat.status}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{feat.desc}</p>
                        </div>
                        <span className={`font-mono text-xs tracking-wider px-2.5 py-1 rounded font-bold border shrink-0 self-start sm:self-center ${feat.badgeTheme}`}>{feat.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: OLLAMA SETUP & HARDWARE PARAMETER MATRIX */}
              {activeTab === 'ollama-setup' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                      <Home size={22} className="text-sky-400" /> Local Ghost Mode & Hardware Sizing Guide
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 mt-1">
                      Hardware specifications chart mapping model parameter sizes (1B to 100B+) to CPU, GPU, VRAM, and RAM requirements.
                    </p>
                  </div>

                  {/* HARDWARE COMPATIBILITY MATRIX CHART — 5 Distinct Specs Boxes with Wrapped Text */}
                  <div className="p-5 rounded-xl bg-[#0d1522] border border-sky-500/30 space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Server size={18} className="text-sky-400" />
                        <h3 className="font-bold text-white text-base">HARDWARE & MODEL PARAMETER MATRIX (1B to 100B+)</h3>
                      </div>
                      <span className="font-mono text-xs tracking-wider px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold">SYSTEM SIZING CHART</span>
                    </div>

                    <div className="space-y-5">
                      {HARDWARE_COMPATIBILITY_TIERS.map((tier) => (
                        <div key={tier.tier} className="p-4 rounded-xl bg-[#04060a] border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                            <div>
                              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                <span>{tier.tier}</span>
                                <span className="font-mono text-xs text-sky-300">({tier.range})</span>
                              </h4>
                              <p className="text-xs text-slate-300 mt-0.5">Popular Models: <strong className="text-white">{tier.models}</strong></p>
                            </div>
                            <span className={`font-mono text-xs tracking-wider px-2.5 py-1 rounded font-bold border ${tier.badgeTheme}`}>{tier.range}</span>
                          </div>

                          {/* 5 Distinct Specs Boxes: RAM, GPU, VRAM, Disk, Context */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs font-mono">
                            {/* 1. System RAM */}
                            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-emerald-500/30 space-y-1">
                              <div className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs"><Memory size={13} /> System RAM</div>
                              <div className="text-slate-200 text-xs whitespace-normal break-words leading-snug">{tier.ram}</div>
                            </div>
                            {/* 2. GPU Hardware */}
                            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-amber-500/30 space-y-1">
                              <div className="text-amber-400 font-bold flex items-center gap-1.5 text-xs"><Cpu size={13} /> GPU Hardware</div>
                              <div className="text-slate-200 text-xs whitespace-normal break-words leading-snug">{tier.gpu}</div>
                            </div>
                            {/* 3. Dedicated VRAM */}
                            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-sky-500/30 space-y-1">
                              <div className="text-sky-400 font-bold flex items-center gap-1.5 text-xs"><Zap size={13} /> Dedicated VRAM</div>
                              <div className="text-slate-200 text-xs whitespace-normal break-words leading-snug">{tier.vram}</div>
                            </div>
                            {/* 4. Disk Storage */}
                            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-purple-500/30 space-y-1">
                              <div className="text-purple-400 font-bold flex items-center gap-1.5 text-xs"><HardDrive size={13} /> Disk File Size</div>
                              <div className="text-slate-200 text-xs whitespace-normal break-words leading-snug">{tier.disk}</div>
                            </div>
                            {/* 5. Context Window */}
                            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-cyan-500/30 space-y-1">
                              <div className="text-cyan-400 font-bold flex items-center gap-1.5 text-xs"><Maximize2 size={13} /> Max Context</div>
                              <div className="text-slate-200 text-xs whitespace-normal break-words leading-snug">{tier.context}</div>
                            </div>
                          </div>

                          <div className="text-xs text-slate-200 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 leading-relaxed">
                            <div className="whitespace-normal break-words"><strong className="text-cyan-300 font-mono">Target Systems:</strong> {tier.targetHardware}</div>
                            <div className="whitespace-normal break-words"><strong className="text-emerald-300 font-mono">Ideal Use Case:</strong> {tier.useCase}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strategy 1: Server Proxy */}
                  <div className="p-5 rounded-xl bg-[#0d1522] border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-emerald-400" />
                        <h3 className="font-bold text-white text-base">STRATEGY 1: True Server-Proxy Ghost Mode (Default)</h3>
                      </div>
                      <span className="font-mono text-xs tracking-wider px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">100% OFFLINE</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      In default local execution (<code className="font-mono text-cyan-300">http://localhost:3000</code>), InputChat routes all prompts through our local Express backend (<code className="font-mono text-cyan-300">localhost:4000</code>). Because Node.js handles requests server-side, <strong>no browser CORS configuration or <code className="font-mono text-emerald-300">OLLAMA_ORIGINS</code> variables are required!</strong>
                    </p>

                    <div className="p-3 rounded-lg bg-[#04060a] border border-slate-800 font-mono text-xs space-y-1.5 text-slate-300">
                      <div className="text-cyan-300 font-bold">Flow Lifecycle:</div>
                      <div>Browser UI (<code className="text-cyan-300">localhost:3000</code>) ➔ Express Backend (<code className="text-cyan-300">localhost:4000</code>) ➔ Ollama Engine (<code className="text-cyan-300">localhost:11434</code>)</div>
                      <div className="text-emerald-400 text-xs pt-0.5">✓ Completely air-gapped, zero external network calls, zero configuration required.</div>
                    </div>

                    <div className="space-y-2 pt-1 font-mono text-xs">
                      <h4 className="text-white font-bold">Steps to Run Strategy 1:</h4>
                      <pre className="p-3 bg-[#04060a] rounded-lg border border-slate-800 text-cyan-200 text-xs">
                        {`# 1. Start Ollama normally (no extra flags required)
ollama serve

# 2. In another terminal, start InputChat
npm start

# 3. Select any Local Model (Qwen 2.5 Coder / LLaVA Vision) in the dropdown!`}
                      </pre>
                    </div>
                  </div>

                  {/* Strategy 2: Direct Browser Mode */}
                  <div className="p-5 rounded-xl bg-[#0d1522] border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Globe size={18} className="text-amber-400" />
                        <h3 className="font-bold text-white text-base">STRATEGY 2: Direct Browser Mode (For Cloud / Online Domains)</h3>
                      </div>
                      <span className="font-mono text-xs tracking-wider px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">FOR CLOUD HOSTED URLS</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      If you host the web application on a public domain (e.g. <code className="font-mono text-cyan-300">https://cyphertech.online</code>) and want your online web browser to connect directly to your laptop's local Ollama instance on port <code className="font-mono text-cyan-300">11434</code>, modern browser security requires enabling Cross-Origin Access (CORS).
                    </p>

                    <div className="space-y-2 pt-1 font-mono text-xs">
                      <h4 className="text-amber-300 font-bold">Terminal CORS Commands (Only for Cloud Domain Strategy):</h4>
                      <pre className="p-3 bg-[#04060a] rounded-lg border border-slate-800 text-amber-200 text-xs">
                        {`# Linux / macOS:
OLLAMA_ORIGINS="*" ollama serve

# Windows (Command Prompt):
set OLLAMA_ORIGINS=*
ollama serve`}
                      </pre>
                    </div>
                  </div>

                  {/* Commands for Downloading & Registering Models */}
                  <div className="p-5 rounded-xl bg-[#0d1522] border border-slate-800 space-y-3 font-mono text-xs">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Terminal size={16} className="text-cyan-400" /> Downloading & Pulling Local Models
                    </h3>
                    <pre className="p-3 bg-[#04060a] rounded-lg border border-slate-800 text-cyan-200 text-xs">
                      {`# Pull Qwen 2.5 Coder 7B (Coding & Technical Blueprints)
ollama pull qwen2.5-coder:7b

# Pull LLaVA 7B (Multimodal Vision & Layout Diagrams)
ollama pull llava:7b

# Pull DeepSeek R1 7B (Reasoning Logic)
ollama pull deepseek-r1:7b`}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* ===== COMPREHENSIVE CYBER SLATE FOOTER ===== */}
            <footer className="mt-12 pt-6 border-t border-slate-800 space-y-4 text-xs shrink-0 font-sans">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="w-5 h-5 rounded bg-cyan-400 text-black font-extrabold flex items-center justify-center text-xs">IC</span>
                    <span className="font-bold text-white tracking-wider text-sm">INPUTCHAT AI COCKPIT</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1 max-w-md leading-relaxed">
                    Next-generation neural interface built for local offline inference, zero-persistence privacy, and dynamic report visualizers.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                  <a
                    href="https://cyphertech.online"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-row items-center justify-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 hover:bg-cyan-400 hover:text-black text-cyan-300 border border-cyan-400/40 font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(0,234,255,0.2)] whitespace-nowrap"
                  >
                    <Globe size={14} className="shrink-0" />
                    <span>Connect with cyphertech.online</span>
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-mono">
                <div>© 2026 InputChat Platform • Created by <a href="https://cyphertech.online" target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline">CypherTech</a></div>
                <div className="flex items-center gap-3">
                  <span>React 18</span>
                  <span>•</span>
                  <span>Express SSE</span>
                  <span>•</span>
                  <span>MongoDB Dual-Ecosystem</span>
                  <span>•</span>
                  <span>Ollama Engine</span>
                </div>
              </div>
            </footer>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
