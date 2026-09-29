import { FIX_SNIPPETS } from './recommendations';
import { ScanCheckResult, SecurityFinding } from './types';

export interface InfoAnalysisResult {
  checks: ScanCheckResult[];
  findings: SecurityFinding[];
  score: number;
  serverHeader?: string;
  poweredByHeader?: string;
  hasSecurityTxt: boolean;
  hasRobotsTxt: boolean;
}

export async function analyzeInformationDisclosure(
  hostname: string,
  rawHeaders: Record<string, string>
): Promise<InfoAnalysisResult> {
  const checks: ScanCheckResult[] = [];
  const findings: SecurityFinding[] = [];
  let score = 100;

  const serverHeader = rawHeaders['server'];
  const poweredBy = rawHeaders['x-powered-by'] || rawHeaders['x-aspnet-version'] || rawHeaders['x-generator'];

  // 1. Server Header Disclosure
  if (serverHeader) {
    const hasDetailedVersion = /\d+\.\d+/.test(serverHeader);
    if (hasDetailedVersion) {
      score -= 20;
      checks.push({
        id: 'info-server-version',
        name: 'Server Banner Information Exposure',
        category: 'serverInfo',
        status: 'warning',
        title: 'Verbose Server Header Detected',
        detail: `Server header exposes specific software and version: "${serverHeader}".`,
        scoreImpact: -20,
      });
      findings.push({
        id: 'finding-server-version',
        category: 'serverInfo',
        severity: 'Medium',
        title: 'Detailed Server Banner Disclosed',
        description: `Server banner discloses precise version information: "${serverHeader}".`,
        whyItMatters: 'Detailed version banners allow automated scanners and threat actors to cross-reference known CVEs and pinpoint unpatched vulnerabilities.',
        evidence: `Server: ${serverHeader}`,
        recommendation: 'Configure your web server to suppress or obfuscate version strings (e.g. server_tokens off in Nginx; ServerTokens Prod in Apache).',
        cwe: 'CWE-200',
        fixSnippets: FIX_SNIPPETS.serverTokens,
      });
    } else {
      checks.push({
        id: 'info-server-version',
        name: 'Server Banner Information Exposure',
        category: 'serverInfo',
        status: 'info',
        title: 'Generic Server Header Disclosed',
        detail: `Server banner is generic ("${serverHeader}") without revealing minor versions.`,
        scoreImpact: 0,
      });
    }
  } else {
    checks.push({
      id: 'info-server-version',
      name: 'Server Banner Information Exposure',
      category: 'serverInfo',
      status: 'passed',
      title: 'Server Header Hidden',
      detail: 'The Server header is not disclosed in responses.',
      scoreImpact: 0,
    });
  }

  // 2. X-Powered-By Exposure
  if (poweredBy) {
    score -= 15;
    checks.push({
      id: 'info-powered-by',
      name: 'Technology Fingerprint (X-Powered-By)',
      category: 'serverInfo',
      status: 'warning',
      title: 'Backend Framework Disclosed',
      detail: `Header discloses underlying stack: "${poweredBy}".`,
      scoreImpact: -15,
    });
    findings.push({
      id: 'finding-x-powered-by',
      category: 'serverInfo',
      severity: 'Low',
      title: 'X-Powered-By / Framework Disclosure',
      description: `The application reveals its underlying framework: "${poweredBy}".`,
      whyItMatters: 'Revealing software frameworks aids target reconnaissance for platform-specific exploits.',
      evidence: `X-Powered-By: ${poweredBy}`,
      recommendation: 'Disable the X-Powered-By header in your application framework settings.',
      cwe: 'CWE-200',
      fixSnippets: FIX_SNIPPETS.serverTokens,
    });
  } else {
    checks.push({
      id: 'info-powered-by',
      name: 'Technology Fingerprint (X-Powered-By)',
      category: 'serverInfo',
      status: 'passed',
      title: 'Technology Fingerprint Hidden',
      detail: 'X-Powered-By header is cleanly suppressed.',
      scoreImpact: 0,
    });
  }

  // 3. RFC 9116 security.txt check
  let hasSecurityTxt = false;
  try {
    const secController = new AbortController();
    const secTimeout = setTimeout(() => secController.abort(), 4000);

    const secRes = await fetch(`https://${hostname}/.well-known/security.txt`, {
      method: 'GET',
      signal: secController.signal,
      headers: {
        'User-Agent': 'SentinelX-Security-Bot/1.0 (+https://sentinelx.security/bot)',
      },
    });
    clearTimeout(secTimeout);

    if (secRes.status === 200) {
      const text = await secRes.text();
      if (text.includes('Contact:')) {
        hasSecurityTxt = true;
        checks.push({
          id: 'info-security-txt',
          name: 'RFC 9116 security.txt',
          category: 'serverInfo',
          status: 'passed',
          title: 'Vulnerability Disclosure Policy Active (security.txt)',
          detail: 'Valid security.txt discovered with Contact directive under /.well-known/.',
          scoreImpact: 0,
        });
      }
    }
  } catch {
    // Ignore fetch error
  }

  if (!hasSecurityTxt) {
    checks.push({
      id: 'info-security-txt',
      name: 'RFC 9116 security.txt',
      category: 'serverInfo',
      status: 'info',
      title: 'Missing security.txt Policy',
      detail: 'No RFC 9116 vulnerability disclosure file found at /.well-known/security.txt.',
      scoreImpact: 0,
    });
    findings.push({
      id: 'finding-missing-security-txt',
      category: 'serverInfo',
      severity: 'Informational',
      title: 'Publish security.txt for Responsible Disclosure',
      description: 'The domain does not have a published RFC 9116 security.txt file.',
      whyItMatters: 'A security.txt file gives ethical hackers and security researchers a clear, verified channel to report security issues before they are exploited.',
      evidence: 'GET /.well-known/security.txt did not return a valid Contact directive.',
      recommendation: 'Create a security.txt file containing Contact: mailto:security@yourdomain.com and Expires: <date>.',
      referenceUrl: 'https://securitytxt.org/',
      fixSnippets: FIX_SNIPPETS.securityTxt,
    });
  }

  // 4. robots.txt check
  let hasRobotsTxt = false;
  try {
    const robController = new AbortController();
    const robTimeout = setTimeout(() => robController.abort(), 4000);

    const robRes = await fetch(`https://${hostname}/robots.txt`, {
      method: 'GET',
      signal: robController.signal,
      headers: {
        'User-Agent': 'SentinelX-Security-Bot/1.0 (+https://sentinelx.security/bot)',
      },
    });
    clearTimeout(robTimeout);

    if (robRes.status === 200) {
      hasRobotsTxt = true;
      const robText = await robRes.text();
      const hasSensitivePatterns = /disallow:\s*\/(admin|backup|secret|private|api\/v1\/internal|dump)/i.test(robText);

      if (hasSensitivePatterns) {
        checks.push({
          id: 'info-robots-check',
          name: 'Robots.txt Analysis',
          category: 'serverInfo',
          status: 'warning',
          title: 'Robots.txt Discloses Sensitive Paths',
          detail: 'Robots.txt lists paths resembling administrative or private directories.',
          scoreImpact: -10,
        });
        findings.push({
          id: 'finding-robots-sensitive-paths',
          category: 'serverInfo',
          severity: 'Low',
          title: 'Sensitive Endpoints Disclosed in robots.txt',
          description: 'Robots.txt explicitly mentions administrative or private directory paths in Disallow directives.',
          whyItMatters: 'Search engine crawlers honor robots.txt, but malicious scrapers specifically harvest Disallow entries to identify high-value targets.',
          evidence: 'Disallow entries containing admin/backup/private keywords found.',
          recommendation: 'Do not rely on robots.txt for access control. Protect sensitive routes with strong authentication and rate limiting.',
        });
      } else {
        checks.push({
          id: 'info-robots-check',
          name: 'Robots.txt Analysis',
          category: 'serverInfo',
          status: 'passed',
          title: 'Robots.txt Cleanly Configured',
          detail: 'Robots.txt is present without leaking obvious admin paths.',
          scoreImpact: 0,
        });
      }
    } else {
      checks.push({
        id: 'info-robots-check',
        name: 'Robots.txt Analysis',
        category: 'serverInfo',
        status: 'info',
        title: 'Robots.txt Not Present',
        detail: 'No robots.txt file was found.',
        scoreImpact: 0,
      });
    }
  } catch {
    // Ignore fetch error
  }

  return {
    checks,
    findings,
    score: Math.max(0, score),
    serverHeader,
    poweredByHeader: poweredBy,
    hasSecurityTxt,
    hasRobotsTxt,
  };
}
