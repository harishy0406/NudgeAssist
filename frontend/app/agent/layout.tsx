'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import AnimatedBackground from '@/components/animations/AnimatedBackground';
import PageTransition from '@/components/animations/PageTransition';

export default function AgentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="page-container">
      <AnimatedBackground />
      <Sidebar />
      <main className="main-content page-content">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
