import { useState, useEffect } from 'react';
import { useGitHubStore } from '../../services/github/githubStore';
import { useFileSystemStore } from '../../services/filesystem/fileSystemStore';
import '../../styles/GitHubPanel.css';

function GitHubPanel() {
  const {
    isAuthenticated,
    repositories,
    currentRepository,
    branches,
    status,
    isLoading,
    authenticate,
    loadRepositories,
    setCurrentRepository,
    cloneRepository,
    commit,
    push,
    pull,
    createBranch,
    checkoutBranch,
    loadBranches,
  } = useGitHubStore();

  const { currentDirectory } = useFileSystemStore();
  const [token, setToken] = useState('');
  const [showAuth, setShowAuth] = useState(!isAuthenticated);
  const [commitMessage, setCommitMessage] = useState('');
  const [newBranchName, setNewBranchName] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadRepositories();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (currentDirectory && isAuthenticated) {
      loadBranches(currentDirectory);
    }
  }, [currentDirectory, isAuthenticated]);

  const handleAuth = async () => {
    const success = await authenticate(token);
    if (success) {
      setShowAuth(false);
      setToken('');
    }
  };

  const handleClone = async (repoUrl: string) => {
    if (!currentDirectory) {
      const paths = await useFileSystemStore.getState().openDirectoryDialog();
      if (paths && paths[0]) {
        await cloneRepository(repoUrl, paths[0]);
      }
    } else {
      await cloneRepository(repoUrl, currentDirectory);
    }
  };

  const handleCommit = async () => {
    if (!currentDirectory || !commitMessage.trim()) return;
    const success = await commit(currentDirectory, commitMessage);
    if (success) {
      setCommitMessage('');
    }
  };

  const handlePush = async () => {
    if (!currentDirectory) return;
    await push(currentDirectory);
  };

  const handlePull = async () => {
    if (!currentDirectory) return;
    await pull(currentDirectory);
  };

  const handleCreateBranch = async () => {
    if (!currentDirectory || !newBranchName.trim()) return;
    const success = await createBranch(currentDirectory, newBranchName);
    if (success) {
      setNewBranchName('');
    }
  };

  if (showAuth || !isAuthenticated) {
    return (
      <div className="github-panel">
        <div className="auth-section">
          <h3>GitHub Authentication</h3>
          <p>Enter your GitHub Personal Access Token</p>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            className="token-input"
          />
          <button onClick={handleAuth} className="auth-btn" disabled={!token.trim() || isLoading}>
            {isLoading ? 'Authenticating...' : 'Authenticate'}
          </button>
          <a
            href="https://github.com/settings/tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="token-link"
          >
            Create token on GitHub →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="github-panel">
      <div className="panel-header">
        <h3>GitHub</h3>
        <button onClick={() => setShowAuth(true)} className="settings-btn">
          ⚙️
        </button>
      </div>

      <div className="repositories-section">
        <h4>Repositories</h4>
        <div className="repo-list">
          {repositories.slice(0, 10).map((repo) => (
            <div
              key={repo.id}
              className={`repo-item ${currentRepository?.id === repo.id ? 'active' : ''}`}
              onClick={() => setCurrentRepository(repo)}
            >
              <div className="repo-name">{repo.name}</div>
              <div className="repo-owner">{repo.owner}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClone(repo.cloneUrl);
                }}
                className="clone-btn"
              >
                Clone
              </button>
            </div>
          ))}
        </div>
      </div>

      {currentDirectory && (
        <div className="git-operations">
          <h4>Git Operations</h4>
          
          {status && (
            <>
              <div className="git-status">
                <div className="status-item">
                  <span>Branch:</span>
                  <strong>{status.branch}</strong>
                </div>
                <div className="status-item">
                  <span>Changes:</span>
                  <strong>{status.files.length} file(s)</strong>
                </div>
              </div>

              {status.files.length > 0 && (
                <div className="changed-files">
                  <h5>Changed Files</h5>
                  <div className="file-list">
                    {status.files.map((file, index) => (
                      <div key={index} className="file-change-item">
                        <span className={`file-status ${file.status}`}>
                          {file.status === 'M' && '●'}
                          {file.status === 'A' && '+'}
                          {file.status === 'D' && '−'}
                          {file.status === '??' && '?'}
                        </span>
                        <span className="file-path" title={file.path}>
                          {file.path}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="operation-group">
            <h5>Commit & Push</h5>
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Commit message..."
              className="commit-input"
              rows={3}
            />
            <div className="action-buttons">
              <button onClick={handleCommit} className="action-btn" disabled={!commitMessage.trim()}>
                💾 Commit
              </button>
              <button onClick={handlePush} className="action-btn">
                ⬆️ Push
              </button>
              <button onClick={handlePull} className="action-btn">
                ⬇️ Pull
              </button>
            </div>
          </div>

          <div className="operation-group">
            <h5>Branches</h5>
            <div className="branch-list">
              {branches.map((branch) => (
                <div key={branch.name} className="branch-item">
                  <span>{branch.name}</span>
                  <button
                    onClick={() => checkoutBranch(currentDirectory, branch.name)}
                    className="checkout-btn"
                  >
                    Checkout
                  </button>
                </div>
              ))}
            </div>
            <div className="create-branch">
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="New branch name..."
                className="branch-input"
              />
              <button onClick={handleCreateBranch} className="create-btn" disabled={!newBranchName.trim()}>
                Create Branch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GitHubPanel;

