import { ScanCheckResult, SecurityFinding } from './types';

export interface HttpsAnalysisResult {
  checks: ScanCheckResult[];
  findings: SecurityFinding[];
  score: number;
  httpRedirectsToHttps: boolean;
  mixedContentFound: boolean;
  mixedContentCount: number;
  statusCode?: number;
  finalUrl?: string;
}

export async function checkHttpsAndRedirects(hostname: string): Promise<HttpsAnalysisResult> {
  const checks: ScanCheckResult[] = [];
  const findings: SecurityFinding[] = [];
  let score = 100;
  let httpRedirectsToHttps = false;
  let mixedContentFound = false;
  let mixedContentCount = 0;
  let statusCode = 200;
  let finalUrl = `https://${hostname}/`;

  // 1. Check HTTP to HTTPS redirect behavior
  try {
    const httpController = new AbortController();
    const httpTimeout = setTimeout(() => httpController.abort(), 5000);

    const httpResponse = await fetch(`http://${hostname}/`, {
      method: 'GET',
      redirect: 'manual', // Do not automatically follow redirect so we inspect 301/302
      headers: {
        'User-Agent': 'SentinelX-Security-Bot/1.0 (+https://sentinelx.security/bot; passive-assessment)',
      },
      signal: httpController.signal,
    });
    clearTimeout(httpTimeout);

    const status = httpResponse.status;
    const location = httpResponse.headers.get('location') || '';

    if (status >= 300 && status < 400 && location.startsWith('https://')) {
      httpRedirectsToHttps = true;
      checks.push({
        id: 'https-redirect-check',
        name: 'HTTP to HTTPS Redirection',
        category: 'httpsTls',
        status: 'passed',
        title: 'HTTP Automatically Upgrades to HTTPS',
        detail: `Plain HTTP requests return HTTP ${status} redirecting securely to ${location}.`,
        scoreImpact: 0,
      });
    } else if (status >= 300 && status < 400 && !location.startsWith('https://')) {
      score -= 20;
      checks.push({
        id: 'https-redirect-check',
        name: 'HTTP to HTTPS Redirection',
        category: 'httpsTls',
        status: 'warning',
        title: 'Insecure Redirection Target',
        detail: `HTTP port 80 redirects to an insecure destination: ${location}.`,
        scoreImpact: -20,
      });
      findings.push({
        id: 'https-insecure-redirect',
        category: 'httpsTls',
        severity: 'Medium',
        title: 'HTTP Redirects to Insecure Location',
        description: `Port 80 redirect targets an unencrypted URL (${location}) instead of https://.`,
        whyItMatters: 'Users entering your domain without typing "https://" could stay unencrypted or experience man-in-the-middle tampering.',
        evidence: `HTTP ${status} -> Location: ${location}`,
        recommendation: 'Configure your web server to immediately redirect all HTTP port 80 traffic to https://${hostname}$request_uri using a 301 Permanent Redirect.',
      });
    } else if (status === 200) {
      score -= 35;
      checks.push({
        id: 'https-redirect-check',
        name: 'HTTP to HTTPS Redirection',
        category: 'httpsTls',
        status: 'failed',
        title: 'Plain HTTP is Served Without Redirect',
        detail: 'Plain HTTP requests return status 200 OK without redirecting to HTTPS.',
        scoreImpact: -35,
      });
      findings.push({
        id: 'https-missing-redirect',
        category: 'httpsTls',
        severity: 'High',
        title: 'Plain HTTP is Allowed Without Redirect',
        description: 'Your website serves content over unencrypted HTTP (port 80) without redirecting users to HTTPS.',
        whyItMatters: 'Anyone on the same local network or Wi-Fi can intercept session tokens, credentials, and browse data in cleartext.',
        evidence: 'HTTP 200 OK returned on port 80.',
        recommendation: 'Configure a 301 Permanent Redirect from HTTP to HTTPS across all domains.',
      });
    }
  } catch (err) {
    // If port 80 is closed/refused, it might be that the server only listens on 443 (which is safe)
    checks.push({
      id: 'https-redirect-check',
      name: 'HTTP Port 80 Behavior',
      category: 'httpsTls',
      status: 'info',
      title: 'HTTP Port 80 Closed or Filtered',
      detail: 'Direct port 80 access did not respond; server may be configured for pure HTTPS.',
      scoreImpact: 0,
    });
  }

  // 2. Inspect HTTPS response and check for mixed content
  try {
    const httpsController = new AbortController();
    const httpsTimeout = setTimeout(() => httpsController.abort(), 6000);

    const httpsRes = await fetch(`https://${hostname}/`, {
      method: 'GET',
      headers: {
        'User-Agent': 'SentinelX-Security-Bot/1.0 (+https://sentinelx.security/bot; passive-assessment)',
      },
      signal: httpsController.signal,
    });
    clearTimeout(httpsTimeout);

    statusCode = httpsRes.status;
    finalUrl = httpsRes.url;

    // Read initial 128KB of HTML to scan for mixed content
    const htmlText = await httpsRes.text();
    const sample = htmlText.substring(0, 131072);

    // Look for active mixed content: <script src="http://", <iframe src="http://", <link rel="stylesheet" href="http://"
    const activeMixedMatches = sample.match(/<(script|iframe|link)[^>]+(src|href)=["']http:\/\/[^"']+/gi) || [];
    // Passive mixed content: <img src="http://", <audio src="http://"
    const passiveMixedMatches = sample.match(/<(img|audio|video)[^>]+src=["']http:\/\/[^"']+/gi) || [];

    mixedContentCount = activeMixedMatches.length + passiveMixedMatches.length;

    if (activeMixedMatches.length > 0) {
      mixedContentFound = true;
      score -= 30;
      checks.push({
        id: 'mixed-content-check',
        name: 'Mixed Content Protection',
        category: 'clientSecurity',
        status: 'failed',
        title: 'Active Mixed Content Detected',
        detail: `Found ${activeMixedMatches.length} insecure script/iframe/stylesheet reference(s) loaded over unencrypted http://.`,
        scoreImpact: -30,
      });
      findings.push({
        id: 'finding-active-mixed-content',
        category: 'clientSecurity',
        severity: 'High',
        title: 'Active Mixed Content (HTTP Resources on HTTPS Page)',
        description: 'Your secure HTTPS page loads executable scripts or styles over unencrypted HTTP.',
        whyItMatters: 'Browsers block active mixed content, which breaks page functionality. If not blocked, a network attacker could inject malicious scripts into the unencrypted resource.',
        evidence: `Sample insecure reference: ${activeMixedMatches[0]}`,
        recommendation: 'Update all resource URLs to use https:// or relative paths, and add "upgrade-insecure-requests" to your CSP.',
        cwe: 'CWE-311',
      });
    } else if (passiveMixedMatches.length > 0) {
      mixedContentFound = true;
      score -= 10;
      checks.push({
        id: 'mixed-content-check',
        name: 'Mixed Content Protection',
        category: 'clientSecurity',
        status: 'warning',
        title: 'Passive Mixed Content Detected',
        detail: `Found ${passiveMixedMatches.length} insecure image/media reference(s) over http://.`,
        scoreImpact: -10,
      });
      findings.push({
        id: 'finding-passive-mixed-content',
        category: 'clientSecurity',
        severity: 'Low',
        title: 'Passive Mixed Content (Images/Media)',
        description: 'Images or media assets are linked over insecure HTTP instead of HTTPS.',
        whyItMatters: 'Attackers can intercept or swap images on the fly, degrading page integrity and triggering mixed-content browser warnings.',
        evidence: `Sample resource: ${passiveMixedMatches[0]}`,
        recommendation: 'Change all image sources from http:// to https://.',
      });
    } else {
      checks.push({
        id: 'mixed-content-check',
        name: 'Mixed Content Protection',
        category: 'clientSecurity',
        status: 'passed',
        title: 'No Mixed Content Detected',
        detail: 'Sampled HTML does not contain insecure http:// asset references.',
        scoreImpact: 0,
      });
    }
  } catch (err) {
    // HTTPS connection failure
    score -= 40;
    checks.push({
      id: 'https-fetch-error',
      name: 'HTTPS Connection',
      category: 'httpsTls',
      status: 'failed',
      title: 'HTTPS Endpoint Unreachable',
      detail: err instanceof Error ? err.message : 'Failed to retrieve HTTPS web page',
      scoreImpact: -40,
    });
  }

  return {
    checks,
    findings,
    score: Math.max(0, score),
    httpRedirectsToHttps,
    mixedContentFound,
    mixedContentCount,
    statusCode,
    finalUrl,
  };
}
