import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import AuthHeader from '@/components/AuthHeader';
import { CommandPalette } from '@/components/CommandPalette';
import { TenantBootstrap } from '@/components/TenantBootstrap';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Prompt Pilot - AI-Powered API Hosting Platform',
  description:
    'Build, test, and deploy AI-powered APIs without code. The ultimate platform for AI API development.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthHeader />
        <Suspense fallback={null}>
          <CommandPalette />
          <TenantBootstrap />
        </Suspense>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
