/**
 * Goals Panel
 * Manage and track revenue goals
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Target,
  TrendingUp,
  Calendar,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useGoalsStore, type RevenueGoal, type GoalPeriod } from '../../services/revenue/goals';
import { formatCurrency } from '../../services/revenue/revenue-engine';

interface GoalsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoalsPanel({ isOpen, onClose }: GoalsPanelProps) {
  const { goals, addGoal, deleteGoal, pauseGoal, resumeGoal } = useGoalsStore();
  const [showAddGoal, setShowAddGoal] = useState(false);

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const pausedGoals = goals.filter((g) => g.status === 'paused');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[85vh] bg-cyber-darker border border-cyber-primary/30 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-cyber-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyber-primary/20 rounded-lg">
                <Target className="w-6 h-6 text-cyber-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold gradient-text">Revenue Goals</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {activeGoals.length} active • {completedGoals.length} completed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddGoal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyber-primary text-cyber-darker font-bold rounded-lg hover:bg-cyber-primary/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Goal
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-cyber-dark rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {goals.length === 0 ? (
              <div className="text-center py-16">
                <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No goals yet</h3>
                <p className="text-gray-500 mb-6">Set your first revenue goal to start tracking progress</p>
                <button
                  onClick={() => setShowAddGoal(true)}
                  className="px-6 py-3 bg-cyber-primary text-cyber-darker font-bold rounded-lg hover:bg-cyber-primary/90 transition-colors"
                >
                  Create Goal
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active Goals */}
                {activeGoals.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-cyber-primary" />
                      Active Goals ({activeGoals.length})
                    </h3>
                    <div className="grid gap-4">
                      {activeGoals.map((goal) => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          onPause={pauseGoal}
                          onDelete={deleteGoal}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Paused Goals */}
                {pausedGoals.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Pause className="w-5 h-5 text-gray-400" />
                      Paused Goals ({pausedGoals.length})
                    </h3>
                    <div className="grid gap-4">
                      {pausedGoals.map((goal) => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          onResume={resumeGoal}
                          onDelete={deleteGoal}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Goals */}
                {completedGoals.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      Completed Goals ({completedGoals.length})
                    </h3>
                    <div className="grid gap-4">
                      {completedGoals.map((goal) => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          onDelete={deleteGoal}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Add Goal Modal */}
        {showAddGoal && (
          <AddGoalModal
            onClose={() => setShowAddGoal(false)}
            onAdd={(goal) => {
              addGoal(goal);
              setShowAddGoal(false);
            }}
          />
        )}
      </div>
    </AnimatePresence>
  );
}

function GoalCard({
  goal,
  onPause,
  onResume,
  onDelete,
}: {
  goal: RevenueGoal;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const progressColor =
    goal.progress >= 100
      ? 'bg-green-500'
      : goal.progress >= 75
      ? 'bg-cyber-primary'
      : goal.progress >= 50
      ? 'bg-yellow-500'
      : 'bg-cyber-secondary';

  return (
    <div className="revenue-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-bold text-white">{goal.name}</h4>
          {goal.metadata?.description && (
            <p className="text-sm text-gray-400 mt-1">{goal.metadata.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
            <span className="capitalize">{goal.period}ly goal</span>
            {goal.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(goal.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onResume && (
            <button
              onClick={() => onResume(goal.id)}
              className="p-2 hover:bg-cyber-dark rounded-lg transition-colors"
              title="Resume goal"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          {onPause && (
            <button
              onClick={() => onPause(goal.id)}
              className="p-2 hover:bg-cyber-dark rounded-lg transition-colors"
              title="Pause goal"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(goal.id)}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
            title="Delete goal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Progress</span>
          <span className="font-bold">
            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.target)}
          </span>
        </div>
        <div className="w-full bg-cyber-dark rounded-full h-3">
          <div
            className={`${progressColor} h-3 rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(100, goal.progress)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{goal.progress.toFixed(1)}% complete</span>
          {goal.progress < 100 && (
            <span>{formatCurrency(goal.target - goal.currentAmount)} remaining</span>
          )}
        </div>
      </div>
    </div>
  );
}

function AddGoalModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (goal: Omit<RevenueGoal, 'id' | 'createdAt' | 'progress' | 'currentAmount'>) => void;
}) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [period, setPeriod] = useState<GoalPeriod>('month');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !target) return;

    onAdd({
      name,
      target: Math.round(parseFloat(target) * 100),
      period,
      status: 'active',
      startDate: new Date(),
      deadline: deadline ? new Date(deadline) : undefined,
      metadata: {
        description: description || undefined,
      },
    });
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-cyber-darker border border-cyber-primary/30 rounded-xl p-6"
      >
        <h3 className="text-xl font-bold gradient-text mb-4">Create New Goal</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Goal Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., First $10k month"
              className="w-full px-4 py-2 bg-cyber-dark border border-cyber-primary/30 rounded-lg focus:outline-none focus:border-cyber-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Target Amount ($)</label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="10000"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 bg-cyber-dark border border-cyber-primary/30 rounded-lg focus:outline-none focus:border-cyber-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as GoalPeriod)}
              className="w-full px-4 py-2 bg-cyber-dark border border-cyber-primary/30 rounded-lg focus:outline-none focus:border-cyber-primary"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="quarter">Quarterly</option>
              <option value="year">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Deadline (Optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2 bg-cyber-dark border border-cyber-primary/30 rounded-lg focus:outline-none focus:border-cyber-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why is this goal important?"
              rows={3}
              className="w-full px-4 py-2 bg-cyber-dark border border-cyber-primary/30 rounded-lg focus:outline-none focus:border-cyber-primary resize-none"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-cyber-dark border border-cyber-primary/30 rounded-lg hover:bg-cyber-dark/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-cyber-primary text-cyber-darker font-bold rounded-lg hover:bg-cyber-primary/90 transition-colors"
            >
              Create Goal
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
