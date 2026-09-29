import { analyzeCookies } from './cookies';
import { analyzeDnsSecurity } from './dns';
import { analyzeHeaders } from './headers';
import { checkHttpsAndRedirects } from './https';
import { analyzeInformationDisclosure } from './information';
import { computeSecurityScore } from './scoring';
import { inspectTlsCertificate } from './tls';
import { ScanCheckResult, ScanResult, SecurityFinding } from './types';

export interface SecurityScannerProvider {
  name: string;
  isAvailable(): boolean;
  scan(target: { url: string; hostname: string; ip?: string; isDemo?: boolean }): Promise<ScanResult>;
}

/**
 * Native, local passive scanner executing safe, non-destructive network checks.
 */
export class LocalPassiveScannerProvider implements SecurityScannerProvider {
  name = 'SentinelX Local Passive Scanner';

  isAvailable(): boolean {
    return true;
  }

  async scan(target: { url: string; hostname: string; ip?: string; isDemo?: boolean }): Promise<ScanResult> {
    const startTime = Date.now();
    const { hostname, url } = target;
    const scanId = `scan_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

    // If demo target
    if (target.isDemo || hostname.includes('demo') || hostname.includes('.local')) {
      return new MockDemoScannerProvider().scan(target);
    }

    // 1. Fetch TLS certificate details
    const tlsPromise = inspectTlsCertificate(hostname, 443, 6000);

    // 2. Fetch HTTP/HTTPS redirects and HTML sample
    const httpsPromise = checkHttpsAndRedirects(hostname);

    // 3. Fetch DNS posture (CAA, SPF, DMARC, AAAA)
    const dnsPromise = analyzeDnsSecurity(hostname);

    // 4. Fetch HTTP response headers from root
    const headersFetchPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`https://${hostname}/`, {
          method: 'GET',
          headers: {
            'User-Agent': 'SentinelX-Security-Bot/1.0 (+https://sentinelx.security/bot; passive-assessment)',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const setCookieHeaders = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie') || ''];
        return {
          headers: res.headers,
          setCookies: setCookieHeaders.filter(Boolean),
          statusCode: res.status,
        };
      } catch {
        return {
          headers: new Headers(),
          setCookies: [],
          statusCode: 0,
        };
      }
    })();

    // Await parallel checks
    const [tlsResult, httpsResult, dnsResult, httpData] = await Promise.all([
      tlsPromise,
      httpsPromise,
      dnsPromise,
      headersFetchPromise,
    ]);

    // 5. Analyze headers
    const headerResult = analyzeHeaders(httpData.headers);

    // 6. Analyze cookies
    const cookieResult = analyzeCookies(httpData.setCookies);

    // 7. Analyze server information disclosure
    const infoResult = await analyzeInformationDisclosure(hostname, headerResult.rawHeaders);

    // Aggregate findings & checks
    const allChecks: ScanCheckResult[] = [
      ...tlsResult.checks,
      ...httpsResult.checks,
      ...headerResult.checks,
      ...cookieResult.checks,
      ...infoResult.checks,
      ...dnsResult.checks,
    ];

    const allFindings: SecurityFinding[] = [
      ...tlsResult.findings,
      ...httpsResult.findings,
      ...headerResult.findings,
      ...cookieResult.findings,
      ...infoResult.findings,
      ...dnsResult.findings,
    ];

    // Compute composite score and risk level
    const scoring = computeSecurityScore({
      httpsTlsScore: Math.round((tlsResult.score + httpsResult.score) / 2),
      headersScore: headerResult.score,
      cookiesScore: cookieResult.score,
      serverInfoScore: infoResult.score,
      dnsScore: dnsResult.score,
      findings: allFindings,
    });

    const passedCount = allChecks.filter(c => c.status === 'passed').length;
    const warningCount = allChecks.filter(c => c.status === 'warning').length;
    const highCount = allFindings.filter(f => f.severity === 'High').length;
    const criticalCount = allFindings.filter(f => f.severity === 'Critical').length;
    const infoCount = allFindings.filter(f => f.severity === 'Informational').length;

    const durationMs = Date.now() - startTime;

    return {
      id: scanId,
      targetUrl: url,
      normalizedUrl: `https://${hostname}/`,
      hostname,
      ipAddress: target.ip,
      scanDate: new Date().toISOString(),
      durationMs,
      score: scoring.overallScore,
      grade: scoring.grade,
      riskLevel: scoring.riskLevel,
      summary: scoring.summary,
      categoryScores: scoring.categoryScores,
      metrics: {
        passedCount,
        warningCount,
        highCount,
        criticalCount,
        infoCount,
        totalChecks: allChecks.length,
      },
      checks: allChecks,
      findings: allFindings,
      tlsDetails: tlsResult.tlsDetails,
      serverDetails: {
        serverHeader: infoResult.serverHeader,
        poweredBy: infoResult.poweredByHeader,
        hasSecurityTxt: infoResult.hasSecurityTxt,
        hasRobotsTxt: infoResult.hasRobotsTxt,
        statusCode: httpData.statusCode || httpsResult.statusCode,
      },
      dnsDetails: {
        hasIpv6: dnsResult.hasIpv6,
        hasMx: dnsResult.hasMx,
        hasSpf: dnsResult.hasSpf,
        hasDmarc: dnsResult.hasDmarc,
        hasCaa: dnsResult.hasCaa,
      },
      isDemo: false,
    };
  }
}

