import { NextRequest, NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { processScan } from '@/lib/qr-service';
import { readDatabase } from '@/lib/db';
import { ScanRequest } from '@unifest/shared';

export async function GET() {
  const db = readDatabase();
  const recentScans = db.scanLogs.slice(0, 50);
  return NextResponse.json(recentScans);
}

export async function POST(req: NextRequest) {
  const activeUser = getActiveUser();
  // Scanner operators, managers and admins can scan
  if (activeUser.role !== 'SCANNER' && activeUser.role !== 'MANAGER' && activeUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only authorized scanner staff can verify QRs.' }, { status: 403 });
  }

  try {
    const body: ScanRequest = await req.json();

    if (!body.token || !body.context || !body.clientScanId) {
      return NextResponse.json(
        { error: 'token, context, and clientScanId are required.' },
        { status: 400 }
      );
    }

    const response = await processScan(body, activeUser.id);
    return NextResponse.json(response);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
