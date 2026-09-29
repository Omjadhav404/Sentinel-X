import { FIX_SNIPPETS } from './recommendations';
import { ScanCheckResult, SecurityFinding } from './types';

export interface CookieAnalysisResult {
  checks: ScanCheckResult[];
  findings: SecurityFinding[];
  score: number;
  totalCookies: number;
  insecureCookies: number;
}

export interface ParsedCookie {
  name: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None' | 'Missing';
  raw: string;
}

export function parseSetCookieHeader(cookieString: string): ParsedCookie {
  const parts = cookieString.split(';').map(p => p.trim());
  const nameValue = parts[0].split('=');
  const name = nameValue[0] || 'unknown';

  let secure = false;
  let httpOnly = false;
  let sameSite: 'Strict' | 'Lax' | 'None' | 'Missing' = 'Missing';

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const lower = part.toLowerCase();
    if (lower === 'secure') {
      secure = true;
    } else if (lower === 'httponly') {
      httpOnly = true;
    } else if (lower.startsWith('samesite=')) {
      const val = part.split('=')[1]?.toLowerCase();
      if (val === 'strict') sameSite = 'Strict';
      else if (val === 'lax') sameSite = 'Lax';
      else if (val === 'none') sameSite = 'None';
    }
  }

  return { name, secure, httpOnly, sameSite, raw: cookieString };
}

