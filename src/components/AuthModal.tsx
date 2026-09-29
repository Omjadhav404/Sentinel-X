'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; email: string; isDemo?: boolean }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'forgot') {
      setMessage('Password reset instructions sent if account exists.');
      return;
    }
    // Clean mock login
    onLoginSuccess({
      name: name.trim() || email.split('@')[0] || 'Security Lead',
      email: email.trim() || 'operator@sentinelx.security',
      isDemo: false,
    });
    onClose();
  };

  const handleQuickDemoLogin = () => {
    onLoginSuccess({
      name: 'Alex Rivera (Demo)',
      email: 'alex.rivera@enterprisesecurity.io',
      isDemo: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md glass-panel p-6 sm:p-8 bg-[#0c121d] border-cyan-500/30 shadow-[0_0_50px_rgba(0,242,254,0.15)] rounded-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">SentinelX Platform</h3>
            <p className="text-xs text-slate-400">Access security reports and scan monitors</p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-white/10 mb-6 text-xs font-semibold">
          <button
            onClick={() => setTab('login')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              tab === 'login' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              tab === 'signup' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
          <button
            onClick={() => setTab('forgot')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              tab === 'forgot' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Reset
          </button>
        </div>

        {/* Quick Demo Access Button */}
        <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/30 flex items-center justify-between">
          <div className="text-left">
            <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Instant Demo Access
            </div>
            <div className="text-[11px] text-slate-400">Preview authenticated scanner features</div>
          </div>
          <button
            onClick={handleQuickDemoLogin}
            className="btn-outline-cyan text-xs !py-1.5 !px-3 font-mono"
          >
            1-Click Login
          </button>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Security Specialist"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/90 border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@company.com"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/90 border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {tab !== 'forgot' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/90 border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary w-full justify-center text-xs py-2.5 mt-2">
            <span>{tab === 'login' ? 'Sign In to Dashboard' : tab === 'signup' ? 'Create Account' : 'Send Reset Link'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-slate-500">
          Environment-ready authentication architecture. Ready for Supabase, NextAuth.js, or Cognito.
        </p>
      </div>
    </div>
  );
};
