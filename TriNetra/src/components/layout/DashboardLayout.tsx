"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import styles from './layout.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) {
    return null; // Skip SSR to avoid hydration mismatches from browser extensions
  }

  return (
    <div className={styles.dashboardContainer} suppressHydrationWarning>
      <Sidebar />
      <div className={styles.mainWrapper} suppressHydrationWarning>
        <Header />
        <main className={styles.content} suppressHydrationWarning>
          {children}
        </main>
      </div>
    </div>
  );
}