/**
 * Mock Demo Scanner Provider for instant, reliable client testing and demonstrations
 * without external network variability.
 */
export class MockDemoScannerProvider implements SecurityScannerProvider {
  name = 'SentinelX Demo Simulation Provider';

  isAvailable(): boolean {
    return true;
  }

  async scan(target: { url: string; hostname: string; ip?: string }): Promise<ScanResult> {
    const isVulnerable = target.hostname.includes('vulnerable') || target.hostname.includes('risk') || target.url.includes('bad');
    const isMedium = target.hostname.includes('medium') || target.hostname.includes('average');
    const scanId = `demo_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    // Simulate realistic processing delay
    await new Promise(r => setTimeout(r, 900));

    if (isVulnerable) {
      return {
        id: scanId,
        targetUrl: target.url,
        normalizedUrl: `https://${target.hostname}/`,
        hostname: target.hostname,
        ipAddress: '198.51.100.99',
        scanDate: new Date().toISOString(),
        durationMs: 1420,
        score: 34,
        grade: 'F',
        riskLevel: 'Critical',
        summary: 'CRITICAL ATTENTION REQUIRED: Target scored 34/100 (Grade F). Missing Content-Security-Policy, unencrypted cookie flags, server banner disclosure, and short-lived TLS certificate.',
        categoryScores: {
          httpsTls: { name: 'HTTPS & SSL/TLS', score: 45, maxScore: 100, percentage: 45, status: 'critical' },
          headers: { name: 'HTTP Security Headers', score: 20, maxScore: 100, percentage: 20, status: 'critical' },
          cookies: { name: 'Cookie Security', score: 30, maxScore: 100, percentage: 30, status: 'critical' },
          serverInfo: { name: 'Information Disclosure', score: 40, maxScore: 100, percentage: 40, status: 'critical' },
          dnsDomain: { name: 'DNS Hardening', score: 40, maxScore: 100, percentage: 40, status: 'critical' },
          clientSecurity: { name: 'Client-Side Security', score: 50, maxScore: 100, percentage: 50, status: 'warning' },
        },
        metrics: {
          passedCount: 4,
          warningCount: 5,
          highCount: 3,
          criticalCount: 2,
          infoCount: 2,
          totalChecks: 14,
        },
        checks: [
          { id: '1', name: 'HTTPS Support', category: 'httpsTls', status: 'passed', title: 'HTTPS is active', detail: 'HTTPS reachable on port 443', scoreImpact: 0 },
          { id: '2', name: 'Certificate Trust', category: 'httpsTls', status: 'failed', title: 'Self-Signed Certificate Detected', detail: 'Certificate is not signed by a recognized root CA', scoreImpact: -40 },
          { id: '3', name: 'Content-Security-Policy', category: 'headers', status: 'failed', title: 'Missing Content-Security-Policy', detail: 'No CSP header observed', scoreImpact: -25 },
          { id: '4', name: 'Strict-Transport-Security', category: 'headers', status: 'failed', title: 'Missing HSTS Header', detail: 'No HSTS header present', scoreImpact: -25 },
          { id: '5', name: 'X-Frame-Options', category: 'headers', status: 'failed', title: 'Missing Clickjacking Protection', detail: 'X-Frame-Options is absent', scoreImpact: -15 },
          { id: '6', name: 'Cookie Security', category: 'cookies', status: 'failed', title: 'Session Cookie Missing Secure & HttpOnly', detail: 'auth_token is transmitted insecurely', scoreImpact: -30 },
          { id: '7', name: 'Server Banner', category: 'serverInfo', status: 'warning', title: 'Detailed Server Banner Disclosed', detail: 'Server: Apache/2.4.29 (Ubuntu)', scoreImpact: -20 },
        ],
        findings: [
          {
            id: 'demo-finding-1',
            category: 'httpsTls',
            severity: 'Critical',
            title: 'Untrusted SSL/TLS Certificate',
            description: 'The certificate presented by this server was self-signed or from an untrusted issuer.',
            whyItMatters: 'Visitors will receive severe full-page warning interstitials in Chrome, Safari, and Firefox.',
            evidence: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
            recommendation: 'Replace with an authorized certificate from Let\'s Encrypt or DigiCert.',
            cwe: 'CWE-295',
          },
          {
            id: 'demo-finding-2',
            category: 'headers',
            severity: 'High',
            title: 'Missing Content-Security-Policy',
            description: 'No Content-Security-Policy (CSP) is defined.',
            whyItMatters: 'Leaves the application vulnerable to cross-site scripting (XSS) and client-side data exfiltration.',
            evidence: 'Header "Content-Security-Policy" not found',
            recommendation: 'Configure a restrictive CSP specifying trusted sources for script-src and object-src.',
            cwe: 'CWE-79',
          },
          {
            id: 'demo-finding-3',
            category: 'cookies',
            severity: 'High',
            title: 'Session Cookies Lack Secure & HttpOnly Flags',
            description: 'Cookies with names like "session" or "token" lack protection flags.',
            whyItMatters: 'Enables credential theft via cross-site scripting or unencrypted Wi-Fi interception.',
            evidence: 'Set-Cookie: session=xyz89; Path=/',
            recommendation: 'Add "; Secure; HttpOnly; SameSite=Lax" to all session cookies.',
            cwe: 'CWE-614',
          },
          {
            id: 'demo-finding-4',
            category: 'serverInfo',
            severity: 'Medium',
            title: 'Apache Version Disclosed in Header',
            description: 'The Server response header leaks the exact Apache and OS version.',
            whyItMatters: 'Attackers can look up known exploits tailored for this exact server version.',
            evidence: 'Server: Apache/2.4.29 (Ubuntu)',
            recommendation: 'Set "ServerTokens Prod" and "ServerSignature Off" in Apache configuration.',
            cwe: 'CWE-200',
          },
        ],
        tlsDetails: {
          protocol: 'TLSv1.2',
          cipher: 'ECDHE-RSA-AES128-GCM-SHA256',
          validFrom: '2023-01-01',
          validTo: '2023-04-01',
          daysRemaining: -450,
          issuer: 'Self-Signed Root',
          subject: target.hostname,
          authorized: false,
          authError: 'SELF_SIGNED_CERT_IN_CHAIN',
        },
        serverDetails: {
          serverHeader: 'Apache/2.4.29 (Ubuntu)',
          poweredBy: 'PHP/7.4.3',
          hasSecurityTxt: false,
          hasRobotsTxt: true,
          statusCode: 200,
        },
        dnsDetails: {
          hasIpv6: false,
          hasMx: true,
          hasSpf: false,
          hasDmarc: false,
          hasCaa: false,
        },
        isDemo: true,
      };
    }

    if (isMedium) {
      return {
        id: scanId,
        targetUrl: target.url,
        normalizedUrl: `https://${target.hostname}/`,
        hostname: target.hostname,
        ipAddress: '198.51.100.80',
        scanDate: new Date().toISOString(),
        durationMs: 1200,
        score: 72,
        grade: 'B',
        riskLevel: 'Medium',
        summary: 'Target scored 72/100 (Grade B). SSL/TLS is modern and trusted, but the site lacks Content-Security-Policy and DNS CAA records.',
        categoryScores: {
          httpsTls: { name: 'HTTPS & SSL/TLS', score: 94, maxScore: 100, percentage: 94, status: 'excellent' },
          headers: { name: 'HTTP Security Headers', score: 62, maxScore: 100, percentage: 62, status: 'warning' },
          cookies: { name: 'Cookie Security', score: 85, maxScore: 100, percentage: 85, status: 'good' },
          serverInfo: { name: 'Information Disclosure', score: 75, maxScore: 100, percentage: 75, status: 'good' },
          dnsDomain: { name: 'DNS Hardening', score: 60, maxScore: 100, percentage: 60, status: 'warning' },
          clientSecurity: { name: 'Client-Side Security', score: 90, maxScore: 100, percentage: 90, status: 'excellent' },
        },
        metrics: {
          passedCount: 11,
          warningCount: 3,
          highCount: 1,
          criticalCount: 0,
          infoCount: 2,
          totalChecks: 17,
        },
        checks: [
          { id: '1', name: 'HTTPS Enforcement', category: 'httpsTls', status: 'passed', title: 'HTTPS is fully enforced', detail: 'Automatic 301 upgrade', scoreImpact: 0 },
          { id: '2', name: 'TLS 1.3 Handshake', category: 'httpsTls', status: 'passed', title: 'TLS 1.3 Active', detail: 'TLS_AES_256_GCM_SHA384', scoreImpact: 0 },
          { id: '3', name: 'Content-Security-Policy', category: 'headers', status: 'failed', title: 'Missing CSP Header', detail: 'No CSP header configured', scoreImpact: -25 },
          { id: '4', name: 'HSTS Header', category: 'headers', status: 'passed', title: 'HSTS Active', detail: 'max-age=31536000', scoreImpact: 0 },
          { id: '5', name: 'DNS CAA Record', category: 'dnsDomain', status: 'warning', title: 'Missing CAA Record', detail: 'No CAA record restricting certificate issuance', scoreImpact: -15 },
        ],
        findings: [
          {
            id: 'demo-finding-med-1',
            category: 'headers',
            severity: 'High',
            title: 'Missing Content-Security-Policy',
            description: 'The website does not send a Content-Security-Policy header.',
            whyItMatters: 'A CSP provides essential defense against XSS, clickjacking, and unauthorized third-party script loading.',
            evidence: 'Header Content-Security-Policy is absent.',
            recommendation: 'Deploy a CSP starting with report-only mode before enforcing strict rules.',
            cwe: 'CWE-79',
          },
          {
            id: 'demo-finding-med-2',
            category: 'dnsDomain',
            severity: 'Medium',
            title: 'Missing DNS CAA Record',
            description: 'The domain does not restrict Certificate Authorities using CAA records.',
            whyItMatters: 'Rogue or compromised CAs could issue unapproved certificates.',
            evidence: 'No CAA records in DNS.',
            recommendation: 'Add CAA records specifying your authorized CA provider.',
          },
        ],
        tlsDetails: {
          protocol: 'TLSv1.3',
          cipher: 'TLS_AES_256_GCM_SHA384',
          validFrom: '2024-01-01',
          validTo: '2025-01-01',
          daysRemaining: 180,
          issuer: 'Let\'s Encrypt',
          subject: target.hostname,
          authorized: true,
        },
        serverDetails: {
          serverHeader: 'cloudflare',
          hasSecurityTxt: false,
          hasRobotsTxt: true,
          statusCode: 200,
        },
        dnsDetails: {
          hasIpv6: true,
          hasMx: true,
          hasSpf: true,
          hasDmarc: false,
          hasCaa: false,
        },
        isDemo: true,
      };
    }

    // Default: High Security / Grade A posture
    return {
      id: scanId,
      targetUrl: target.url,
      normalizedUrl: `https://${target.hostname}/`,
      hostname: target.hostname,
      ipAddress: '104.21.45.12',
      scanDate: new Date().toISOString(),
      durationMs: 980,
      score: 96,
      grade: 'A+',
      riskLevel: 'Low',
      summary: 'EXCELLENT SECURITY POSTURE: Target scored 96/100 (Grade A+). Strict HSTS with preloading, robust Content-Security-Policy, secure cookies, modern TLS 1.3, and DNS CAA protection.',
      categoryScores: {
        httpsTls: { name: 'HTTPS & SSL/TLS', score: 98, maxScore: 100, percentage: 98, status: 'excellent' },
        headers: { name: 'HTTP Security Headers', score: 96, maxScore: 100, percentage: 96, status: 'excellent' },
        cookies: { name: 'Cookie Security', score: 95, maxScore: 100, percentage: 95, status: 'excellent' },
        serverInfo: { name: 'Information Disclosure', score: 95, maxScore: 100, percentage: 95, status: 'excellent' },
        dnsDomain: { name: 'DNS Hardening', score: 94, maxScore: 100, percentage: 94, status: 'excellent' },
        clientSecurity: { name: 'Client-Side Security', score: 100, maxScore: 100, percentage: 100, status: 'excellent' },
      },
      metrics: {
        passedCount: 16,
        warningCount: 1,
        highCount: 0,
        criticalCount: 0,
        infoCount: 1,
        totalChecks: 18,
      },
      checks: [
        { id: '1', name: 'HTTPS Redirection', category: 'httpsTls', status: 'passed', title: 'HTTP 301 Permanent Redirect to HTTPS', detail: 'Strict HTTPS upgrade active', scoreImpact: 0 },
        { id: '2', name: 'TLS Protocol', category: 'httpsTls', status: 'passed', title: 'TLS 1.3 Negotiated', detail: 'State of the art cryptography', scoreImpact: 0 },
        { id: '3', name: 'HSTS Preload', category: 'headers', status: 'passed', title: 'HSTS Enforced with Preload', detail: 'max-age=63072000; includeSubDomains; preload', scoreImpact: 0 },
        { id: '4', name: 'Content-Security-Policy', category: 'headers', status: 'passed', title: 'Strict CSP Active', detail: 'default-src \'self\'; frame-ancestors \'none\'', scoreImpact: 0 },
        { id: '5', name: 'X-Content-Type-Options', category: 'headers', status: 'passed', title: 'nosniff Enforced', detail: 'MIME-sniffing prevented', scoreImpact: 0 },
        { id: '6', name: 'X-Frame-Options', category: 'headers', status: 'passed', title: 'Clickjacking Protected', detail: 'X-Frame-Options: DENY', scoreImpact: 0 },
        { id: '7', name: 'DNS CAA Record', category: 'dnsDomain', status: 'passed', title: 'CAA Record Enforced', detail: 'Restricts issuance to letsencrypt.org', scoreImpact: 0 },
        { id: '8', name: 'security.txt', category: 'serverInfo', status: 'passed', title: 'RFC 9116 Policy Published', detail: 'Found at /.well-known/security.txt', scoreImpact: 0 },
      ],
      findings: [
        {
          id: 'demo-finding-opt-1',
          category: 'headers',
          severity: 'Informational',
          title: 'Permissions-Policy Recommended',
          description: 'Consider explicitly declaring a Permissions-Policy header to restrict camera and microphone delegations.',
          whyItMatters: 'Limits browser hardware API access for third-party embeds.',
          evidence: 'Permissions-Policy is currently omitted.',
          recommendation: 'Add Permissions-Policy: camera=(), microphone=(), geolocation=().',
        },
      ],
      tlsDetails: {
        protocol: 'TLSv1.3',
        cipher: 'TLS_AES_256_GCM_SHA384',
        validFrom: '2024-01-15',
        validTo: '2025-01-15',
        daysRemaining: 240,
        issuer: 'Let\'s Encrypt Authority X3',
        subject: target.hostname,
        authorized: true,
      },
      serverDetails: {
        serverHeader: 'Protected',
        hasSecurityTxt: true,
        hasRobotsTxt: true,
        statusCode: 200,
      },
      dnsDetails: {
        hasIpv6: true,
        hasMx: true,
        hasSpf: true,
        hasDmarc: true,
        hasCaa: true,
      },
      isDemo: true,
    };
  }
}

