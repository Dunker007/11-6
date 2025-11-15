/**
 * Gemini Function Calls UI Component
 * Displays function calls in chat/conversation interface
 * Shows function parameters and results
 */

import { useState } from 'react';
import { Code, ChevronDown, ChevronUp, Play, CheckCircle2 } from 'lucide-react';
import type { GeminiFunctionCall } from '@/types/gemini';
import { geminiFunctionRegistry } from '@/services/ai/geminiFunctions';
import { useToast } from '@/components/ui';
import '@/styles/GeminiFunctionCalls.css';

interface GeminiFunctionCallsProps {
  functionCalls?: GeminiFunctionCall[];
  onExecute?: (call: GeminiFunctionCall) => Promise<any>;
  results?: Record<string, any>;
}

function GeminiFunctionCalls({ 
  functionCalls = [], 
  onExecute,
  results = {},
}: GeminiFunctionCallsProps) {
  const { showToast } = useToast();
  const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set());
  const [executing, setExecuting] = useState<Set<string>>(new Set());

  const toggleCall = (callId: string) => {
    setExpandedCalls(prev => {
      const next = new Set(prev);
      if (next.has(callId)) {
        next.delete(callId);
      } else {
        next.add(callId);
      }
      return next;
    });
  };

  const handleExecute = async (call: GeminiFunctionCall) => {
    const callId = `${call.name}-${JSON.stringify(call.args)}`;
    setExecuting(prev => new Set(prev).add(callId));

    try {
      if (onExecute) {
        await onExecute(call);
      } else {
        await geminiFunctionRegistry.executeFunction(call);
      }
      showToast({
        variant: 'success',
        title: 'Function executed',
        message: `Function "${call.name}" executed successfully`,
      });
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setExecuting(prev => {
        const next = new Set(prev);
        next.delete(callId);
        return next;
      });
    }
  };

  if (functionCalls.length === 0) {
    return null;
  }

  return (
    <div className="gemini-function-calls">
      <div className="gemini-function-calls-header">
        <Code size={16} />
        <span>Function Calls ({functionCalls.length})</span>
      </div>
      <div className="gemini-function-calls-list">
        {functionCalls.map((call, index) => {
          const callId = `${call.name}-${index}`;
          const isExpanded = expandedCalls.has(callId);
          const isExecuting = executing.has(callId);
          const result = results[call.name] || results[callId];
          const hasResult = !!result;

          return (
            <div key={callId} className="gemini-function-call-item">
              <div
                className="gemini-function-call-header"
                onClick={() => toggleCall(callId)}
              >
                <div className="gemini-function-call-info">
                  <span className="gemini-function-call-name">{call.name}</span>
                  {hasResult && (
                    <CheckCircle2 size={14} className="gemini-function-call-success" />
                  )}
                  {isExecuting && (
                    <div className="gemini-function-call-spinner" />
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>
              {isExpanded && (
                <div className="gemini-function-call-content">
                  <div className="gemini-function-call-section">
                    <label>Parameters:</label>
                    <pre className="gemini-function-call-json">
                      {JSON.stringify(call.args || {}, null, 2)}
                    </pre>
                  </div>
                  {hasResult && (
                    <div className="gemini-function-call-section">
                      <label>Result:</label>
                      <pre className="gemini-function-call-json gemini-function-call-result">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  )}
                  {!hasResult && !isExecuting && (
                    <button
                      className="gemini-function-call-execute"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExecute(call);
                      }}
                    >
                      <Play size={14} />
                      Execute Function
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GeminiFunctionCalls;

