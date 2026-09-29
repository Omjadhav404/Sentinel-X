'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScanDashboard } from '@/components/ScanDashboard';
import { ConsultationModal } from '@/components/ConsultationModal';
import { AuthModal } from '@/components/AuthModal';
import { ScanResult } from '@/lib/scanner/types';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ScanReportPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params.id as string;

  const [scan, setScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Consultation & Auth modal state
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

  useEffect(() => {
    if (!scanId) return;

    const fetchScan = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/scan/${encodeURIComponent(scanId)}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to load scan report.');
        }

        setScan(json.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error fetching scan details.');
      } finally {
        setLoading(false);
      }
    };

    fetchScan();
  }, [scanId]);

  const handleConsultation = (scanData: ScanResult, findingTitle?: string) => {
    setConsultationPreFill({
      website: scanData.targetUrl,
      score: scanData.score,
      risk: scanData.riskLevel,
      issue: findingTitle || scanData.findings[0]?.title || 'Security remediation',
      scanId: scanData.id,
    });
    setIsConsultationOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        user={currentUser}
        onLogout={() => setCurrentUser(null)}
      />

      <main className="flex-1 py-8">
        {loading ? (
          <div className="max-w-md mx-auto py-24 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-white">Loading Security Assessment...</h2>
            <p className="text-xs text-slate-400">Fetching cryptographic parameters and telemetry.</p>
          </div>
        ) : error ? (
          <div className="max-w-lg mx-auto py-16 px-4">
            <div className="glass-panel p-6 bg-slate-900/80 border-rose-500/30 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">Report Not Found</h2>
              <p className="text-xs text-slate-300">{error}</p>
              <div className="pt-2">
                <Link href="/" className="btn-primary text-xs px-6 py-2.5 inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Start New Assessment</span>
                </Link>
              </div>
            </div>
          </div>
        ) : scan ? (
          <ScanDashboard
            scan={scan}
            onRescan={() => router.push(`/?url=${encodeURIComponent(scan.targetUrl)}`)}
            onRequestConsultation={handleConsultation}
          />
        ) : null}
      </main>

      <Footer />

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
