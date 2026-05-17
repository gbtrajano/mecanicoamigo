'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';

interface AuthState {
  loading: boolean;
  authenticated: boolean;
  user: { id: string; email: string; role: string } | null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<AuthState>({ loading: true, authenticated: false, user: null });
  const initialized = useRef(false);

  // Public paths that don't need authentication
  const isPublicPath = pathname === '/login' || pathname === '/register';

  // Admin-only path
  const isAdminPath = pathname === '/admin';

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (!data.authenticated) {
          if (!isPublicPath) {
            router.push('/login');
          } else {
            setState({ loading: false, authenticated: false, user: null });
          }
        } else {
          // User is authenticated
          const user = data.user;

          // Check if trying to access admin page without admin role
          if (isAdminPath && user.role !== 'ADMIN') {
            router.push('/');
            return;
          }

          if (isPublicPath) {
            router.push('/');
          } else {
            setState({ loading: false, authenticated: true, user });
          }
        }
      } catch {
        if (!isPublicPath) {
          router.push('/login');
        } else {
          setState({ loading: false, authenticated: false, user: null });
        }
      }
    }

    checkAuth();
  }, [pathname, router, isPublicPath, isAdminPath]);

  // Show loading while checking auth
  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Verificando acesso...</div>
      </div>
    );
  }

  // If not authenticated and not on public path, don't render children
  if (!state.authenticated && !isPublicPath) {
    return null;
  }

  // If on public path (login/register), render without sidebar
  if (isPublicPath) {
    return <>{children}</>;
  }

  // Authenticated - render with sidebar and nav
  return (
    <>
      <Sidebar />
      <main className="flex-1 md:ml-[280px] pb-20 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </>
  );
}