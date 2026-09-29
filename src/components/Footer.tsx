'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, ExternalLink, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/5 bg-[#05070c] text-slate-400 text-xs pt-16 pb-12 mt-20 non-printable">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white font-sans tracking-tight">
                Sentinel<span className="text-cyan-400">X</span>
              </span>
            </Link>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
              "Know Your Website. Secure Your Business."
              <br />
              Enterprise website security posture assessment and passive vulnerability intelligence.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-cyan-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Assessment Engine v2.4 • Safe & Passive</span>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-white">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-cyan-300 transition-colors">Security Scanner</Link></li>
              <li><Link href="/dashboard" className="hover:text-cyan-300 transition-colors">Risk Dashboard</Link></li>
              <li><Link href="/monitoring" className="hover:text-cyan-300 transition-colors">Continuous Monitoring</Link></li>
              <li><Link href="/pricing" className="hover:text-cyan-300 transition-colors">Plans & Pricing</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-cyan-300 transition-colors">How It Works</Link></li>
            </ul>
          </div>

          {/* Resources & Learn */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-white">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/learn" className="hover:text-cyan-300 transition-colors">Security Guide</Link></li>
              <li><Link href="/learn#headers" className="hover:text-cyan-300 transition-colors">HTTP Headers Matrix</Link></li>
              <li><Link href="/learn#csp" className="hover:text-cyan-300 transition-colors">CSP Best Practices</Link></li>
              <li><Link href="/learn#checklist" className="hover:text-cyan-300 transition-colors">Audit Checklist</Link></li>
              <li><a href="/api/scans" target="_blank" className="hover:text-cyan-300 transition-colors flex items-center gap-1">API Endpoint <ExternalLink className="w-3 h-3" /></a></li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-white">Trust & Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/#disclaimer" className="hover:text-cyan-300 transition-colors">Responsible Scanning</Link></li>
              <li><Link href="/pricing" className="hover:text-cyan-300 transition-colors">Enterprise SLA</Link></li>
              <li><span className="text-slate-400">Privacy Policy</span></li>
              <li><span className="text-slate-400">Terms of Service</span></li>
              <li><span className="text-slate-400">RFC 9116 security.txt</span></li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="pt-8 border-t border-white/5 space-y-4 text-center sm:text-left">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <strong className="text-slate-400">Legal Disclaimer:</strong> SentinelX provides automated security assessments based exclusively on publicly observable signals and safe HTTP/TLS handshakes. It does not perform intrusive exploitation, denial-of-service, or brute force penetration testing. Results should be validated by qualified security professionals.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <span>© {new Date().getFullYear()} SentinelX Security Inc. All rights reserved.</span>
            <span>Built for modern DevSecOps & Enterprise Posture Assessment</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
