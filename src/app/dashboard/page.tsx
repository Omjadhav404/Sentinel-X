'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthModal } from '@/components/AuthModal';
import { ScanSummaryItem } from '@/lib/scanner/types';
import Link from 'next/link';
import {
  Shield, Search, Trash2, ExternalLink, ArrowRight, CheckCircle2,
  AlertTriangle, AlertOctagon, RefreshCw, BarChart2, PlusCircle, Filter
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [scans, setScans] = useState<ScanSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [quickUrl, setQuickUrl] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; isDemo?: boolean } | null>(null);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/scans');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setScans(json.data);
      }
    } catch (err) {
      console.error('Failed to load scans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const handleDeleteScan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/scan/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setScans((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error('Error deleting scan:', err);
    }
  };

  const handleQuickScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickUrl.trim()) {
      router.push(`/?url=${encodeURIComponent(quickUrl.trim())}`);
    }
  };

  // Filtered scans
  const filteredScans = scans.filter((s) => {
    const matchesSearch =
      s.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'all' || s.riskLevel.toLowerCase() === riskFilter.toLowerCase();
    return matchesSearch && matchesRisk;
  });

  // Calculate statistics
  const totalScans = scans.length;
  const avgScore =
    totalScans > 0 ? Math.round(scans.reduce((acc, curr) => acc + curr.score, 0) / totalScans) : 0;
  const highRiskCount = scans.filter((s) => s.riskLevel === 'High' || s.riskLevel === 'Critical').length;
  const passedCount = scans.filter((s) => s.riskLevel === 'Low').length;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        user={currentUser}
        onLogout={() => setCurrentUser(null)}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Header Title & Quick Scan Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Security Assessment Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Audit history, security score telemetry, and verified website assessments
            </p>
          </div>

          {/* Quick Scan Input */}
          <form onSubmit={handleQuickScan} className="flex items-center gap-2">
            <input
              type="text"
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              placeholder="https://new-domain.com"
              className="px-3.5 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400 min-w-[220px]"
            />
            <button type="submit" className="btn-primary text-xs !py-2 !px-3.5 whitespace-nowrap">
              <span>Run Scan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 bg-slate-900/60 border-white/5 rounded-xl space-y-1">
            <span className="text-xs text-slate-400 font-medium">Total Assessed Websites</span>
            <div className="text-2xl font-bold font-mono text-white">{totalScans}</div>
            <span className="text-[11px] text-cyan-400 flex items-center gap-1 font-mono">
              <Shield className="w-3 h-3" /> Historical Archive
            </span>
          </div>

          <div className="glass-panel p-5 bg-slate-900/60 border-white/5 rounded-xl space-y-1">
            <span className="text-xs text-slate-400 font-medium">Average Security Score</span>
            <div className="text-2xl font-bold font-mono text-cyan-300">{avgScore} / 100</div>
            <span className="text-[11px] text-slate-400">Across all evaluated endpoints</span>
          </div>

          <div className="glass-panel p-5 bg-slate-900/60 border-white/5 rounded-xl space-y-1">
            <span className="text-xs text-slate-400 font-medium">Hardened / Low Risk</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">{passedCount}</div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Meeting security standards
            </span>
          </div>

          <div className="glass-panel p-5 bg-slate-900/60 border-white/5 rounded-xl space-y-1">
            <span className="text-xs text-slate-400 font-medium">Elevated / Critical Risk</span>
            <div className="text-2xl font-bold font-mono text-rose-400">{highRiskCount}</div>
            <span className="text-[11px] text-rose-400 flex items-center gap-1">
              <AlertOctagon className="w-3 h-3" /> Remediation suggested
            </span>
          </div>
        </div>

        {/* Scans Table Section */}
        <div className="glass-panel p-6 bg-slate-900/70 border-white/5 rounded-2xl space-y-4">
          {/* Table Controls (Search & Risk Filter) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search domain or URL..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950/80 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Risk Filter:
              </span>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="critical">Critical Risk</option>
              </select>

              <button
                onClick={fetchScans}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Refresh list"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/90 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-white/10">
                  <th className="py-3 px-4">Target Website</th>
                  <th className="py-3 px-4">Security Score</th>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Assessment Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredScans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      {loading ? 'Loading assessments...' : 'No security scans recorded yet. Enter a website URL to begin.'}
                    </td>
                  </tr>
                ) : (
                  filteredScans.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/scan/${item.id}`)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate max-w-[200px] sm:max-w-xs">{item.hostname}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={`text-sm ${
                          item.score >= 85 ? 'text-emerald-400' : item.score >= 65 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {item.score}
                        </span>
                        <span className="text-slate-500 text-[10px]"> / 100</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                        Grade {item.grade}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          item.riskLevel === 'Low'
                            ? 'badge-low'
                            : item.riskLevel === 'Medium'
                            ? 'badge-medium'
                            : item.riskLevel === 'High'
                            ? 'badge-high'
                            : 'badge-critical'
                        }`}>
                          {item.riskLevel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(item.scanDate).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{item.status}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/scan/${item.id}`}
                            className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                            title="View Full Report"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={(e) => handleDeleteScan(item.id, e)}
                            className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Scan Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
