import { ConsultationRequest, MonitoringTarget, ScanResult, ScanSummaryItem } from '../scanner/types';

// In-memory cache with fallback seed items
class ScanStorage {
  private scans: Map<string, ScanResult> = new Map();
  private consultations: ConsultationRequest[] = [];
  private monitoringTargets: MonitoringTarget[] = [];

  constructor() {
    this.seedDefaultScans();
  }

  private seedDefaultScans() {
    // Seed sample scans for instant rich dashboard demo
    const sampleScan1: ScanResult = {
      id: 'scan_sample_cloudflare',
      targetUrl: 'https://cloudflare.com',
      normalizedUrl: 'https://cloudflare.com/',
      hostname: 'cloudflare.com',
      ipAddress: '104.16.132.229',
      scanDate: new Date(Date.now() - 3600000 * 2).toISOString(),
      durationMs: 820,
      score: 98,
      grade: 'A+',
      riskLevel: 'Low',
      summary: 'Exceptional security posture. Full HSTS preload, strict CSP, TLS 1.3, and CAA records enforced.',
      categoryScores: {
        httpsTls: { name: 'HTTPS & SSL/TLS', score: 100, maxScore: 100, percentage: 100, status: 'excellent' },
        headers: { name: 'HTTP Security Headers', score: 98, maxScore: 100, percentage: 98, status: 'excellent' },
        cookies: { name: 'Cookie Security', score: 96, maxScore: 100, percentage: 96, status: 'excellent' },
        serverInfo: { name: 'Information Disclosure', score: 95, maxScore: 100, percentage: 95, status: 'excellent' },
        dnsDomain: { name: 'DNS Hardening', score: 100, maxScore: 100, percentage: 100, status: 'excellent' },
        clientSecurity: { name: 'Client-Side Security', score: 100, maxScore: 100, percentage: 100, status: 'excellent' },
      },
      metrics: {
        passedCount: 17,
        warningCount: 1,
        highCount: 0,
        criticalCount: 0,
        infoCount: 1,
        totalChecks: 18,
      },
      checks: [
        { id: '1', name: 'HTTPS Enforcement', category: 'httpsTls', status: 'passed', title: 'HTTPS is fully enforced', detail: '301 Permanent Redirect to HTTPS', scoreImpact: 0 },
        { id: '2', name: 'TLS 1.3 Handshake', category: 'httpsTls', status: 'passed', title: 'TLS 1.3 Active', detail: 'Modern authenticated encryption', scoreImpact: 0 },
        { id: '3', name: 'HSTS Preload', category: 'headers', status: 'passed', title: 'HSTS Preloaded', detail: 'max-age=31536000; includeSubDomains; preload', scoreImpact: 0 },
        { id: '4', name: 'Content-Security-Policy', category: 'headers', status: 'passed', title: 'Strict CSP Active', detail: 'default-src \'self\'', scoreImpact: 0 },
        { id: '5', name: 'DNS CAA Record', category: 'dnsDomain', status: 'passed', title: 'CAA Record Enforced', detail: 'Protects certificate issuance', scoreImpact: 0 },
      ],
      findings: [
        {
          id: 'sample-find-1',
          category: 'headers',
          severity: 'Informational',
          title: 'Permissions-Policy Recommended',
          description: 'Permissions-Policy header can be expanded to further restrict device hardware.',
          whyItMatters: 'Limits browser feature delegation for embedded third-party frames.',
          evidence: 'Header absent',
          recommendation: 'Add Permissions-Policy: camera=(), microphone=().',
        },
      ],
      tlsDetails: {
        protocol: 'TLSv1.3',
        cipher: 'TLS_AES_256_GCM_SHA384',
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        daysRemaining: 190,
        issuer: 'Cloudflare Inc ECC CA-3',
        subject: 'cloudflare.com',
        authorized: true,
      },
      isDemo: false,
    };

    const sampleScan2: ScanResult = {
      id: 'scan_sample_medium',
      targetUrl: 'https://example.com',
      normalizedUrl: 'https://example.com/',
      hostname: 'example.com',
      ipAddress: '93.184.216.34',
      scanDate: new Date(Date.now() - 3600000 * 24).toISOString(),
      durationMs: 910,
      score: 74,
      grade: 'B',
      riskLevel: 'Medium',
      summary: 'Moderate security posture. TLS 1.3 is supported, but missing Content-Security-Policy and HSTS allows potential downgrade and injection risks.',
      categoryScores: {
        httpsTls: { name: 'HTTPS & SSL/TLS', score: 90, maxScore: 100, percentage: 90, status: 'excellent' },
        headers: { name: 'HTTP Security Headers', score: 55, maxScore: 100, percentage: 55, status: 'warning' },
        cookies: { name: 'Cookie Security', score: 85, maxScore: 100, percentage: 85, status: 'good' },
        serverInfo: { name: 'Information Disclosure', score: 70, maxScore: 100, percentage: 70, status: 'good' },
        dnsDomain: { name: 'DNS Hardening', score: 65, maxScore: 100, percentage: 65, status: 'warning' },
        clientSecurity: { name: 'Client-Side Security', score: 85, maxScore: 100, percentage: 85, status: 'good' },
      },
      metrics: {
        passedCount: 10,
        warningCount: 3,
        highCount: 2,
        criticalCount: 0,
        infoCount: 2,
        totalChecks: 15,
      },
      checks: [
        { id: '1', name: 'HTTPS Support', category: 'httpsTls', status: 'passed', title: 'HTTPS is active', detail: 'Port 443 accessible', scoreImpact: 0 },
        { id: '2', name: 'HSTS Header', category: 'headers', status: 'failed', title: 'Missing Strict-Transport-Security', detail: 'HSTS is not active', scoreImpact: -25 },
        { id: '3', name: 'Content-Security-Policy', category: 'headers', status: 'failed', title: 'Missing CSP', detail: 'No CSP configured', scoreImpact: -25 },
      ],
      findings: [
        {
          id: 'sample-find-2',
          category: 'headers',
          severity: 'High',
          title: 'Missing Content-Security-Policy',
          description: 'No Content-Security-Policy header was observed.',
          whyItMatters: 'Leaves the site susceptible to cross-site scripting (XSS) and clickjacking.',
          evidence: 'Header Content-Security-Policy is absent.',
          recommendation: 'Implement a Content-Security-Policy header restricting script execution.',
          cwe: 'CWE-79',
        },
        {
          id: 'sample-find-3',
          category: 'headers',
          severity: 'High',
          title: 'Missing HTTP Strict Transport Security (HSTS)',
          description: 'The server does not enforce HTTPS connections via HSTS.',
          whyItMatters: 'Users can be vulnerable to SSL-stripping attacks.',
          evidence: 'Header Strict-Transport-Security is absent.',
          recommendation: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains.',
          cwe: 'CWE-319',
        },
      ],
      tlsDetails: {
        protocol: 'TLSv1.3',
        cipher: 'TLS_AES_256_GCM_SHA384',
        validFrom: '2024-02-01',
        validTo: '2025-02-01',
        daysRemaining: 140,
        issuer: 'DigiCert TLS RSA SHA256 2020 CA1',
        subject: 'example.com',
        authorized: true,
      },
      isDemo: false,
    };

    this.scans.set(sampleScan1.id, sampleScan1);
    this.scans.set(sampleScan2.id, sampleScan2);

    // Seed monitoring targets
    this.monitoringTargets.push({
      id: 'target-1',
      url: 'https://example.com',
      frequency: 'daily',
      lastScanDate: new Date().toISOString(),
      currentScore: 74,
      previousScore: 71,
      status: 'active',
      alertEmail: 'admin@example.com',
      scoreHistory: [
        { date: 'Sep 24', score: 68 },
        { date: 'Sep 25', score: 70 },
        { date: 'Sep 26', score: 71 },
        { date: 'Sep 27', score: 71 },
        { date: 'Sep 28', score: 74 },
      ],
    });
    this.monitoringTargets.push({
      id: 'target-2',
      url: 'https://cloudflare.com',
      frequency: 'continuous',
      lastScanDate: new Date().toISOString(),
      currentScore: 98,
      previousScore: 98,
      status: 'active',
      alertEmail: 'secops@mycompany.org',
      scoreHistory: [
        { date: 'Sep 24', score: 98 },
        { date: 'Sep 25', score: 98 },
        { date: 'Sep 26', score: 97 },
        { date: 'Sep 27', score: 98 },
        { date: 'Sep 28', score: 98 },
      ],
    });
  }

