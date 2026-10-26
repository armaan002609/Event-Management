import { ScannerPwa } from '@/components/scanner/ScannerPwa';

export const metadata = {
  title: 'UniFest QR Scanner — Hostel & Mess Verification',
  description: 'High-speed browser scanner with offline support and instant allow/deny verification.',
};

export default function ScannerPage() {
  return <ScannerPwa />;
}
