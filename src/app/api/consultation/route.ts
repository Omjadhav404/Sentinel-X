import { scanStorage } from '@/lib/storage/scan-storage';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, company, website, securityScore, riskLevel, urgency, issueSummary, message, scanId } = body;

    // Field validations
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Your name is required.' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Please provide a valid business email address.' }, { status: 400 });
    }
    if (!website || typeof website !== 'string') {
      return NextResponse.json({ success: false, error: 'Target website URL is required.' }, { status: 400 });
    }

    const consultation = scanStorage.addConsultation({
      name: name.trim(),
      email: email.trim(),
      company: company?.trim() || undefined,
      website: website.trim(),
      securityScore: typeof securityScore === 'number' ? securityScore : undefined,
      riskLevel: riskLevel || undefined,
      urgency: urgency || 'high',
      issueSummary: issueSummary || undefined,
      message: message?.trim() || 'Urgent website security remediation assistance requested.',
      scanId: scanId || undefined,
    });

    // Logging & Extensible Notification Channel
    // (In production: plug in Resend, Sendgrid, AWS SES or Slack Webhook via env vars)
    if (process.env.CONSULTATION_WEBHOOK_URL) {
      try {
        await fetch(process.env.CONSULTATION_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'NEW_SECURITY_CONSULTATION_REQUEST',
            consultation,
          }),
        });
      } catch (webhookErr) {
        console.warn('Webhook notification failure:', webhookErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Request received. Our security response team will review your assessment and reach out within 4 business hours.',
      data: consultation,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error processing consultation request';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  const list = scanStorage.listConsultations();
  return NextResponse.json({
    success: true,
    data: list,
  });
}
