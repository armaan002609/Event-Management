import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UniFest Manager — Inter-College Sports & Folk Events Platform',
  description:
    'Comprehensive inter-college festival operations: automated constraint-first hostel allocation, single QR identity for check-in and mess dining, and targeted event schedule updates.',
};

import { InactivityGuard } from '@/components/auth/InactivityGuard';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen selection:bg-primary/20 selection:text-primary">
        <InactivityGuard />
        {children}
      </body>
    </html>
  );
}
