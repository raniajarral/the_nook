import React, { useState } from "react";

import { useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface AuthFormProps {
  onAuthSuccess: (role: "admin" | "user") => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const now = new Date();
        // Only require displayName and email, set other fields to null
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email,
          displayName,
          username: null,
          status: "user",
          createdAt: now,
          updatedAt: now,
        });
        onAuthSuccess("user");
        setError("");
        setShowDialog(true);
        setTimeout(() => {
          setShowDialog(false);
          navigate("/");
        }, 1800);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Check user role
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        const role = userDoc.exists() ? userDoc.data().role : "user";
        onAuthSuccess(role);
        setError("");
        setShowDialog(true);
        setTimeout(() => {
          setShowDialog(false);
          navigate("/");
        }, 1800);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 max-w-sm mx-auto p-6 bg-background rounded-2xl shadow-xl border border-border animate-fade-in"
      >
        <h2 className="text-2xl font-bold mb-2 text-foreground text-center tracking-tight animate-slide-down">
          {isSignup ? "Sign Up" : "Login"}
        </h2>
        <div className="flex flex-col gap-4">
          {isSignup && (
            <div className="relative group">
              <input
                type="text"
                placeholder="Name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required={isSignup}
                className="w-full px-4 py-3 bg-muted text-foreground placeholder:text-muted-foreground rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-all duration-300 shadow-sm"
                autoComplete="name"
              />
            </div>
          )}
          <div className="relative group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-muted text-foreground placeholder:text-muted-foreground rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-all duration-300 shadow-sm"
              autoComplete="email"
            />
          </div>
          <div className="relative group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-muted text-foreground placeholder:text-muted-foreground rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-all duration-300 shadow-sm"
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
          </div>
        </div>
        {error && (
          <div className="text-red-500 text-center font-medium animate-shake">
            {error}
          </div>
        )}
        <button
          type="submit"
          className="w-full py-3 mt-2 rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/60 active:scale-95 animate-fade-in"
        >
          {isSignup ? "Sign Up" : "Login"}
        </button>
        <button
          type="button"
          onClick={() => setIsSignup(!isSignup)}
          className="w-full text-muted-foreground hover:text-primary underline text-sm mt-2 transition-colors duration-200 animate-fade-in"
        >
          {isSignup ? "Already have an account? Login" : "Don't have an account? Sign Up"}
        </button>
      </form>
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
          <div className="relative max-w-xs w-full rounded-2xl p-7 text-center border border-border shadow-2xl backdrop-blur-xl bg-white/10 dark:bg-[#23272f]/80" style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
            <button
              aria-label="Close dialog"
              onClick={() => setShowDialog(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-primary rounded-full p-1 bg-black/10 hover:bg-primary/10 transition-colors"
              tabIndex={0}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-2">
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div className="text-lg font-semibold mb-1 text-white drop-shadow">
                {isSignup ? "Account created!" : "Login successful!"}
              </div>
              <div className="text-muted-foreground mb-1">Redirecting to your nook...</div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .animate-fade-in { animation: fadeIn 1s ease; }
        .animate-slide-down { animation: slideDown 1s cubic-bezier(.4,2,.6,1); }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(2px); } 30%, 50%, 70% { transform: translateX(-4px); } 40%, 60% { transform: translateX(4px); } }
      `}</style>
    </>
  );
};
