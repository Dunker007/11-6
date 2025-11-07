import '../styles/VibDEEditor.css';

function VibDEEditor() {
  return (
    <div className="vibdee-editor">
      <div className="editor-header">
        <div className="editor-tabs">
          <div className="editor-tab active">
            <span>Welcome</span>
          </div>
        </div>
      </div>
      <div className="editor-content">
        <div className="welcome-screen">
          <div className="welcome-logo">
            <img src="/vibdee-logo.svg" alt="VibDee" />
          </div>
          <h1>Welcome to VibDEEditor</h1>
          <p>Your AI-native development companion</p>
          <div className="welcome-actions">
            <button className="action-button primary">New Project</button>
            <button className="action-button">Open Project</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VibDEEditor;

