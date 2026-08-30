import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Loader2, ShieldCheck, Cpu, Lock, Mail, Crosshair, Zap, Radio } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const endpoint = isLogin ? "/auth/login" : "/auth/signup";
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");
      login(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center py-8 px-4 overflow-hidden bg-[#010a0f]">
      <div className="sci-bg" />
      <div className="sci-grid" />
      <div className="sci-stars" />
      <div className="sci-vignette" />
      <div className="cockpit-top-beam" />

      {/* orbital background */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[720px] h-[720px] rounded-full border border-cyan-400/10 absolute" />
        <div className="w-[560px] h-[560px] rounded-full border border-dashed border-cyan-400/15 absolute animate-spin" style={{ animationDuration: '40s' }} />
        <div className="w-[420px] h-[420px] rounded-full border border-cyan-300/10 absolute" />
        <div className="w-[320px] h-[320px] rounded-full border border-cyan-400/20 absolute shadow-[0_0_60px_rgba(0,234,255,0.12)_inset]" />
      </div>
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[280px] bg-cyan-400/10 blur-[70px] rounded-[100%] pointer-events-none" />

      <div className="relative w-full max-w-[440px]">
        {/* top clearance badge */}
        <div className="flex justify-center mb-4">
          <div className="sci-panel-cut-sm bg-cyan-400/10 border-cyan-400/20 px-3 py-1.5 flex items-center gap-2 mono text-[10px] tracking-[0.22em] text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
            QUANTUM GATEWAY • SECURE UPLINK
            <Radio size={10} className="text-cyan-400" />
          </div>
        </div>

        <div className="sci-panel sci-panel-cut p-7 lg:p-8 relative overflow-hidden">
          <span className="corners"><i/><i/><i/><i/></span>
          <div className="scanline" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <div className="text-center relative">
            <div className="mx-auto w-14 h-14 sci-panel sci-panel-cut-sm bg-cyan-400/15 border-cyan-400/40 flex items-center justify-center relative shadow-[0_0_20px_rgba(0,234,255,0.25)]">
              <span className="corners"><i/><i/><i/><i/></span>
              <Cpu size={22} className="text-cyan-300" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0a1f2a] animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            </div>
            <h2 className="mt-4 display text-[22px] font-extrabold tracking-[0.16em] text-white">
              {isLogin ? "INITIATE LINK" : "REGISTER CREW"}
            </h2>
            <p className="mono text-[10px] tracking-[0.18em] text-cyan-300/60 mt-1 flex items-center justify-center gap-1.5">
              <Crosshair size={10} /> {isLogin ? "AUTHENTICATE TO ACCESS COCKPIT" : "CREATE QUANTUM IDENTITY"}
            </p>
            <div className="mt-3 hud-line opacity-40" />
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="sci-panel sci-panel-cut-sm bg-red-500/10 border-red-400/30 text-red-200 px-3 py-2.5 mono text-xs tracking-wide flex items-start gap-2">
                <ShieldCheck size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="group">
                <label className="mono text-[10px] tracking-[0.18em] text-cyan-300/80 flex items-center gap-1.5 mb-1.5">
                  <Mail size={11} /> EMAIL IDENTITY
                </label>
                <div className="relative">
                  <div className="absolute inset-0 sci-panel-cut-sm bg-cyan-400/10 opacity-0 group-focus-within:opacity-100 blur-[4px] transition-opacity pointer-events-none" />
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="relative w-full sci-panel-cut-sm bg-black/30 border-cyan-400/20 text-cyan-50 placeholder:text-cyan-100/25 px-3 py-3 mono text-sm tracking-wide focus:outline-none focus:border-cyan-400/50 focus:bg-cyan-950/20 transition-colors"
                    placeholder="commander@orbit.station"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:block">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50" />
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="mono text-[10px] tracking-[0.18em] text-cyan-300/80 flex items-center gap-1.5 mb-1.5">
                  <Lock size={11} /> ACCESS CODE
                </label>
                <div className="relative">
                  <div className="absolute inset-0 sci-panel-cut-sm bg-cyan-400/10 opacity-0 group-focus-within:opacity-100 blur-[4px] transition-opacity pointer-events-none" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="relative w-full sci-panel-cut-sm bg-black/30 border-cyan-400/20 text-cyan-50 placeholder:text-cyan-100/25 px-3 py-3 mono text-sm tracking-wide focus:outline-none focus:border-cyan-400/50 focus:bg-cyan-950/20 transition-colors"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full holo-btn sci-panel-cut-sm py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Zap size={14} className="text-cyan-200" />}
              {isLogin ? "ESTABLISH LINK" : "CREATE IDENTITY"}
            </button>

            <div className="relative flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-400/15" />
              <span className="mono text-[10px] tracking-[0.18em] text-cyan-300/35">OR</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-400/15" />
            </div>

            <div className="text-center">
              <p className="raj text-sm text-cyan-100/60">
                {isLogin ? "No clearance?" : "Already enlisted?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="mono text-xs tracking-[0.14em] text-cyan-300 hover:text-cyan-200 underline decoration-cyan-400/30 underline-offset-4 transition-colors"
                >
                  {isLogin ? "REGISTER CREW →" : "AUTHENTICATE →"}
                </button>
              </p>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-between mono text-[9px] tracking-[0.16em] text-cyan-400/30 border-t border-cyan-400/10 pt-3">
            <span className="flex items-center gap-1"><ShieldCheck size={10} /> BIO-LOCK • ENCRYPTED</span>
            <span>SYS v4.7.2</span>
          </div>
        </div>

        <p className="mono text-[9px] tracking-[0.18em] text-cyan-400/25 text-center mt-3">◂ WARP CORE STABLE • SHIELDS NOMINAL ▸</p>
      </div>
    </div>
  );
};

export default AuthForm;
