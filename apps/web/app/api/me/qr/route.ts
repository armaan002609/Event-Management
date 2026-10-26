import { NextResponse } from 'next/server';
import { getActiveUser } from '@/lib/auth';
import { generateQrToken } from '@/lib/qr-service';
import { readDatabase } from '@/lib/db';

export async function GET() {
  const activeUser = getActiveUser();
  const db = readDatabase();

  const college = db.colleges.find((c) => c.id === activeUser.collegeId);
  const { token, qrDataUrl } = await generateQrToken(activeUser.id);

  // Get last scan info
  const userScans = db.scanLogs
    .filter((s) => s.userId === activeUser.id)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const lastScan = userScans[0] || null;

  return NextResponse.json({
    token,
    qrDataUrl,
    user: {
      id: activeUser.id,
      name: activeUser.name,
      gender: activeUser.gender,
      collegeCode: college?.code || 'N/A',
      collegeName: college?.name || 'Unknown',
      collegeColor: college?.color || '#3B3FD9',
    },
    lastScan,
  });
}
