import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import AuthHeader from '@/components/AuthHeader';
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Prompt Pilot - AI-Powered API Hosting Platform',
  description: 'Build, test, and deploy AI-powered APIs without code. The ultimate platform for AI API development.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      <body className={inter.className}>
        <AuthHeader />
        {children}
        <Toaster position="top-right" richColors />
      </body>
      </ClerkProvider>
    </html>
  );
}