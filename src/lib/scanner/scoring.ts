import { CategoryScore, RiskLevel, SecurityFinding, SecurityGrade } from './types';

export interface ScoringEngineInput {
  httpsTlsScore: number;
  headersScore: number;
  cookiesScore: number;
  serverInfoScore: number;
  dnsScore: number;
  findings: SecurityFinding[];
}

export interface ScoringEngineOutput {
  overallScore: number;
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
}

export function computeSecurityScore(input: ScoringEngineInput): ScoringEngineOutput {
  const {
    httpsTlsScore,
    headersScore,
    cookiesScore,
    serverInfoScore,
    dnsScore,
    findings,
  } = input;

  // Category Weights:
  // HTTPS/TLS: 25%
  // Headers: 30%
  // Cookies: 15%
  // Server Info: 15%
  // DNS: 15%
  const weighted =
    httpsTlsScore * 0.25 +
    headersScore * 0.30 +
    cookiesScore * 0.15 +
    serverInfoScore * 0.15 +
    dnsScore * 0.15;

  let overallScore = Math.round(weighted);

  // Apply severity caps:
  // If there are Critical findings, overall score cannot exceed 45
  const criticalCount = findings.filter(f => f.severity === 'Critical').length;
  const highCount = findings.filter(f => f.severity === 'High').length;

  if (criticalCount > 0 && overallScore > 45) {
    overallScore = 45;
  } else if (highCount >= 3 && overallScore > 65) {
    overallScore = 65;
  }

  overallScore = Math.max(0, Math.min(100, overallScore));

  // Determine Grade
  let grade: SecurityGrade = 'F';
  if (overallScore >= 95) grade = 'A+';
  else if (overallScore >= 88) grade = 'A';
  else if (overallScore >= 75) grade = 'B';
  else if (overallScore >= 60) grade = 'C';
  else if (overallScore >= 40) grade = 'D';
  else grade = 'F';

  // Determine Risk Level
  let riskLevel: RiskLevel = 'Critical';
  if (overallScore >= 82 && criticalCount === 0 && highCount === 0) {
    riskLevel = 'Low';
  } else if (overallScore >= 65 && criticalCount === 0) {
    riskLevel = 'Medium';
  } else if (overallScore >= 40) {
    riskLevel = 'High';
  } else {
    riskLevel = 'Critical';
  }

  const getStatus = (score: number): 'excellent' | 'good' | 'warning' | 'critical' => {
    if (score >= 88) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'warning';
    return 'critical';
  };

  const categoryScores = {
    httpsTls: {
      name: 'HTTPS & SSL/TLS Configuration',
      score: httpsTlsScore,
      maxScore: 100,
      percentage: Math.round(httpsTlsScore),
      status: getStatus(httpsTlsScore),
    },
    headers: {
      name: 'HTTP Security Headers',
      score: headersScore,
      maxScore: 100,
      percentage: Math.round(headersScore),
      status: getStatus(headersScore),
    },
    cookies: {
      name: 'Cookie Security & Session Flags',
      score: cookiesScore,
      maxScore: 100,
      percentage: Math.round(cookiesScore),
      status: getStatus(cookiesScore),
    },
    serverInfo: {
      name: 'Server & Information Disclosure',
      score: serverInfoScore,
      maxScore: 100,
      percentage: Math.round(serverInfoScore),
      status: getStatus(serverInfoScore),
    },
    dnsDomain: {
      name: 'DNS & Domain Hardening',
      score: dnsScore,
      maxScore: 100,
      percentage: Math.round(dnsScore),
      status: getStatus(dnsScore),
    },
    clientSecurity: {
      name: 'Client-Side Mixed Content',
      score: Math.min(100, httpsTlsScore),
      maxScore: 100,
      percentage: Math.round(Math.min(100, httpsTlsScore)),
      status: getStatus(httpsTlsScore),
    },
  };

  // Executive Summary text
  let summary = '';
  if (riskLevel === 'Low') {
    summary = `The target website demonstrates a robust security posture with a Grade ${grade} (${overallScore}/100). Essential cryptographic safeguards, modern protocols, and security controls are active.`;
  } else if (riskLevel === 'Medium') {
    summary = `The target website earned a Grade ${grade} (${overallScore}/100) with moderate security risks. While basic transport security is functional, key defense-in-depth controls (such as CSP or HSTS) require hardening.`;
  } else if (riskLevel === 'High') {
    summary = `The assessment identified significant security exposures with a Grade ${grade} (${overallScore}/100). Missing defense-in-depth protections and unhardened response headers leave the site susceptible to client-side attacks. Immediate remediation recommended.`;
  } else {
    summary = `CRITICAL ATTENTION REQUIRED: The target scored ${overallScore}/100 (Grade ${grade}) with severe vulnerability indicators. Transport security failures, untrusted certificates, or missing core protections expose visitors to immediate interception.`;
  }

  return {
    overallScore,
    grade,
    riskLevel,
    summary,
    categoryScores,
  };
}
