import { FIX_SNIPPETS } from './recommendations';
import { ScanCheckResult, SecurityFinding } from './types';

export interface HeaderAnalysisResult {
  checks: ScanCheckResult[];
  findings: SecurityFinding[];
  score: number; // 0 - 100
  rawHeaders: Record<string, string>;
}

export function analyzeHeaders(headers: Headers | Record<string, string>): HeaderAnalysisResult {
  const normHeaders: Record<string, string> = {};
  
  if (headers instanceof Headers) {
    headers.forEach((val, key) => {
      normHeaders[key.toLowerCase()] = val;
    });
  } else {
    for (const [k, v] of Object.entries(headers)) {
      normHeaders[k.toLowerCase()] = v;
    }
  }

  const checks: ScanCheckResult[] = [];
  const findings: SecurityFinding[] = [];
  let headerPoints = 100;

  // 1. Content-Security-Policy (CSP)
  const csp = normHeaders['content-security-policy'];
  if (!csp) {
    headerPoints -= 25;
    checks.push({
      id: 'csp-check',
      name: 'Content-Security-Policy',
      category: 'headers',
      status: 'failed',
      title: 'Missing Content-Security-Policy (CSP)',
      detail: 'No Content-Security-Policy header was observed in the server response.',
      scoreImpact: -25,
    });
    findings.push({
      id: 'finding-missing-csp',
      category: 'headers',
      severity: 'High',
      title: 'Missing Content-Security-Policy Header',
      description: 'The server did not send a Content-Security-Policy (CSP) response header.',
      whyItMatters: 'A CSP provides defense-in-depth against Cross-Site Scripting (XSS), data injection, and malicious script execution by strictly whitelisting where scripts, styles, and frames can load from.',
      evidence: 'Header "Content-Security-Policy" is absent in HTTP response.',
      recommendation: 'Deploy a Content-Security-Policy that whitelists trusted domains and restricts unsafe inline scripts.',
      technicalDetails: 'Standard baseline: Content-Security-Policy: default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; frame-ancestors \'none\';',
      cwe: 'CWE-1021 / CWE-79',
      referenceUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP',
      fixSnippets: FIX_SNIPPETS.csp,
    });
  } else {
    const isWeakCsp = csp.includes("'unsafe-inline'") || csp.includes("'unsafe-eval'") || csp.includes('*');
    if (isWeakCsp) {
      headerPoints -= 10;
      checks.push({
        id: 'csp-check',
        name: 'Content-Security-Policy',
        category: 'headers',
        status: 'warning',
        title: 'CSP Contains Permissive Directives',
        detail: 'CSP is present, but contains potentially permissive keywords such as unsafe-inline, unsafe-eval, or wildcards (*).',
        scoreImpact: -10,
      });
      findings.push({
        id: 'finding-weak-csp',
        category: 'headers',
        severity: 'Medium',
        title: 'Permissive Directives Detected in CSP',
        description: 'Your Content-Security-Policy includes keywords like \'unsafe-inline\', \'unsafe-eval\', or wildcards (*).',
        whyItMatters: 'Allowing unsafe-inline or unsafe-eval can undermine XSS mitigations by allowing untrusted scripts injected into DOM to execute.',
        evidence: `Content-Security-Policy: ${csp.length > 120 ? csp.substring(0, 120) + '...' : csp}`,
        recommendation: 'Replace unsafe-inline with cryptographic nonces (nonce-...) or SHA-256 hashes for approved scripts.',
        cwe: 'CWE-79',
        referenceUrl: 'https://content-security-policy.com/',
        fixSnippets: FIX_SNIPPETS.csp,
      });
    } else {
      checks.push({
        id: 'csp-check',
        name: 'Content-Security-Policy',
        category: 'headers',
        status: 'passed',
        title: 'Strong Content-Security-Policy Configured',
        detail: 'CSP header is properly set without risky wildcards.',
        scoreImpact: 0,
      });
    }
  }

  // 2. Strict-Transport-Security (HSTS)
  const hsts = normHeaders['strict-transport-security'];
  if (!hsts) {
    headerPoints -= 25;
    checks.push({
      id: 'hsts-check',
      name: 'Strict-Transport-Security',
      category: 'headers',
      status: 'failed',
      title: 'Missing HSTS Header',
      detail: 'No Strict-Transport-Security header detected.',
      scoreImpact: -25,
    });
    findings.push({
      id: 'finding-missing-hsts',
      category: 'headers',
      severity: 'High',
      title: 'Missing HTTP Strict Transport Security (HSTS)',
      description: 'The server does not enforce HTTPS connections via HSTS.',
      whyItMatters: 'Without HSTS, visitors could be downgraded to insecure plain HTTP via SSL stripping attacks or accidental unencrypted links.',
      evidence: 'Header "Strict-Transport-Security" is absent.',
      recommendation: 'Enable Strict-Transport-Security with a max-age of at least 31536000 seconds (1 year) and includeSubDomains.',
      cwe: 'CWE-319',
      referenceUrl: 'https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html',
      fixSnippets: FIX_SNIPPETS.hsts,
    });
  } else {
    const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
    const hasSubDomains = /includeSubDomains/i.test(hsts);

    if (maxAge < 10368000) {
      headerPoints -= 8;
      checks.push({
        id: 'hsts-check',
        name: 'Strict-Transport-Security',
        category: 'headers',
        status: 'warning',
        title: 'HSTS Max-Age Too Short',
        detail: `HSTS is present, but max-age (${maxAge}s) is shorter than recommended (minimum 10368000s / 120 days).`,
        scoreImpact: -8,
      });
      findings.push({
        id: 'finding-short-hsts',
        category: 'headers',
        severity: 'Low',
        title: 'HSTS Max-Age Below Recommended Threshold',
        description: `Current max-age is set to ${maxAge} seconds.`,
        whyItMatters: 'Short HSTS policies leave user browsers unprotected if they do not revisit the site within that window.',
        evidence: `Strict-Transport-Security: ${hsts}`,
        recommendation: 'Increase max-age to 31536000 (1 year) and consider submitting to the HSTS Preload list.',
        fixSnippets: FIX_SNIPPETS.hsts,
      });
    } else {
      checks.push({
        id: 'hsts-check',
        name: 'Strict-Transport-Security',
        category: 'headers',
        status: 'passed',
        title: 'HSTS Properly Enforced',
        detail: `HSTS active with max-age=${maxAge}${hasSubDomains ? ' and includeSubDomains' : ''}.`,
        scoreImpact: 0,
      });
    }
  }

  // 3. X-Content-Type-Options
  const xContentType = normHeaders['x-content-type-options'];
  if (!xContentType || !xContentType.toLowerCase().includes('nosniff')) {
    headerPoints -= 15;
    checks.push({
      id: 'x-content-type-check',
      name: 'X-Content-Type-Options',
      category: 'headers',
      status: 'failed',
      title: 'Missing X-Content-Type-Options',
      detail: 'The header is either missing or not set to "nosniff".',
      scoreImpact: -15,
    });
    findings.push({
      id: 'finding-missing-nosniff',
      category: 'headers',
      severity: 'Medium',
      title: 'Missing X-Content-Type-Options: nosniff',
      description: 'Browsers may attempt MIME-type sniffing on files served without nosniff.',
      whyItMatters: 'MIME-sniffing can cause user-uploaded images or text files containing JavaScript to be executed as active HTML/JS in browser contexts.',
      evidence: `X-Content-Type-Options: ${xContentType || 'Not present'}`,
      recommendation: 'Configure your web server or reverse proxy to send "X-Content-Type-Options: nosniff" on all responses.',
      cwe: 'CWE-434 / CWE-79',
      referenceUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options',
      fixSnippets: FIX_SNIPPETS.xContentTypeOptions,
    });
  } else {
    checks.push({
      id: 'x-content-type-check',
      name: 'X-Content-Type-Options',
      category: 'headers',
      status: 'passed',
      title: 'MIME Sniffing Protection Enabled',
      detail: 'X-Content-Type-Options is properly set to nosniff.',
      scoreImpact: 0,
    });
  }

  // 4. X-Frame-Options
  const xFrame = normHeaders['x-frame-options'];
  const hasCspFrameAncestors = csp && csp.includes('frame-ancestors');
  if (!xFrame && !hasCspFrameAncestors) {
    headerPoints -= 15;
    checks.push({
      id: 'x-frame-check',
      name: 'X-Frame-Options / Clickjacking',
      category: 'headers',
      status: 'failed',
      title: 'Missing Clickjacking Protection',
      detail: 'Neither X-Frame-Options nor CSP frame-ancestors is present.',
      scoreImpact: -15,
    });
    findings.push({
      id: 'finding-missing-frame-options',
      category: 'headers',
      severity: 'Medium',
      title: 'Missing Clickjacking Mitigation (X-Frame-Options)',
      description: 'This website does not restrict whether it can be embedded within an <iframe> or <frame> on third-party sites.',
      whyItMatters: 'An attacker can frame your site transparently and trick users into clicking buttons or submitting transactions unwittingly (Clickjacking / UI Redressing).',
      evidence: 'No X-Frame-Options or CSP frame-ancestors directive detected.',
      recommendation: 'Set X-Frame-Options to DENY or SAMEORIGIN, or add frame-ancestors \'none\' to your CSP.',
      cwe: 'CWE-1021',
      referenceUrl: 'https://owasp.org/www-community/attacks/Clickjacking',
      fixSnippets: FIX_SNIPPETS.xFrameOptions,
    });
  } else {
    checks.push({
      id: 'x-frame-check',
      name: 'X-Frame-Options / Clickjacking',
      category: 'headers',
      status: 'passed',
      title: 'Clickjacking Protection Configured',
      detail: xFrame ? `X-Frame-Options set to ${xFrame}.` : 'Protected via CSP frame-ancestors.',
      scoreImpact: 0,
    });
  }

  // 5. Referrer-Policy
  const refPolicy = normHeaders['referrer-policy'];
  if (!refPolicy) {
    headerPoints -= 10;
    checks.push({
      id: 'referrer-policy-check',
      name: 'Referrer-Policy',
      category: 'headers',
      status: 'warning',
      title: 'Missing Referrer-Policy',
      detail: 'No explicit Referrer-Policy was found in the response.',
      scoreImpact: -10,
    });
    findings.push({
      id: 'finding-missing-referrer-policy',
      category: 'headers',
      severity: 'Low',
      title: 'Missing Referrer-Policy Header',
      description: 'Without this header, browsers use default referrer behavior which may leak query parameters or paths to external sites.',
      whyItMatters: 'Sensitive query strings (e.g. reset tokens, search terms, user IDs) could be exposed to third-party domains via the HTTP Referer header.',
      evidence: 'Referrer-Policy header is absent.',
      recommendation: 'Configure "Referrer-Policy: strict-origin-when-cross-origin" or "no-referrer".',
      cwe: 'CWE-200',
      fixSnippets: FIX_SNIPPETS.referrerPolicy,
    });
  } else {
    checks.push({
      id: 'referrer-policy-check',
      name: 'Referrer-Policy',
      category: 'headers',
      status: 'passed',
      title: 'Referrer-Policy Configured',
      detail: `Referrer-Policy is explicitly set to "${refPolicy}".`,
      scoreImpact: 0,
    });
  }

  // 6. Permissions-Policy
  const permissionsPolicy = normHeaders['permissions-policy'] || normHeaders['feature-policy'];
  if (!permissionsPolicy) {
    headerPoints -= 10;
    checks.push({
      id: 'permissions-policy-check',
      name: 'Permissions-Policy',
      category: 'headers',
      status: 'info',
      title: 'No Permissions-Policy Header',
      detail: 'Permissions-Policy is not specified to restrict browser hardware/API access.',
      scoreImpact: -10,
    });
    findings.push({
      id: 'finding-missing-permissions-policy',
      category: 'headers',
      severity: 'Informational',
      title: 'Permissions-Policy Not Explicitly Defined',
      description: 'Permissions-Policy allows developers to selectively restrict browser features (camera, microphone, geolocation, payment).',
      whyItMatters: 'Restricting unnecessary browser APIs prevents embedded iframes or scripts from accessing sensitive user hardware.',
      evidence: 'Permissions-Policy header is not present.',
      recommendation: 'Set a Permissions-Policy header disabling unused features, e.g. camera=(), microphone=(), geolocation=().',
      cwe: 'CWE-272',
      fixSnippets: FIX_SNIPPETS.permissionsPolicy,
    });
  } else {
    checks.push({
      id: 'permissions-policy-check',
      name: 'Permissions-Policy',
      category: 'headers',
      status: 'passed',
      title: 'Permissions-Policy Active',
      detail: 'Permissions-Policy is defined and limiting browser feature delegation.',
      scoreImpact: 0,
    });
  }

  return {
    checks,
    findings,
    score: Math.max(0, headerPoints),
    rawHeaders: normHeaders,
  };
}
