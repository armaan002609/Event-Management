import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UniFest Manager — Inter-College Sports & Folk Events Platform',
  description:
    'Comprehensive inter-college festival operations: automated constraint-first hostel allocation, single QR identity for check-in and mess dining, and targeted event schedule updates.',
};

import { InactivityGuard } from '@/components/auth/InactivityGuard';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('unifest_theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && prefersDark)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen selection:bg-primary/20 selection:text-primary transition-colors duration-150">
        <ThemeProvider>
          <InactivityGuard />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
