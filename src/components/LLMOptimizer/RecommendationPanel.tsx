import { useMemo } from 'react';
import { ArrowUpRight, CheckCircle2, Flame, Gauge, Zap } from 'lucide-react';
import type { ModelRecommendation } from '@/types/optimizer';
import '../../styles/LLMOptimizer.css';

interface RecommendationPanelProps {
  recommendations: ModelRecommendation[];
  onBenchmark?: (modelId: string) => void;
}

const RecommendationPanel = ({ recommendations, onBenchmark }: RecommendationPanelProps) => {
  const topRecommendation = useMemo(() => recommendations[0], [recommendations]);

  return (
    <div className="recommendation-panel">
      <div className="recommendation-header">
        <Gauge size={18} />
        <h3>Recommended Loadout</h3>
      </div>

      {recommendations.length === 0 ? (
        <div className="recommendation-empty">
          <CheckCircle2 size={18} />
          <p>Run hardware detection to receive tailored recommendations.</p>
        </div>
      ) : (
        <>
          {topRecommendation && (
            <div className="recommendation-banner">
              <div className="banner-title">
                <Flame size={18} />
                <span>Primary pick</span>
              </div>
              <h4>{topRecommendation.catalogEntry.displayName}</h4>
              <p>{topRecommendation.catalogEntry.description}</p>
              <div className="banner-meta">
                <span className={`availability-badge ${topRecommendation.availability.isOnline ? 'online' : 'offline'}`}>
                  {topRecommendation.availability.isOnline ? 'Provider ready' : 'Provider offline'}
                </span>
                <span>{topRecommendation.catalogEntry.contextWindow.toLocaleString()} token context</span>
                {topRecommendation.catalogEntry.sizeGB > 0 && (
                  <span>{topRecommendation.catalogEntry.sizeGB} GB footprint</span>
                )}
              </div>
            </div>
          )}

          <div className="recommendation-list">
            {recommendations.slice(0, 4).map((rec) => (
              <div key={rec.modelId} className="recommendation-card">
                <div className="rec-card-header">
                  <div>
                    <h4>{rec.catalogEntry.displayName}</h4>
                    <span className={`provider-chip ${rec.catalogEntry.provider}`}>{rec.catalogEntry.provider}</span>
                  </div>
                  <span className="rec-score">{Math.round(rec.score)} pts</span>
                </div>
                <ul className="rec-rationale">
                  {rec.rationale.slice(0, 3).map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
                <div className="rec-card-footer">
                  <div className="rec-tags">
                    {rec.catalogEntry.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="rec-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="rec-actions">
                    <a
                      className="rec-link"
                      href={rec.catalogEntry.downloadUrl ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => {
                        if (!rec.catalogEntry.downloadUrl) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <ArrowUpRight size={14} />
                      Docs
                    </a>
                    {rec.catalogEntry.pullCommand && (
                      <code className="rec-command">{rec.catalogEntry.pullCommand}</code>
                    )}
                    <button
                      className="benchmark-button"
                      type="button"
                      onClick={() => onBenchmark?.(rec.modelId)}
                    >
                      <Zap size={14} />
                      Benchmark
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RecommendationPanel;

