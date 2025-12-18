'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, Mail, Lock, AlertCircle, Info } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // Check Supabase configuration on mount
    const checkConfig = () => {
      const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
      const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      setDebugInfo({
        timestamp: new Date().toISOString(),
        supabaseConfigured: hasUrl && hasKey,
        hasUrl,
        hasKey,
      });
    };

    checkConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const startTime = Date.now();

    try {
      console.log('=== SIGN IN ATTEMPT ===');
      console.log('Email:', email);
      console.log('Time:', new Date().toISOString());

      const result = await signIn(email, password);

      const duration = Date.now() - startTime;
      console.log('Sign in successful! Duration:', duration, 'ms');
      console.log('Sign in result:', result);

      setDebugInfo({
        ...debugInfo,
        lastAttempt: new Date().toISOString(),
        success: true,
        duration,
      });

      console.log('Redirecting to dashboard...');

      // Use a small delay to ensure session is fully set
      await new Promise(resolve => setTimeout(resolve, 200));

      router.push('/dashboard');
    } catch (err: any) {
      const duration = Date.now() - startTime;
      const errorMessage = err.message || 'Failed to sign in. Please check your credentials.';

      console.error('=== SIGN IN FAILED ===');
      console.error('Error:', err);
      console.error('Message:', errorMessage);
      console.error('Duration:', duration, 'ms');

      setDebugInfo({
        ...debugInfo,
        lastAttempt: new Date().toISOString(),
        success: false,
        error: errorMessage,
        errorDetails: {
          message: err.message,
          name: err.name,
          status: err.status,
          stack: err.stack?.split('\n').slice(0, 3),
        },
        duration,
      });

      setError(errorMessage);
      setShowDebug(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-600 mt-2">Sign in to your Prompt Pilot account</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {showDebug && debugInfo && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="font-bold mb-2">Debug Information:</div>
                      <div>Supabase Configured: {debugInfo.supabaseConfigured ? '✓ Yes' : '✗ No'}</div>
                      {debugInfo.lastAttempt && (
                        <>
                          <div>Last Attempt: {new Date(debugInfo.lastAttempt).toLocaleTimeString()}</div>
                          <div>Duration: {debugInfo.duration}ms</div>
                          {debugInfo.errorDetails && (
                            <>
                              <div className="mt-2 font-bold">Error Details:</div>
                              <div>Name: {debugInfo.errorDetails.name || 'Unknown'}</div>
                              <div>Status: {debugInfo.errorDetails.status || 'N/A'}</div>
                              <div className="break-all">Message: {debugInfo.errorDetails.message}</div>
                            </>
                          )}
                        </>
                      )}
                      <div className="mt-2 text-blue-600">Check browser console for full logs</div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link
                  href="/auth/reset-password"
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/sign-up" className="text-purple-600 hover:text-purple-700 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-purple-600 hover:text-purple-700">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-purple-600 hover:text-purple-700">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
