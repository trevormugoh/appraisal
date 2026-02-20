"use client";

import { useAuth, MOCK_USERS } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@/lib/types";

export default function LandingPage() {
  const { switchRole } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login delay
    setTimeout(() => {
      // For demo purposes, we'll find the user by email or just default to first one
      const user = MOCK_USERS.find(u => u.email === email) || MOCK_USERS[1];
      switchRole(user.role);
      router.push("/dashboard");
    }, 800);
  };

  const useDemo = (role: UserRole) => {
    const user = MOCK_USERS.find(u => u.role === role);
    if (user) {
      setEmail(user.email);
      setPassword("password123");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center py-8 md:py-12 px-4 sm:px-6 selection:bg-primary/10 overflow-x-hidden relative">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-surface-dark/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-[480px] animate-slide-up">
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm animate-slide-down">
            <div className="w-4 h-4 rounded bg-primary flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
              qwik<span className="text-primary">pace</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-surface-dark tracking-tight leading-tight mb-3">
            Welcome <span className="text-primary">Back</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed px-4">
            Enter your credentials to access the performance portal.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-[32px] md:rounded-[40px] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-6 md:p-10 animate-scale-in">
          <form onSubmit={handleLogin} className="space-y-5 md:space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl px-4 md:px-5 py-3.5 md:py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl px-4 md:px-5 py-3.5 md:py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full bg-surface-dark text-white rounded-xl md:rounded-2xl py-3.5 md:py-4 font-black text-xs md:text-sm uppercase tracking-widest hover:bg-black transition-all duration-300 overflow-hidden disabled:opacity-70"
            >
              <span className={`flex items-center justify-center gap-2 transition-transform duration-300 ${isLoading ? 'translate-y-[-100%]' : ''}`}>
                Sign In
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-dark">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </button>
          </form>

          {/* Demo Credentials Section */}
          <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-slate-100/50">
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-center text-slate-400 mb-4 md:mb-6">
              Quick access demo credentials
            </p>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {(['hr', 'employee', 'manager'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => useDemo(role)}
                  className="flex flex-col items-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-xl md:rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center mb-0.5 md:mb-1 group-hover:scale-110 transition-transform bg-slate-100 text-slate-500">
                    {role === 'hr' && (
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                    {role === 'employee' && (
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    {role === 'manager' && (
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-primary transition-colors">
                    {role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 md:mt-12 text-center animate-fade-in opacity-50">
          <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">
            © 2026 QwikPace Technologies
          </div>
        </div>
      </div>
    </div>
  );
}


