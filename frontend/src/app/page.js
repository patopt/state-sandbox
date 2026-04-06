'use client';

import { useUser } from '@/context/user-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, states, loading } = useUser();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth');
      return;
    }
    if (states !== null && states.length === 0) {
      router.push('/create');
    } else if (states !== null && states.length > 0) {
      router.push(`/game/${states.at(-1).id}`);
    }
  }, [user, states, loading, router]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
      <p className="text-muted-foreground text-sm">Loading your nation...</p>
    </div>
  );
}
