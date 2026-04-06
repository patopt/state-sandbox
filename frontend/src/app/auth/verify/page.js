'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useUser();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setError('Invalid verification link');
      return;
    }

    fetch(`/api/auth/verify?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem('state-sandbox-token', data.token);
          setStatus('success');
          refreshUser?.();
          setTimeout(() => router.push('/'), 1500);
        } else {
          setStatus('error');
          setError(data.error || 'Verification failed');
        }
      })
      .catch(() => {
        setStatus('error');
        setError('Network error. Please try again.');
      });
  }, [searchParams, router, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-panel rounded-2xl p-10 text-center max-w-sm w-full space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
            <h2 className="text-lg font-semibold">Verifying your link...</h2>
            <p className="text-sm text-muted-foreground">Just a moment</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto" />
            <h2 className="text-lg font-semibold">Verified!</h2>
            <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-10 h-10 text-red-400 mx-auto" />
            <h2 className="text-lg font-semibold">Verification Failed</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => router.push('/auth')}
              className="text-sm text-primary hover:text-primary/80"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
