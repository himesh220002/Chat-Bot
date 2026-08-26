import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

const API_URL = "http://localhost:4000/api";

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

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      login(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-zinc-200">
        <div>
          <div className="mx-auto h-12 w-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white text-xl font-bold">C</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-900 tracking-tight">
            {isLogin ? "Sign in to your account" : "Create an account"}
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600">
            Or{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-zinc-900 hover:text-zinc-700 underline underline-offset-4"
            >
              {isLogin ? "start your journey today" : "sign in to existing account"}
            </button>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-4 shadow-sm">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="email-address">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2.5 border border-zinc-300 placeholder-zinc-400 text-zinc-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 focus:z-10 sm:text-sm transition-colors"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2.5 border border-zinc-300 placeholder-zinc-400 text-zinc-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 focus:z-10 sm:text-sm transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
              ) : null}
              {isLogin ? "Sign in" : "Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
