/**
 * BoltExport Component
 * UI for exporting projects to bolt.diy for autonomous building
 */

import { useState, useEffect } from 'react';
import { useProjectStore } from '@/services/project/projectStore';
import { boltService } from '@/services/bolt/boltService';
import { boltAPIService } from '@/services/bolt/boltAPIService';
import { Button } from '@/components/ui';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui';
import { Input } from '@/components/ui';
import { Progress } from '@/components/ui';
import { Badge } from '@/components/ui';
import { useToast } from '@/components/ui';
import { Rocket, CheckCircle, XCircle, AlertCircle, Download, Key } from 'lucide-react';
import type { BoltBuildPackage, PackageValidationResult } from '@/types/bolt';
import '@/styles/BoltExport.css';

export function BoltExport() {
  const { activeProject } = useProjectStore();
  const { showToast } = useToast();
  const [apiKey, setAPIKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [buildPackage, setBuildPackage] = useState<BoltBuildPackage | null>(null);
  const [validation, setValidation] = useState<PackageValidationResult | null>(null);
  const [buildId, setBuildId] = useState<string | null>(null);
  const [buildStatus, setBuildStatus] = useState<'pending' | 'building' | 'completed' | 'failed' | null>(null);
  const [showAPIKeyInput, setShowAPIKeyInput] = useState(false);

  useEffect(() => {
    // Load stored API key
    const storedKey = boltAPIService.getAPIKey();
    if (storedKey) {
      setAPIKey(storedKey);
      boltAPIService.setAPIKey(storedKey);
    }
  }, []);

  const handleGeneratePackage = async () => {
    if (!activeProject) {
      showToast({
        title: 'No Project Selected',
        description: 'Please select a project first',
        variant: 'error',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const package_ = await boltService.generateBuildPackage(activeProject.id);
      const validationResult = boltService.validatePackage(package_);
      
      setBuildPackage(package_);
      setValidation(validationResult);

      if (!validationResult.valid) {
        showToast({
          title: 'Package Validation Failed',
          description: validationResult.errors.join(', '),
          variant: 'error',
        });
      } else if (validationResult.warnings.length > 0) {
        showToast({
          title: 'Package Generated with Warnings',
          description: validationResult.warnings.join(', '),
          variant: 'warning',
        });
      } else {
        showToast({
          title: 'Package Generated',
          description: 'Build package is ready to send',
          variant: 'success',
        });
      }
    } catch (error) {
      showToast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate build package',
        variant: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAPIKey = () => {
    if (!apiKey.trim()) {
      showToast({
        title: 'API Key Required',
        description: 'Please enter your bolt.diy API key',
        variant: 'error',
      });
      return;
    }

    boltAPIService.setAPIKey(apiKey);
    setShowAPIKeyInput(false);
    showToast({
      title: 'API Key Saved',
      description: 'Your API key has been saved',
      variant: 'success',
    });
  };

  const handleSendPackage = async () => {
    if (!buildPackage) {
      showToast({
        title: 'No Package',
        description: 'Please generate a build package first',
        variant: 'error',
      });
      return;
    }

    const storedKey = boltAPIService.getAPIKey();
    if (!storedKey) {
      setShowAPIKeyInput(true);
      showToast({
        title: 'API Key Required',
        description: 'Please configure your bolt.diy API key',
        variant: 'error',
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await boltAPIService.sendBuildPackage(buildPackage);
      
      if (response.success) {
        setBuildId(response.buildId || null);
        setBuildStatus('pending');
        showToast({
          title: 'Package Sent',
          description: response.message || 'Build package sent to bolt.diy successfully',
          variant: 'success',
        });

        // Start polling for build status
        if (response.buildId) {
          pollBuildStatus(response.buildId);
        }
      } else {
        showToast({
          title: 'Send Failed',
          description: response.error || 'Failed to send build package',
          variant: 'error',
        });
      }
    } catch (error) {
      showToast({
        title: 'Send Failed',
        description: error instanceof Error ? error.message : 'Failed to send build package',
        variant: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  const pollBuildStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await boltAPIService.checkBuildStatus(id);
        setBuildStatus(status.status);

        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
        }
      } catch (error) {
        // Error handling - logging would be redundant here as it's already handled by the caller
        clearInterval(interval);
      }
    }, 5000); // Poll every 5 seconds

    // Cleanup after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  const handleDownloadJSON = () => {
    if (!buildPackage) return;

    const json = boltService.exportAsJSON(buildPackage);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject?.name || 'project'}-bolt-package.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast({
      title: 'Package Downloaded',
      description: 'Build package saved as JSON',
      variant: 'success',
    });
  };

  const handleTestConnection = async () => {
    const result = await boltAPIService.testConnection();
    showToast({
      title: result.success ? 'Connection Successful' : 'Connection Failed',
      description: result.message,
      variant: result.success ? 'success' : 'error',
    });
  };

  if (!activeProject) {
    return (
      <Card className="bolt-export-card">
        <CardBody>
          <div className="bolt-export-empty">
            <Rocket size={48} className="bolt-export-empty-icon" />
            <h3>No Project Selected</h3>
            <p>Select a project to export to bolt.diy</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="bolt-export">
      <Card className="bolt-export-card">
        <CardHeader>
          <div className="bolt-export-header">
            <Rocket className="bolt-export-icon" />
            <div>
              <h2>Export to bolt.diy</h2>
              <p className="bolt-export-subtitle">Generate and send build package for autonomous building</p>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          {/* API Key Configuration */}
          <div className="bolt-export-section">
            <div className="bolt-export-section-header">
              <Key size={18} />
              <span>API Configuration</span>
            </div>
            {showAPIKeyInput || !boltAPIService.getAPIKey() ? (
              <div className="bolt-export-api-key">
                <Input
                  type="password"
                  placeholder="Enter bolt.diy API key"
                  value={apiKey}
                  onChange={(e) => setAPIKey(e.target.value)}
                  className="bolt-export-api-key-input"
                />
                <Button onClick={handleSaveAPIKey} variant="primary" size="sm">
                  Save Key
                </Button>
                <Button onClick={handleTestConnection} variant="secondary" size="sm">
                  Test Connection
                </Button>
              </div>
            ) : (
              <div className="bolt-export-api-key-saved">
                <Badge variant="success" size="sm">API Key Configured</Badge>
                <Button onClick={() => setShowAPIKeyInput(true)} variant="ghost" size="sm">
                  Change Key
                </Button>
              </div>
            )}
          </div>

          {/* Package Generation */}
          <div className="bolt-export-section">
            <div className="bolt-export-section-header">
              <Rocket size={18} />
              <span>Build Package</span>
            </div>
            <div className="bolt-export-actions">
              <Button
                onClick={handleGeneratePackage}
                disabled={isGenerating}
                isLoading={isGenerating}
                variant="primary"
                leftIcon={Rocket}
              >
                Generate Package
              </Button>
            </div>

            {buildPackage && (
              <div className="bolt-export-package-info">
                <div className="bolt-export-package-details">
                  <div>
                    <strong>Project:</strong> {buildPackage.project.name}
                  </div>
                  <div>
                    <strong>Type:</strong> <Badge variant="primary" size="sm">{buildPackage.project.type}</Badge>
                  </div>
                  <div>
                    <strong>Files:</strong> {buildPackage.structure.files.length}
                  </div>
                  <div>
                    <strong>Build Steps:</strong> {buildPackage.build.steps.length}
                  </div>
                </div>

                {validation && (
                  <div className={`bolt-export-validation bolt-export-validation--${validation.valid ? 'valid' : 'invalid'}`}>
                    {validation.valid ? (
                      <CheckCircle className="bolt-export-validation-icon" />
                    ) : (
                      <XCircle className="bolt-export-validation-icon" />
                    )}
                    <div>
                      <div className="bolt-export-validation-status">
                        {validation.valid ? 'Valid Package' : 'Invalid Package'}
                      </div>
                      {validation.errors.length > 0 && (
                        <div className="bolt-export-validation-errors">
                          {validation.errors.map((error, i) => (
                            <div key={i} className="bolt-export-validation-error">
                              <AlertCircle size={14} />
                              {error}
                            </div>
                          ))}
                        </div>
                      )}
                      {validation.warnings.length > 0 && (
                        <div className="bolt-export-validation-warnings">
                          {validation.warnings.map((warning, i) => (
                            <div key={i} className="bolt-export-validation-warning">
                              <AlertCircle size={14} />
                              {warning}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Build Status */}
          {buildId && buildStatus && (
            <div className="bolt-export-section">
              <div className="bolt-export-section-header">
                <Rocket size={18} />
                <span>Build Status</span>
              </div>
              <div className="bolt-export-build-status">
                <Badge
                  variant={
                    buildStatus === 'completed'
                      ? 'success'
                      : buildStatus === 'failed'
                      ? 'error'
                      : buildStatus === 'building'
                      ? 'info'
                      : 'warning'
                  }
                  size="sm"
                >
                  {buildStatus}
                </Badge>
                {buildStatus === 'building' && (
                  <Progress value={50} className="bolt-export-progress" />
                )}
              </div>
            </div>
          )}
        </CardBody>

        <CardFooter>
          <div className="bolt-export-footer">
            <Button
              onClick={handleDownloadJSON}
              disabled={!buildPackage}
              variant="secondary"
              leftIcon={Download}
            >
              Download JSON
            </Button>
            <Button
              onClick={handleSendPackage}
              disabled={!buildPackage || !validation?.valid || isSending}
              isLoading={isSending}
              variant="primary"
              leftIcon={Rocket}
            >
              Send to bolt.diy
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

