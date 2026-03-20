import React, { memo, ReactNode } from 'react';
import { User } from 'lucide-react';
import './Sidebar.css';

export type TabId = 'overview' | 'intelligence' | 'credentials' | 'idle' | 'agents' | 'testing' | 'setup' | 'revenue' | 'backoffice' | 'wealth' | 'ideas' | 'googleai';

export interface Tab {
    id: TabId;
    name: string;
    icon: ReactNode;
    badge?: number;
    category?: 'main' | 'revenue' | 'labs' | 'system';
}

interface SidebarProps {
    activeTab: TabId;
    setActiveTab: (tab: TabId) => void;
    tabs: Tab[];
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    isMobile?: boolean;
    onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = memo(({
    activeTab,
    setActiveTab,
    tabs,
    isCollapsed,
    onToggleCollapse,
    isMobile,
    onCloseMobile
}) => {
    // Group tabs by category for better organization
    const groupedTabs = tabs.reduce((acc, tab) => {
        const category = tab.category || 'main';
        if (!acc[category]) acc[category] = [];
        acc[category].push(tab);
        return acc;
    }, {} as Record<string, Tab[]>);

    const categoryLabels: Record<string, string> = {
        main: 'Dashboard',
        revenue: 'Revenue & Finance',
        labs: 'Innovation Labs',
        system: 'System & Agents',
    };

    const handleTabClick = (tabId: TabId) => {
        setActiveTab(tabId);
        if (isMobile && onCloseMobile) {
            onCloseMobile();
        }
    };

    return (
        <aside className={`cyber-sidebar ${isCollapsed ? 'cyber-sidebar--collapsed' : ''} ${isMobile ? 'cyber-sidebar--mobile' : ''}`}>
            {/* Sidebar Header */}
            <div className="cyber-sidebar__header">
                <div className="cyber-sidebar__logo">
                    <img src="/assets/branding/dlx-brain-command-center.png" alt="DLX" className="cyber-sidebar__logo-img" />
                </div>
                {!isCollapsed && (
                    <div className="cyber-sidebar__brand animate-fade-in">
                        <span className="cyber-sidebar__title">DLX Ultimate</span>
                        <span className="cyber-sidebar__subtitle">Command Center</span>
                    </div>
                )}
                {!isMobile && (
                    <button
                        className="cyber-sidebar__toggle"
                        onClick={onToggleCollapse}
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? '»' : '«'}
                    </button>
                )}
            </div>

            {/* Navigation Content */}
            <div className="cyber-sidebar__content">
                {Object.entries(groupedTabs).map(([category, categoryTabs]) => (
                    <div key={category} className="cyber-sidebar__section">
                        {!isCollapsed && (
                            <h3 className="cyber-sidebar__section-title animate-fade-in">
                                {categoryLabels[category]}
                            </h3>
                        )}
                        <div className="cyber-sidebar__list">
                            {categoryTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabClick(tab.id)}
                                    className={`cyber-sidebar-item ${activeTab === tab.id ? 'cyber-sidebar-item--active' : ''}`}
                                    title={isCollapsed ? tab.name : ''}
                                >
                                    <span className="cyber-sidebar-item__icon">{tab.icon}</span>
                                    {!isCollapsed && (
                                        <span className="cyber-sidebar-item__label animate-fade-in">{tab.name}</span>
                                    )}
                                    {tab.badge && (
                                        <span className={`cyber-sidebar-item__badge ${isCollapsed ? 'cyber-sidebar-item__badge--dot' : ''}`}>
                                            {!isCollapsed ? tab.badge : ''}
                                        </span>
                                    )}
                                    {activeTab === tab.id && (
                                        <div className="cyber-sidebar-item__glow"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Sidebar Footer */}
            <div className="cyber-sidebar__footer">
                <button className="cyber-sidebar-item cyber-sidebar-item--footer">
                    <span className="cyber-sidebar-item__icon"><User size={18} /></span>
                    {!isCollapsed && <span className="cyber-sidebar-item__label">User Profile</span>}
                </button>
            </div>
        </aside>
    );
});

Sidebar.displayName = 'Sidebar';

