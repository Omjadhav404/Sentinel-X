'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, Send, Loader2, Sparkles } from 'lucide-react';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultWebsite?: string;
  defaultScore?: number;
  defaultRiskLevel?: string;
  defaultIssueSummary?: string;
  scanId?: string;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  defaultWebsite = '',
  defaultScore,
  defaultRiskLevel = 'High',
  defaultIssueSummary = '',
  scanId,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    website: defaultWebsite,
    securityScore: defaultScore !== undefined ? defaultScore : '',
    urgency: 'high' as 'low' | 'medium' | 'high' | 'critical',
    issueSummary: defaultIssueSummary,
    message: defaultIssueSummary
      ? `We need assistance remediating high-priority findings detected during our SentinelX assessment (${defaultIssueSummary}).`
      : 'We would like guidance from a cybersecurity associate to review our website security posture and implement recommended security headers and TLS hardening.',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          securityScore: formData.securityScore !== '' ? Number(formData.securityScore) : undefined,
          riskLevel: defaultRiskLevel,
          scanId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit consultation request');
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl glass-panel p-6 sm:p-8 bg-[#0c121d] border-cyan-500/30 shadow-[0_0_50px_rgba(0,242,254,0.15)] rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white">Consultation Request Received</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Our cybersecurity incident & remediation team has received your assessment briefing. An associate will review your report for <span className="text-cyan-300 font-mono">{formData.website}</span> and contact you shortly.
            </p>
            <div className="pt-4">
              <button onClick={onClose} className="btn-primary text-sm px-6 py-2.5">
                Back to Assessment
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Request Security Consultation</h3>
                <p className="text-xs text-slate-400">
                  Direct engagement with an enterprise cybersecurity associate
                </p>
              </div>
            </div>

            {defaultScore !== undefined && (
              <div className="my-4 p-3 rounded-lg bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Target Website:</span>{' '}
                  <span className="font-mono text-cyan-300 font-semibold">{formData.website}</span>
                </div>
                <div>
                  <span className="text-slate-400">Security Score:</span>{' '}
                  <span className="font-mono text-amber-400 font-bold">{formData.securityScore}/100</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Work Email <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@company.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Acme Corp"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Remediation Urgency
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none transition-colors"
                  >
                    <option value="critical">Critical (Immediate breach concern)</option>
                    <option value="high">High (Audit compliance / Next 24h)</option>
                    <option value="medium">Medium (Standard remediation cycle)</option>
                    <option value="low">Low (General guidance)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Website URL <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Message / Security Focus
                </label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  NDA & confidentiality guaranteed
                </span>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-xs !py-2.5 !px-5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Request Consultation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
