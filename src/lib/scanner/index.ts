import { getScannerProvider } from './provider';
import { validateAndNormalizeTargetUrl } from './security-guard';
import { ScanResult } from './types';

export * from './types';
export * from './security-guard';
export * from './provider';
export * from './scoring';
export * from './recommendations';

export interface ScanExecutionOptions {
  isDemo?: boolean;
  providerMode?: 'local' | 'external' | 'demo';
}

/**
 * Main SentinelX scanner execution pipeline:
 * 1. Validates and normalizes URL
 * 2. Enforces SSRF, localhost, private IP blocking
 * 3. Selects configured provider (Local passive, Demo, or External)
 * 4. Executes scan and records telemetry
 */
export async function executeScan(
  rawUrl: string,
  options: ScanExecutionOptions = {}
): Promise<{ success: true; data: ScanResult } | { success: false; error: string; statusCode: number }> {
  // 1. Validation & SSRF Guard
  const validation = await validateAndNormalizeTargetUrl(rawUrl);

  if (!validation.valid || !validation.normalizedUrl || !validation.hostname) {
    return {
      success: false,
      error: validation.error || 'Invalid target website URL.',
      statusCode: 400,
    };
  }

  const isDemo = options.isDemo || validation.isDemo || false;
  const mode = isDemo ? 'demo' : options.providerMode;
  const provider = getScannerProvider(mode);

  try {
    const result = await provider.scan({
      url: validation.normalizedUrl,
      hostname: validation.hostname,
      ip: validation.ip,
      isDemo,
    });

    return {
      success: true,
      data: result,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown scanning error occurred.';
    return {
      success: false,
      error: `Security Assessment Failed: ${msg}. Please ensure the domain is publicly reachable.`,
      statusCode: 502,
    };
  }
}
