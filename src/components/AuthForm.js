import React, { useState } from "react";
import nhost from "../nhost.js";

export default function AuthForm({ onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [showResend, setShowResend] = useState(false);
  const [resendMessage, setResendMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setResendMessage(null);

    try {
      let result;
      if (isSignUp) {
        // Sign-up automatically triggers verification email
        result = await nhost.auth.signUp({ email, password });
        if (result.error) throw result.error;

        setInfoMessage(
          "Sign-up successful! Please check your email for verification before signing in."
        );
        setShowResend(true); // allow resend option
      } else {
        result = await nhost.auth.signIn({ email, password });
        if (result.error) throw result.error;

        onAuthSuccess(result.session?.user);
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    }
  };

  const handleResendVerification = async () => {
    setError(null);
    setResendMessage(null);
    try {
      const res = await nhost.auth.sendVerificationEmail({ email });
      if (res.error) throw res.error;
      setResendMessage("Verification email resent! Please check your inbox.");
    } catch (err) {
      setError(err.message || "Failed to resend verification email.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {isSignUp ? "Create an Account" : "Welcome Back"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
          >
            {isSignUp ? "Register" : "Login"}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {infoMessage && (
          <div className="mt-4 text-center">
            <p className="text-sm text-green-600">{infoMessage}</p>
            {showResend && (
              <button
                onClick={handleResendVerification}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Didn’t get the email? Resend
              </button>
            )}
          </div>
        )}
        {resendMessage && (
          <p className="mt-2 text-sm text-green-600">{resendMessage}</p>
        )}

        <p
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setInfoMessage(null);
            setResendMessage(null);
          }}
          className="mt-6 text-sm text-blue-600 cursor-pointer hover:underline text-center"
        >
          {isSignUp
            ? "Already have an account? Sign In"
            : "Don't have an account? Sign Up"}
        </p>
      </div>
    </div>
  );
}
