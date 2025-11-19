/**
 * Keyboard Shortcuts Helper
 * Displays all available keyboard shortcuts
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ['⌘', 'K'], description: 'Open command palette', category: 'Navigation' },
  { keys: ['⌘', ','], description: 'Open settings', category: 'Navigation' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Navigation' },
  { keys: ['Esc'], description: 'Close modal/dialog', category: 'Navigation' },

  // Actions
  { keys: ['⌘', 'N'], description: 'Add new revenue', category: 'Actions' },
  { keys: ['⌘', 'A'], description: 'Open AI assistant', category: 'Actions' },
  { keys: ['⌘', 'G'], description: 'Open revenue goals', category: 'Actions' },
  { keys: ['⌘', 'E'], description: 'Export data', category: 'Actions' },

  // View
  { keys: ['1'], description: 'Timeline chart view', category: 'View' },
  { keys: ['2'], description: 'Breakdown chart view', category: 'View' },
];

const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-cyber-darker border border-cyber-primary/30 rounded-xl shadow-2xl pointer-events-auto overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-cyber-primary/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyber-primary/20 rounded-lg">
                    <Keyboard className="w-6 h-6 text-cyber-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold gradient-text">Keyboard Shortcuts</h2>
                    <p className="text-sm text-gray-400 mt-1">Master DLX v2 like a pro</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-cyber-dark rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  {categories.map((category) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {shortcuts
                          .filter((s) => s.category === category)
                          .map((shortcut, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3 bg-cyber-dark/30 rounded-lg hover:bg-cyber-dark/50 transition-colors"
                            >
                              <span className="text-gray-200">{shortcut.description}</span>
                              <div className="flex gap-1">
                                {shortcut.keys.map((key, j) => (
                                  <kbd
                                    key={j}
                                    className="px-2 py-1 bg-cyber-dark border border-cyber-primary/30 rounded text-xs font-mono text-cyber-primary"
                                  >
                                    {key}
                                  </kbd>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer tip */}
                <div className="mt-6 p-4 bg-cyber-primary/10 border border-cyber-primary/20 rounded-lg">
                  <p className="text-sm text-gray-300">
                    💡 <strong>Pro tip:</strong> On Windows/Linux, use <kbd className="px-1.5 py-0.5 bg-cyber-dark border border-cyber-primary/30 rounded text-xs font-mono">Ctrl</kbd> instead of <kbd className="px-1.5 py-0.5 bg-cyber-dark border border-cyber-primary/30 rounded text-xs font-mono">⌘</kbd>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