/**
 * External Scanner Provider: Ready-to-wire adapter for third-party scanning engines
 * (e.g. Mozilla Observatory, Qualys SSL Labs, or proprietary scanning microservices).
 * Configured via EXTERNAL_SCANNER_URL and EXTERNAL_SCANNER_API_KEY.
 */
export class ExternalScannerProvider implements SecurityScannerProvider {
  name = 'SentinelX External Scanner Adapter';

  isAvailable(): boolean {
    return Boolean(process.env.EXTERNAL_SCANNER_URL && process.env.EXTERNAL_SCANNER_API_KEY);
  }

  async scan(target: { url: string; hostname: string; ip?: string }): Promise<ScanResult> {
    if (!this.isAvailable()) {
      // Fallback to local passive scanner
      return new LocalPassiveScannerProvider().scan(target);
    }

    try {
      const apiUrl = process.env.EXTERNAL_SCANNER_URL!;
      const apiKey = process.env.EXTERNAL_SCANNER_API_KEY!;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          target: target.url,
          hostname: target.hostname,
        }),
      });

      if (!res.ok) {
        throw new Error(`External scanner API responded with status ${res.status}`);
      }

      const externalData = await res.json();
      return externalData as ScanResult;
    } catch (err) {
      console.warn('External scanner failed, falling back to local passive scanner:', err);
      return new LocalPassiveScannerProvider().scan(target);
    }
  }
}

/**
 * Scanner Provider Factory
 */
export function getScannerProvider(mode?: 'local' | 'external' | 'demo'): SecurityScannerProvider {
  if (mode === 'demo') {
    return new MockDemoScannerProvider();
  }

  if (mode === 'external' || (process.env.SCANNER_PROVIDER === 'external' && process.env.EXTERNAL_SCANNER_URL)) {
    return new ExternalScannerProvider();
  }

  return new LocalPassiveScannerProvider();
}
