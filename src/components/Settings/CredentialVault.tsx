import React, { useState, useEffect } from 'react';
import { credentialVaultService, ServiceCredentials, ConnectionTest } from '../../services/credentials/credentialVaultService';

export const CredentialVault: React.FC = () => {
  const [credentials, setCredentials] = useState<ServiceCredentials[]>([]);
  const [editingService, setEditingService] = useState<ServiceCredentials | null>(null);
  const [testResults, setTestResults] = useState<Map<string, ConnectionTest>>(new Map());
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [filter, setFilter] = useState<'all' | ServiceCredentials['category']>('all');

  useEffect(() => {
    loadCredentials();

    const unsubscribe = credentialVaultService.onStatusChange(() => {
      loadCredentials();
    });

    return unsubscribe;
  }, []);

  const loadCredentials = () => {
    const allCreds = credentialVaultService.getAllCredentials();
    setCredentials(allCreds);
  };

  const handleEditService = (service: ServiceCredentials) => {
    setEditingService({ ...service });
  };

  const handleSaveCredentials = () => {
    if (!editingService) return;

    credentialVaultService.setCredentials(editingService.serviceId, editingService.credentials);
    setEditingService(null);
    loadCredentials();
  };

  const handleTestConnection = async (serviceId: string) => {
    const result = await credentialVaultService.testConnection(serviceId);
    setTestResults(prev => new Map(prev).set(serviceId, result));
    loadCredentials();
  };

  const handleTestAll = async () => {
    setIsTestingAll(true);
    const results = await credentialVaultService.testAllConnections();

    const resultMap = new Map<string, ConnectionTest>();
    results.forEach(r => resultMap.set(r.serviceId, r));
    setTestResults(resultMap);

    setIsTestingAll(false);
    loadCredentials();
  };

  const handleClearCredentials = (serviceId: string) => {
    if (confirm(`Clear credentials for ${serviceId}?`)) {
      credentialVaultService.clearCredentials(serviceId);
      loadCredentials();
    }
  };

  const handleExport = () => {
    const exported = credentialVaultService.exportCredentials();
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dlx-credentials-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const count = credentialVaultService.importCredentials(data);
        alert(`Imported ${count} credentials`);
        loadCredentials();
      } catch (error) {
        alert('Failed to import credentials');
      }
    };
    reader.readAsText(file);
  };

  const getStatusIcon = (status: ServiceCredentials['status']) => {
    switch (status) {
      case 'connected':
        return '🟢';
      case 'disconnected':
        return '🔴';
      case 'testing':
        return '🟡';
      case 'error':
        return '❌';
      default:
        return '⚪';
    }
  };

  const getStatusColor = (status: ServiceCredentials['status']) => {
    switch (status) {
      case 'connected':
        return '#10b981';
      case 'disconnected':
        return '#6b7280';
      case 'testing':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  };

  const filteredCredentials = filter === 'all'
    ? credentials
    : credentials.filter(c => c.category === filter);

  const stats = credentialVaultService.getConnectionStats();

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold' }}>🔐 Credential Vault</h1>
        <p style={{ margin: '0', color: '#6b7280' }}>Manage all your service connections and API credentials</p>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total}</div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Services</div>
        </div>
        <div style={{ padding: '20px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #10b981' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{stats.connected}</div>
          <div style={{ fontSize: '14px', color: '#059669' }}>Connected</div>
        </div>
        <div style={{ padding: '20px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #ef4444' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{stats.errors}</div>
          <div style={{ fontSize: '14px', color: '#dc2626' }}>Errors</div>
        </div>
        <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.disconnected}</div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Not Connected</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={handleTestAll}
          disabled={isTestingAll}
          style={{
            padding: '10px 20px',
            background: isTestingAll ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isTestingAll ? 'not-allowed' : 'pointer',
            fontWeight: '500',
          }}
        >
          {isTestingAll ? 'Testing All...' : '🔍 Test All Connections'}
        </button>

        <button
          onClick={handleExport}
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
          📥 Export Credentials
        </button>

        <label style={{ cursor: 'pointer' }}>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <div
            style={{
              padding: '10px 20px',
              background: '#8b5cf6',
              color: 'white',
              borderRadius: '6px',
              fontWeight: '500',
              display: 'inline-block',
            }}
          >
            📤 Import Credentials
          </div>
        </label>

        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          style={{
            padding: '10px 15px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            background: 'white',
          }}
        >
          <option value="all">All Categories</option>
          <option value="revenue">💰 Revenue</option>
          <option value="publishing">📝 Publishing</option>
          <option value="integration">🔗 Integrations</option>
          <option value="ai">🤖 AI</option>
          <option value="storage">💾 Storage</option>
        </select>
      </div>

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {filteredCredentials.map(service => {
          const testResult = testResults.get(service.serviceId);
          const hasCredentials = credentialVaultService.hasCredentials(service.serviceId);

          return (
            <div
              key={service.serviceId}
              style={{
                padding: '20px',
                background: 'white',
                border: `2px solid ${getStatusColor(service.status)}`,
                borderRadius: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    <span style={{ fontSize: '20px' }}>{getStatusIcon(service.status)}</span>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{service.serviceName}</h3>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '500' }}>
                    {service.category}
                  </div>
                </div>
                <div style={{
                  padding: '4px 8px',
                  background: getStatusColor(service.status),
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                }}>
                  {service.status.toUpperCase()}
                </div>
              </div>

              {service.lastError && (
                <div style={{ padding: '10px', background: '#fef2f2', borderRadius: '6px', marginBottom: '15px' }}>
                  <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '500' }}>Error</div>
                  <div style={{ fontSize: '12px', color: '#991b1b' }}>{service.lastError}</div>
                </div>
              )}

              {testResult && (
                <div style={{
                  padding: '10px',
                  background: testResult.success ? '#f0fdf4' : '#fef2f2',
                  borderRadius: '6px',
                  marginBottom: '15px',
                }}>
                  <div style={{ fontSize: '12px', color: testResult.success ? '#059669' : '#dc2626', fontWeight: '500' }}>
                    {testResult.message}
                  </div>
                  {testResult.latency && (
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                      Latency: {testResult.latency.toFixed(0)}ms
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                <button
                  onClick={() => handleEditService(service)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: hasCredentials ? '#f3f4f6' : '#3b82f6',
                    color: hasCredentials ? '#374151' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  {hasCredentials ? '⚙️ Configure' : '🔌 Connect'}
                </button>

                {hasCredentials && (
                  <>
                    <button
                      onClick={() => handleTestConnection(service.serviceId)}
                      disabled={service.status === 'testing'}
                      style={{
                        padding: '8px 12px',
                        background: service.status === 'testing' ? '#9ca3af' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: service.status === 'testing' ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      🧪
                    </button>

                    <button
                      onClick={() => handleClearCredentials(service.serviceId)}
                      style={{
                        padding: '8px 12px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>

              {service.lastTested && (
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '10px' }}>
                  Last tested: {new Date(service.lastTested).toLocaleString()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingService && (
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
            zIndex: 1000,
          }}
          onClick={() => setEditingService(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
          >
            <h2 style={{ margin: '0 0 20px 0' }}>Configure {editingService.serviceName}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {Object.keys(editingService.credentials).map(key => (
                <div key={key}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </label>
                  <input
                    type={key.includes('secret') || key.includes('password') || key.includes('key') ? 'password' : 'text'}
                    value={editingService.credentials[key]}
                    onChange={(e) => setEditingService({
                      ...editingService,
                      credentials: {
                        ...editingService.credentials,
                        [key]: e.target.value,
                      },
                    })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    placeholder={`Enter ${key}`}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button
                onClick={handleSaveCredentials}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Save Credentials
              </button>
              <button
                onClick={() => setEditingService(null)}
                style={{
                  padding: '12px 24px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
