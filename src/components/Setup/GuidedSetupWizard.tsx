import React, { useState, useEffect } from 'react';
import { guidedSetupService, ServiceSetup, SetupStep } from '../../services/setup/guidedSetupService';

interface Props {
  serviceId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export const GuidedSetupWizard: React.FC<Props> = ({ serviceId, onComplete, onCancel }) => {
  const [setup, setSetup] = useState<ServiceSetup | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    guidedSetupService.initializeSetups();
    const setupData = guidedSetupService.getSetup(serviceId);
    setSetup(setupData || null);
  }, [serviceId]);

  if (!setup) {
    return <div>Loading setup...</div>;
  }

  const currentStep = setup.steps[setup.currentStep];

  const handleNext = () => {
    guidedSetupService.nextStep(serviceId);
    setSetup({ ...guidedSetupService.getSetup(serviceId)! });
  };

  const handleBack = () => {
    guidedSetupService.previousStep(serviceId);
    setSetup({ ...guidedSetupService.getSetup(serviceId)! });
    setTestResult(null);
  };

  const handleSaveCredentials = () => {
    guidedSetupService.saveCredentials(serviceId, credentials);
    handleNext();
  };

  const handleTest = async () => {
    setTesting(true);
    const success = await guidedSetupService.testSetup(serviceId);
    setTesting(false);

    setTestResult({
      success,
      message: success ? 'Connection successful!' : 'Connection failed. Please check your credentials.',
    });

    if (success) {
      setTimeout(() => {
        handleNext();
      }, 1500);
    }
  };

  const handleComplete = () => {
    guidedSetupService.completeSetup(serviceId);
    onComplete?.();
  };

  const renderCheckStep = () => (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>🤔</div>
      <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>{currentStep.title}</h3>
      <p style={{ color: '#6b7280', marginBottom: '40px' }}>{currentStep.description}</p>

      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <button
          onClick={() => {
            setHasAccount(true);
            handleNext();
          }}
          style={{
            padding: '15px 40px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          ✅ Yes, I have an account
        </button>

        <button
          onClick={() => {
            setHasAccount(false);
            window.open(setup.signupUrl, '_blank');
          }}
          style={{
            padding: '15px 40px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          🚀 No, create one now
        </button>
      </div>

      {!hasAccount && hasAccount !== null && (
        <div style={{ marginTop: '30px', padding: '20px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #10b981' }}>
          <p style={{ margin: '0 0 15px 0', color: '#059669' }}>
            ✨ We've opened the signup page in a new tab. Come back here when you're ready!
          </p>
          <button
            onClick={() => {
              setHasAccount(true);
              handleNext();
            }}
            style={{
              padding: '10px 20px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            I've created my account →
          </button>
        </div>
      )}

      {setup.canAutoCreate && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #3b82f6' }}>
          <div style={{ fontSize: '14px', color: '#1e40af' }}>
            💡 <strong>Pro tip:</strong> We can help you create an account automatically!
          </div>
        </div>
      )}
    </div>
  );

  const renderCredentialsStep = () => {
    const fields = currentStep.data?.fields || [];

    return (
      <div style={{ padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '40px', marginBottom: '15px' }}>🔑</div>
          <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>{currentStep.title}</h3>
          <p style={{ color: '#6b7280', marginBottom: '10px' }}>{currentStep.description}</p>
          {setup.docsUrl && (
            <a
              href={setup.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#3b82f6', fontSize: '14px', textDecoration: 'none' }}
            >
              📚 View Documentation →
            </a>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px', margin: '0 auto' }}>
          {fields.map((field: any) => (
            <div key={field.name}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                {field.label}
              </label>
              <input
                type={field.type}
                value={credentials[field.name] || ''}
                onChange={(e) => setCredentials({ ...credentials, [field.name]: e.target.value })}
                placeholder={field.placeholder}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>
          ))}

          <button
            onClick={handleSaveCredentials}
            disabled={!Object.values(credentials).some(v => v)}
            style={{
              padding: '12px',
              background: Object.values(credentials).some(v => v) ? '#3b82f6' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: Object.values(credentials).some(v => v) ? 'pointer' : 'not-allowed',
              marginTop: '10px',
            }}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  };

  const renderTestStep = () => (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>
        {testing ? '⏳' : testResult?.success ? '✅' : '🧪'}
      </div>
      <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>{currentStep.title}</h3>
      <p style={{ color: '#6b7280', marginBottom: '30px' }}>{currentStep.description}</p>

      {!testing && !testResult && (
        <button
          onClick={handleTest}
          style={{
            padding: '15px 40px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          🧪 Test Connection
        </button>
      )}

      {testing && (
        <div style={{ padding: '20px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #3b82f6' }}>
          <div style={{ fontSize: '16px', color: '#1e40af', fontWeight: '500' }}>Testing connection...</div>
        </div>
      )}

      {testResult && (
        <div
          style={{
            padding: '20px',
            background: testResult.success ? '#f0fdf4' : '#fef2f2',
            borderRadius: '8px',
            border: `1px solid ${testResult.success ? '#10b981' : '#ef4444'}`,
          }}
        >
          <div style={{ fontSize: '16px', color: testResult.success ? '#059669' : '#dc2626', fontWeight: '500', marginBottom: '10px' }}>
            {testResult.message}
          </div>

          {!testResult.success && (
            <button
              onClick={handleBack}
              style={{
                padding: '10px 20px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                marginTop: '10px',
              }}
            >
              ← Go Back and Fix Credentials
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderSuccessStep = () => (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
      <h3 style={{ fontSize: '24px', marginBottom: '10px', color: '#10b981' }}>{currentStep.title}</h3>
      <p style={{ color: '#6b7280', marginBottom: '40px', fontSize: '16px' }}>{currentStep.description}</p>

      <button
        onClick={handleComplete}
        style={{
          padding: '15px 40px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '500',
          cursor: 'pointer',
        }}
      >
        ✨ Finish Setup
      </button>
    </div>
  );

  const renderStep = () => {
    switch (currentStep.type) {
      case 'check':
        return renderCheckStep();
      case 'credentials':
        return renderCredentialsStep();
      case 'test':
        return renderTestStep();
      case 'success':
        return renderSuccessStep();
      default:
        return <div>Unknown step type</div>;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '25px 30px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 5px 0', fontSize: '22px' }}>Setup {setup.serviceName}</h2>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                ⏱️ Estimated time: {setup.estimatedTime} minutes
              </div>
            </div>
            <button
              onClick={onCancel}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress */}
        <div style={{ padding: '20px 30px', background: '#fafafa' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {setup.steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div
                  style={{
                    flex: 1,
                    height: '8px',
                    background: idx <= setup.currentStep ? '#3b82f6' : '#e5e7eb',
                    borderRadius: '4px',
                    transition: 'background 0.3s',
                  }}
                />
              </React.Fragment>
            ))}
          </div>
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
            Step {setup.currentStep + 1} of {setup.steps.length}
          </div>
        </div>

        {/* Content */}
        <div style={{ minHeight: '300px' }}>{renderStep()}</div>

        {/* Footer */}
        {setup.currentStep > 0 && currentStep.type !== 'success' && (
          <div style={{ padding: '20px 30px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <button
              onClick={handleBack}
              style={{
                padding: '10px 20px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const SetupLauncher: React.FC = () => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [setups, setSetups] = useState<ServiceSetup[]>([]);

  useEffect(() => {
    guidedSetupService.initializeSetups();
    setSetups(guidedSetupService.getAllSetups());
  }, []);

  if (selectedService) {
    return (
      <GuidedSetupWizard
        serviceId={selectedService}
        onComplete={() => {
          setSelectedService(null);
          setSetups(guidedSetupService.getAllSetups());
        }}
        onCancel={() => setSelectedService(null)}
      />
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>🚀 Quick Setup</h2>
      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        Connect your services with our step-by-step guided setup wizards
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
        {setups.map(setup => (
          <div
            key={setup.serviceId}
            style={{
              padding: '20px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={() => setSelectedService(setup.serviceId)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{setup.serviceName}</h3>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '15px' }}>
              ⏱️ {setup.estimatedTime} min setup
            </div>
            <button
              style={{
                width: '100%',
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Start Setup →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
