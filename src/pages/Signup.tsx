import React from "react";
import { AuthForm } from "../components/AuthForm";

const Signup: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#18181b] via-[#23232a] to-[#101014] dark">
  <div className="w-full max-w-md p-6 sm:p-8 md:p-10 animate-fade-in md:bg-white/5 md:dark:bg-white/10 md:backdrop-blur-xl md:rounded-3xl md:shadow-2xl md:border md:border-white/10">
        <button
          onClick={() => window.location.href = '/'}
          className="mb-4 text-sm text-foreground/70 hover:text-yellow-400 px-2 py-1 rounded transition-colors focus:outline-none focus:underline underline underline-offset-2"
          style={{ background: 'none', border: 'none' }}
        >
          ← Back to Library
        </button>
        <h1 className="text-4xl font-extrabold text-white text-center mb-2 tracking-tight drop-shadow-lg animate-slide-down">
          Welcome
        </h1>
        <p className="text-lg text-foreground/80 text-center mb-8 animate-fade-in delay-100">
          Sign up to join <span className="text-yellow-400 font-semibold">My Nook</span>
        </p>
        <AuthForm onAuthSuccess={() => {}} />
      </div>
      <style>{`
        .animate-fade-in { animation: fadeIn 1s ease; }
        .animate-slide-down { animation: slideDown 1s cubic-bezier(.4,2,.6,1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default Signup;
