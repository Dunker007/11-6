/**
 * MobileNav.tsx
 *
 * Mobile bottom navigation bar and hamburger menu
 */

import React from 'react';
import './MobileNav.css';

interface MobileNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeView, onNavigate }) => {
  return (
    <nav className="mobile-bottom-nav">
      <button
        className={`mobile-bottom-nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
        onClick={() => onNavigate('dashboard')}
      >
        <span className="mobile-bottom-nav-icon">🏠</span>
        <span>Dashboard</span>
      </button>

      <button
        className={`mobile-bottom-nav-item ${activeView === 'creator' ? 'active' : ''}`}
        onClick={() => onNavigate('creator')}
      >
        <span className="mobile-bottom-nav-icon">✍️</span>
        <span>Create</span>
      </button>

      <button
        className={`mobile-bottom-nav-item ${activeView === 'revenue' ? 'active' : ''}`}
        onClick={() => onNavigate('revenue')}
      >
        <span className="mobile-bottom-nav-icon">💰</span>
        <span>Revenue</span>
      </button>

      <button
        className={`mobile-bottom-nav-item ${activeView === 'settings' ? 'active' : ''}`}
        onClick={() => onNavigate('settings')}
      >
        <span className="mobile-bottom-nav-icon">⚙️</span>
        <span>Settings</span>
      </button>
    </nav>
  );
};

export default MobileNav;
