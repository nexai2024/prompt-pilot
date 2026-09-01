import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Suspense } from 'react';
import { Toaster } from '@/components/ui/sonner';
import AuthHeader from '@/components/AuthHeader';
import { CommandPalette } from '@/components/CommandPalette';
import { TenantBootstrap } from '@/components/TenantBootstrap';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Analytics } from "@vercel/analytics/next"

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Prompt Pilot — AI API studio',
  description:
    'Design prompts, score quality, and ship production APIs from one workspace.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} font-sans`}>
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            <AuthHeader />
            <Suspense fallback={null}>
              <CommandPalette />
              <TenantBootstrap />
            </Suspense>
            {children}
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
