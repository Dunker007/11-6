import { useMemo } from 'react';
import { Zap, Sparkles } from 'lucide-react';
import { useLLMOptimizerStore } from '@/services/ai/llmOptimizerStore';
import { useLLMStore } from '@/services/ai/llmStore';
import '../../styles/LLMOptimizer.css';

const TopRecommendationsCompact = () => {
  const { recommendations, refreshRecommendations } = useLLMOptimizerStore();
  const { switchToModel, models } = useLLMStore();

  // Get top 2-3 recommendations
  const topRecommendations = useMemo(() => {
    return recommendations
      .filter((rec) => rec.availability.isOnline)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [recommendations]);

  const handleLoadModel = async (modelId: string) => {
    try {
      const success = await switchToModel(modelId);
      if (success) {
        // Optionally refresh recommendations after switching
        refreshRecommendations();
      }
    } catch (error) {
      console.error('Failed to load model:', error);
    }
  };

  if (topRecommendations.length === 0) {
    return (
      <div className="sidebar-section">
        <h3>Top Recommendations</h3>
        <div className="compact-recommendations-empty">
          <span className="recommendation-text">No recommendations available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-section">
      <h3>Top Recommendations</h3>
      <div className="compact-recommendations-list">
        {topRecommendations.map((rec) => (
          <div key={rec.modelId} className="compact-recommendation-card">
            <div className="recommendation-header">
              <div className="recommendation-name" title={rec.catalogEntry.displayName}>
                {rec.catalogEntry.displayName.length > 25
                  ? `${rec.catalogEntry.displayName.substring(0, 25)}...`
                  : rec.catalogEntry.displayName}
              </div>
              {rec.catalogEntry.optimizationMethod === 'unsloth-dynamic-2.0' && (
                <Sparkles size={12} className="unsloth-icon" />
              )}
            </div>
            <div className="recommendation-meta">
              <span className="recommendation-score">
                {Math.round(rec.score)}% match
              </span>
              <span className="recommendation-provider">
                {rec.catalogEntry.provider}
              </span>
            </div>
            <button
              className="recommendation-load-btn"
              onClick={() => handleLoadModel(rec.modelId)}
              title={`Load ${rec.catalogEntry.displayName}`}
            >
              <Zap size={12} />
              Load
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopRecommendationsCompact;

