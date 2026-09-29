import tls from 'tls';
import { ScanCheckResult, SecurityFinding } from './types';

export interface TlsAnalysisResult {
  checks: ScanCheckResult[];
  findings: SecurityFinding[];
  score: number;
  tlsDetails: {
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
}

export async function inspectTlsCertificate(hostname: string, port = 443, timeoutMs = 6000): Promise<TlsAnalysisResult> {
  const checks: ScanCheckResult[] = [];
  const findings: SecurityFinding[] = [];
  let score = 100;

  return new Promise((resolve) => {
    let resolved = false;

    const cleanupAndResolve = (result: TlsAnalysisResult) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };

    const options: tls.ConnectionOptions = {
      host: hostname,
      port,
      servername: hostname, // SNI support
      rejectUnauthorized: false, // We inspect cert details even if untrusted/expired
      timeout: timeoutMs,
    };

    const socket = tls.connect(options, () => {
      try {
        const cert = socket.getPeerCertificate(true);
        const protocol = socket.getProtocol() || undefined;
        const cipherInfo = socket.getCipher();
        const cipher = cipherInfo ? cipherInfo.name : undefined;
        const authorized = socket.authorized;
        const authError = socket.authorizationError ? String(socket.authorizationError) : undefined;

        socket.destroy();

        if (!cert || Object.keys(cert).length === 0) {
          checks.push({
            id: 'tls-cert-check',
            name: 'TLS Certificate Inspection',
            category: 'httpsTls',
            status: 'failed',
            title: 'No SSL/TLS Certificate Presented',
            detail: 'Server did not present a valid peer certificate during TLS handshake.',
            scoreImpact: -50,
          });
          findings.push({
            id: 'tls-missing-cert',
            category: 'httpsTls',
            severity: 'Critical',
            title: 'Missing SSL/TLS Certificate',
            description: 'Could not obtain a TLS peer certificate from the server.',
            whyItMatters: 'Traffic cannot be encrypted without an active TLS certificate, exposing user credentials and data in transit.',
            evidence: `Failed to retrieve certificate on ${hostname}:${port}`,
            recommendation: 'Install a valid SSL/TLS certificate from an authorized CA (such as Let\'s Encrypt).',
          });
          cleanupAndResolve({
            checks,
            findings,
            score: 0,
            tlsDetails: {},
          });
          return;
        }

        const validTo = cert.valid_to;
        const validFrom = cert.valid_from;
        const expiryDate = new Date(validTo);
        const now = new Date();
        const daysRemaining = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const formatCertField = (val: string | string[] | undefined): string => {
          if (!val) return '';
          return Array.isArray(val) ? val.join(', ') : val;
        };
        const issuerName = cert.issuer ? (formatCertField(cert.issuer.O) || formatCertField(cert.issuer.CN) || 'Unknown CA') : 'Unknown CA';
        const subjectName = cert.subject ? (formatCertField(cert.subject.CN) || hostname) : hostname;
        const sans = cert.subjectaltname ? cert.subjectaltname.split(', ').map(s => s.replace(/^DNS:/, '')) : [];

        // 1. Certificate Authority Trust
        if (!authorized) {
          score -= 40;
          checks.push({
            id: 'tls-trust-check',
            name: 'Certificate Authority Trust',
            category: 'httpsTls',
            status: 'failed',
            title: 'Untrusted SSL Certificate',
            detail: `Certificate validation failed: ${authError || 'Self-signed or invalid root chain'}`,
            scoreImpact: -40,
          });
          findings.push({
            id: 'tls-untrusted-cert',
            category: 'httpsTls',
            severity: 'Critical',
            title: 'SSL/TLS Certificate is Not Trusted',
            description: `The certificate presented by ${hostname} failed validation with the trust store. Reason: ${authError || 'Untrusted Authority'}.`,
            whyItMatters: 'Browsers will trigger severe red interstitial warnings ("Your connection is not private"), driving away 95%+ of traffic and blocking API clients.',
            evidence: `Authorization Error: ${authError || 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'}`,
            recommendation: 'Replace self-signed or invalid certificates with one issued by an accredited public Certificate Authority.',
            cwe: 'CWE-295',
          });
        } else {
          checks.push({
            id: 'tls-trust-check',
            name: 'Certificate Authority Trust',
            category: 'httpsTls',
            status: 'passed',
            title: 'Trusted Public Certificate Authority',
            detail: `Issued by ${issuerName}, trusted by all major root stores.`,
            scoreImpact: 0,
          });
        }

        // 2. Expiration Check
        if (daysRemaining < 0) {
          score -= 50;
          checks.push({
            id: 'tls-expiry-check',
            name: 'Certificate Expiration',
            category: 'httpsTls',
            status: 'failed',
            title: 'Certificate Has Expired',
            detail: `Certificate expired ${Math.abs(daysRemaining)} days ago on ${validTo}.`,
            scoreImpact: -50,
          });
          findings.push({
            id: 'tls-expired-cert',
            category: 'httpsTls',
            severity: 'Critical',
            title: 'SSL Certificate is Expired',
            description: `The certificate expired on ${validTo}.`,
            whyItMatters: 'Users cannot securely browse this website without receiving security exception warnings.',
            evidence: `Certificate Valid To: ${validTo} (${Math.abs(daysRemaining)} days overdue)`,
            recommendation: 'Renew the SSL/TLS certificate immediately and configure auto-renewal via Certbot or your hosting provider.',
            cwe: 'CWE-298',
          });
        } else if (daysRemaining <= 14) {
          score -= 15;
          checks.push({
            id: 'tls-expiry-check',
            name: 'Certificate Expiration',
            category: 'httpsTls',
            status: 'warning',
            title: 'Certificate Expiring Soon',
            detail: `Certificate expires in ${daysRemaining} day(s) on ${validTo}.`,
            scoreImpact: -15,
          });
          findings.push({
            id: 'tls-expiring-soon',
            category: 'httpsTls',
            severity: 'Medium',
            title: 'SSL Certificate Expiring Imminently',
            description: `The certificate will expire in ${daysRemaining} day(s).`,
            whyItMatters: 'If not renewed before expiration, users will experience service interruption and security warnings.',
            evidence: `Expiration date: ${validTo}`,
            recommendation: 'Renew and deploy the certificate prior to the expiration date.',
          });
        } else {
          checks.push({
            id: 'tls-expiry-check',
            name: 'Certificate Expiration',
            category: 'httpsTls',
            status: 'passed',
            title: 'Certificate Valid & Current',
            detail: `Expires in ${daysRemaining} days (${validTo}).`,
            scoreImpact: 0,
          });
        }

        // 3. Protocol Version
        if (protocol === 'TLSv1.3') {
          checks.push({
            id: 'tls-proto-check',
            name: 'TLS Protocol Version',
            category: 'httpsTls',
            status: 'passed',
            title: 'Modern TLS 1.3 Active',
            detail: 'Server negotiated TLSv1.3 with 0-RTT support and perfected forward secrecy.',
            scoreImpact: 0,
          });
        } else if (protocol === 'TLSv1.2') {
          checks.push({
            id: 'tls-proto-check',
            name: 'TLS Protocol Version',
            category: 'httpsTls',
            status: 'passed',
            title: 'Standard TLS 1.2 Active',
            detail: 'Server negotiated TLSv1.2. (Consider enabling TLSv1.3 for faster handshakes).',
            scoreImpact: 0,
          });
        } else if (protocol) {
          score -= 25;
          checks.push({
            id: 'tls-proto-check',
            name: 'TLS Protocol Version',
            category: 'httpsTls',
            status: 'failed',
            title: `Legacy Protocol Detected (${protocol})`,
            detail: `Server negotiated deprecated protocol ${protocol}. TLS 1.0 and 1.1 are considered insecure.`,
            scoreImpact: -25,
          });
          findings.push({
            id: 'tls-legacy-proto',
            category: 'httpsTls',
            severity: 'High',
            title: 'Deprecated TLS Protocol in Use',
            description: `Server allows connection with ${protocol}.`,
            whyItMatters: 'Legacy TLS versions contain known cryptographic weaknesses (POODLE, BEAST) and are disallowed by PCI-DSS and modern browsers.',
            evidence: `Negotiated protocol: ${protocol}`,
            recommendation: 'Disable TLS 1.0 and TLS 1.1 in web server configs and enable TLS 1.2 and 1.3 only.',
            cwe: 'CWE-326',
          });
        }

        // 4. Cipher Suite
        if (cipher) {
          checks.push({
            id: 'tls-cipher-check',
            name: 'TLS Cipher Suite',
            category: 'httpsTls',
            status: 'passed',
            title: `Secure Cipher Suite (${cipher})`,
            detail: `Negotiated cipher suite: ${cipher}.`,
            scoreImpact: 0,
          });
        }

        cleanupAndResolve({
          checks,
          findings,
          score: Math.max(0, score),
          tlsDetails: {
            protocol,
            cipher,
            validFrom,
            validTo,
            daysRemaining,
            issuer: issuerName,
            subject: subjectName,
            authorized,
            authError,
            sans: sans.slice(0, 5),
          },
        });
      } catch (err) {
        socket.destroy();
        cleanupAndResolve({
          checks: [
            {
              id: 'tls-error',
              name: 'TLS Handshake',
              category: 'httpsTls',
              status: 'warning',
              title: 'TLS Inspection Incomplete',
              detail: err instanceof Error ? err.message : 'TLS inspection encountered an error',
              scoreImpact: -10,
            },
          ],
          findings: [],
          score: 75,
          tlsDetails: {},
        });
      }
    });

    socket.on('error', (err) => {
      socket.destroy();
      checks.push({
        id: 'tls-conn-error',
        name: 'TLS Connection',
        category: 'httpsTls',
        status: 'failed',
        title: 'TLS Connection Failed',
        detail: `Could not establish TLS connection to port ${port}: ${err.message}`,
        scoreImpact: -40,
      });
      findings.push({
        id: 'tls-fail-handshake',
        category: 'httpsTls',
        severity: 'High',
        title: 'Failed to Complete TLS Handshake',
        description: `Direct TLS handshake to ${hostname}:${port} failed: ${err.message}`,
        whyItMatters: 'An encrypted connection could not be negotiated properly, which may indicate SSL misconfiguration or port blocking.',
        evidence: err.message,
        recommendation: 'Verify your web server SSL certificate installation and firewall configuration.',
      });
      cleanupAndResolve({
        checks,
        findings,
        score: 30,
        tlsDetails: {},
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      checks.push({
        id: 'tls-timeout',
        name: 'TLS Handshake Timeout',
        category: 'httpsTls',
        status: 'warning',
        title: 'TLS Connection Timed Out',
        detail: `Port ${port} did not respond within ${timeoutMs}ms.`,
        scoreImpact: -15,
      });
      cleanupAndResolve({
        checks,
        findings,
        score: 70,
        tlsDetails: {},
      });
    });
  });
}
