import { useState } from 'react';
import FinancialDashboard from './FinancialDashboard';
import UserProfile from './UserProfile';
import '../../styles/BackOffice.css';

type BackOfficeTab = 'financial' | 'profile';

function BackOffice() {
  const [activeTab, setActiveTab] = useState<BackOfficeTab>('financial');

  return (
    <div className="back-office">
      <div className="back-office-tabs">
        <button
          className={`tab ${activeTab === 'financial' ? 'active' : ''}`}
          onClick={() => setActiveTab('financial')}
        >
          💰 Financial
        </button>
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile
        </button>
      </div>

      <div className="back-office-content">
        {activeTab === 'financial' && <FinancialDashboard />}
        {activeTab === 'profile' && <UserProfile />}
      </div>
    </div>
  );
}

export default BackOffice;

