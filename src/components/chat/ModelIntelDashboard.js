import React, { useState, useEffect, useRef } from 'react';
import { Activity, ChevronDown, ChevronUp, ExternalLink, Link2, BookOpen, Layers } from 'lucide-react';

const INITIAL_PROBES = {
  // FAST
  "openai/gpt-oss-20b": { name: "GPT-OSS 20B", speedSec: 10, score: 82, category: "FAST" },
  "nvidia/nemotron-3.5-lightning-30b-a3b": { name: "Nemotron 3.5 Light", speedSec: 20, score: 86, category: "FAST" },
  "poolside/laguna-xs-2.1": { name: "Laguna XS 2.1", speedSec: 15, score: 80, category: "FAST" },
  "deepseek-ai/deepseek-v4-flash-0731": { name: "DeepSeek V4 Flash", speedSec: 12, score: 84, category: "FAST" },

  // VISION
  "meta/muse-glimmer-30b": { name: "Muse Glimmer 30B", speedSec: 40, score: 88, category: "VISION" },
  "google/diffusiongemma-26b-a4b-it": { name: "DiffusionGemma 26B", speedSec: 35, score: 84, category: "VISION" },
  "meta/llama-3.2-11b-vision-instruct": { name: "Llama 3.2 11B Vis", speedSec: 25, score: 78, category: "VISION" },
  "nvidia/ising-calibration-1.5-31b": { name: "Ising Calibration VLM", speedSec: 18, score: 85, category: "VISION" },

  // CODING
  "deepseek-ai/deepseek-v4-pro-0813": { name: "DeepSeek V4 Pro", speedSec: 45, score: 92, category: "CODING" },
  "nvidia/nemotron-3-super-120b-a12b": { name: "Nemotron 3 Super", speedSec: 30, score: 88, category: "CODING" },
  "nvidia/nemotron-3-ultra-550b-a55b": { name: "Nemotron 3 Ultra", speedSec: 35, score: 90, category: "CODING" },
  "mistralai/mistral-nemotron": { name: "Mistral Nemotron", speedSec: 28, score: 86, category: "CODING" },

  // DEEP
  "nvidia/nemotron-3-ultra-550b-a55b_deep": { id: "nvidia/nemotron-3-ultra-550b-a55b", name: "Nemotron 3 Ultra", speedSec: 40, score: 91, category: "DEEP" },
  "openai/gpt-oss-120b": { name: "GPT-OSS 120B", speedSec: 55, score: 87, category: "DEEP" },
  "google/gemma-4-31b-it": { name: "Gemma 4 31B", speedSec: 50, score: 85, category: "DEEP" },

  // LOCAL
  "local-llava": { name: "Local LLaVA 7B (Vis)", speedSec: 6, score: 78, category: "LOCAL" },
  "local-gguf": { name: "Qwen Coder 2.5 7B", speedSec: 8, score: 75, category: "LOCAL" },
  "ollama-fallback": { name: "Ollama fallback", speedSec: 15, score: 68, category: "LOCAL" }
};

const CATEGORIES = [
  { key: "FAST", label: "FAST", accentBorder: "border-emerald-400", barSpeed: "bg-emerald-400", textAccent: "text-emerald-400" },
  { key: "VISION", label: "VISION", accentBorder: "border-sky-400", barSpeed: "bg-sky-400", textAccent: "text-sky-400" },
  { key: "CODING", label: "CODING", accentBorder: "border-amber-400", barSpeed: "bg-amber-400", textAccent: "text-amber-400" },
  { key: "DEEP", label: "DEEP", accentBorder: "border-[#ff4655]", barSpeed: "bg-[#ff4655]", textAccent: "text-[#ff4655]" },
  { key: "LOCAL", label: "LOCAL", accentBorder: "border-purple-400", barSpeed: "bg-purple-400", textAccent: "text-purple-400" }
];

