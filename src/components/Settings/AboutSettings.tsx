import { Info, Code, Package, ExternalLink } from 'lucide-react';
import packageJson from '../../../package.json';
import '../../styles/Settings.css';

function AboutSettings() {
  const version = packageJson.version;
  const author = packageJson.author || 'DLXStudios.a1';
  const license = packageJson.license || 'MIT';
  const repository = packageJson.repository?.url || '';
  const homepage = packageJson.homepage || '';
  const description = packageJson.description || '';

  // Get system info safely
  const platform = typeof process !== 'undefined' ? process.platform : 'Unknown';
  const nodeVersion = typeof process !== 'undefined' && process.versions?.node ? process.versions.node : 'N/A';
  const electronVersion = typeof process !== 'undefined' && process.versions?.electron ? process.versions.electron : 'N/A';
  const chromeVersion = typeof process !== 'undefined' && process.versions?.chrome ? process.versions.chrome : 'N/A';

  return (
    <div className="about-settings">
      <div className="about-header">
        <h2>About</h2>
        <p className="about-subtitle">Application information and version details</p>
      </div>

      <div className="about-content">
        <div className="about-card">
          <div className="about-card-header">
            <Info size={20} />
            <h3>Application</h3>
          </div>
          <div className="about-card-body">
            <div className="about-info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">{packageJson.name}</span>
            </div>
            {description && (
              <div className="about-info-item">
                <span className="info-label">Description:</span>
                <span className="info-value">{description}</span>
              </div>
            )}
            <div className="about-info-item">
              <span className="info-label">Version:</span>
              <span className="info-value version-badge">{version}</span>
            </div>
          </div>
        </div>

        <div className="about-card">
          <div className="about-card-header">
            <Code size={20} />
            <h3>Development</h3>
          </div>
          <div className="about-card-body">
            <div className="about-info-item">
              <span className="info-label">Author:</span>
              <span className="info-value">{author}</span>
            </div>
            <div className="about-info-item">
              <span className="info-label">License:</span>
              <span className="info-value">{license}</span>
            </div>
            {repository && (
              <div className="about-info-item">
                <span className="info-label">Repository:</span>
                <a
                  href={repository.replace('git+', '').replace('.git', '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="info-link"
                >
                  <ExternalLink size={14} />
                  <span>View on GitHub</span>
                </a>
              </div>
            )}
            {homepage && (
              <div className="about-info-item">
                <span className="info-label">Homepage:</span>
                <a
                  href={homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="info-link"
                >
                  <ExternalLink size={14} />
                  <span>Visit Website</span>
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="about-card">
          <div className="about-card-header">
            <Package size={20} />
            <h3>System</h3>
          </div>
          <div className="about-card-body">
            <div className="about-info-item">
              <span className="info-label">Platform:</span>
              <span className="info-value">{platform}</span>
            </div>
            <div className="about-info-item">
              <span className="info-label">Node Version:</span>
              <span className="info-value">{nodeVersion}</span>
            </div>
            <div className="about-info-item">
              <span className="info-label">Electron Version:</span>
              <span className="info-value">{electronVersion}</span>
            </div>
            <div className="about-info-item">
              <span className="info-label">Chrome Version:</span>
              <span className="info-value">{chromeVersion}</span>
            </div>
          </div>
        </div>

        <div className="about-footer">
          <p>Copyright © 2025 {author}</p>
          <p className="about-footer-note">Built with Electron, React, and TypeScript</p>
        </div>
      </div>
    </div>
  );
}

export default AboutSettings;

