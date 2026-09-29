export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational' | 'Passed';

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type SecurityGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface CodeSnippet {
  technology: 'nginx' | 'apache' | 'caddy' | 'cloudflare' | 'nextjs' | 'express';
  title: string;
  code: string;
}

export interface SecurityFinding {
  id: string;
  category: 'httpsTls' | 'headers' | 'cookies' | 'serverInfo' | 'dnsDomain' | 'clientSecurity';
  severity: SeverityLevel;
  title: string;
  description: string;
  whyItMatters: string;
  evidence: string;
  recommendation: string;
  technicalDetails?: string;
  cwe?: string;
  referenceUrl?: string;
  fixSnippets?: CodeSnippet[];
}

export interface ScanCheckResult {
  id: string;
  name: string;
  category: 'httpsTls' | 'headers' | 'cookies' | 'serverInfo' | 'dnsDomain' | 'clientSecurity';
  status: 'passed' | 'warning' | 'failed' | 'info';
  title: string;
  detail: string;
  scoreImpact: number;
}

export interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface ScanResult {
  id: string;
  targetUrl: string;
  normalizedUrl: string;
  hostname: string;
  ipAddress?: string;
  scanDate: string;
  durationMs: number;
  score: number;
  grade: SecurityGrade;
  riskLevel: RiskLevel;
  summary: string;
  categoryScores: {
    httpsTls: CategoryScore;
    headers: CategoryScore;
    cookies: CategoryScore;
    serverInfo: CategoryScore;
    dnsDomain: CategoryScore;
    clientSecurity: CategoryScore;
  };
  metrics: {
    passedCount: number;
    warningCount: number;
    highCount: number;
    criticalCount: number;
    infoCount: number;
    totalChecks: number;
  };
  checks: ScanCheckResult[];
  findings: SecurityFinding[];
  tlsDetails?: {
    protocol?: string;
    cipher?: string;
    validFrom?: string;
    validTo?: string;
    daysRemaining?: number;
    issuer?: string;
    subject?: string;
    authorized?: boolean;
    authError?: string;
    sans?: string[];
  };
  serverDetails?: {
    serverHeader?: string;
    poweredBy?: string;
    hasSecurityTxt?: boolean;
    hasRobotsTxt?: boolean;
    statusCode?: number;
    redirectCount?: number;
  };
  dnsDetails?: {
    hasIpv6?: boolean;
    hasMx?: boolean;
    hasSpf?: boolean;
    hasDmarc?: boolean;
    hasCaa?: boolean;
  };
  isDemo?: boolean;
}

export interface ScanSummaryItem {
  id: string;
  url: string;
  hostname: string;
  score: number;
  grade: SecurityGrade;
  riskLevel: RiskLevel;
  scanDate: string;
  status: 'Complete' | 'Failed' | 'In Progress';
  criticalCount: number;
  warningCount: number;
}

export interface ConsultationRequest {
  id?: string;
  scanId?: string;
  name: string;
  email: string;
  company?: string;
  website: string;
  securityScore?: number;
  riskLevel?: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  issueSummary?: string;
  message: string;
  createdAt?: string;
}

export interface MonitoringTarget {
  id: string;
  url: string;
  frequency: 'daily' | 'weekly' | 'continuous';
  lastScanDate: string;
  currentScore: number;
  previousScore: number;
  status: 'active' | 'paused';
  alertEmail: string;
  scoreHistory: { date: string; score: number }[];
}
