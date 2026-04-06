'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

const UserContext = createContext({
  loading: true,
  user: null,
  states: null,
  refreshUser: async () => {},
  refreshStates: async () => {},
});

const PUBLIC_PATHS = ['/auth', '/auth/verify'];

export function UserProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [states, setStates] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('state-sandbox-token');
    if (token) {
      api
        .getCurrentUser()
        .then((userData) => {
          setUser(userData);
          return api.getStates();
        })
        .then((statesData) => {
          setStates(statesData);
        })
        .catch(() => {
          localStorage.removeItem('state-sandbox-token');
          if (!PUBLIC_PATHS.some((p) => pathname?.startsWith(p))) {
            router.push('/auth');
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      if (!PUBLIC_PATHS.some((p) => pathname?.startsWith(p))) {
        router.push('/auth');
      }
    }
  }, []);

  const refreshUser = async () => {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
      return userData;
    } catch {
      return null;
    }
  };

  const refreshStates = async () => {
    try {
      const statesData = await api.getStates();
      setStates(statesData);
      return statesData;
    } catch {
      return [];
    }
  };

  return (
    <UserContext.Provider value={{ loading, user, states, refreshUser, refreshStates }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
