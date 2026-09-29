'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Activity, BarChart2, BookOpen, Layers, DollarSign, Menu, X, UserCheck, LogIn, Lock } from 'lucide-react';

interface NavbarProps {
  onOpenAuth?: () => void;
  onOpenConsultation?: () => void;
  user?: { name: string; email: string; isDemo?: boolean } | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  user,
  onLogout,
}) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Scanner', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Monitoring', href: '/monitoring' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Learn', href: '/learn' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#07090e]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/30 to-violet-600/20 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,254,0.25)] transition-all group-hover:shadow-[0_0_28px_rgba(0,242,254,0.45)] group-hover:scale-105">
            <Shield className="w-5 h-5 text-cyan-400" />
            <div className="absolute inset-0 rounded-xl border border-cyan-400/30 animate-pulse pointer-events-none" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1 font-sans">
              Sentinel<span className="text-cyan-400">X</span>
            </span>
            <span className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
              Enterprise Web Security
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 border border-white/5 px-3 py-1.5 rounded-full backdrop-blur-md">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                  isActive
                    ? 'text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,242,254,0.2)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA & Auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-800/80 border border-white/10 px-3 py-1.5 rounded-lg text-xs">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono text-slate-200">{user.name}</span>
                {user.isDemo && (
                  <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    DEMO
                  </span>
                )}
              </div>
              <button
                onClick={onLogout}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors px-2 py-1"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 flex items-center gap-1.5 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-400" />
              Sign In
            </button>
          )}

          <Link
            href="/"
            className="btn-primary text-xs !py-2 !px-4 !rounded-lg"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Scan Website</span>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg bg-slate-800/80 border border-white/10 text-slate-300 hover:text-white"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#0c111c] px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-cyan-300 hover:bg-white/5 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            {user ? (
              <div className="flex items-center justify-between px-3 py-2 bg-slate-900/60 rounded-lg">
                <span className="text-xs text-slate-300">{user.email}</span>
                <button
                  onClick={() => {
                    onLogout?.();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-400"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth?.();
                  setMobileMenuOpen(false);
                }}
                className="btn-secondary w-full justify-center text-xs py-2.5"
              >
                Sign In / Demo Login
              </button>
            )}

            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary w-full justify-center text-xs py-2.5"
            >
              Scan Website Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
