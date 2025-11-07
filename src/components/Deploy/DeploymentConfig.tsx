import { useState, useEffect } from 'react';
import type { DeploymentTarget, DeploymentConfig } from '@/types/deploy';
import '../../styles/DeployWorkflow.css';

interface DeploymentConfigProps {
  target: DeploymentTarget;
  projectPath?: string;
  onConfigured: (config: DeploymentConfig) => void;
  onCancel: () => void;
}

function DeploymentConfig({ target, projectPath, onConfigured, onCancel }: DeploymentConfigProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize form with default values
    const defaults: Record<string, string> = {};
    target.configFields.forEach((field) => {
      if (field.defaultValue) {
        defaults[field.name] = field.defaultValue;
      }
    });
    if (projectPath) {
      defaults.projectPath = projectPath;
    }
    setFormData(defaults);
  }, [target, projectPath]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const newErrors: Record<string, string> = {};
    target.configFields.forEach((field) => {
      if (field.required && !formData[field.name]?.trim()) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const config: DeploymentConfig = {
      targetId: target.id,
      projectPath: formData.projectPath || projectPath || '',
      buildCommand: formData.buildCommand,
      outputDirectory: formData.outputDirectory || formData.publishDirectory,
      environmentVariables: {},
      customDomain: formData.customDomain,
      framework: formData.framework,
      nodeVersion: formData.nodeVersion,
      installCommand: formData.installCommand,
    };

    // Extract environment variables (if any)
    if (formData.envVars) {
      formData.envVars.split('\n').forEach((line) => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          config.environmentVariables[key.trim()] = valueParts.join('=').trim();
        }
      });
    }

    onConfigured(config);
  };

  return (
    <div className="deployment-config">
      <div className="config-header">
        <h3>Configure {target.name} Deployment</h3>
        <button onClick={onCancel} className="cancel-btn">×</button>
      </div>

      <form onSubmit={handleSubmit} className="config-form">
        {target.configFields.map((field) => (
          <div key={field.name} className="form-group">
            <label>
              {field.label} {field.required && <span className="required">*</span>}
            </label>
            {field.type === 'select' ? (
              <select
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                className={errors[field.name] ? 'error' : ''}
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                rows={4}
                className={errors[field.name] ? 'error' : ''}
              />
            ) : (
              <input
                type={field.type}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className={errors[field.name] ? 'error' : ''}
              />
            )}
            {errors[field.name] && (
              <span className="error-message">{errors[field.name]}</span>
            )}
          </div>
        ))}

        <div className="form-group">
          <label>Environment Variables (optional)</label>
          <textarea
            value={formData.envVars || ''}
            onChange={(e) => handleChange('envVars', e.target.value)}
            placeholder="KEY1=value1&#10;KEY2=value2"
            rows={4}
          />
          <small>One per line, format: KEY=value</small>
        </div>

        <div className="form-actions">
          <button type="submit" className="deploy-btn">
            🚀 Deploy
          </button>
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default DeploymentConfig;

