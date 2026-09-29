import dns from 'dns/promises';
import { FIX_SNIPPETS } from './recommendations';
import { ScanCheckResult, SecurityFinding } from './types';

export interface DnsAnalysisResult {
  checks: ScanCheckResult[];
  findings: SecurityFinding[];
  score: number;
  hasIpv6: boolean;
  hasMx: boolean;
  hasSpf: boolean;
  hasDmarc: boolean;
  hasCaa: boolean;
}

export async function analyzeDnsSecurity(hostname: string): Promise<DnsAnalysisResult> {
  const checks: ScanCheckResult[] = [];
  const findings: SecurityFinding[] = [];
  let score = 100;

  let hasIpv6 = false;
  let hasMx = false;
  let hasSpf = false;
  let hasDmarc = false;
  let hasCaa = false;

  // 1. IPv6 Support (AAAA)
  try {
    const aaaa = await dns.resolve6(hostname);
    if (aaaa && aaaa.length > 0) {
      hasIpv6 = true;
      checks.push({
        id: 'dns-ipv6-check',
        name: 'IPv6 Readiness',
        category: 'dnsDomain',
        status: 'passed',
        title: 'IPv6 Enabled (AAAA Record)',
        detail: `Domain has active IPv6 addresses: ${aaaa.slice(0, 2).join(', ')}.`,
        scoreImpact: 0,
      });
    }
  } catch {
    checks.push({
      id: 'dns-ipv6-check',
      name: 'IPv6 Readiness',
      category: 'dnsDomain',
      status: 'info',
      title: 'No IPv6 (AAAA) Records Detected',
      detail: 'Site is reachable via IPv4 only.',
      scoreImpact: 0,
    });
  }

  // 2. CAA Records (Certificate Authority Authorization)
  try {
    const caa = await dns.resolveCaa(hostname);
    if (caa && caa.length > 0) {
      hasCaa = true;
      const authorities = caa.map(c => c.issue || c.issuewild).filter(Boolean).join(', ');
      checks.push({
        id: 'dns-caa-check',
        name: 'DNS CAA Record',
        category: 'dnsDomain',
        status: 'passed',
        title: 'CAA Record Enforced',
        detail: `Restricted certificate issuance to authorized CAs: ${authorities || 'Custom CAA'}.`,
        scoreImpact: 0,
      });
    } else {
      score -= 15;
      checks.push({
        id: 'dns-caa-check',
        name: 'DNS CAA Record',
        category: 'dnsDomain',
        status: 'warning',
        title: 'Missing DNS CAA Record',
        detail: 'No Certificate Authority Authorization (CAA) record found in DNS.',
        scoreImpact: -15,
      });
      findings.push({
        id: 'finding-missing-caa',
        category: 'dnsDomain',
        severity: 'Medium',
        title: 'Missing DNS CAA Record',
        description: 'The domain has not published DNS CAA records to explicitly designate which Certificate Authorities are authorized to issue certificates.',
        whyItMatters: 'Without CAA, any compromised or rogue Certificate Authority worldwide can issue an SSL certificate for your domain without your permission.',
        evidence: `No CAA records returned for ${hostname}`,
        recommendation: 'Add DNS CAA records specifying your authorized CA (e.g. letsencrypt.org, digicert.com).',
        referenceUrl: 'https://developer.mozilla.org/en-US/docs/Web/Security/Certificate_Authority_Authorization',
        fixSnippets: FIX_SNIPPETS.dnsCaa,
      });
    }
  } catch {
    score -= 15;
    checks.push({
      id: 'dns-caa-check',
      name: 'DNS CAA Record',
      category: 'dnsDomain',
      status: 'warning',
      title: 'Missing DNS CAA Record',
      detail: 'No CAA record found for this domain.',
      scoreImpact: -15,
    });
    findings.push({
      id: 'finding-missing-caa',
      category: 'dnsDomain',
      severity: 'Medium',
      title: 'Missing DNS CAA Record',
      description: 'The domain does not have CAA records configured.',
      whyItMatters: 'Without CAA, any public Certificate Authority is technically permitted to issue certificates for your domain.',
      evidence: `No CAA record returned for ${hostname}`,
      recommendation: 'Publish a CAA DNS record for your primary certificate provider.',
      fixSnippets: FIX_SNIPPETS.dnsCaa,
    });
  }

  // 3. Email Security: SPF Record in TXT
  try {
    const txtRecords = await dns.resolveTxt(hostname);
    for (const chunk of txtRecords) {
      const fullRecord = chunk.join('');
      if (fullRecord.toLowerCase().startsWith('v=spf1')) {
        hasSpf = true;
        break;
      }
    }

    if (hasSpf) {
      checks.push({
        id: 'dns-spf-check',
        name: 'SPF Record (Email Spoofing Protection)',
        category: 'dnsDomain',
        status: 'passed',
        title: 'SPF Record Configured',
        detail: 'Sender Policy Framework (SPF) record active to protect against email spoofing.',
        scoreImpact: 0,
      });
    } else {
      score -= 10;
      checks.push({
        id: 'dns-spf-check',
        name: 'SPF Record (Email Spoofing Protection)',
        category: 'dnsDomain',
        status: 'warning',
        title: 'Missing SPF Record',
        detail: 'No SPF (v=spf1) record discovered on the domain apex.',
        scoreImpact: -10,
      });
      findings.push({
        id: 'finding-missing-spf',
        category: 'dnsDomain',
        severity: 'Low',
        title: 'Missing SPF Record in DNS',
        description: 'No Sender Policy Framework (SPF) record was detected.',
        whyItMatters: 'Attackers can spoof emails appearing to originate from your domain to conduct phishing attacks against your clients.',
        evidence: `No v=spf1 TXT record found for ${hostname}`,
        recommendation: 'Configure a TXT record with v=spf1 defining authorized mail sending servers, or "v=spf1 -all" if this domain never sends email.',
      });
    }
  } catch {
    checks.push({
      id: 'dns-spf-check',
      name: 'SPF Record',
      category: 'dnsDomain',
      status: 'info',
      title: 'SPF Verification Inconclusive',
      detail: 'Could not query TXT records for SPF.',
      scoreImpact: 0,
    });
  }

  // 4. DMARC Record (_dmarc.hostname)
  try {
    const dmarcRecords = await dns.resolveTxt(`_dmarc.${hostname}`);
    for (const chunk of dmarcRecords) {
      const full = chunk.join('');
      if (full.toLowerCase().startsWith('v=dmarc1')) {
        hasDmarc = true;
        break;
      }
    }

    if (hasDmarc) {
      checks.push({
        id: 'dns-dmarc-check',
        name: 'DMARC Enforcement',
        category: 'dnsDomain',
        status: 'passed',
        title: 'DMARC Policy Active',
        detail: 'DMARC TXT record detected under _dmarc subdomain.',
        scoreImpact: 0,
      });
    } else {
      score -= 10;
      checks.push({
        id: 'dns-dmarc-check',
        name: 'DMARC Enforcement',
        category: 'dnsDomain',
        status: 'warning',
        title: 'Missing DMARC Policy',
        detail: 'No _dmarc TXT record detected.',
        scoreImpact: -10,
      });
      findings.push({
        id: 'finding-missing-dmarc',
        category: 'dnsDomain',
        severity: 'Low',
        title: 'Missing DMARC Policy',
        description: 'Domain lacks a DMARC policy for email validation and reporting.',
        whyItMatters: 'DMARC aligns SPF and DKIM, telling recipient mail servers whether to quarantine or reject forged messages.',
        evidence: `_dmarc.${hostname} not found`,
        recommendation: 'Publish a TXT record at _dmarc.${hostname} with "v=DMARC1; p=reject;".',
      });
    }
  } catch {
    // DMARC record absent
    score -= 10;
    checks.push({
      id: 'dns-dmarc-check',
      name: 'DMARC Enforcement',
      category: 'dnsDomain',
      status: 'info',
      title: 'DMARC Policy Not Detected',
      detail: 'No _dmarc TXT record found.',
      scoreImpact: 0,
    });
  }

  return {
    checks,
    findings,
    score: Math.max(0, score),
    hasIpv6,
    hasMx,
    hasSpf,
    hasDmarc,
    hasCaa,
  };
}
