import { scanStorage } from '@/lib/storage/scan-storage';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const targets = scanStorage.listMonitoringTargets();
  return NextResponse.json({
    success: true,
    data: targets,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, frequency, alertEmail } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'Target URL is required.' }, { status: 400 });
    }
    if (!alertEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alertEmail)) {
      return NextResponse.json({ success: false, error: 'Valid alert email is required.' }, { status: 400 });
    }

    const newTarget = scanStorage.addMonitoringTarget({
      url: url.startsWith('http') ? url : `https://${url}`,
      frequency: frequency || 'daily',
      alertEmail,
      status: 'active',
      lastScanDate: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Monitoring configured successfully.',
      data: newTarget,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error creating monitor';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
