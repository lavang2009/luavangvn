'use client';

import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { firebaseAuth } from '@/lib/firebase/client';
import { initAuthPersistence } from '@/lib/firebase/auth-client';
import { ensureUserProfile } from '@/lib/firebase/user';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  token: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, token: async () => null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuthPersistence().catch(() => undefined);
    return onAuthStateChanged(firebaseAuth, async (next) => {
      setUser(next);
      setLoading(false);
      if (next) {
        try {
          const token = await next.getIdToken(true);
          const response = await fetch('/api/auth/bootstrap', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
          if (!response.ok) {
            await ensureUserProfile({
              uid: next.uid,
              email: next.email,
              displayName: next.displayName,
              photoURL: next.photoURL,
              providerId: next.providerData[0]?.providerId ?? 'password',
            });
          }
        } catch {
          // Bootstrap is best-effort; authentication state remains valid.
        }
      }
    });
  }, []);

  const value = useMemo(() => ({ user, loading, token: async () => user ? user.getIdToken() : null }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
