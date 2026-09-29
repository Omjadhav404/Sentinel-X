'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthModal } from '@/components/AuthModal';
import {
  BookOpen, ShieldCheck, Lock, Eye, Server, Cpu, CheckSquare,
  Search, ChevronDown, ChevronUp, Code, ArrowRight, Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  category: string;
  readTime: string;
  summary: string;
  content: React.ReactNode;
}

export default function LearnPage() {
  const [search, setSearch] = useState('');
  const [expandedArticle, setExpandedArticle] = useState<string | null>('headers');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; isDemo?: boolean } | null>(null);

  const articles: Article[] = [
    {
      id: 'headers',
      title: 'What are HTTP Security Headers & Why Do They Matter?',
      category: 'Defense in Depth',
      readTime: '4 min read',
      summary: 'HTTP response headers instruct web browsers how to handle your site’s content, preventing entire classes of cyber attacks.',
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            When a visitor navigates to your website, your web server returns HTTP response headers alongside the HTML. Modern browsers interpret these headers as strict security directives.
          </p>
          <div className="space-y-2 pt-1 font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-white/5 space-y-1">
              <strong className="text-cyan-400">1. Strict-Transport-Security (HSTS):</strong>
              <p className="text-slate-400 font-sans">Forces the browser to always use HTTPS, preventing man-in-the-middle SSL stripping attacks on unencrypted links.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-white/5 space-y-1">
              <strong className="text-cyan-400">2. X-Content-Type-Options: nosniff:</strong>
              <p className="text-slate-400 font-sans">Prevents the browser from trying to guess (MIME-sniff) the type of content, stopping malicious user-uploaded text from executing as executable code.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-white/5 space-y-1">
              <strong className="text-cyan-400">3. X-Frame-Options: DENY:</strong>
              <p className="text-slate-400 font-sans">Protects against clickjacking attacks where an attacker embeds your website inside a transparent iframe to steal user interactions.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'csp',
      title: 'What is Content-Security-Policy (CSP)?',
      category: 'XSS Prevention',
      readTime: '5 min read',
      summary: 'CSP is a powerful browser security standard designed to prevent Cross-Site Scripting (XSS) and malicious data injection.',
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Cross-Site Scripting (XSS) occurs when malicious JavaScript is injected into a trusted web page. A Content-Security-Policy (CSP) allows website administrators to explicitly declare which dynamic resources are permitted to load and execute.
          </p>
          <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/20 font-mono text-[11px] text-cyan-200">
            Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted-cdn.com; object-src 'none'; frame-ancestors 'none';
          </div>
          <p>
            By restricting <code className="text-cyan-300 font-mono">object-src 'none'</code> and eliminating <code className="text-rose-400 font-mono">'unsafe-inline'</code>, even if an attacker manages to inject HTML into the page, the browser will refuse to execute unauthorized scripts.
          </p>
        </div>
      ),
    },
    {
      id: 'tls',
      title: 'What is TLS & How Does Modern SSL Encryption Work?',
      category: 'Cryptography',
      readTime: '4 min read',
      summary: 'Transport Layer Security (TLS) is the cryptographic protocol that secures communication over computer networks.',
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            TLS 1.3 is the modern gold standard for secure internet communication. It replaces outdated SSL versions (SSLv2, SSLv3) and older TLS versions (1.0 and 1.1) that have known cryptographic flaws such as POODLE and BEAST.
          </p>
          <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
            <li><strong className="text-slate-200">Perfect Forward Secrecy (PFS):</strong> Ensures that even if the server’s private key is compromised in the future, past session traffic cannot be decrypted.</li>
            <li><strong className="text-slate-200">1-RTT Handshake:</strong> Speeds up encrypted connection setup by reducing latency to a single round-trip.</li>
            <li><strong className="text-slate-200">AEAD Ciphers:</strong> Mandates authenticated encryption with associated data (such as AES-GCM and ChaCha20-Poly1305).</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'cookies',
      title: 'Why Are Secure Cookie Flags (Secure, HttpOnly, SameSite) Critical?',
      category: 'Session Protection',
      readTime: '3 min read',
      summary: 'Cookies store sensitive user authentication session tokens. Insecure flags allow eavesdropping and cross-site forgery.',
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            When web applications issue cookies via the <code className="text-cyan-300 font-mono">Set-Cookie</code> HTTP header, three attributes are essential for protecting user accounts:
          </p>
          <div className="space-y-2 pt-1 font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-white/5 space-y-1">
              <strong className="text-cyan-400">Secure:</strong>
              <p className="text-slate-400 font-sans">Guarantees the browser will only transmit the cookie over encrypted HTTPS connections, preventing Wi-Fi packet sniffing.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-white/5 space-y-1">
              <strong className="text-cyan-400">HttpOnly:</strong>
              <p className="text-slate-400 font-sans">Blocks client-side JavaScript (<code className="text-slate-300">document.cookie</code>) from reading the cookie, stopping XSS credential theft.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-white/5 space-y-1">
              <strong className="text-cyan-400">SameSite=Lax / Strict:</strong>
              <p className="text-slate-400 font-sans">Prevents the browser from sending the session cookie in cross-site requests, mitigating Cross-Site Request Forgery (CSRF).</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'scoring',
      title: 'How Does the SentinelX Security Scoring Algorithm Work?',
      category: 'Scoring Methodology',
      readTime: '3 min read',
      summary: 'SentinelX uses a deterministic, transparent weighted scoring model based on publicly observable defenses.',
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Unlike tools that produce arbitrary numbers, SentinelX computes a transparent composite score from 0 to 100 based on weighted security dimensions:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-400">
            <li><strong className="text-slate-200">Security Headers (30%):</strong> Verification of CSP, HSTS, X-Content-Type, X-Frame-Options, Referrer-Policy.</li>
            <li><strong className="text-slate-200">HTTPS & TLS (25%):</strong> CA trust chain, cipher suites, expiration, and automatic HTTP upgrade.</li>
            <li><strong className="text-slate-200">Cookie Security (15%):</strong> Secure, HttpOnly, and SameSite attributes on public session cookies.</li>
            <li><strong className="text-slate-200">Information Disclosure (15%):</strong> Server banners, framework leaks, and RFC 9116 security.txt compliance.</li>
            <li><strong className="text-slate-200">DNS Hardening (15%):</strong> Certificate Authority Authorization (CAA) and email spoofing protections.</li>
          </ul>
          <p className="text-cyan-300 font-semibold pt-1">
            Severity Override Rule: If a Critical finding is detected (e.g. untrusted or expired SSL certificate), the composite score is strictly capped at 45.
          </p>
        </div>
      ),
    },
    {
      id: 'checklist',
      title: 'Website Security Pre-Flight Checklist',
      category: 'Checklist',
      readTime: '4 min read',
      summary: 'A step-by-step audit checklist for engineering teams deploying new websites into production.',
      content: (
        <div className="space-y-2 text-xs text-slate-300">
          {[
            'Ensure HTTP port 80 returns a 301 Permanent Redirect to https://',
            'Install a valid TLS certificate issued by an accredited CA with auto-renewal',
            'Deploy Strict-Transport-Security (HSTS) with max-age=31536000 and includeSubDomains',
            'Implement Content-Security-Policy (CSP) with nonce-based script whitelisting',
            'Add X-Content-Type-Options: nosniff to all responses',
            'Add X-Frame-Options: DENY or SAMEORIGIN to prevent clickjacking',
            'Set Secure, HttpOnly, and SameSite=Lax on all session cookies',
            'Disable Server and X-Powered-By banners in server configuration',
            'Publish RFC 9116 security.txt at /.well-known/security.txt with valid contact email',
            'Publish DNS CAA records specifying your authorized Certificate Authority',
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/60 border border-white/5">
              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        user={currentUser}
        onLogout={() => setCurrentUser(null)}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 space-y-12 animate-fade-in">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase font-bold">
            Cybersecurity Knowledge Base
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Web Security Architecture & Standards
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Learn how browser security controls, cryptography, and response headers protect your business from automated threats.
          </p>

          {/* Search bar */}
          <div className="relative max-w-md mx-auto pt-2">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guides, CSP, HSTS, cookies..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-inner"
            />
          </div>
        </div>

        {/* Articles Accordion List */}
        <div className="space-y-4">
          {filtered.map((article) => {
            const isExpanded = expandedArticle === article.id;

            return (
              <div
                key={article.id}
                className="glass-panel border border-white/10 bg-slate-900/60 rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all"
              >
                <div
                  onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                  className="p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                        {article.category}
                      </span>
                      <span className="text-[11px] text-slate-400">{article.readTime}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{article.title}</h3>
                    <p className="text-xs text-slate-300">{article.summary}</p>
                  </div>

                  <div className="p-2 text-slate-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-cyan-400" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-white/5 animate-fade-in">
                    {article.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA to run scan */}
        <div className="glass-panel p-8 text-center bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-blue-950/40 border-cyan-500/30 rounded-2xl space-y-4">
          <h3 className="text-xl font-bold text-white">Ready to inspect your website?</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Test your live deployment against these exact security controls in 10 seconds.
          </p>
          <Link href="/" className="btn-primary text-xs px-6 py-2.5 inline-flex items-center gap-2">
            <span>Run Free Security Scan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
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
