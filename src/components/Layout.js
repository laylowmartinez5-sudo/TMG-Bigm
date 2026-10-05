import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InstallPrompt from './InstallPrompt';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/releases', label: 'Releases', icon: '💿' },
  { to: '/analytics', label: 'Analytics', icon: '📈' },
  { to: '/royalties', label: 'Royalties', icon: '💰' },
  { to: '/bitcoin', label: 'Bitcoin', icon: '₿' },
  { to: '/player', label: 'Player', icon: '🎧' },
];

const TITLES = {
  '/': 'Dashboard',
  '/releases': 'Releases',
  '/analytics': 'Analytics',
  '/royalties': 'Royalties',
  '/bitcoin': 'Bitcoin (watch-only)',
  '/player': 'Player',
};

function titleFor(pathname) {
  if (pathname.startsWith('/releases/')) return 'Release detail';
  return TITLES[pathname] || 'TMG';
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          TMG
          <small>TRACKILLAZ MUSIC GLOBAL</small>
        </div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            <span role="img" aria-hidden="true">{item.icon} </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
        <div className="sidebar-spacer" />
        <div className="sidebar-user">
          <div className="user-email">{user?.email || user?.name || 'Signed in'}</div>
          <button className="btn btn-secondary btn-small logout-btn" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <div className="main">
        <InstallPrompt />
        <header className="topbar">
          <h1>Trackillaz Music Global</h1>
        </header>
        <div className="page">
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>{titleFor(location.pathname)}</h2>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
