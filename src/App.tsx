import React from 'react';

function App() {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      backgroundColor: '#0F172A',
      color: '#F1F5F9',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          DLX Studios Ultimate
        </h1>
        <p style={{ fontSize: '1.5rem', color: '#CBD5E1' }}>
          VibDEEditor - AI-Native Development Platform
        </p>
        <p style={{ marginTop: '2rem', color: '#94A3B8' }}>
          Building with Intelligence... 🚀
        </p>
      </div>
    </div>
  );
}

export default App;

