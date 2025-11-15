/**
 * VariableInspector.tsx
 * 
 * PURPOSE:
 * Component for inspecting variables during debugging. Displays variables
 * in the current scope with their values and types.
 * 
 * ARCHITECTURE:
 * React component that uses debuggerService to get variable information:
 * - debuggerService: Retrieves variable data via CDP
 * - Expandable object/array inspection
 * - Variable value display
 * 
 * Features:
 * - Current scope variables
 * - Expandable object/array inspection
 * - Variable value editing
 * - Variable search/filter
 * - Copy variable values
 * 
 * CURRENT STATUS:
 * ✅ Variable display
 * ✅ Expandable inspection
 * ✅ Value formatting
 * 
 * DEPENDENCIES:
 * - debuggerService: Debugging operations
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import VariableInspector from '@/components/Debugging/VariableInspector';
 * 
 * <VariableInspector callFrameId="frame-1" />
 * ```
 */

import { useState, useEffect } from 'react';
import { debuggerService, type Variable } from '@/services/debugging/debuggerService';
import { Search, Copy, ChevronRight, ChevronDown } from 'lucide-react';
import '../../styles/VariableInspector.css';

export interface VariableInspectorProps {
  callFrameId?: string;
  onVariableSelect?: (variable: Variable) => void;
}

function VariableInspector({ callFrameId, onVariableSelect }: VariableInspectorProps) {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedVars, setExpandedVars] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (callFrameId) {
      loadVariables(callFrameId);
    }
  }, [callFrameId]);

  const loadVariables = async (frameId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await debuggerService.getVariables(frameId);
      if (result.success && result.variables) {
        setVariables(result.variables);
      } else {
        setError(result.error || 'Failed to load variables');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVariables = variables.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (varName: string) => {
    const newExpanded = new Set(expandedVars);
    if (newExpanded.has(varName)) {
      newExpanded.delete(varName);
    } else {
      newExpanded.add(varName);
    }
    setExpandedVars(newExpanded);
  };

  const formatValue = (value: any, type: string): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (type === 'object' || type === 'array') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const copyValue = (value: any) => {
    navigator.clipboard.writeText(String(value));
  };

  if (!callFrameId) {
    return (
      <div className="variable-inspector">
        <div className="empty-state">
          <p>No call frame selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="variable-inspector">
      <div className="inspector-header">
        <h3>Variables</h3>
        <div className="search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search variables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {isLoading ? (
        <div className="loading-state">Loading variables...</div>
      ) : (
        <div className="variables-list">
          {filteredVariables.map((variable) => {
            const isExpanded = expandedVars.has(variable.name);
            const isComplex = variable.type === 'object' || variable.type === 'array';

            return (
              <div key={variable.name} className="variable-item">
                <div
                  className="variable-header"
                  onClick={() => {
                    if (isComplex) toggleExpand(variable.name);
                    onVariableSelect?.(variable);
                  }}
                >
                  {isComplex && (
                    <button className="expand-btn">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                  <span className="variable-name">{variable.name}</span>
                  <span className="variable-type">{variable.type}</span>
                  <button
                    className="copy-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyValue(variable.value);
                    }}
                    title="Copy value"
                  >
                    <Copy size={12} />
                  </button>
                </div>
                {isExpanded && isComplex ? (
                  <div className="variable-value-expanded">
                    <pre>{formatValue(variable.value, variable.type)}</pre>
                  </div>
                ) : (
                  <div className="variable-value">
                    {formatValue(variable.value, variable.type)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default VariableInspector;