export function analyzeCookies(rawSetCookieHeaders: string[] | string | null): CookieAnalysisResult {
  const checks: ScanCheckResult[] = [];
  const findings: SecurityFinding[] = [];
  let score = 100;

  if (!rawSetCookieHeaders) {
    checks.push({
      id: 'cookie-analysis-none',
      name: 'Cookie Security Flags',
      category: 'cookies',
      status: 'passed',
      title: 'No Public Cookies Set on Landing',
      detail: 'The landing page does not issue any cookies on initial unauthenticated request, reducing initial tracking surface.',
      scoreImpact: 0,
    });
    return {
      checks,
      findings,
      score: 100,
      totalCookies: 0,
      insecureCookies: 0,
    };
  }

  const cookieList = Array.isArray(rawSetCookieHeaders)
    ? rawSetCookieHeaders
    : [rawSetCookieHeaders];

  const parsedCookies = cookieList.map(parseSetCookieHeader);
  let missingSecure = 0;
  let missingHttpOnly = 0;
  let missingSameSite = 0;

  for (const cookie of parsedCookies) {
    if (!cookie.secure) missingSecure++;
    if (!cookie.httpOnly) missingHttpOnly++;
    if (cookie.sameSite === 'Missing') missingSameSite++;
  }

  const total = parsedCookies.length;
  let insecureCount = 0;

  // 1. Secure Flag Check
  if (missingSecure > 0) {
    insecureCount += missingSecure;
    score -= 30;
    checks.push({
      id: 'cookie-secure-flag',
      name: 'Cookie "Secure" Flag',
      category: 'cookies',
      status: 'failed',
      title: `${missingSecure} Cookie(s) Missing "Secure" Flag`,
      detail: `Detected ${missingSecure} of ${total} cookies without the Secure attribute.`,
      scoreImpact: -30,
    });
    findings.push({
      id: 'cookie-missing-secure',
      category: 'cookies',
      severity: 'High',
      title: 'Cookies Missing "Secure" Attribute',
      description: `${missingSecure} cookie(s) were issued without the "Secure" flag set.`,
      whyItMatters: 'Without the Secure flag, browsers will transmit this cookie in unencrypted HTTP requests if the user clicks an http link, exposing session tokens to Wi-Fi eavesdropping.',
      evidence: `Insecure cookies: ${parsedCookies.filter(c => !c.secure).map(c => c.name).join(', ')}`,
      recommendation: 'Ensure all cookies have the "Secure" flag added to the Set-Cookie response header.',
      cwe: 'CWE-614',
      referenceUrl: 'https://owasp.org/www-community/controls/SecureCookieAttribute',
      fixSnippets: FIX_SNIPPETS.cookies,
    });
  } else {
    checks.push({
      id: 'cookie-secure-flag',
      name: 'Cookie "Secure" Flag',
      category: 'cookies',
      status: 'passed',
      title: 'All Cookies Enforce "Secure"',
      detail: `All ${total} public cookie(s) have the Secure attribute configured.`,
      scoreImpact: 0,
    });
  }

  // 2. HttpOnly Flag Check
  if (missingHttpOnly > 0) {
    score -= 15;
    checks.push({
      id: 'cookie-httponly-flag',
      name: 'Cookie "HttpOnly" Flag',
      category: 'cookies',
      status: 'warning',
      title: `${missingHttpOnly} Cookie(s) Without "HttpOnly"`,
      detail: `Detected ${missingHttpOnly} of ${total} cookies accessible by client-side JavaScript.`,
      scoreImpact: -15,
    });
    findings.push({
      id: 'cookie-missing-httponly',
      category: 'cookies',
      severity: 'Medium',
      title: 'Cookies Missing "HttpOnly" Flag',
      description: `Cookies (${parsedCookies.filter(c => !c.httpOnly).map(c => c.name).join(', ')}) do not specify HttpOnly.`,
      whyItMatters: 'If your site suffers from an XSS vulnerability, JavaScript can read document.cookie and exfiltrate user session identifiers to an attacker server.',
      evidence: `Accessible cookies: ${parsedCookies.filter(c => !c.httpOnly).map(c => c.name).join(', ')}`,
      recommendation: 'Add the HttpOnly attribute to all sensitive session and authentication cookies.',
      cwe: 'CWE-1004',
      fixSnippets: FIX_SNIPPETS.cookies,
    });
  } else {
    checks.push({
      id: 'cookie-httponly-flag',
      name: 'Cookie "HttpOnly" Flag',
      category: 'cookies',
      status: 'passed',
      title: 'HttpOnly Flag Active',
      detail: 'Cookies cannot be accessed directly via document.cookie.',
      scoreImpact: 0,
    });
  }

  // 3. SameSite Flag Check
  if (missingSameSite > 0) {
    score -= 15;
    checks.push({
      id: 'cookie-samesite-flag',
      name: 'Cookie "SameSite" Attribute',
      category: 'cookies',
      status: 'warning',
      title: `${missingSameSite} Cookie(s) Missing "SameSite"`,
      detail: 'Cookies do not specify SameSite=Lax or SameSite=Strict for CSRF protection.',
      scoreImpact: -15,
    });
    findings.push({
      id: 'cookie-missing-samesite',
      category: 'cookies',
      severity: 'Medium',
      title: 'Cookies Missing "SameSite" Attribute',
      description: 'Cookies were set without an explicit SameSite value.',
      whyItMatters: 'Without SameSite=Lax or Strict, requests originating from external websites can transmit cookies, making the site vulnerable to Cross-Site Request Forgery (CSRF).',
      evidence: `Cookies: ${parsedCookies.filter(c => c.sameSite === 'Missing').map(c => c.name).join(', ')}`,
      recommendation: 'Set SameSite=Lax (default for modern flows) or SameSite=Strict on session cookies.',
      cwe: 'CWE-352',
      fixSnippets: FIX_SNIPPETS.cookies,
    });
  } else {
    checks.push({
      id: 'cookie-samesite-flag',
      name: 'Cookie "SameSite" Attribute',
      category: 'cookies',
      status: 'passed',
      title: 'SameSite Attribute Enforced',
      detail: 'All cookies have explicit SameSite attributes configured.',
      scoreImpact: 0,
    });
  }

  return {
    checks,
    findings,
    score: Math.max(0, score),
    totalCookies: total,
    insecureCookies: insecureCount,
  };
}
