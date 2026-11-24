import { useEffect, useState } from 'react';
import { FluentProvider, Spinner } from '@fluentui/react-components';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.js';
import { Layout } from './Layout.js';
import { themes } from './theme.js';
import { DocumentsPage } from '../features/DocumentsPage.js';
import { ShareDocumentPage } from '../features/ShareDocumentPage.js';
import { SignDocumentPage } from '../features/SignDocumentPage.js';
import { DocumentDetailsPage } from '../features/DocumentDetailsPage.js';
import { LoginPage, RegisterPage } from '../features/AuthPages.js';

function AuthRequired({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth(); const location = useLocation();
  if (loading) return <div className="auth-loading"><Spinner label="Restoring your session" /></div>;
  return user ? children : <Navigate to="/login" state={{ from: location.pathname }} replace />;
}

function AppRoutes() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    const saved = window.localStorage.getItem('app-theme');
    return saved === 'light' || saved === 'dark' ? saved : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  useEffect(() => { window.localStorage.setItem('app-theme', themeMode); document.documentElement.dataset.theme = themeMode; }, [themeMode]);
  useEffect(() => { const media = window.matchMedia('(prefers-color-scheme: dark)'); const update = (event: MediaQueryListEvent) => { if (!window.localStorage.getItem('app-theme')) setThemeMode(event.matches ? 'dark' : 'light'); }; media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  const toggle = () => setThemeMode((current) => current === 'light' ? 'dark' : 'light');
  return <FluentProvider theme={themes[themeMode]}><BrowserRouter><AuthProvider><Routes>
    <Route element={<Layout themeMode={themeMode} onToggleTheme={toggle} />}>
      <Route path="/" element={<AuthRequired><DocumentsPage /></AuthRequired>} />
      <Route path="/documents/new" element={<AuthRequired><ShareDocumentPage /></AuthRequired>} />
      <Route path="/documents/:id" element={<AuthRequired><DocumentDetailsPage /></AuthRequired>} />
      <Route path="/sign/:token" element={<SignDocumentPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes></AuthProvider></BrowserRouter></FluentProvider>;
}

export default function App() { return <AppRoutes />; }