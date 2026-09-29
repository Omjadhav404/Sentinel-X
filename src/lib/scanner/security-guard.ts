import dns from 'dns/promises';
import { isIP } from 'net';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  normalizedUrl?: string;
  hostname?: string;
  ip?: string;
  isDemo?: boolean;
}

// Check if an IP address is private, loopback, link-local, or reserved
export function isPrivateOrReservedIP(ip: string): boolean {
  if (!ip) return true;

  // IPv4 check
  if (ip.includes('.')) {
    const parts = ip.split('.').map(p => parseInt(p, 10));
    if (parts.length !== 4 || parts.some(isNaN)) return true;

    // 0.0.0.0/8 - Current network
    if (parts[0] === 0) return true;

    // 127.0.0.0/8 - Loopback
    if (parts[0] === 127) return true;

    // 10.0.0.0/8 - Private-Use
    if (parts[0] === 10) return true;

    // 172.16.0.0/12 - Private-Use
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

    // 192.168.0.0/16 - Private-Use
    if (parts[0] === 192 && parts[1] === 168) return true;

    // 169.254.0.0/16 - Link-Local (Cloud metadata e.g. 169.254.169.254)
    if (parts[0] === 169 && parts[1] === 254) return true;

    // 100.64.0.0/10 - Shared Address Space (Carrier-grade NAT)
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;

    // 224.0.0.0/4 - Multicast
    if (parts[0] >= 224 && parts[0] <= 239) return true;

    // 240.0.0.0/4 - Reserved
    if (parts[0] >= 240) return true;

    return false;
  }

  // IPv6 check
  const lowerIp = ip.toLowerCase();
  if (lowerIp === '::1' || lowerIp === '::') return true;
  // fe80::/10 - Link-local
  if (lowerIp.startsWith('fe8') || lowerIp.startsWith('fe9') || lowerIp.startsWith('fea') || lowerIp.startsWith('feb')) return true;
  // fc00::/7 - Unique local
  if (lowerIp.startsWith('fc') || lowerIp.startsWith('fd')) return true;

  return false;
}

/**
 * Validates target URL against SSRF, loopbacks, internal network targets,
 * and malicious schemes.
 */
export async function validateAndNormalizeTargetUrl(rawUrl: string): Promise<ValidationResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Please enter a website URL.' };
  }

  let trimmed = rawUrl.trim();

  // Support demo aliases
  if (trimmed.startsWith('demo-') || trimmed.includes('.sentinelx.local')) {
    return {
      valid: true,
      isDemo: true,
      normalizedUrl: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
      hostname: trimmed.replace(/^https?:\/\//, '').split('/')[0],
      ip: '198.51.100.42',
    };
  }

  // Prepend https:// if protocol is missing
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'The provided URL is not a valid web address.' };
  }

  // Enforce http / https only
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS protocols are supported for security assessments.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Basic string heuristics against localhost and internal names
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1'
  ) {
    return {
      valid: false,
      error: 'Security Policy Violation: Scanning internal networks, loopbacks, or local hosts is strictly prohibited.',
    };
  }

  // Check custom port
  if (parsed.port) {
    const portNum = parseInt(parsed.port, 10);
    const allowedPorts = [80, 443, 8080, 8443];
    if (!allowedPorts.includes(portNum)) {
      return {
        valid: false,
        error: `Port ${portNum} is restricted. Assessments are limited to standard web ports (80, 443, 8080, 8443).`,
      };
    }
  }

  // DNS lookup & SSRF resolution protection
  try {
    // If hostname is directly an IP
    if (isIP(hostname)) {
      if (isPrivateOrReservedIP(hostname)) {
        return {
          valid: false,
          error: 'Security Policy Violation: Target resolves to a private or reserved IP address range.',
        };
      }
      return {
        valid: true,
        normalizedUrl: parsed.toString(),
        hostname,
        ip: hostname,
      };
    }

    // Resolve domain to IP via DNS
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { valid: false, error: `Could not resolve domain name "${hostname}". Please verify DNS configuration.` };
    }

    // Verify all resolved addresses
    for (const record of addresses) {
      if (isPrivateOrReservedIP(record.address)) {
        return {
          valid: false,
          error: `Security Policy Violation: Host resolves to internal or private IP address (${record.address}).`,
        };
      }
    }

    return {
      valid: true,
      normalizedUrl: parsed.toString(),
      hostname,
      ip: addresses[0].address,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'DNS lookup failed';
    return {
      valid: false,
      error: `Domain resolution failure for ${hostname}: ${errorMsg}`,
    };
  }
}
