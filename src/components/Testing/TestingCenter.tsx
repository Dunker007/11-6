import React, { useState, useCallback } from 'react';
import { programService } from '@/services/program/programService';
import { Button } from '../ui/Button';
import { Play, Loader, CheckCircle, XCircle, ListChecks } from '@/components/Icons/icons';
import '../../styles/TestingCenter.css';

type TestStatus = 'idle' | 'running' | 'completed' | 'error';

const TEST_STATS = {
  planned: {
    unit: 15,
    component: 20,
    integration: 5,
  },
  completed: {
    unit: 3, // formatters, storeHelpers, apiKeyService
    component: 0,
    integration: 0,
  },
};

const TestingCenter: React.FC = () => {
  const [testOutput, setTestOutput] = useState<string>('');
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');

  const runTests = useCallback(async () => {
    setTestStatus('running');
    setTestOutput('');

    try {
      const execution = await programService.execute('npm test');
      
      if (!execution) {
        setTestOutput('Failed to execute tests.');
        setTestStatus('error');
        return;
      }

      const output = execution.output.join('\n');
      const errorOutput = execution.error || '';
      
      if (execution.exitCode === 0) {
        setTestOutput(output);
        setTestStatus('completed');
      } else {
        setTestOutput(output + '\n' + errorOutput);
        setTestStatus('error');
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setTestOutput(errorMessage);
      setTestStatus('error');
    }
  }, []);

  const getProgress = (type: 'unit' | 'component' | 'integration') => {
    const { planned, completed } = TEST_STATS;
    if (planned[type] === 0) return 0;
    return (completed[type] / planned[type]) * 100;
  };

  return (
    <div className="testing-center">
      <header className="testing-center-header">
        <h2>Testing Center</h2>
        <Button onClick={runTests} disabled={testStatus === 'running'} variant="primary">
          {testStatus === 'running' ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <Play size={16} />
          )}
          Run All Tests
        </Button>
      </header>

      <div className="test-dashboard">
        <section className="test-progress">
          <h3>Test Suite Progress</h3>
          <div className="progress-grid">
            <div className="progress-item">
              <div className="progress-label">Unit Tests</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${getProgress('unit')}%` }} />
              </div>
              <div className="progress-text">{TEST_STATS.completed.unit} / {TEST_STATS.planned.unit}</div>
            </div>
            <div className="progress-item">
              <div className="progress-label">Component Tests</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${getProgress('component')}%` }} />
              </div>
              <div className="progress-text">{TEST_STATS.completed.component} / {TEST_STATS.planned.component}</div>
            </div>
            <div className="progress-item">
              <div className="progress-label">Integration Tests</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${getProgress('integration')}%` }} />
              </div>
              <div className="progress-text">{TEST_STATS.completed.integration} / {TEST_STATS.planned.integration}</div>
            </div>
          </div>
        </section>

        <section className="upcoming-tests">
          <h3>Upcoming Tests</h3>
          <ul>
            <li><ListChecks size={16} /> Component: ErrorBoundary</li>
            <li><ListChecks size={16} /> Component: Button</li>
            <li><ListChecks size={16} /> Component: Modal</li>
            <li><ListChecks size={16} /> Component: ActivityFeed</li>
            <li><ListChecks size={16} /> Service: llmRouter</li>
          </ul>
        </section>
      </div>

      <section className="test-output">
        <div className="output-header">
          <h3>Test Results</h3>
          <div className={`status-badge ${testStatus}`}>
            {testStatus === 'idle' && 'Waiting to run'}
            {testStatus === 'running' && <><Loader size={14} className="animate-spin" /> Running...</>}
            {testStatus === 'completed' && <><CheckCircle size={14} /> All tests passed</>}
            {testStatus === 'error' && <><XCircle size={14} /> Tests failed</>}
          </div>
        </div>
        <pre className="output-console">
          {testOutput || 'Click "Run All Tests" to see the output.'}
        </pre>
      </section>
    </div>
  );
};

export default TestingCenter;
