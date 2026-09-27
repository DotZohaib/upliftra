/**
 * useDataSync — Shared hook for reactive LocalStorage access
 *
 * Listens for 'upliftra_data_changed' events and refreshes data automatically.
 * Use this in any view that reads from LocalStorage to ensure the UI stays
 * in sync without unnecessary re-renders.
 *
 * @example
 * const opportunities = useDataSync(getOpportunities);
 * const users = useDataSync(getUsers);
 */
import { useState, useEffect, useCallback } from 'react';

export function useDataSync<T>(fetcher: () => T): T {
  const [data, setData] = useState<T>(fetcher);

  const refresh = useCallback(() => {
    setData(fetcher());
  }, [fetcher]);

  useEffect(() => {
    window.addEventListener('upliftra_data_changed', refresh);
    return () => window.removeEventListener('upliftra_data_changed', refresh);
  }, [refresh]);

  return data;
}

/**
 * useCurrentUser — Returns the currently authenticated user,
 * refreshed on auth state changes and data changes.
 */
import { getCurrentUser } from '../lib/storage';
import { User } from '../types';

export function useCurrentUser(): User {
  const [user, setUser] = useState<User>(getCurrentUser);

  useEffect(() => {
    const refresh = () => setUser(getCurrentUser());
    window.addEventListener('upliftra_auth_state_changed', refresh);
    window.addEventListener('upliftra_data_changed', refresh);
    return () => {
      window.removeEventListener('upliftra_auth_state_changed', refresh);
      window.removeEventListener('upliftra_data_changed', refresh);
    };
  }, []);

  return user;
}
