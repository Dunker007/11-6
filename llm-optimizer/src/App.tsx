import { useState, useEffect } from 'react';
import SystemOverview from './components/SystemOverview';
import LLMDetection from './components/LLMDetection';
import BenchmarkRunner from './components/BenchmarkRunner';
import ModelLibrary from './components/ModelLibrary';
import BoltOptimizer from './components/BoltOptimizer';
import DevToolsManager from './components/DevToolsManager';
import FilesystemManager from './components/FilesystemManager';
import './styles/index.css';

type Tab = 'overview' | 'detection' | 'benchmark' | 'library' | 'bolt' | 'devtools' | 'filesystem';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 LLM Optimizer</h1>
        <p>Optimize your LM Studio/Ollama setup and benchmark models</p>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 System Overview
        </button>
        <button
          className={activeTab === 'detection' ? 'active' : ''}
          onClick={() => setActiveTab('detection')}
        >
          🔍 LLM Detection
        </button>
        <button
          className={activeTab === 'benchmark' ? 'active' : ''}
          onClick={() => setActiveTab('benchmark')}
        >
          ⚡ Benchmark
        </button>
        <button
          className={activeTab === 'library' ? 'active' : ''}
          onClick={() => setActiveTab('library')}
        >
          📚 Model Library
        </button>
        <button
          className={activeTab === 'bolt' ? 'active' : ''}
          onClick={() => setActiveTab('bolt')}
        >
          ⚙️ Bolt.diy Optimizer
        </button>
        <button
          className={activeTab === 'devtools' ? 'active' : ''}
          onClick={() => setActiveTab('devtools')}
        >
          🛠️ Dev Tools
        </button>
        <button
          className={activeTab === 'filesystem' ? 'active' : ''}
          onClick={() => setActiveTab('filesystem')}
        >
          💾 Filesystem
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'overview' && <SystemOverview />}
        {activeTab === 'detection' && <LLMDetection />}
        {activeTab === 'benchmark' && <BenchmarkRunner />}
        {activeTab === 'library' && <ModelLibrary />}
        {activeTab === 'bolt' && <BoltOptimizer />}
        {activeTab === 'devtools' && <DevToolsManager />}
        {activeTab === 'filesystem' && <FilesystemManager />}
      </main>
    </div>
  );
}

export default App;

