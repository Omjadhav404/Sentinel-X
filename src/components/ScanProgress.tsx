'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Circle, Shield, Terminal } from 'lucide-react';

interface ScanProgressProps {
  targetUrl: string;
  isComplete: boolean;
  onFinished: () => void;
}

interface ScanStage {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
}

const INITIAL_STAGES: ScanStage[] = [
  { id: '1', label: 'URL Validation & SSRF Guard', status: 'active' },
  { id: '2', label: 'Inspecting SSL/TLS Configuration', status: 'pending' },
  { id: '3', label: 'Checking HTTPS & Redirect Behavior', status: 'pending' },
  { id: '4', label: 'Evaluating HTTP Security Headers', status: 'pending' },
  { id: '5', label: 'Inspecting Cookie Security & Flags', status: 'pending' },
  { id: '6', label: 'Checking Information Disclosure & security.txt', status: 'pending' },
  { id: '7', label: 'Checking DNS-Related Security Signals (CAA/SPF)', status: 'pending' },
  { id: '8', label: 'Calculating Overall Risk & Generating Score', status: 'pending' },
];

export const ScanProgress: React.FC<ScanProgressProps> = ({
  targetUrl,
  isComplete,
  onFinished,
}) => {
  const [stages, setStages] = useState<ScanStage[]>(INITIAL_STAGES);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [progressPercent, setProgressPercent] = useState(12);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);

  useEffect(() => {
    const logs = [
      `[PROBE] Target normalized: ${targetUrl}`,
      `[SSRF-GUARD] Hostname validation passed. Private/internal IP range blocked.`,
      `[DNS] Initiating non-intrusive DNS resolution for A, AAAA, CAA records...`,
      `[TLS] Connecting via SNI: Negotiating TLS cipher suites and root authority...`,
      `[HTTP] Probing port 80: checking 301/308 redirect upgrade rule...`,
      `[HEADERS] Analyzing response headers: HSTS, CSP, X-Frame-Options, X-Content-Type...`,
      `[COOKIES] Inspecting Set-Cookie attributes: verifying Secure, HttpOnly, and SameSite...`,
      `[INFO] Checking RFC 9116 security.txt policy and server banner leaks...`,
      `[ENGINE] Weighting security dimensions and synthesizing remediation guide...`,
    ];

    setTelemetryLogs([logs[0], logs[1]]);

    const interval = setInterval(() => {
      setCurrentStageIdx((prevIdx) => {
        if (prevIdx < INITIAL_STAGES.length - 1) {
          const nextIdx = prevIdx + 1;
          setStages((prevStages) =>
            prevStages.map((st, i) => {
              if (i < nextIdx) return { ...st, status: 'completed' };
              if (i === nextIdx) return { ...st, status: 'active' };
              return st;
            })
          );
          setProgressPercent(Math.min(96, Math.round(((nextIdx + 1) / INITIAL_STAGES.length) * 100)));
          if (logs[nextIdx + 1]) {
            setTelemetryLogs((prev) => [...prev.slice(-4), logs[nextIdx + 1]]);
          }
          return nextIdx;
        }
        return prevIdx;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [targetUrl]);

  // When backend scan response arrives
  useEffect(() => {
    if (isComplete) {
      setStages((prev) => prev.map((s) => ({ ...s, status: 'completed' })));
      setProgressPercent(100);
      setTelemetryLogs((prev) => [...prev.slice(-4), `[SUCCESS] Assessment complete. Compiling risk dashboard.`]);

      const timer = setTimeout(() => {
        onFinished();
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [isComplete, onFinished]);

  return (
    <div className="w-full max-w-3xl mx-auto glass-panel p-6 sm:p-8 bg-[#090d16]/90 border-cyan-500/40 shadow-[0_0_45px_rgba(0,242,254,0.15)] rounded-2xl animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.3)]">
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold">
                SECURITY SCAN IN PROGRESS
              </span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <h2 className="text-lg font-bold text-white font-mono truncate max-w-sm sm:max-w-md">
              {targetUrl}
            </h2>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-mono font-extrabold text-cyan-300">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950/80 rounded-full h-2 my-6 overflow-hidden border border-white/10 relative">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-300 transition-all duration-300 relative shadow-[0_0_12px_rgba(0,242,254,0.8)]"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/40 blur-[2px]" />
        </div>
      </div>

      {/* Two Column Layout: Stages & Live Telemetry Stream */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Stages Checklist */}
        <div className="space-y-2.5">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono font-bold block mb-1">
            Execution Stages
          </span>
          {stages.map((stage) => (
            <div
              key={stage.id}
              className={`flex items-center gap-2.5 text-xs transition-all duration-200 px-3 py-1.5 rounded-lg ${
                stage.status === 'active'
                  ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 shadow-[0_0_10px_rgba(0,242,254,0.15)] font-semibold'
                  : stage.status === 'completed'
                  ? 'text-slate-300'
                  : 'text-slate-600'
              }`}
            >
              {stage.status === 'completed' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {stage.status === 'active' && (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
              )}
              {stage.status === 'pending' && (
                <Circle className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              )}
              <span className="truncate">{stage.label}</span>
            </div>
          ))}
        </div>

        {/* Live Terminal Telemetry Box */}
        <div className="bg-[#05070c] border border-cyan-500/20 rounded-xl p-4 font-mono text-[11px] space-y-2 text-slate-300 flex flex-col justify-between h-full min-h-[220px] shadow-inner">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-slate-500">
              <span className="flex items-center gap-1.5 text-[10px] text-cyan-400">
                <Terminal className="w-3.5 h-3.5" />
                TELEMETRY FEED
              </span>
              <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded border border-white/5">
                PASSIVE SCAN
              </span>
            </div>

            <div className="space-y-1.5 font-mono">
              {telemetryLogs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-1.5 text-slate-300 animate-fade-in break-words"
                >
                  <span className="text-cyan-500 select-none">&gt;</span>
                  <span className={log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : log.includes('SSRF') ? 'text-cyan-300' : 'text-slate-300'}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
            <span>Method: Passive Recon</span>
            <span className="text-cyan-400 animate-pulse">Scanning...</span>
          </div>
        </div>
      </div>
    </div>
  );
};
