'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthModal } from '@/components/AuthModal';
import { Check, X, Shield, Sparkles, HelpCircle, ArrowRight, Zap, Info } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [stripeNoticeOpen, setStripeNoticeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; isDemo?: boolean } | null>(null);

  const handleSelectPaidPlan = (planName: string) => {
    setSelectedPlan(planName);
    setStripeNoticeOpen(true);
  };

  const plans = [
    {
      name: 'Free Scan',
      tagline: 'Instant passive security posture assessment for any public domain.',
      priceMonthly: 0,
      priceAnnual: 0,
      isPopular: false,
      ctaLabel: 'Start Free Scan',
      ctaHref: '/',
      features: [
        'Passive SSL/TLS certificate evaluation',
        'HTTP security headers baseline analysis',
        'Transparent composite 0-100 score & grade',
        'Public cookie security flag inspection',
        'Information disclosure & server banner checks',
        'Export findings in JSON format',
      ],
      notIncluded: [
        'Automated continuous domain monitoring',
        'Printable enterprise PDF report download',
        'Configuration snippet generators (Nginx/Apache)',
        'Direct consultation with cybersecurity associates',
        'Multi-domain team collaboration workspace',
      ],
    },
    {
      name: 'Pro Security',
      tagline: 'Comprehensive security posture, monitoring, and automated remediation.',
      priceMonthly: 49,
      priceAnnual: 39,
      isPopular: true,
      ctaLabel: 'Upgrade to Pro',
      ctaAction: () => handleSelectPaidPlan('Pro Security'),
      features: [
        'Everything in Free Scan',
        'Deep cipher suite & protocol analysis',
        'Continuous surveillance monitoring (Weekly)',
        'Full actionable code snippets (Nginx, Caddy, Next.js)',
        'Downloadable enterprise PDF reports',
        'Permanent scan history archive',
        'Slack & Webhook change alert notifications',
        'DNS CAA and email spoofing (SPF/DMARC) audit',
      ],
      notIncluded: [
        'Direct consultation with cybersecurity associates',
        'Multi-domain team collaboration workspace',
        'Custom scanning API webhooks',
      ],
    },
    {
      name: 'Business & Enterprise',
      tagline: 'Dedicated DevSecOps surveillance, multi-asset tracking, and expert advisory.',
      priceMonthly: 199,
      priceAnnual: 159,
      isPopular: false,
      ctaLabel: 'Contact Enterprise',
      ctaAction: () => handleSelectPaidPlan('Business Enterprise'),
      features: [
        'Everything in Pro Security',
        'Continuous perimeter monitoring (Every 6h)',
        'Up to 50 monitored domains and subdomains',
        'Priority incident consultation with cybersecurity associates',
        'Team access and role-based permissions (RBAC)',
        'Custom REST API integration & webhooks',
        '99.9% uptime SLA and dedicated account manager',
        'Executive compliance briefings (SOC2 / ISO 27001 mapping)',
      ],
      notIncluded: [],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        user={currentUser}
        onLogout={() => setCurrentUser(null)}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 space-y-16 animate-fade-in">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase font-bold">
            Transparent Subscription Tiers
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Security Posture Built for Every Scale
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Start with our safe passive scanner today or upgrade for automated perimeter surveillance and expert remediation assistance.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 rounded-full bg-slate-900 border border-white/10 mt-4">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(0,242,254,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
                billingPeriod === 'annual'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(0,242,254,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] font-mono font-bold bg-slate-950 text-cyan-300 px-1.5 py-0.5 rounded-full border border-cyan-400/40">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const price = billingPeriod === 'annual' ? plan.priceAnnual : plan.priceMonthly;

            return (
              <div
                key={plan.name}
                className={`glass-panel p-8 rounded-2xl flex flex-col justify-between relative transition-all duration-300 ${
                  plan.isPopular
                    ? 'bg-gradient-to-b from-[#0c182c] to-[#07090e] border-cyan-400/50 shadow-[0_0_40px_rgba(0,242,254,0.15)] lg:-translate-y-2'
                    : 'bg-slate-900/60 border-white/5 hover:border-white/20'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-[11px] font-mono font-extrabold uppercase tracking-wider shadow-[0_0_15px_rgba(0,242,254,0.6)]">
                    Most Popular
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white font-sans">{plan.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{plan.tagline}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold font-mono text-white">
                      ${price}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      / month {billingPeriod === 'annual' && price > 0 ? '(billed annually)' : ''}
                    </span>
                  </div>

                  {plan.ctaHref ? (
                    <Link
                      href={plan.ctaHref}
                      className="btn-secondary w-full justify-center text-xs py-3 rounded-xl"
                    >
                      {plan.ctaLabel}
                    </Link>
                  ) : (
                    <button
                      onClick={plan.ctaAction}
                      className={`w-full justify-center text-xs py-3 rounded-xl ${
                        plan.isPopular ? 'btn-primary' : 'btn-secondary'
                      }`}
                    >
                      <span>{plan.ctaLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  )}

                  {/* Feature Checklist */}
                  <div className="space-y-3 pt-4 border-t border-white/10 text-xs">
                    <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-slate-400 block">
                      Included Capabilities:
                    </span>
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5 text-slate-200">
                        <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}

                    {plan.notIncluded.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5 text-slate-500 line-through">
                        <X className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Matrix */}
        <div className="glass-panel p-8 bg-slate-900/60 border-white/5 rounded-2xl space-y-6">
          <h2 className="text-xl font-bold text-white text-center">Plan Comparison Matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-mono text-[11px] uppercase">
                  <th className="py-3 px-4">Feature / Capability</th>
                  <th className="py-3 px-4 text-center">Free Scan</th>
                  <th className="py-3 px-4 text-center">Pro Security</th>
                  <th className="py-3 px-4 text-center">Business</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Passive Web Inspection</td>
                  <td className="py-3 px-4 text-center text-cyan-400">Unlimited</td>
                  <td className="py-3 px-4 text-center text-cyan-400">Unlimited</td>
                  <td className="py-3 px-4 text-center text-cyan-400">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Continuous Monitoring</td>
                  <td className="py-3 px-4 text-center text-slate-600">—</td>
                  <td className="py-3 px-4 text-center">Weekly</td>
                  <td className="py-3 px-4 text-center text-emerald-400">Continuous (6h)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Downloadable PDF Reports</td>
                  <td className="py-3 px-4 text-center text-slate-600">—</td>
                  <td className="py-3 px-4 text-center text-emerald-400">Included</td>
                  <td className="py-3 px-4 text-center text-emerald-400">Included</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Configuration Snippet Generator</td>
                  <td className="py-3 px-4 text-center text-slate-600">—</td>
                  <td className="py-3 px-4 text-center text-emerald-400">Included</td>
                  <td className="py-3 px-4 text-center text-emerald-400">Included</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Expert Cybersecurity Consultation</td>
                  <td className="py-3 px-4 text-center text-slate-600">—</td>
                  <td className="py-3 px-4 text-center text-slate-400">Add-on</td>
                  <td className="py-3 px-4 text-center text-emerald-400">Priority Included</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Stripe Integration Notice Modal */}
        {stripeNoticeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md glass-panel p-6 bg-[#0c121d] border-cyan-500/30 rounded-2xl space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-white">
                  {selectedPlan} — Checkout Integration Ready
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In production deployment, connecting this button triggers the live Stripe / Paddle checkout session via your <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded font-mono">STRIPE_SECRET_KEY</code> configuration.
                </p>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-white/5 text-[11px] text-slate-400 text-left space-y-1 font-mono">
                  <div>Status: Ready for Stripe webhook connection</div>
                  <div>Mode: Test / Staging</div>
                  <div>SKU: sentinelx_{selectedPlan.toLowerCase().replace(/\s+/g, '_')}</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setStripeNoticeOpen(false)}
                  className="btn-primary text-xs px-6 py-2.5"
                >
                  Understood
                </button>
              </div>
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
