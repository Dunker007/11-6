import { useState } from 'react';
import FinancialDashboard from './FinancialDashboard';
import UserProfile from './UserProfile';
import WorkflowHeader from '../shared/WorkflowHeader';
import CommandCard from '../shared/CommandCard';
import TechIcon from '../Icons/TechIcon';
import { DollarSign, User } from 'lucide-react';
import '../../styles/BackOffice.css';

type BackOfficeTab = 'financial' | 'profile';

function BackOffice() {
  const [activeTab, setActiveTab] = useState<BackOfficeTab>('financial');

  return (
    <div className="back-office command-center-layout">
      <WorkflowHeader
        title="BACK OFFICE"
        breadcrumbs={['Admin', 'Management']}
      />

      <div className="back-office-tab-nav">
        <CommandCard
          variant="cyan"
          clickable
          onClick={() => setActiveTab('financial')}
          className={activeTab === 'financial' ? 'active' : ''}
        >
          <div className="tab-content">
            <TechIcon
              icon={DollarSign}
              size={32}
              glow="green"
              animated={activeTab === 'financial'}
            />
            <h3>Financial Dashboard</h3>
            <p>Revenue, expenses, and financial metrics</p>
          </div>
        </CommandCard>

        <CommandCard
          variant="violet"
          clickable
          onClick={() => setActiveTab('profile')}
          className={activeTab === 'profile' ? 'active' : ''}
        >
          <div className="tab-content">
            <TechIcon
              icon={User}
              size={32}
              glow="violet"
              animated={activeTab === 'profile'}
            />
            <h3>User Profile</h3>
            <p>Account settings and preferences</p>
          </div>
        </CommandCard>
      </div>

      <div className="back-office-content">
        {activeTab === 'financial' && <FinancialDashboard />}
        {activeTab === 'profile' && <UserProfile />}
      </div>
    </div>
  );
}

export default BackOffice;
