import { executeScan } from '@/lib/scanner';
import { scanStorage } from '@/lib/storage/scan-storage';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, isDemo, scanMode } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please specify a target website URL.' },
        { status: 400 }
      );
    }

    const scanResult = await executeScan(url, {
      isDemo: Boolean(isDemo || scanMode === 'demo'),
    });

    if (!scanResult.success) {
      return NextResponse.json(
        { success: false, error: scanResult.error },
        { status: scanResult.statusCode }
      );
    }

    // Persist scan in storage
    scanStorage.saveScan(scanResult.data);

    return NextResponse.json(
      {
        success: true,
        data: scanResult.data,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal scanner error';
    return NextResponse.json(
      { success: false, error: `Scanner error: ${message}` },
      { status: 500 }
    );
  }
}
