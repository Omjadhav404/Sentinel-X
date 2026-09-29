'use client';

import React, { useState } from 'react';
import {
  Shield, AlertTriangle, AlertOctagon, CheckCircle2, Info, ChevronDown, ChevronUp,
  Download, FileCode, ExternalLink, HelpCircle, Copy, Check, Sparkles, RefreshCw,
  Share2, ShieldAlert, ArrowLeft
} from 'lucide-react';
import { ScanResult, SecurityFinding, SeverityLevel } from '@/lib/scanner/types';
import Link from 'next/link';

interface ScanDashboardProps {
  scan: ScanResult;
  onRescan?: () => void;
  onRequestConsultation?: (scan: ScanResult, findingTitle?: string) => void;
}

export const ScanDashboard: React.FC<ScanDashboardProps> = ({
  scan,
  onRescan,
  onRequestConsultation,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [expandedFindings, setExpandedFindings] = useState<Record<string, boolean>>({});
  const [reviewedFindings, setReviewedFindings] = useState<Record<string, boolean>>({});
  const [activeSnippetTab, setActiveSnippetTab] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedFindings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleReviewed = (id: string) => {
    setReviewedFindings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setShareNotice(true);
      setTimeout(() => setShareNotice(false), 2500);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SentinelX-Report-${scan.hostname}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrintPdf = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Filtered findings
  const filteredFindings = scan.findings.filter((f) => {
    if (filterSeverity === 'all') return true;
    if (filterSeverity === 'critical') return f.severity === 'Critical';
    if (filterSeverity === 'high') return f.severity === 'High';
    if (filterSeverity === 'medium') return f.severity === 'Medium';
    if (filterSeverity === 'low') return f.severity === 'Low';
    if (filterSeverity === 'info') return f.severity === 'Informational';
    return true;
  });

  // Circular gauge calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * scan.score) / 100;

  const scoreStrokeColor =
    scan.score >= 85 ? '#10b981' : scan.score >= 65 ? '#f59e0b' : scan.score >= 45 ? '#f97316' : '#ef4444';

  const riskBadgeClass =
    scan.riskLevel === 'Low'
      ? 'badge-low'
      : scan.riskLevel === 'Medium'
      ? 'badge-medium'
      : scan.riskLevel === 'High'
      ? 'badge-high'
      : 'badge-critical';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Breadcrumb & Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10 non-printable">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Scanner</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          {shareNotice && (
            <span className="text-xs text-emerald-400 font-mono animate-fade-in">
              Assessment link copied!
            </span>
          )}
          <button
            onClick={handleShare}
            className="btn-secondary !text-xs !py-1.5 !px-3"
            title="Share assessment link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
          <button
            onClick={handleExportJson}
            className="btn-secondary !text-xs !py-1.5 !px-3 font-mono"
            title="Export full assessment data as JSON"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handlePrintPdf}
            className="btn-primary !text-xs !py-1.5 !px-4"
            title="Generate and download printable PDF report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report (PDF)</span>
          </button>
          {onRescan && (
            <button
              onClick={onRescan}
              className="btn-secondary !text-xs !py-1.5 !px-3"
              title="Re-run assessment"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rescan</span>
            </button>
          )}
        </div>
      </div>

      {/* Target Hero Summary Card */}
      <div className="glass-panel p-6 sm:p-8 bg-[#0a0f1b]/80 border-cyan-500/30 shadow-[0_0_40px_rgba(0,242,254,0.1)] rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Target Host Details */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`text-xs px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider ${riskBadgeClass}`}>
                {scan.riskLevel} Risk Posture
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-mono font-bold bg-slate-800 text-slate-300 border border-white/10">
                Grade {scan.grade}
              </span>
              {scan.isDemo && (
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  DEMO ASSESSMENT
                </span>
              )}
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                {scan.hostname}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-2 font-mono">
                <span>URL: <a href={scan.targetUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">{scan.targetUrl}</a></span>
                {scan.ipAddress && <span>• IP: {scan.ipAddress}</span>}
                <span>• Assessment Date: {new Date(scan.scanDate).toLocaleDateString()} at {new Date(scan.scanDate).toLocaleTimeString()}</span>
                <span>• Duration: {scan.durationMs}ms</span>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
              {scan.summary}
            </p>
          </div>

          {/* Animated Circular Gauge */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 border-t lg:border-t-0 lg:border-l border-white/10">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                {/* Background Track */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="12"
                  fill="transparent"
                />
                {/* Foreground Score Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke={scoreStrokeColor}
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{
                    filter: `drop-shadow(0 0 8px ${scoreStrokeColor})`,
                  }}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold font-mono text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                  {scan.score}
                </span>
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">
                  Security Score
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400 mt-0.5">
                  Grade {scan.grade}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 bg-slate-900/60 border-white/5 rounded-xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold font-mono text-white block">
              {scan.metrics.passedCount}
            </span>
            <span className="text-xs text-slate-400">Passed Checks</span>
          </div>
        </div>

        <div className="glass-panel p-4 bg-slate-900/60 border-white/5 rounded-xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold font-mono text-white block">
              {scan.metrics.warningCount}
            </span>
            <span className="text-xs text-slate-400">Warnings</span>
          </div>
        </div>

        <div className="glass-panel p-4 bg-slate-900/60 border-white/5 rounded-xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold font-mono text-white block">
              {scan.metrics.highCount + scan.metrics.criticalCount}
            </span>
            <span className="text-xs text-slate-400">High / Critical</span>
          </div>
        </div>

        <div className="glass-panel p-4 bg-slate-900/60 border-white/5 rounded-xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold font-mono text-white block">
              {scan.metrics.infoCount}
            </span>
            <span className="text-xs text-slate-400">Informational</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Progress Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Security Category Breakdown</span>
          <span className="text-xs font-mono text-slate-400 font-normal">
            (Weighted evaluation)
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(scan.categoryScores).map(([key, cat]) => (
            <div
              key={key}
              className="glass-panel p-4 bg-slate-900/70 border-white/5 rounded-xl space-y-2.5 hover:border-cyan-500/30 transition-all"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{cat.name}</span>
                <span className={`font-mono font-bold ${
                  cat.status === 'excellent' ? 'text-emerald-400' : cat.status === 'good' ? 'text-cyan-400' : cat.status === 'warning' ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {cat.score} / 100
                </span>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-white/5">
                <div
                  className={`h-full transition-all duration-700 ${
                    cat.status === 'excellent'
                      ? 'bg-emerald-400'
                      : cat.status === 'good'
                      ? 'bg-cyan-400'
                      : cat.status === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${cat.score}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="capitalize">{cat.status} status</span>
                <span className="font-mono">{cat.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* High-Risk Urgent Banner / Expert Consultation Callout */}
      {(scan.riskLevel === 'High' || scan.riskLevel === 'Critical' || scan.metrics.highCount > 0) && (
        <div className="glass-panel p-6 bg-gradient-to-r from-rose-950/40 via-slate-900/80 to-amber-950/40 border-rose-500/40 shadow-[0_0_35px_rgba(239,68,68,0.15)] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 non-printable">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Need Help Securing Your Website?
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-mono uppercase font-bold">
                  Recommended Action
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Our cybersecurity associates can review your findings, verify client-side exposures, and guide your engineering team through config hardening.
              </p>
            </div>
          </div>

          <button
            onClick={() => onRequestConsultation?.(scan)}
            className="btn-primary !bg-gradient-to-r !from-rose-500 !to-amber-500 text-xs !py-2.5 !px-5 whitespace-nowrap shadow-[0_0_20px_rgba(244,63,94,0.4)]"
          >
            <span>Talk to a Security Associate</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Security Findings Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Security Findings & Recommendations</h2>
            <p className="text-xs text-slate-400">
              Transparent evidence, risk explanations, and production-ready configuration fixes
            </p>
          </div>

          {/* Severity Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
            {[
              { label: 'All Findings', value: 'all', count: scan.findings.length },
              { label: 'Critical', value: 'critical', count: scan.findings.filter(f => f.severity === 'Critical').length },
              { label: 'High', value: 'high', count: scan.findings.filter(f => f.severity === 'High').length },
              { label: 'Medium', value: 'medium', count: scan.findings.filter(f => f.severity === 'Medium').length },
              { label: 'Low', value: 'low', count: scan.findings.filter(f => f.severity === 'Low').length },
              { label: 'Info', value: 'info', count: scan.findings.filter(f => f.severity === 'Informational').length },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterSeverity(tab.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  filterSeverity === tab.value
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white bg-slate-900/60 border border-white/5'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Findings List */}
        {filteredFindings.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-400 bg-slate-900/40 rounded-xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No findings match this filter</p>
            <p className="text-xs text-slate-500 mt-1">
              Select another filter or review the passed checks below.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFindings.map((finding) => {
              const isExpanded = Boolean(expandedFindings[finding.id]);
              const isReviewed = Boolean(reviewedFindings[finding.id]);
              const currentSnippetTab = activeSnippetTab[finding.id] || finding.fixSnippets?.[0]?.technology || 'nginx';

              const severityBadge =
                finding.severity === 'Critical'
                  ? 'badge-critical'
                  : finding.severity === 'High'
                  ? 'badge-high'
                  : finding.severity === 'Medium'
                  ? 'badge-medium'
                  : finding.severity === 'Low'
                  ? 'badge-low'
                  : 'badge-info';

              return (
                <div
                  key={finding.id}
                  className={`glass-panel border transition-all duration-200 rounded-xl overflow-hidden ${
                    isReviewed ? 'opacity-65 border-white/5 bg-slate-950/40' : 'bg-slate-900/70 border-white/10 hover:border-cyan-500/30'
                  }`}
                >
                  {/* Finding Header Bar */}
                  <div
                    onClick={() => toggleExpand(finding.id)}
                    className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className={`text-[11px] font-mono font-bold uppercase px-2.5 py-1 rounded-md shrink-0 ${severityBadge}`}>
                        {finding.severity}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-white">
                            {finding.title}
                          </h3>
                          {finding.cwe && (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-white/5">
                              {finding.cwe}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                          {finding.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleReviewed(finding.id);
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                          isReviewed
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-white/5 text-slate-400 hover:text-white border-white/10'
                        }`}
                        title="Mark as Reviewed"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isReviewed ? 'Reviewed' : 'Review'}</span>
                      </button>

                      <div className="p-1 text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content Details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-white/5 space-y-4 text-xs bg-slate-950/40">
                      {/* Why it Matters */}
                      <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/20 space-y-1">
                        <div className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Why This Matters
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {finding.whyItMatters}
                        </p>
                      </div>

                      {/* Observable Evidence */}
                      {finding.evidence && (
                        <div className="space-y-1 font-mono">
                          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                            Observable Evidence
                          </span>
                          <div className="p-2.5 rounded-lg bg-[#05080f] border border-white/5 text-cyan-300 text-[11px] break-all">
                            {finding.evidence}
                          </div>
                        </div>
                      )}

                      {/* Recommendation */}
                      <div className="space-y-1">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold font-mono block">
                          Actionable Remediation
                        </span>
                        <p className="text-slate-200 leading-relaxed font-sans">
                          {finding.recommendation}
                        </p>
                      </div>

                      {/* Configuration Snippets (Tabbed Nginx, Apache, Cloudflare, Next.js) */}
                      {finding.fixSnippets && finding.fixSnippets.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold font-mono flex items-center gap-1.5">
                              <FileCode className="w-3.5 h-3.5" />
                              Production Configuration Snippets
                            </span>

                            {/* Tech Tab Buttons */}
                            <div className="flex items-center gap-1">
                              {finding.fixSnippets.map((snip) => (
                                <button
                                  key={snip.technology}
                                  onClick={() =>
                                    setActiveSnippetTab((prev) => ({
                                      ...prev,
                                      [finding.id]: snip.technology,
                                    }))
                                  }
                                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                                    currentSnippetTab === snip.technology
                                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                      : 'text-slate-400 hover:text-white bg-slate-900 border border-white/5'
                                  }`}
                                >
                                  {snip.technology}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Code Display */}
                          {(() => {
                            const activeSnip =
                              finding.fixSnippets.find((s) => s.technology === currentSnippetTab) ||
                              finding.fixSnippets[0];
                            const snippetKey = `${finding.id}-${activeSnip.technology}`;

                            return (
                              <div className="relative rounded-lg bg-[#05080f] border border-cyan-500/20 p-3 font-mono text-[11px] text-slate-200 overflow-x-auto shadow-inner">
                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[10px] text-slate-400">
                                  <span>{activeSnip.title}</span>
                                  <button
                                    onClick={() => copyCode(activeSnip.code, snippetKey)}
                                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                                  >
                                    {copiedKey === snippetKey ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-emerald-400">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy Code</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="whitespace-pre overflow-x-auto">
                                  {activeSnip.code}
                                </pre>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Ask Associate for this specific finding */}
                      <div className="pt-2 flex items-center justify-between text-slate-400 text-[11px]">
                        <span>Need assistance implementing this configuration?</span>
                        <button
                          onClick={() => onRequestConsultation?.(scan, finding.title)}
                          className="text-cyan-400 hover:text-cyan-300 font-semibold underline flex items-center gap-1"
                        >
                          Request remediation assistance →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Passed Checks Section Accordion */}
      <div className="glass-panel p-6 bg-slate-900/50 border-white/5 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Passed Security Controls ({scan.checks.filter(c => c.status === 'passed').length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {scan.checks
            .filter((c) => c.status === 'passed')
            .map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-lg bg-slate-950/60 border border-emerald-500/10 flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200 block">{c.title}</span>
                  <span className="text-slate-400 text-[11px]">{c.detail}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Disclaimer & Methodology Footer Box */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-400 space-y-2">
        <div className="font-mono text-slate-300 font-bold uppercase tracking-wider text-[10px]">
          Assessment Methodology & Safe Scanning Disclaimer
        </div>
        <p>
          SentinelX delivers automated security assessments based strictly on publicly observable, passive network and HTTP telemetry. This non-intrusive evaluation does not perform penetration testing, exploit execution, or credential attacks.
        </p>
        <p className="text-slate-500">
          Generated via SentinelX Core Engine. Validated against RFC 9116, OWASP Secure Headers Project, and TLS 1.3 Best Practices.
        </p>
      </div>
    </div>
  );
};
