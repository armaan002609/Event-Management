import { NextRequest, NextResponse } from 'next/server';
import { getOptionalActiveUser, getOptionalActiveUserId, getActiveUser } from '@/lib/auth';
import { generateQrToken } from '@/lib/qr-service';
import { readDatabase, writeDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  let activeUser = getOptionalActiveUser();
  const db = readDatabase();

  if (!activeUser) {
    const userId = getOptionalActiveUserId();
    if (userId) {
      const { supabaseGetUserById } = await import('@/lib/supabase');
      const sbUser = await supabaseGetUserById(userId);
      if (sbUser) {
        db.users.push(sbUser);
        writeDatabase(db);
        activeUser = sbUser;
      }
    }
  }

  if (!activeUser) {
    activeUser = getActiveUser();
  }

  // Derive origin so phone camera scanning directly navigates to verification pass
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const origin = `${proto}://${host}`;

  const college = db.colleges.find((c) => c.id === activeUser.collegeId);
  const { token, qrDataUrl, verifyUrl } = await generateQrToken(activeUser.id, origin);

  // Get last scan info
  const userScans = db.scanLogs
    .filter((s) => s.userId === activeUser.id)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const lastScan = userScans[0] || null;

  return NextResponse.json({
    token,
    qrDataUrl,
    verifyUrl,
    user: {
      id: activeUser.id,
      name: activeUser.name,
      gender: activeUser.gender,
      collegeCode: college?.code || 'N/A',
      collegeName: activeUser.collegeName || college?.name || 'Unknown',
      collegeColor: college?.color || '#3B3FD9',
    },
    lastScan,
  });
}
