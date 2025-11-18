/**
 * DataManagement.tsx
 *
 * Data export/import and backup management
 */

import React, { useState } from 'react';
import { dataPortabilityService, ExportOptions } from '../../services/data/dataPortabilityService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import './DataManagement.css';

export const DataManagement: React.FC = () => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeRevenue: true,
    includeContent: true,
    includeSettings: true,
    includeCredentials: false,
    includeHistory: true,
    encryptCredentials: true,
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      const blob = await dataPortabilityService.exportAllData(exportOptions, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dlx-export-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await dataPortabilityService.importData(file);
      alert('Data imported successfully! Reload the app to see changes.');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check the file format.');
    }
  };

  return (
    <div className="data-management">
      <h2>Data Management</h2>

      {/* Export */}
      <Card className="data-section">
        <h3>📤 Export Data</h3>
        <p>Download all your data for backup or migration.</p>

        <div className="export-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={exportOptions.includeRevenue}
              onChange={(e) =>
                setExportOptions({ ...exportOptions, includeRevenue: e.target.checked })
              }
            />
            Revenue Data
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={exportOptions.includeContent}
              onChange={(e) =>
                setExportOptions({ ...exportOptions, includeContent: e.target.checked })
              }
            />
            Content Library
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={exportOptions.includeSettings}
              onChange={(e) =>
                setExportOptions({ ...exportOptions, includeSettings: e.target.checked })
              }
            />
            Settings & Preferences
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={exportOptions.includeCredentials}
              onChange={(e) =>
                setExportOptions({ ...exportOptions, includeCredentials: e.target.checked })
              }
            />
            Credentials (Encrypted)
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={exportOptions.includeHistory}
              onChange={(e) =>
                setExportOptions({ ...exportOptions, includeHistory: e.target.checked })
              }
            />
            Activity History
          </label>
        </div>

        <div className="export-actions">
          <Button onClick={() => handleExport('json')} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export as JSON'}
          </Button>
          <Button variant="secondary" onClick={() => handleExport('csv')} disabled={isExporting}>
            Export as CSV
          </Button>
        </div>
      </Card>

      {/* Import */}
      <Card className="data-section">
        <h3>📥 Import Data</h3>
        <p>Restore data from a previous export.</p>

        <div className="import-actions">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            id="import-file"
            style={{ display: 'none' }}
          />
          <Button
            onClick={() => document.getElementById('import-file')?.click()}
          >
            Choose File to Import
          </Button>
        </div>

        <div className="import-warning">
          ⚠️ <strong>Warning:</strong> Importing will overwrite existing data. Make sure to
          export first!
        </div>
      </Card>

      {/* Backup */}
      <Card className="data-section">
        <h3>🔄 Automatic Backups</h3>
        <p>Schedule automatic backups to protect your data.</p>

        <div className="backup-options">
          <label>
            Frequency:
            <select>
              <option value="disabled">Disabled</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>

          <label>
            Destination:
            <select>
              <option value="local">Local Storage</option>
              <option value="cloud">Cloud Storage (Coming Soon)</option>
            </select>
          </label>
        </div>

        <Button disabled>Configure Backup (Coming Soon)</Button>
      </Card>
    </div>
  );
};

export default DataManagement;
