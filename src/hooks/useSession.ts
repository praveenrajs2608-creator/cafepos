import { useEffect, useState } from 'react';

export interface UserSession {
  id: string;
  email: string;
  role: string;
  name: string;
}

export function useSession() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/login');
      if (res.ok) {
        const data = await res.json();
        setSession(data.session || null);
      }
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
  };

  return { session, loading, logout, refetch: fetchSession };
}
