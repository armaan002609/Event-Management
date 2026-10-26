import { NextRequest, NextResponse } from 'next/server';
import { getOptionalActiveUser, getOptionalActiveUserId, getActiveUser } from '@/lib/auth';
import { processScan } from '@/lib/qr-service';
import { readDatabase, writeDatabase } from '@/lib/db';
import { ScanRequest } from '@unifest/shared';

export async function GET() {
  const db = readDatabase();
  const recentScans = db.scanLogs.slice(0, 50);
  return NextResponse.json(recentScans);
}

export async function POST(req: NextRequest) {
  let activeUser = getOptionalActiveUser();
  if (!activeUser) {
    const userId = getOptionalActiveUserId();
    if (userId) {
      const { supabaseGetUserById } = await import('@/lib/supabase');
      const sbUser = await supabaseGetUserById(userId);
      if (sbUser) {
        activeUser = sbUser;
      }
    }
  }

  const operatorId = activeUser?.id || 'usr-scanner';

  try {
    const body: ScanRequest = await req.json();

    if (!body.token || !body.context || !body.clientScanId) {
      return NextResponse.json(
        { error: 'token, context, and clientScanId are required.' },
        { status: 400 }
      );
    }

    const response = await processScan(body, operatorId);
    return NextResponse.json(response);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
