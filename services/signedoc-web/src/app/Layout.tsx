import { useState } from 'react';
import { Avatar, Button, Card, CardHeader, Divider, MessageBar, MessageBarBody, Subtitle1, Tab, TabList, Toolbar, Tooltip } from '@fluentui/react-components';
import { AddRegular, ArrowExitRegular, CheckmarkCircleRegular, DocumentRegular, WeatherMoonRegular, WeatherSunnyRegular } from '@fluentui/react-icons';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.js';

interface LayoutProps { themeMode: 'light' | 'dark'; onToggleTheme(): void }

export function Layout({ themeMode, onToggleTheme }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [banner, setBanner] = useState('');
  const signOut = async () => { await logout(); setBanner('You have signed out of this local session.'); navigate('/login'); };
  return <div className="app-shell">
    <header className="topbar">
      <Link to="/" className="brand-lockup" aria-label="SingEDoc home"><span className="brand-mark"><DocumentRegular /></span><span className="brand-name">SingEDoc</span><span className="brand-divider" /><span className="brand-caption">Signing workspace</span></Link>
      <Toolbar className="topbar-actions">
        <Tooltip content={themeMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} relationship="label"><Button appearance="subtle" aria-label="Toggle color theme" icon={themeMode === 'light' ? <WeatherMoonRegular /> : <WeatherSunnyRegular />} onClick={onToggleTheme} /></Tooltip>
        {user ? <><Avatar name={user.displayName} color="brand" size={32} /><span className="user-name">{user.displayName}</span><Button appearance="subtle" icon={<ArrowExitRegular />} onClick={() => void signOut()}>Sign out</Button></> : <Button appearance="subtle" as="a" href="/login">Sign in</Button>}
      </Toolbar>
    </header>
    {user && <nav className="navigation" aria-label="Main navigation"><TabList selectedValue={location.pathname === '/documents/new' ? 'share' : location.pathname.startsWith('/documents/') ? 'activity' : 'documents'}>
      <Tab value="documents" icon={<DocumentRegular />} onClick={() => navigate('/')}>Documents</Tab>
      <Tab value="share" icon={<AddRegular />} onClick={() => navigate('/documents/new')}>Share a document</Tab>
      <Tab value="activity" icon={<CheckmarkCircleRegular />} onClick={() => navigate('/')}>Activity</Tab>
    </TabList></nav>}
    {banner && <MessageBar intent="success" className="banner"><MessageBarBody>{banner}</MessageBarBody></MessageBar>}
    <main className="page-content"><Outlet /></main>
    <footer className="footer"><Divider /><div><span>© 2026 SingEDoc</span><span>Private by design · MVP signing workflow</span><span className="footer-disclaimer">Electronic signature validity and legal compliance are not guaranteed.</span></div></footer>
  </div>;
}

export function PageHeader({ title, description, backTo }: { title: string; description: string; backTo?: string }) {
  return <div className="page-heading">{backTo && <Button as="a" href={backTo} appearance="subtle" className="back-link">← All documents</Button>}<Subtitle1>{title}</Subtitle1><p>{description}</p></div>;
}

export function TrustNote() {
  return <Card className="trust-note" appearance="filled-alternative"><CardHeader header={<span>Signing MVP notice</span>} description={<span>This workflow records a typed signature and timestamp. It does not guarantee legal enforceability or regulatory compliance.</span>} /></Card>;
}