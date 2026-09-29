'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthModal } from '@/components/AuthModal';
import { MonitoringTarget } from '@/lib/scanner/types';
import {
  Activity, Bell, Plus, Calendar, Clock, CheckCircle2, AlertTriangle,
  TrendingUp, Shield, Mail, Play, Pause, Server, ExternalLink, Info
} from 'lucide-react';

export default function MonitoringPage() {
  const [targets, setTargets] = useState<MonitoringTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newFrequency, setNewFrequency] = useState<'daily' | 'weekly' | 'continuous'>('daily');
  const [newEmail, setNewEmail] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; isDemo?: boolean } | null>(null);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/monitoring');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTargets(json.data);
      }
    } catch (err) {
      console.error('Failed to load targets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleAddTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || !newEmail) return;

    try {
      const res = await fetch('/api/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newUrl,
          frequency: newFrequency,
          alertEmail: newEmail,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setTargets((prev) => [...prev, json.data]);
        setIsAddOpen(false);
        setNewUrl('');
        setNewEmail('');
      }
    } catch (err) {
      console.error('Failed to create monitor:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        user={currentUser}
        onLogout={() => setCurrentUser(null)}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold">
                CONTINUOUS PERIMETER SURVEILLANCE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Website Security Monitoring
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Track security score drift, SSL expiration, and header configuration changes over time
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="btn-primary text-xs !py-2.5 !px-4"
          >
            <Plus className="w-4 h-4" />
            <span>Add Monitored Website</span>
          </button>
        </div>

        {/* Architectural Notice */}
        <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3 text-xs text-slate-300">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-cyan-300">Continuous Monitoring Architecture:</strong> Scheduled assessments utilize our modular scanner interface. In production, configure a recurring cron daemon (e.g. AWS EventBridge, Vercel Cron, or Kubernetes CronJob) invoking <code className="text-cyan-200 bg-slate-900 px-1 py-0.5 rounded font-mono">POST /api/scan</code> with alert dispatch via SendGrid/Resend.
          </div>
        </div>

        {/* Monitored Targets List */}
        <div className="space-y-6">
          {targets.map((target) => {
            // Generate visual sparkline/trend data points
            const points = target.scoreHistory || [
              { date: 'Day 1', score: target.currentScore - 3 },
              { date: 'Day 2', score: target.currentScore - 1 },
              { date: 'Day 3', score: target.currentScore + 2 },
              { date: 'Day 4', score: target.currentScore },
            ];

            return (
              <div
                key={target.id}
                className="glass-panel p-6 bg-slate-900/70 border-white/10 rounded-2xl space-y-6 hover:border-cyan-500/30 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-lg font-bold text-white font-mono">{target.url}</h3>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono uppercase font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {target.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-400">
                      <span>Frequency: <strong className="text-slate-200 capitalize">{target.frequency}</strong></span>
                      <span>• Alert Email: <strong className="text-slate-200">{target.alertEmail}</strong></span>
                      <span>• Last Check: {new Date(target.lastScanDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Current Posture</span>
                      <div className="text-2xl font-extrabold font-mono text-cyan-300">
                        {target.currentScore} / 100
                      </div>
                    </div>
                    <div className="text-right border-l border-white/10 pl-6">
                      <span className="text-xs text-slate-400 block">Score Drift</span>
                      <div className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>+{target.currentScore - target.previousScore >= 0 ? target.currentScore - target.previousScore : 0} pts</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Trend Timeline Visualization */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      Security Score History Timeline
                    </span>
                    <span>Progression: {points.map((p) => p.score).join(' → ')}</span>
                  </div>

                  {/* SVG Chart */}
                  <div className="h-28 w-full pt-2">
                    <svg className="w-full h-full" viewBox="0 0 500 80" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id={`grad-${target.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Area Fill */}
                      <path
                        d="M 20 50 L 140 40 L 260 25 L 380 32 L 480 20 L 480 80 L 20 80 Z"
                        fill={`url(#grad-${target.id})`}
                      />

                      {/* Trend Line */}
                      <path
                        d="M 20 50 L 140 40 L 260 25 L 380 32 L 480 20"
                        fill="none"
                        stroke="#00f2fe"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                      {/* Nodes */}
                      {[
                        { cx: 20, cy: 50, val: points[0]?.score || 78 },
                        { cx: 140, cy: 40, val: points[1]?.score || 81 },
                        { cx: 260, cy: 25, val: points[2]?.score || 84 },
                        { cx: 380, cy: 32, val: points[3]?.score || 82 },
                        { cx: 480, cy: 20, val: points[4]?.score || target.currentScore },
                      ].map((node, i) => (
                        <g key={i}>
                          <circle cx={node.cx} cy={node.cy} r="4" fill="#07090e" stroke="#00f2fe" strokeWidth="2.5" />
                          <text x={node.cx} y={node.cy - 8} fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">
                            {node.val}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal: Add Monitor */}
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md glass-panel p-6 bg-[#0c121d] border-cyan-500/30 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold text-white">Add Monitored Website</h3>
              <form onSubmit={handleAddTarget} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Website URL</label>
                  <input
                    type="text"
                    required
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Surveillance Frequency</label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="daily">Daily Assessment (Recommended)</option>
                    <option value="weekly">Weekly Assessment</option>
                    <option value="continuous">Continuous (Every 6 hours)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Alert Email Address</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="security@company.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="btn-secondary text-xs !py-2 !px-4"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary text-xs !py-2 !px-4">
                    Save Monitor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}