export default function ModelIntelDashboard() {
  const [isModelIntelOpen, setIsModelIntelOpen] = useState(true);
  const [resources, setResources] = useState([]);
  const [activeResourceMsgId, setActiveResourceMsgId] = useState(null);
  const prevResourcesLenRef = useRef(0);
  const resourcesScrollRef = useRef(null);
  const [telemetry, setTelemetry] = useState(() => {
    try {
      const saved = localStorage.getItem("cypher_model_telemetry");
      return saved ? JSON.parse(saved) : INITIAL_PROBES;
    } catch {
      return INITIAL_PROBES;
    }
  });

  useEffect(() => {
    const handleProbeUpdate = (e) => {
      const { modelId, elapsedSec } = e.detail || {};
      if (!modelId) return;

      setTelemetry((prev) => {
        const next = { ...prev };
        let found = false;

        Object.keys(next).forEach((key) => {
          const item = next[key];
          if (key === modelId || item.id === modelId) {
            found = true;
            const oldSpeed = item.speedSec || elapsedSec;
            const newSpeed = Math.round((oldSpeed * 0.4) + (elapsedSec * 0.6));
            next[key] = {
              ...item,
              speedSec: newSpeed,
              score: Math.min(99, Math.max(60, item.score + (newSpeed < oldSpeed ? 1 : -1)))
            };
          }
        });

        if (!found) {
          const isLocal = modelId.startsWith("local-");
          next[modelId] = {
            name: modelId.split("/").pop().replace("-instruct", "").slice(0, 18),
            speedSec: elapsedSec,
            score: 80,
            category: isLocal ? "LOCAL" : "FAST"
          };
        }

        try {
          localStorage.setItem("cypher_model_telemetry", JSON.stringify(next));
        } catch {}
        return next;
      });
    };

    window.addEventListener("model_probe_update", handleProbeUpdate);
    return () => window.removeEventListener("model_probe_update", handleProbeUpdate);
  }, []);

  useEffect(() => {
    const handleResources = (e) => {
      const { resources: newResources, activeMsgId } = e.detail || {};
      if (Array.isArray(newResources)) {
        setResources(newResources);
        if (newResources.length > 0 && prevResourcesLenRef.current === 0) {
          setIsModelIntelOpen(false);
        }
        prevResourcesLenRef.current = newResources.length;
      }
      if (activeMsgId) setActiveResourceMsgId(activeMsgId);
    };
    const handleVisible = (e) => {
      if (e.detail?.activeMsgId) setActiveResourceMsgId(e.detail.activeMsgId);
    };
    const handleChatChange = () => {
      setResources([]);
      prevResourcesLenRef.current = 0;
      setIsModelIntelOpen(true);
      setActiveResourceMsgId(null);
    };
    window.addEventListener("chat_resources_update", handleResources);
    window.addEventListener("chat_visible_resources", handleVisible);
    window.addEventListener("chat_changed", handleChatChange);
    return () => {
      window.removeEventListener("chat_resources_update", handleResources);
      window.removeEventListener("chat_visible_resources", handleVisible);
      window.removeEventListener("chat_changed", handleChatChange);
    };
  }, []);

  useEffect(() => {
    if (!activeResourceMsgId || !resourcesScrollRef.current) return;
    const el = resourcesScrollRef.current.querySelector(`[data-group-msg-id="${activeResourceMsgId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeResourceMsgId]);

  const getTop3 = (catKey) => {
    const items = Object.entries(telemetry)
      .map(([key, data]) => ({ key, ...data }))
      .filter((item) => item.category === catKey);

    // Rank sorting: lower speedSec = better, higher score = better
    items.sort((a, b) => (a.speedSec - b.speedSec) || (b.score - a.score));

    return items.slice(0, 3);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#090d12] text-[#ece8e1] font-mono select-none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#ff4655]/20 bg-[#0f1923] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="valorant-header text-[16px] text-[#ff4655] tracking-wider font-bold">DASHBOARD</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] tracking-widest text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
          LIVE
        </div>
      </div>

      {/* Model Intel — Collapsible */}
      <div className="shrink-0">
        <button
          onClick={() => setIsModelIntelOpen(!isModelIntelOpen)}
          className="w-full px-4 pt-3 pb-2 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
        >
          <div className="text-[10px] tracking-[0.2em] font-bold text-cyan-400 flex items-center gap-2">
            <span>MODEL INTEL // TOP-3</span>
            <div className="hidden sm:block flex-1 h-px bg-gradient-to-r from-cyan-500/40 to-transparent w-12 ml-2" />
            {resources.length > 0 && !isModelIntelOpen && (
              <span className="text-[8px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">+{resources.length} RES</span>
            )}
          </div>
          <span className="flex items-center gap-2 text-white/40">
            <span className="mono text-[9px] tracking-widest hidden sm:inline">{isModelIntelOpen ? 'HIDE' : 'SHOW'}</span>
            {isModelIntelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isModelIntelOpen ? 'max-h-[55vh] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-3.5 py-2 space-y-3.5 max-h-[45vh] overflow-y-auto scrollbar-thin">
            {CATEGORIES.map((cat) => {
              const top3 = getTop3(cat.key);
              return (
                <div
                  key={cat.key}
                  className="bg-[#0e1620] border border-white/[0.08] p-2.5 relative"
                  style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${cat.barSpeed}`} />
                  <div className="flex items-center justify-between pl-2 mb-2">
                    <span className={`text-[11px] font-extrabold tracking-[0.16em] ${cat.textAccent}`}>{cat.label}</span>
                    <span className="text-[8px] tracking-widest text-white/35 font-bold">TOP 3</span>
                  </div>
                  <div className="space-y-2 pl-2">
                    {top3.map((item, idx) => {
                      const rankColor = idx === 0 ? "text-[#ff4655]" : idx === 1 ? "text-amber-400" : "text-slate-400";
                      const speedWidth = Math.min(100, Math.max(18, Math.round((60 - Math.min(item.speedSec, 60)) / 60 * 100 + 20)));
                      const scoreWidth = Math.min(100, Math.max(20, item.score));
                      return (
                        <div key={item.key || idx} className="text-[10px]">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 truncate pr-2">
                              <span className={`text-[9px] font-bold ${rankColor}`}>#{idx + 1}</span>
                              <span className="text-[#ece8e1] font-medium truncate text-[10px] tracking-tight">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[9px] shrink-0">
                              <span className="text-white/60">{item.speedSec}s</span>
                              <span className={`${cat.textAccent} font-bold`}>{item.score}</span>
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <div className="h-1 bg-[#16202c] overflow-hidden rounded-xs flex">
                              <div className={`h-full ${cat.barSpeed} transition-all duration-500`} style={{ width: `${speedWidth}%` }} />
                            </div>
                            <div className="h-1 bg-[#16202c] overflow-hidden rounded-xs flex">
                              <div className="h-full bg-[#ff4655]/70 transition-all duration-500" style={{ width: `${scoreWidth}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Resources — Sticky per chat */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 border-t border-white/5">
        <div className="px-4 py-2.5 bg-[#0f1923] border-b border-white/5 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] font-bold text-amber-300">
            <BookOpen size={12} className="text-amber-400" />
            <span>RESOURCES</span>
            {resources.length > 0 && <span className="bg-amber-400 text-black text-[9px] px-1.5 py-0.5 rounded-full font-bold">{resources.length}</span>}
          </div>
          <span className="text-[8px] tracking-widest text-white/30">{resources.length ? 'STICKY • PER CHAT' : 'NO LINKS YET'}</span>
        </div>
        <div ref={resourcesScrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 scrollbar-thin bg-[#090d12] scroll-smooth">
          {resources.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
                <Link2 size={16} className="text-white/20" />
              </div>
              <p className="mono text-[10px] tracking-widest text-white/30">NO RESOURCES YET</p>
              <p className="raj text-white/40 text-[11px] leading-relaxed">Links from assistant replies will appear here, sticky with the current chat.</p>
            </div>
          ) : (
            (() => {
              const grouped = resources.reduce((acc, r) => {
                const k = r.msgId || 'unknown';
                if (!acc[k]) acc[k] = [];
                acc[k].push(r);
                return acc;
              }, {});
              const groups = Object.entries(grouped);
              return (
                <div className="space-y-4">
                  {groups.map(([msgId, groupResources]) => {
                    const isActive = activeResourceMsgId === msgId;
                    return (
                      <div key={msgId} data-group-msg-id={msgId} className="space-y-2">
                        <div className={`sticky top-0 z-5 px-2 py-1.5 -mx-1 flex items-center justify-between backdrop-blur bg-[#090d12]/90 border-b ${isActive ? 'border-amber-400/30' : 'border-white/5'}`}>
                          <span className={`mono text-[9px] tracking-[0.16em] font-bold flex items-center gap-1.5 ${isActive ? 'text-amber-300' : 'text-white/30'}`}>
                            <Layers size={10} className={isActive ? 'text-amber-400' : 'text-white/20'} />
                            {isActive ? 'CURRENT • STICKY' : 'RESOURCES'}
                          </span>
                          <span className={`mono text-[8px] tracking-widest px-1.5 py-0.5 rounded ${isActive ? 'bg-amber-400 text-black' : 'bg-white/5 text-white/30'}`}>{groupResources.length}</span>
                        </div>
                        <div className="space-y-2.5">
                          {groupResources.map((res, idx) => (
                            <div
                              key={`${res.url}-${idx}`}
                              className={`group relative bg-[#0e1620] border p-3 transition-colors ${isActive ? 'border-amber-400/30 shadow-[0_0_12px_rgba(245,158,11,0.12)]' : 'border-white/[0.06] hover:border-white/10'}`}
                              style={{ clipPath: 'polygon(6px 0,100% 0,100% calc(100% - 6px), calc(100% - 6px) 100%,0 100%,0 6px)' }}
                            >
                              {isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-400" />}
                              <div className="flex items-start gap-2.5">
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${res.domain}&sz=32`}
                                  alt=""
                                  className="w-7 h-7 rounded bg-white/10 border border-white/10 shrink-0 mt-0.5"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                <div className="flex-1 min-w-0">
                                  <a href={res.url} target="_blank" rel="noopener noreferrer" className="display text-[11px] font-bold text-white hover:text-amber-300 leading-tight line-clamp-2 flex items-center gap-1">
                                    {res.title || res.domain}
                                    <ExternalLink size={10} className="text-white/30 group-hover:text-amber-400 shrink-0" />
                                  </a>
                                  <p className="mono text-[9px] tracking-wide text-cyan-300/60 truncate mt-0.5">{res.domain}</p>
                                  {res.snippet && <p className="raj text-[11px] leading-snug text-white/50 mt-1 line-clamp-2">{res.snippet}</p>}
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="mono text-[8px] tracking-widest px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-white/30">{res.type || 'LINK'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* Footer Legend */}
      <div className="p-3 bg-[#0c131c] border-t border-white/10 shrink-0 text-[8px] text-white/50 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-bold tracking-wider text-white/70">LIVE METRICS</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-emerald-400" /> speed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-[#ff4655]" /> score
            </span>
          </div>
        </div>
        <div className="text-[7.5px] text-white/40 tracking-tight">Speed · Accuracy (your runs)</div>
        <div className="text-[7px] text-cyan-400/60 tracking-widest uppercase flex items-center gap-1">
          <Activity size={8} className="text-cyan-400" /> Updated from session probes
        </div>
      </div>
    </div>
  );
}
