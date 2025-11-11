import { useState, lazy, Suspense } from 'react';
import { Settings as SettingsIcon, Key, Palette, Sliders, BookOpen, Info } from 'lucide-react';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import '../../styles/Settings.css';

// Lazy load settings sections
const APISettings = lazy(() => import('./APISettings'));
const GeneralSettings = lazy(() => import('./GeneralSettings'));
const AppearanceSettings = lazy(() => import('./AppearanceSettings'));
const AdvancedSettings = lazy(() => import('./AdvancedSettings'));
const TestingSettings = lazy(() => import('./TestingSettings'));
const AboutSettings = lazy(() => import('./AboutSettings'));

type SettingsSection = 'api' | 'general' | 'appearance' | 'advanced' | 'testing' | 'about';

function Settings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('api');

  const sections: { id: SettingsSection; label: string; icon: typeof SettingsIcon }[] = [
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'advanced', label: 'Advanced', icon: Sliders },
    { id: 'testing', label: 'Testing Tutorial', icon: BookOpen },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>
          <SettingsIcon size={24} />
          Settings
        </h1>
        <p className="settings-subtitle">Manage your application preferences and API keys</p>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          <nav className="settings-nav">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <Icon size={18} />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="settings-content">
          <ErrorBoundary sectionName={`Settings - ${sections.find(s => s.id === activeSection)?.label}`}>
            <Suspense
              fallback={
                <div className="loading-state" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '0.75rem' }}>
                  <div className="loading-spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(139, 92, 246, 0.3)', borderTopColor: 'var(--violet-500)', borderRadius: '50%' }}></div>
                  <span>Loading settings...</span>
                </div>
              }
            >
              {activeSection === 'api' && <APISettings />}
              {activeSection === 'general' && <GeneralSettings />}
              {activeSection === 'appearance' && <AppearanceSettings />}
              {activeSection === 'advanced' && <AdvancedSettings />}
              {activeSection === 'testing' && <TestingSettings />}
              {activeSection === 'about' && <AboutSettings />}
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

export default Settings;