  saveScan(scan: ScanResult): void {
    this.scans.set(scan.id, scan);
  }

  getScan(id: string): ScanResult | undefined {
    return this.scans.get(id);
  }

  listScans(): ScanSummaryItem[] {
    const list: ScanSummaryItem[] = [];
    for (const scan of this.scans.values()) {
      list.push({
        id: scan.id,
        url: scan.targetUrl,
        hostname: scan.hostname,
        score: scan.score,
        grade: scan.grade,
        riskLevel: scan.riskLevel,
        scanDate: scan.scanDate,
        status: 'Complete',
        criticalCount: scan.metrics.criticalCount,
        warningCount: scan.metrics.warningCount,
      });
    }
    // Sort descending by date
    return list.sort((a, b) => new Date(b.scanDate).getTime() - new Date(a.scanDate).getTime());
  }

  deleteScan(id: string): boolean {
    return this.scans.delete(id);
  }

  addConsultation(request: ConsultationRequest): ConsultationRequest {
    const enriched: ConsultationRequest = {
      ...request,
      id: `cons_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`,
      createdAt: new Date().toISOString(),
    };
    this.consultations.push(enriched);
    return enriched;
  }

  listConsultations(): ConsultationRequest[] {
    return this.consultations;
  }

  listMonitoringTargets(): MonitoringTarget[] {
    return this.monitoringTargets;
  }

  addMonitoringTarget(target: Omit<MonitoringTarget, 'id' | 'currentScore' | 'previousScore' | 'scoreHistory'>): MonitoringTarget {
    const newTarget: MonitoringTarget = {
      ...target,
      id: `mon_${Date.now().toString(36)}`,
      currentScore: 80,
      previousScore: 80,
      scoreHistory: [{ date: 'Today', score: 80 }],
    };
    this.monitoringTargets.push(newTarget);
    return newTarget;
  }
}

// Global singleton across Next.js reloads
const globalForStorage = globalThis as unknown as { __sentinelx_storage?: ScanStorage };
export const scanStorage = globalForStorage.__sentinelx_storage || new ScanStorage();
if (process.env.NODE_ENV !== 'production') {
  globalForStorage.__sentinelx_storage = scanStorage;
}
