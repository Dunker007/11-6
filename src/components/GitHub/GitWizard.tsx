import { useState } from 'react';
import { useGitHubStore } from '../../services/github/githubStore';
import { useFileSystemStore } from '../../services/filesystem/fileSystemStore';
import { useToast } from '@/components/ui';
import { CheckCircle2, Circle, ArrowRight, GitBranch, GitCommit, GitMerge, Upload } from 'lucide-react';
import '../../styles/GitWizard.css';

type WizardStep = 'select' | 'setup' | 'first-commit' | 'push' | 'pull-request';

interface WizardStepConfig {
  id: WizardStep;
  title: string;
  description: string;
}

const wizardSteps: WizardStepConfig[] = [
  {
    id: 'setup',
    title: 'First Time Setup',
    description: 'Initialize a repository and connect to GitHub',
  },
  {
    id: 'first-commit',
    title: 'Make Your First Commit',
    description: 'Stage, commit, and save your changes',
  },
  {
    id: 'push',
    title: 'Push to GitHub',
    description: 'Upload your commits to GitHub',
  },
  {
    id: 'pull-request',
    title: 'Create Pull Request',
    description: 'Create a pull request to merge your changes',
  },
];

function GitWizard() {
  const [activeWizard, setActiveWizard] = useState<WizardStep | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [repoPath, setRepoPath] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [prTitle, setPrTitle] = useState('');
  const [prDescription, setPrDescription] = useState('');

  const {
    isAuthenticated,
    initRepository,
    commit,
    push,
    createPullRequest,
    getStatus,
    currentRepository,
  } = useGitHubStore();

  const { currentDirectory, openDirectoryDialog } = useFileSystemStore();
  const { showToast } = useToast();

  const handleSelectPath = async () => {
    const paths = await openDirectoryDialog();
    if (paths && paths[0]) {
      setRepoPath(paths[0]);
    }
  };

  const handleSetup = async () => {
    if (!repoPath) {
      const paths = await openDirectoryDialog();
      if (paths && paths[0]) {
        setRepoPath(paths[0]);
        await initRepository(paths[0]);
      }
    } else {
      await initRepository(repoPath);
    }
    setCurrentStep(1);
  };

  const handleFirstCommit = async () => {
    if (!commitMessage.trim()) {
      showToast({
        variant: 'warning',
        title: 'Commit message required',
        message: 'Please enter a commit message',
      });
      return;
    }
    const path = repoPath || currentDirectory;
    if (!path) {
      showToast({
        variant: 'warning',
        title: 'Repository path required',
        message: 'Please select a repository path',
      });
      return;
    }
    await commit(path, commitMessage);
    setCurrentStep(2);
  };

  const handlePush = async () => {
    const path = repoPath || currentDirectory;
    if (!path) {
      showToast({
        variant: 'warning',
        title: 'Repository path required',
        message: 'Please select a repository path',
      });
      return;
    }
    await push(path);
    setCurrentStep(3);
  };

  const handleCreatePR = async () => {
    if (!prTitle.trim()) {
      showToast({
        variant: 'warning',
        title: 'PR title required',
        message: 'Please enter a PR title',
      });
      return;
    }
    
    if (!currentRepository) {
      showToast({
        variant: 'warning',
        title: 'Repository required',
        message: 'Please select a repository first',
      });
      return;
    }

    const [owner, repo] = currentRepository.fullName.split('/');
    if (!owner || !repo) {
      showToast({
        variant: 'error',
        title: 'Invalid repository format',
        message: 'Repository format should be owner/repo',
      });
      return;
    }

    const path = repoPath || currentDirectory;
    if (!path) {
      showToast({
        variant: 'warning',
        title: 'Repository path required',
        message: 'Please select a repository path',
      });
      return;
    }

    // Get current branch from status - now returns the status directly
    const currentStatus = await getStatus(path);
    if (!currentStatus) {
      showToast({
        variant: 'error',
        title: 'Failed to get repository status',
        message: 'Could not get repository status',
      });
      return;
    }

    try {
      await createPullRequest(
        owner,
        repo,
        prTitle,
        prDescription || `Pull request: ${prTitle}`,
        'main', // base branch
        currentStatus.branch // head branch
      );
      setCurrentStep(2);
      showToast({
        variant: 'success',
        title: 'Pull request created',
        message: 'Pull request created successfully!',
        duration: 4000,
      });
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to create pull request',
        message: (error as Error).message,
      });
    }
  };

  const renderWizardContent = () => {
    if (!activeWizard) {
      return (
        <div className="wizard-selector">
          <h2>Git Workflow Wizards</h2>
          <p>Choose a workflow to get started</p>
          <div className="wizard-cards">
            {wizardSteps.map((step) => (
              <div
                key={step.id}
                className="wizard-card"
                onClick={() => {
                  setActiveWizard(step.id);
                  setCurrentStep(0);
                }}
              >
                <div className="wizard-card-icon">
                  {step.id === 'setup' && <GitBranch size={32} />}
                  {step.id === 'first-commit' && <GitCommit size={32} />}
                  {step.id === 'push' && <Upload size={32} />}
                  {step.id === 'pull-request' && <GitMerge size={32} />}
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <ArrowRight size={20} className="wizard-card-arrow" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeWizard === 'setup') {
      return (
        <div className="wizard-content">
          <div className="wizard-header">
            <h2>First Time Setup</h2>
            <button onClick={() => setActiveWizard(null)}>← Back</button>
          </div>

          <div className="wizard-steps">
            <div className={`wizard-step ${currentStep >= 0 ? 'active' : ''}`}>
              <div className="step-indicator">
                {currentStep > 0 ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </div>
              <div className="step-content">
                <h3>Step 1: Select Repository Path</h3>
                <p>Choose where to initialize your Git repository</p>
                <div className="step-actions">
                  <input
                    type="text"
                    value={repoPath || currentDirectory || ''}
                    placeholder="Repository path"
                    readOnly
                    className="path-input"
                  />
                  <button onClick={handleSelectPath}>Browse</button>
                </div>
              </div>
            </div>

            <div className={`wizard-step ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="step-indicator">
                {currentStep > 1 ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </div>
              <div className="step-content">
                <h3>Step 2: Initialize Repository</h3>
                <p>Create a new Git repository in the selected folder</p>
                <div className="step-actions">
                  <button onClick={handleSetup} disabled={!repoPath && !currentDirectory}>
                    Initialize Repository
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeWizard === 'first-commit') {
      return (
        <div className="wizard-content">
          <div className="wizard-header">
            <h2>Make Your First Commit</h2>
            <button onClick={() => setActiveWizard(null)}>← Back</button>
          </div>

          <div className="wizard-steps">
            <div className={`wizard-step ${currentStep >= 0 ? 'active' : ''}`}>
              <div className="step-indicator">
                {currentStep > 0 ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </div>
              <div className="step-content">
                <h3>Step 1: Write Commit Message</h3>
                <p>Describe what changes you're committing</p>
                <div className="step-actions">
                  <textarea
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="e.g., Add login page"
                    className="commit-message-input"
                  />
                </div>
              </div>
            </div>

            <div className={`wizard-step ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="step-indicator">
                {currentStep > 1 ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </div>
              <div className="step-content">
                <h3>Step 2: Commit Changes</h3>
                <p>Save your changes to the repository</p>
                <div className="step-actions">
                  <button onClick={handleFirstCommit} disabled={!commitMessage.trim()}>
                    Commit Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeWizard === 'push') {
      return (
        <div className="wizard-content">
          <div className="wizard-header">
            <h2>Push to GitHub</h2>
            <button onClick={() => setActiveWizard(null)}>← Back</button>
          </div>

          <div className="wizard-steps">
            <div className={`wizard-step ${currentStep >= 0 ? 'active' : ''}`}>
              <div className="step-indicator">
                {currentStep > 0 ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </div>
              <div className="step-content">
                <h3>Step 1: Review Changes</h3>
                <p>Make sure you've committed all your changes</p>
                <div className="step-actions">
                  <button onClick={async () => {
                    const path = repoPath || currentDirectory;
                    if (path) await getStatus(path);
                  }}>
                    Check Status
                  </button>
                </div>
              </div>
            </div>

            <div className={`wizard-step ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="step-indicator">
                {currentStep > 1 ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </div>
              <div className="step-content">
                <h3>Step 2: Push to GitHub</h3>
                <p>Upload your commits to the remote repository</p>
                <div className="step-actions">
                  <button onClick={handlePush}>
                    Push to GitHub
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeWizard === 'pull-request') {
      return (
        <div className="wizard-content">
          <div className="wizard-header">
            <h2>Create Pull Request</h2>
            <button onClick={() => setActiveWizard(null)}>← Back</button>
          </div>

          <div className="wizard-steps">
            <div className={`wizard-step ${currentStep >= 0 ? 'active' : ''}`}>
              <div className="step-indicator">
                {currentStep > 0 ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </div>
              <div className="step-content">
                <h3>Step 1: Enter PR Details</h3>
                <p>Provide a title and description for your pull request</p>
                <div className="step-actions">
                  <input
                    type="text"
                    value={prTitle}
                    onChange={(e) => setPrTitle(e.target.value)}
                    placeholder="Pull request title..."
                    className="path-input"
                  />
                  <textarea
                    value={prDescription}
                    onChange={(e) => setPrDescription(e.target.value)}
                    placeholder="Description (optional)..."
                    className="commit-message-input"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className={`wizard-step ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="step-indicator">
                {currentStep > 1 ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </div>
              <div className="step-content">
                <h3>Step 2: Create Pull Request</h3>
                <p>Submit your pull request to merge your changes</p>
                <div className="step-actions">
                  <button onClick={handleCreatePR} disabled={!prTitle.trim() || !currentRepository}>
                    Create Pull Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="git-wizard">
      {!isAuthenticated && (
        <div className="wizard-warning">
          <p>⚠️ Please authenticate with GitHub first to use Git features</p>
        </div>
      )}
      {renderWizardContent()}
    </div>
  );
}

export default GitWizard;

