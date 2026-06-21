'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
    } else {
      // Role-based redirect
      switch (user.role) {
        case 'employee': router.push('/tickets'); break;
        case 'agent': router.push('/agent'); break;
        case 'manager': router.push('/manager'); break;
        default: router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
    }}>
      <div className="loading-spinner" style={{ width: 40, height: 40 }} />
    </div>
  );
}
