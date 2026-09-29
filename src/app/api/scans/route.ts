import { scanStorage } from '@/lib/storage/scan-storage';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const scans = scanStorage.listScans();
  return NextResponse.json({
    success: true,
    data: scans,
  });
}
