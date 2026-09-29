'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CyberShield } from '@/components/CyberShield';
import { ScanProgress } from '@/components/ScanProgress';
import { ScanDashboard } from '@/components/ScanDashboard';
import { ConsultationModal } from '@/components/ConsultationModal';
import { AuthModal } from '@/components/AuthModal';
import { ScanResult } from '@/lib/scanner/types';
import {
  Shield, Lock, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck,
  Server, Cpu, Eye, Code, Terminal, Sparkles, Zap, ChevronRight, FileText
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [urlInput, setUrlInput] = useState('');
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'complete'>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Modals state
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [consultationPreFill, setConsultationPreFill] = useState<{
    website?: string;
    score?: number;
    risk?: string;
    issue?: string;
    scanId?: string;
  }>({});
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; isDemo?: boolean } | null>(null);

  const startScan = async (targetUrl: string, isDemo = false) => {
    if (!targetUrl || targetUrl.trim().length === 0) {
      setScanError('Please enter a website URL to begin the assessment.');
      return;
    }

    setScanError(null);
    setScanState('scanning');

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl.trim(),
          isDemo: isDemo || targetUrl.includes('demo') || targetUrl.includes('.local'),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to complete security assessment.');
      }

      setScanResult(json.data);
    } catch (err: unknown) {
      setScanState('idle');
      setScanError(err instanceof Error ? err.message : 'Network error occurred. Ensure the target website is reachable.');
    }
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startScan(urlInput);
  };

  const handleQuickSample = (sample: string, isDemo = true) => {
    setUrlInput(sample);
    startScan(sample, isDemo);
  };

  const handleConsultationRequest = (scan: ScanResult, findingTitle?: string) => {
    setConsultationPreFill({
      website: scan.targetUrl,
      score: scan.score,
      risk: scan.riskLevel,
      issue: findingTitle || scan.findings[0]?.title || 'Critical risk remediation',
      scanId: scan.id,
    });
    setIsConsultationOpen(true);
  };

  const handleResetScan = () => {
    setScanResult(null);
    setScanState('idle');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenConsultation={() => setIsConsultationOpen(true)}
        user={currentUser}
        onLogout={() => setCurrentUser(null)}
      />

      <main className="flex-1">
        {/* If Scan in Progress */}
        {scanState === 'scanning' && (
          <section className="py-16 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex justify-center">
                <CyberShield mode="scanning" size={280} />
              </div>
              <ScanProgress
                targetUrl={urlInput || 'https://target-domain.com'}
                isComplete={scanResult !== null}
                onFinished={() => setScanState('complete')}
              />
            </div>
          </section>
        )}

        {/* If Scan Finished */}
        {scanState === 'complete' && scanResult && (
          <section className="py-8">
            <ScanDashboard
              scan={scanResult}
              onRescan={handleResetScan}
              onRequestConsultation={handleConsultationRequest}
            />
          </section>
        )}

        {/* Landing Page Idle Hero */}
        {scanState === 'idle' && (
          <>
            {/* Hero Section */}
            <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  {/* Left Column: Headline, Description & Input */}
                  <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold shadow-[0_0_15px_rgba(0,242,254,0.15)]">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Passive Cybersecurity Assessment Engine v2.4</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] font-sans">
                      See How Secure Your Website{' '}
                      <span className="gradient-text-cyan">Really Is.</span>
                    </h1>

                    {/* Supporting Text */}
                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                      Scan your website's publicly observable security posture, inspect TLS & HTTP headers, identify hidden exposures, and get actionable configuration fixes in seconds.
                    </p>

                    {/* URL Input Form */}
                    <div className="space-y-3 max-w-2xl mx-auto lg:mx-0">
                      <form onSubmit={handleScanSubmit} className="relative flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                            <Lock className="w-5 h-5 text-cyan-400" />
                          </div>
                          <input
                            type="text"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://yourwebsite.com"
                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-sm sm:text-base font-mono focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 shadow-inner transition-all"
                          />
                        </div>

                        <button
                          type="submit"
                          className="btn-primary text-sm sm:text-base !py-4 !px-8 whitespace-nowrap"
                        >
                          <span>Run Security Scan</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>

                      {/* Error notice */}
                      {scanError && (
                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{scanError}</span>
                        </div>
                      )}

                      {/* Trust Indicators */}
                      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Safe passive assessment
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          No passwords or access keys required
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Non-intrusive / Public signals
                        </span>
                      </div>
                    </div>

                    {/* Quick Demo Target Samples */}
                    <div className="space-y-2 pt-2 text-center lg:text-left">
                      <span className="text-xs font-mono uppercase tracking-wider text-slate-500 block">
                        Quick Assessment Demo Scenarios:
                      </span>
                      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                        <button
                          onClick={() => handleQuickSample('demo-secure.sentinelx.local', true)}
                          className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-emerald-500/30 text-emerald-300 text-xs hover:bg-emerald-950/40 transition-colors font-mono flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Grade A+ (Hardened)
                        </button>
                        <button
                          onClick={() => handleQuickSample('demo-medium.sentinelx.local', true)}
                          className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-amber-500/30 text-amber-300 text-xs hover:bg-amber-950/40 transition-colors font-mono flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Grade B (Missing CSP)
                        </button>
                        <button
                          onClick={() => handleQuickSample('demo-vulnerable.sentinelx.local', true)}
                          className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-rose-500/30 text-rose-300 text-xs hover:bg-rose-950/40 transition-colors font-mono flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Grade F (High Risk)
                        </button>
                        <button
                          onClick={() => handleQuickSample('https://example.com', false)}
                          className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-white/10 text-slate-300 text-xs hover:bg-white/10 transition-colors font-mono"
                        >
                          example.com
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Interactive 3D Cyber Shield */}
                  <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                    <div className="relative">
                      {/* Ambient Ring Glow */}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                      <CyberShield mode="idle" size={380} />
                    </div>
                    <div className="text-center mt-3">
                      <span className="text-[11px] font-mono text-slate-500 tracking-wider">
                        Interactive Security Shield • Move cursor to inspect
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Core Features & Check Categories */}
            <section className="py-20 border-t border-white/5 bg-[#090d16]/60">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="text-center max-w-3xl mx-auto space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-mono uppercase font-bold">
                    Multi-Dimensional Posture Analysis
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Comprehensive, Safe Assessment Pillars
                  </h2>
                  <p className="text-sm sm:text-base text-slate-400">
                    SentinelX evaluates every publicly observable layer of your web perimeter without invasive exploits or service disruption.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Pillar 1 */}
                  <div className="glass-panel p-6 bg-slate-900/60 border-white/5 rounded-2xl space-y-3 hover:border-cyan-500/40 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">HTTPS & SSL/TLS Protocols</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Verifies modern TLS 1.3 / 1.2 negotiation, cipher suites, certificate authority trust chains, expiration timelines, and strict HTTP-to-HTTPS redirect rules.
                    </p>
                  </div>

                  {/* Pillar 2 */}
                  <div className="glass-panel p-6 bg-slate-900/60 border-white/5 rounded-2xl space-y-3 hover:border-cyan-500/40 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">HTTP Security Headers</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Audits Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Content-Type-Options, X-Frame-Options, and Referrer-Policy against OWASP baselines.
                    </p>
                  </div>

                  {/* Pillar 3 */}
                  <div className="glass-panel p-6 bg-slate-900/60 border-white/5 rounded-2xl space-y-3 hover:border-cyan-500/40 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center">
                      <Eye className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Cookie & Session Flags</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Inspects publicly observable Set-Cookie headers for Secure flags, HttpOnly protections against XSS theft, and SameSite CSRF barriers.
                    </p>
                  </div>

                  {/* Pillar 4 */}
                  <div className="glass-panel p-6 bg-slate-900/60 border-white/5 rounded-2xl space-y-3 hover:border-cyan-500/40 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                      <Server className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Information Exposure Guard</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Detects verbose Server and X-Powered-By banners that disclose framework versions, inspects robots.txt leakage, and verifies RFC 9116 security.txt policies.
                    </p>
                  </div>

                  {/* Pillar 5 */}
                  <div className="glass-panel p-6 bg-slate-900/60 border-white/5 rounded-2xl space-y-3 hover:border-cyan-500/40 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">DNS & Domain Hardening</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Queries Certificate Authority Authorization (CAA) records to restrict rogue SSL issuance, checks IPv6 readiness, and verifies SPF/DMARC anti-spoofing policies.
                    </p>
                  </div>

                  {/* Pillar 6 */}
                  <div className="glass-panel p-6 bg-slate-900/60 border-white/5 rounded-2xl space-y-3 hover:border-cyan-500/40 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                      <Code className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Actionable Code Snippets</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Generates ready-to-paste configurations for Nginx, Apache, Cloudflare, Next.js, and Express, turning assessment findings into instantaneous remediation.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 border-t border-white/5 relative">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                <div className="text-center max-w-3xl mx-auto space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase font-bold">
                    Zero-Friction Workflow
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    How SentinelX Works
                  </h2>
                  <p className="text-sm sm:text-base text-slate-400">
                    From URL input to executive-ready report in six straightforward steps.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { step: '01', title: 'Enter', desc: 'Paste your target domain or web address. Our engine sanitizes input and validates protocols.' },
                    { step: '02', title: 'Scan', desc: 'We inspect publicly observable signals via non-intrusive TLS handshakes and passive HTTP queries.' },
                    { step: '03', title: 'Analyze', desc: 'Our deterministic scoring engine correlates findings against OWASP, RFC standards, and modern baselines.' },
                    { step: '04', title: 'Understand', desc: 'Review your composite 0-100 score, grade (A+ to F), risk level, and prioritized findings breakdown.' },
                    { step: '05', title: 'Improve', desc: 'Deploy tailored copy-paste configuration snippets for Nginx, Apache, Cloudflare, or Node.js.' },
                    { step: '06', title: 'Protect', desc: 'Optionally request expert consultation from our cybersecurity associates for critical remediation.' },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="glass-panel p-6 bg-slate-900/60 border-white/5 rounded-2xl relative space-y-3 group hover:border-cyan-500/40 transition-all"
                    >
                      <span className="text-3xl font-extrabold font-mono text-cyan-400/40 group-hover:text-cyan-400 transition-colors">
                        {item.step}
                      </span>
                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Bottom CTA Banner */}
            <section className="py-20 border-t border-white/5 bg-gradient-to-b from-[#090d16] to-[#05070c]">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Protect Your Reputation Before Vulnerabilities Are Exploited.
                </h2>
                <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
                  Run a free passive assessment right now. No credentials needed, 100% safe, non-destructive.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="btn-primary text-sm !py-3 !px-8"
                  >
                    <span>Scan Your Website Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <Link href="/pricing" className="btn-secondary text-sm !py-3 !px-8">
                    View Enterprise Plans
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />

      {/* Modals */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        defaultWebsite={consultationPreFill.website}
        defaultScore={consultationPreFill.score}
        defaultRiskLevel={consultationPreFill.risk}
        defaultIssueSummary={consultationPreFill.issue}
        scanId={consultationPreFill.scanId}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}
