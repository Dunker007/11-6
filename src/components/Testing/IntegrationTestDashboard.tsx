import React, { useState, useEffect } from 'react';
import {
  integrationTestService,
  TestSuite,
  IntegrationTest,
  FixSuggestion,
} from '../../services/testing/integrationTestService';

export const IntegrationTestDashboard: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [activeTest, setActiveTest] = useState<TestSuite | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [suggestions, setSuggestions] = useState<FixSuggestion[]>([]);

  useEffect(() => {
    loadTestSuites();
  }, []);

  const loadTestSuites = () => {
    const suites = integrationTestService.getAllTestSuites();
    setTestSuites(suites);

    if (suites.length > 0) {
      setActiveTest(suites[suites.length - 1]);
      setSuggestions(integrationTestService.getFixSuggestions(suites[suites.length - 1].id));
    }
  };

  const handleRunAllTests = async () => {
    setIsRunning(true);

    try {
      const suite = await integrationTestService.runAllConnectionTests();
      setActiveTest(suite);
      setSuggestions(integrationTestService.getFixSuggestions(suite.id));
      loadTestSuites();
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRetryFailed = async () => {
    if (!activeTest) return;

    setIsRunning(true);

    try {
      await integrationTestService.retryFailedTests(activeTest.id);
      const updated = integrationTestService.getTestSuite(activeTest.id);
      if (updated) {
        setActiveTest(updated);
        setSuggestions(integrationTestService.getFixSuggestions(updated.id));
      }
      loadTestSuites();
    } catch (error) {
      console.error('Error retrying tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportResults = () => {
    if (!activeTest) return;

    const report = integrationTestService.exportResults(activeTest.id);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integration-test-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: IntegrationTest['status']) => {
    switch (status) {
      case 'passed':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      case 'running':
        return '#f59e0b';
      case 'skipped':
        return '#6b7280';
      default:
        return '#9ca3af';
    }
  };

  const getStatusIcon = (status: IntegrationTest['status']) => {
    switch (status) {
      case 'passed':
        return '✅';
      case 'failed':
        return '❌';
      case 'running':
        return '⏳';
      case 'skipped':
        return '⏭️';
      default:
        return '⚪';
    }
  };

  const getPriorityColor = (priority: FixSuggestion['priority']) => {
    switch (priority) {
      case 'critical':
        return '#dc2626';
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#6b7280';
    }
  };

  if (!activeTest && testSuites.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🧪</div>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '24px' }}>Integration Testing</h2>
        <p style={{ color: '#6b7280', marginBottom: '30px', maxWidth: '500px', margin: '0 auto 30px' }}>
          Test all your service connections and integrations. Get detailed reports and fix suggestions.
        </p>
        <button
          onClick={handleRunAllTests}
          disabled={isRunning}
          style={{
            padding: '15px 40px',
            background: isRunning ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isRunning ? 'not-allowed' : 'pointer',
          }}
        >
          {isRunning ? '⏳ Running Tests...' : '🧪 Run All Connection Tests'}
        </button>
      </div>
    );
  }

  const summary = activeTest ? integrationTestService.getTestSummary(activeTest.id) : null;

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold' }}>
          🧪 Integration Testing Dashboard
        </h1>
        <p style={{ margin: 0, color: '#6b7280' }}>
          Test and monitor all service connections
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <button
          onClick={handleRunAllTests}
          disabled={isRunning}
          style={{
            padding: '12px 24px',
            background: isRunning ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: '600',
          }}
        >
          {isRunning ? '⏳ Running...' : '🧪 Test All Connections'}
        </button>

        {activeTest && activeTest.failedCount > 0 && (
          <button
            onClick={handleRetryFailed}
            disabled={isRunning}
            style={{
              padding: '12px 24px',
              background: isRunning ? '#9ca3af' : '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontWeight: '600',
            }}
          >
            🔄 Retry Failed Tests
          </button>
        )}

        {activeTest && (
          <button
            onClick={handleExportResults}
            style={{
              padding: '12px 24px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            📥 Export Report
          </button>
        )}
      </div>

      {/* Summary Stats */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Total Tests</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{summary.total}</div>
          </div>

          <div style={{ padding: '20px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #10b981' }}>
            <div style={{ fontSize: '14px', color: '#059669', marginBottom: '5px' }}>Passed</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{summary.passed}</div>
          </div>

          <div style={{ padding: '20px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #ef4444' }}>
            <div style={{ fontSize: '14px', color: '#dc2626', marginBottom: '5px' }}>Failed</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>{summary.failed}</div>
          </div>

          <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Pass Rate</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: summary.passRate >= 80 ? '#10b981' : '#ef4444' }}>
              {summary.passRate.toFixed(1)}%
            </div>
          </div>

          <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Avg Duration</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{summary.avgDuration.toFixed(0)}ms</div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {activeTest && activeTest.status === 'running' && (
        <div style={{ marginBottom: '25px', padding: '20px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>Running Tests...</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
              {activeTest.progress.toFixed(0)}%
            </span>
          </div>
          <div style={{ height: '10px', background: '#dbeafe', borderRadius: '5px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${activeTest.progress}%`,
                background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      )}

      {/* Fix Suggestions */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>🔧 Fix Suggestions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {suggestions.map(suggestion => (
              <div
                key={suggestion.testId}
                style={{
                  padding: '20px',
                  background: 'white',
                  border: `2px solid ${getPriorityColor(suggestion.priority)}`,
                  borderRadius: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'start', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <div
                        style={{
                          padding: '4px 10px',
                          background: getPriorityColor(suggestion.priority),
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                        }}
                      >
                        {suggestion.priority}
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: '600' }}>{suggestion.serviceId}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>{suggestion.issue}</div>
                  </div>
                  {suggestion.autoFixAvailable && (
                    <button
                      style={{
                        padding: '8px 16px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      🔧 Auto-Fix
                    </button>
                  )}
                </div>

                {suggestion.suggestions.length > 0 && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                      Suggestions:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#6b7280' }}>
                      {suggestion.suggestions.map((s, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Results */}
      {activeTest && (
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>📋 Test Results</h2>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    STATUS
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    SERVICE
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    TEST
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    RESULT
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    DURATION
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeTest.tests.map((test, idx) => (
                  <tr key={test.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          background: `${getStatusColor(test.status)}20`,
                          color: getStatusColor(test.status),
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        <span>{getStatusIcon(test.status)}</span>
                        <span>{test.status.toUpperCase()}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                      {test.serviceName}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                      {test.testName}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {test.result?.message || '-'}
                      {test.result?.error && (
                        <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                          {test.result.error}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', textAlign: 'right' }}>
                      {test.duration ? `${test.duration}ms` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
