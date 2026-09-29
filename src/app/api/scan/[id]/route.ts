import { scanStorage } from '@/lib/storage/scan-storage';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const scan = scanStorage.getScan(id);

  if (!scan) {
    return NextResponse.json(
      { success: false, error: `Scan report with ID "${id}" was not found.` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: scan,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const deleted = scanStorage.deleteScan(id);

  if (!deleted) {
    return NextResponse.json(
      { success: false, error: 'Scan not found or already deleted.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Scan deleted successfully.',
  });
}
