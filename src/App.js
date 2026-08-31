import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import AuthForm from './components/AuthForm';
import ChatList from './components/chat/ChatList';
import ChatWindow from './components/chat/ChatWindow';
import ModelIntelDashboard from './components/chat/ModelIntelDashboard';
import { Menu, X, Zap, Activity, Crosshair, Radio, Box, Camera, KeyRound, ShieldCheck, Gauge, ChevronRight } from "lucide-react";

function App() {
  const { user, loading } = useAuth();
  const [selectedChat, setSelectedChat] = useState(() => localStorage.getItem("selectedChatId") || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  React.useEffect(() => {
    if (selectedChat) {
      localStorage.setItem("selectedChatId", selectedChat);
    } else {
      localStorage.removeItem("selectedChatId");
    }
  }, [selectedChat]);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-black overflow-hidden flex items-center justify-center">
        <div className="sci-bg" />
        <div className="sci-grid" />
        <div className="sci-stars" />
        <div className="tunnel-floor" />
        <div className="tunnel-rays" />
        <div className="tunnel-center-glow" />
        <div className="tunnel-streaks"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="hud-arc hud-arc-left"><div className="hud-arc-inner" /></div>
        <div className="hud-arc hud-arc-right"><div className="hud-arc-inner" /></div>
        <div className="sci-vignette" />
        <div className="relative flex flex-col items-center gap-8 z-10">
          <div className="relative w-36 h-36">
            <div className="absolute inset-0 rounded-full border border-cyan-400/20" />
            <div className="absolute inset-2 rounded-full border border-dashed border-cyan-400/30 animate-orbit" />
            <div className="absolute inset-5 rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-400/50 animate-orbit" style={{ animationDuration: '1.2s' }} />
            <div className="absolute inset-9 rounded-full border border-cyan-300/40 animate-orbit-rev" />
            <div className="absolute inset-0 rounded-full border border-cyan-400/10 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_18px_rgba(0,234,255,0.9)] animate-pulse-glow" />
            <div className="absolute inset-0 animate-orbit" style={{ animationDuration: '8s' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-cyan-400 shadow-[0_0_6px_cyan]" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-cyan-400/50" />
            </div>
          </div>
          <div className="text-center space-y-3">
            <p className="display text-[11px] tracking-[0.32em] text-cyan-300/90">NEURAL LINK • INITIALIZING</p>
            <p className="mono text-xs text-cyan-100/70 tracking-widest animate-pulse">ESTABLISHING HOLO-DECK<span className="animate-pulse">...</span></p>
            <div className="w-48 h-[2px] mx-auto bg-cyan-950 rounded-full overflow-hidden border border-cyan-900/50">
              <div className="h-full w-1/2 bg-gradient-to-r from-cyan-400 to-teal-300 relative" style={{ animation: 'scanMove 1.1s linear infinite' }} />
            </div>
          </div>
          <div className="flex items-center gap-2 mono text-[10px] tracking-[0.2em] text-cyan-500/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            SYS.BOOT • VER 4.7.2
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <>
      {/* Background — Vast 3D Universe Far Behind */}
      <div className="bg-layers" aria-hidden>
        <div className="sci-bg" />
        <div className="sci-stars-far" />
        <div className="sci-stars-near" />
        <div className="sci-stars" />
        {/* 3D grid room side walls — same angle as side screens */}
        <div className="room-wall room-wall-left" />
        <div className="room-wall room-wall-right" />
        <div className="room-wall room-wall-back" />
        <div className="room-wall room-wall-floor" />
        <div className="tunnel-floor" />
        <div className="tunnel-rays" />
        <div className="tunnel-center-glow" />
        <div className="tunnel-streaks"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="hud-arc hud-arc-left"><div className="hud-arc-inner" /></div>
        <div className="hud-arc hud-arc-right"><div className="hud-arc-inner" /></div>
        <div className="hud-ticks" />
        <div className="sci-vignette" />
      </div>

      <div className="cinema-wrapper text-cyan-50 selection:bg-cyan-400/30 selection:text-white">
        {/* Ambient side glows — inside wrapper but absolute, not fixed */}
        <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-80 h-[70vh] bg-cyan-500/10 blur-[90px] rounded-full pointer-events-none z-0 hidden lg:block" />
        <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-80 h-[70vh] bg-teal-500/10 blur-[90px] rounded-full pointer-events-none z-0 hidden lg:block" />

        <div className="cinema-shell">
          <div className="cockpit-top-beam hidden lg:block" />

          <div className="cinema-content">
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/65 backdrop-blur-[2px] z-20 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}
            {/* Left screen — attached to left side wall with same angle (Image 1) — tilt on inner wrapper to avoid drawer conflict */}
            <aside
              className={`fixed lg:static top-0 left-0 h-full w-[86vw] max-w-[360px] lg:w-auto flex flex-col z-30 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:shrink-0
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
            >
              <div className="h-full p-3 lg:p-2 lg:pr-1 flex flex-col relative triple-left">
                <div className="hidden lg:block float-shadow" />
                <div className="h-full valorant-panel flex flex-col overflow-hidden relative">
                  <div className="scanline" />
                  <div className="absolute inset-0 pointer-events-none rounded-[22px] border border-white/5" />

                  <div className="relative px-5 py-4 border-b border-[#ff4655]/20 bg-[#0f1923]">
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#ff4655]" />
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-10 flex items-center justify-center">
                          <div className="absolute inset-0 bg-[#ff4655] shadow-[0_0_12px_rgba(255,70,85,0.5)]" style={{ clipPath: 'polygon(6px 0,100% 0,100% calc(100% - 6px), calc(100% - 6px) 100%,0 100%,0 6px)' }} />
                          <span className="relative valorant-header text-white text-[20px] tracking-widest">&gt;_</span>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#ece8e1] rounded-full border-2 border-[#0f1923]" />
                        </div>
                        <div>
                          <h2 className="valorant-header text-[18px] tracking-[0.06em] valorant-beige leading-none">&gt;_ INPUT<span className="valorant-accent">CHAT</span></h2>
                          <p className="valorant-label text-[10px] tracking-[0.16em] text-[#ece8e1]/60 mt-1 flex items-center gap-1.5"><Radio size={10} className="text-[#ff4655]" /> COCKPIT • MK-VII</p>
                        </div>
                      </div>
                      <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden w-8 h-8 bg-[#1a242e] border border-white/10 flex items-center justify-center text-white hover:bg-[#ff4655]/20 transition-colors" style={{ clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px), calc(100% - 5px) 100%,0 100%,0 5px)' }}>
                        <X size={16} />
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 valorant-label text-[9px]">
                      <div className="bg-[#1a242e] border border-white/10 px-2 py-1.5 flex items-center gap-1.5" style={{ clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px), calc(100% - 5px) 100%,0 100%,0 5px)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff4655] animate-pulse shadow-[0_0_6px_rgba(255,70,85,0.6)]" />
                        <span className="tracking-widest text-[#ece8e1]/80">COMMS</span>
                      </div>
                      <div className="bg-[#1a242e] border border-white/10 px-2 py-1.5 flex items-center gap-1.5" style={{ clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px), calc(100% - 5px) 100%,0 100%,0 5px)' }}>
                        <Activity size={10} className="text-[#ff4655]" />
                        <span className="tracking-widest text-[#ece8e1]/80">LNK 98%</span>
                      </div>
                      <div className="bg-[#1a242e] border border-white/10 px-2 py-1.5 flex items-center gap-1.5" style={{ clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px), calc(100% - 5px) 100%,0 100%,0 5px)' }}>
                        <Zap size={10} className="text-[#ff4655]" />
                        <span className="tracking-widest text-[#ece8e1]/80">PWR OK</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <ChatList
                      onSelectChat={(id) => {
                        setSelectedChat(id);
                        setIsSidebarOpen(false);
                      }}
                      currentChatId={selectedChat}
                    />
                  </div>
                </div>
              </div>
            </aside>

            {/* Center — big screen (triple-screen middle) */}
            <main className="flex-1 flex flex-col relative min-w-0 min-h-0 z-10 triple-center">
              {!isSidebarOpen && (
                <div className="lg:hidden sticky top-0 z-20 bg-[#0f1923] border-b border-[#ff4655]/15 px-3 py-2.5 flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="w-9 h-9 bg-[#ff4655] text-white flex items-center justify-center shrink-0 hover:bg-[#e03a4a] transition-colors"
                    style={{ clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px), calc(100% - 5px) 100%,0 100%,0 5px)' }}
                    aria-label="Open menu"
                  >
                    <Menu size={18} />
                  </button>
                  <span className="valorant-header text-[12px] tracking-[0.06em] text-[#ece8e1]">&gt;_ inputChat</span>
                  <span className="ml-auto valorant-label text-[9px] tracking-wide text-white/35">SPAWNING </span>
                </div>
              )}

              <div className="flex-1 p-0 lg:p-2 flex flex-col min-h-0 relative">
                <div className="hidden lg:block float-shadow" />
                <div className="flex-1 min-h-0 flex flex-col relative glass-holo overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent opacity-60" />
                  {/* top HUD micro inside */}
                  <div className="hidden lg:flex absolute top-3 left-1/2 -translate-x-1/2 items-center gap-2 mono text-[9px] tracking-[0.18em] text-cyan-100/45 pointer-events-none z-10">
                    <span className="w-8 h-px bg-white/10" />
                    <Crosshair size={12} className="text-cyan-400/30" />
                    <span>AZ 024° • ALT 14.2K • HUD LOCK</span>
                    <Crosshair size={12} className="text-cyan-400/30" />
                    <span className="w-8 h-px bg-white/10" />
                  </div>

                  {selectedChat ? (
                    <ChatWindow key={selectedChat} chatId={selectedChat} />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 lg:p-10 relative overflow-hidden">
                      {/* faint orbital rings behind */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.08]">
                        <div className="w-[520px] h-[520px] rounded-full border border-cyan-400 border-dashed" />
                        <div className="absolute w-[380px] h-[380px] rounded-full border border-cyan-400/40" />
                        <div className="absolute w-[240px] h-[240px] rounded-full border border-cyan-300/60" style={{ boxShadow: '0 0 40px rgba(0,234,255,0.18) inset' }} />
                      </div>

                      <div className="relative max-w-lg w-full">
                        <div className="w-24 h-24 mx-auto rounded-[18px] bg-white/[0.06] backdrop-blur border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(0,234,255,0.18)] mb-6 relative">
                          <Crosshair size={36} className="text-cyan-300 animate-pulse" />
                          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-cyan-400 text-black mono text-[7px] font-bold tracking-widest rounded-full">READY</div>
                        </div>
                        <div className="mono text-[10px] tracking-[0.32em] text-cyan-300/70 mb-2">STANDBY • AWAITING NEURAL INPUT</div>
                        <h3 className="display text-2xl lg:text-3xl font-bold tracking-wide text-white mb-3">How can I assist,<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-teal-300">Commander?</span></h3>
                        <p className="raj text-cyan-100/60 max-w-md mx-auto leading-relaxed">Select a transmission from the telemetry deck or initialize a new holo-link to begin your deep-space conversation.</p>

                        <div className="mt-6 flex flex-wrap justify-center gap-2 mono text-[10px]">
                          <span className="px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-200 tracking-widest">◉ VOICE SYNTH • ONLINE</span>
                          <span className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/8 text-white/35 tracking-widest">NAV • 0.00, 0.00</span>
                        </div>

                        {/* Bottom inventory floating (Image 1) — only on empty state center */}
                        <div className="mt-10 hidden lg:flex flex-col items-center gap-3">
                          <div className="flex gap-2">
                            {[
                              { icon: KeyRound, label: 'KEY', active: true },
                              { icon: Box, label: 'ITEM', active: false },
                              { icon: Camera, label: 'CAM', active: false },
                              { icon: ShieldCheck, label: 'SHLD', active: false },
                              { icon: Gauge, label: 'BOOST', active: false },
                            ].map((it, idx) => (
                              <div key={idx} className={`w-[72px] h-[64px] inv-chip flex flex-col items-center justify-center gap-1 ${it.active ? '!bg-cyan-400/15 !border-cyan-400/40 shadow-[0_0_16px_rgba(0,234,255,0.28)]' : ''}`}>
                                <it.icon size={18} className={it.active ? 'text-cyan-300' : 'text-white/30'} />
                                <span className={`mono text-[8px] tracking-widest ${it.active ? 'text-cyan-200' : 'text-white/30'}`}>{idx + 1}</span>
                              </div>
                            ))}
                          </div>
                          <div className="hud-card w-full max-w-[420px] px-4 py-3 flex items-center justify-between text-left">
                            <div>
                              <div className="mono text-[9px] tracking-[0.18em] text-amber-200/70">JOURNAL ENTRY</div>
                              <p className="raj text-[13px] leading-snug text-white/80 mt-1">Dr. Velum&apos;s experiments were said to unlock the secrets of time itself...</p>
                            </div>
                            <ChevronRight size={16} className="text-white/30 flex-shrink-0 ml-3" />
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-4 left-6 right-6 hidden lg:flex justify-between mono text-[9px] tracking-[0.18em] text-white/20">
                        <span>◂ WING LEFT • SHIELDS 100% ▸</span>
                        <span>◂ WING RIGHT • SHIELDS 100% ▸</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="hidden lg:flex mt-1 items-center justify-between mono text-[9px] tracking-[0.16em] text-white/25 px-1">
                  <span className="flex items-center gap-2"><span className="w-6 h-px bg-white/10" /> HULL INTEGRITY • NOMINAL</span>
                  <span className="flex items-center gap-2">QUANTUM RELAY • ENCRYPTED <span className="w-6 h-px bg-white/10" /></span>
                </div>
              </div>
            </main>

            {/* Right screen — Model Intel TOP-3 Live Telemetry Dashboard */}
            <aside className="hidden xl:flex shrink-0 flex-col w-[320px] triple-right">
              <div className="relative flex flex-col h-full">
                <div className="hidden xl:block float-shadow" />
                <div className="valorant-panel flex-1 flex flex-col overflow-hidden">
                  <ModelIntelDashboard />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
