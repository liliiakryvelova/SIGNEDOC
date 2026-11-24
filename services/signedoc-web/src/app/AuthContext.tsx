import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { CurrentUser, RegisterRequest } from '../types/index.js';
import { api } from '../api/index.js';

interface AuthContextValue { user: CurrentUser | null; loading: boolean; login(email: string, password: string): Promise<void>; register(input: RegisterRequest): Promise<void>; logout(): Promise<void> }
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; api.getCurrentUser().then((current) => { if (active) setUser(current); }).catch(() => { if (active) setUser(null); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const login = useCallback(async (email: string, password: string) => { const result = await api.login({ email, password }); setUser(result.user); }, []);
  const register = useCallback(async (input: RegisterRequest) => { const result = await api.register(input); setUser(result.user); }, []);
  const logout = useCallback(async () => { await api.logout(); setUser(null); }, []);
  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}