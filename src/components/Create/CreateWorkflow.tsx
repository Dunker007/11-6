import '../../styles/CreateWorkflow.css';

function CreateWorkflow() {
  return (
    <div className="create-workflow">
      <div className="workflow-placeholder-content">
        <h2>Create Workflow</h2>
        <p>Start a new project from templates or use AI to generate one</p>
        <div className="create-options">
          <div className="create-option">
            <div className="option-icon">📋</div>
            <h3>Templates</h3>
            <p>Choose from pre-built project templates</p>
            <button className="option-button">Browse Templates</button>
          </div>
          <div className="create-option">
            <div className="option-icon">🤖</div>
            <h3>AI Generator</h3>
            <p>Describe your project and let AI create it</p>
            <button className="option-button">Generate with AI</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateWorkflow;

