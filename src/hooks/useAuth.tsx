'use client';

import { useEffect, useState, createContext, useContext, ReactNode, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, AuthError, Session } from '@supabase/supabase-js';
import type { UsuarioOnline } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  usuariosOnline: UsuarioOnline[];
  refreshUsers: () => Promise<void>;
  subscriptionStatus: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [usuariosOnline, setUsuariosOnline] = useState<UsuarioOnline[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        setIsAdmin(session?.user?.app_metadata?.role === 'admin' || false);
        
        // Fetch subscription status for the user from the users table (source of truth)
        if (session?.user) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('subscription_status')
            .eq('id', session.user.id)
            .single(); // Will throw if no record found
            
          if (error) {
            // Handle case where no user record exists yet (PGRST116)
            if (error.code === 'PGRST116') {
              // No record found - treat as new user and create the record
              setSubscriptionStatus(null);
              // Create the user record in users table with pending status
              await supabase.from('users').insert({
                id: session.user.id,
                email: session.user.email,
                subscription_status: 'pending'
              });
              // Also create pending record in user_presence
              await supabase.from('user_presence').upsert({
                user_id: session.user.id,
                email: session.user.email,
                subscription_status: 'pending'
              }, { onConflict: 'user_id' });
            } else {
              // Real error
              console.error('[AuthProvider] Error fetching user data:', error);
              setSubscriptionStatus(null);
            }
          } else if (userData && typeof userData === 'object' && 'subscription_status' in userData) {
            // We have a user record, check the subscription_status
            const status = userData.subscription_status;
            if (typeof status === 'string') {
              setSubscriptionStatus(status);
              // Sync with user_presence for internal consistency
              await supabase.from('user_presence').upsert({
                user_id: session.user.id,
                email: session.user.email,
                subscription_status: status
              }, { onConflict: 'user_id' });
            } else {
              // subscription_status is null or not a string
              setSubscriptionStatus(null);
              // Set as pending in user_presence for consistency
              await supabase.from('user_presence').upsert({
                user_id: session.user.id,
                email: session.user.email,
                subscription_status: 'pending'
              }, { onConflict: 'user_id' });
            }
          } else {
            // Unexpected data shape
            setSubscriptionStatus(null);
            await supabase.from('user_presence').upsert({
              user_id: session.user.id,
              email: session.user.email,
              subscription_status: 'pending'
            }, { onConflict: 'user_id' });
          }
        } else {
          setSubscriptionStatus(null);
        }
      } catch (err) {
        console.error('[AuthProvider] Error in checkSession:', err);
        // In case of error, still set user data but without subscription status
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        setIsAdmin(session?.user?.app_metadata?.role === 'admin' || false);
        setSubscriptionStatus(null);
      } finally {
        // ALWAYS set loading to false to prevent infinite loading
        setLoading(false);
      }
    };

    checkSession();

    const handleAuthChange = async (_event: string, session: Session | null) => {
      try {
        setUser(session?.user || null);
        setIsAdmin(session?.user?.app_metadata?.role === 'admin' || false);
        
        if (session?.user) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('subscription_status')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            // Handle case where no user record exists yet (PGRST116)
            if (error.code === 'PGRST116') {
              // No record found - treat as new user and create the record
              setSubscriptionStatus(null);
              // Create the user record in users table with pending status
              await supabase.from('users').insert({
                id: session.user.id,
                email: session.user.email,
                subscription_status: 'pending'
              });
              // Create pending record in user_presence
              await supabase.from('user_presence').upsert({
                user_id: session.user.id,
                email: session.user.email,
                subscription_status: 'pending'
              }, { onConflict: 'user_id' });
            } else {
              // Real error
              console.error('[AuthProvider] Error fetching user data in handleAuthChange:', error);
              setSubscriptionStatus(null);
            }
          } else if (userData && typeof userData === 'object' && 'subscription_status' in userData) {
            const status = userData.subscription_status;
            if (typeof status === 'string') {
              setSubscriptionStatus(status);
              // Sync with user_presence
              await supabase.from('user_presence').upsert({
                user_id: session.user.id,
                email: session.user.email,
                subscription_status: status
              }, { onConflict: 'user_id' });
            } else {
              setSubscriptionStatus(null);
              await supabase.from('user_presence').upsert({
                user_id: session.user.id,
                email: session.user.email,
                subscription_status: 'pending'
              }, { onConflict: 'user_id' });
            }
          } else {
            // Unexpected data shape
            setSubscriptionStatus(null);
            await supabase.from('user_presence').upsert({
              user_id: session.user.id,
              email: session.user.email,
              subscription_status: 'pending'
            }, { onConflict: 'user_id' });
          }
        } else {
          setSubscriptionStatus(null);
        }
      } catch (err) {
        console.error('[AuthProvider] Error in handleAuthChange:', err);
        setSubscriptionStatus(null);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Update online status periodically (preserve subscription_status in user_presence)
  useEffect(() => {
    if (!user) return;

    const updateOnline = async () => {
      try {
        await supabase.from('user_presence').update({
          online: true,
          last_seen: new Date().toISOString()
        }).eq('user_id', user.id);
      } catch (err) {
        console.error('[AuthProvider] Error updating online status:', err);
      }
    };

    updateOnline();
    const interval = setInterval(updateOnline, 30000);

    const handleBeforeUnload = () => {
      supabase.from('user_presence').update({
        online: false,
        last_seen: new Date().toISOString()
      }).eq('user_id', user.id);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, supabase]);

  // Fetch online users (admin only)
  const refreshUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json() as { users: UsuarioOnline[] };
        setUsuariosOnline(data.users || []);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    }
  }, [isAdmin]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      
      if (error) {
        return { error };
      }
      
      // Sign up successful - create our application records immediately using the returned user data
      if (data.user) {
        // Create record in users table
        await supabase.from('users').upsert({
          id: data.user.id,
          email: data.user.email,
          subscription_status: 'pending'
        }, { onConflict: 'id' });
        
        // Create record in user_presence table
        await supabase.from('user_presence').upsert({
          user_id: data.user.id,
          email: data.user.email,
          online: true,
          last_seen: new Date().toISOString(),
          subscription_status: 'pending'
        }, { onConflict: 'user_id' });
      }
      
      return { error: null };
    } catch (err) {
      console.error('[AuthProvider] Error in signUp:', err);
      return { error: err as AuthError };
    }
  };

  const signOut = async () => {
    if (user) {
      await supabase.from('user_presence').update({
        online: false,
        last_seen: new Date().toISOString()
      }).eq('user_id', user.id);
    }
    await supabase.auth.signOut();
    setUser(null);
    setSubscriptionStatus(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isAdmin, usuariosOnline, refreshUsers, subscriptionStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}