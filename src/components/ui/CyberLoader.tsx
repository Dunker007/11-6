import React from 'react';
import './CyberLoader.css';

export interface CyberLoaderProps {
  variant?: 'brain' | 'hexagon' | 'spinner' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  fullScreen?: boolean;
}

export const CyberLoader: React.FC<CyberLoaderProps> = ({
  variant = 'brain',
  size = 'md',
  message,
  fullScreen = false,
}) => {
  const containerClasses = [
    'cyber-loader-container',
    fullScreen && 'cyber-loader-container--fullscreen',
  ]
    .filter(Boolean)
    .join(' ');

  const loaderClasses = [
    'cyber-loader',
    `cyber-loader--${variant}`,
    `cyber-loader--${size}`,
  ].join(' ');

  return (
    <div className={containerClasses}>
      <div className="cyber-loader-wrapper">
        {variant === 'brain' && (
          <div className={loaderClasses}>
            <div className="cyber-loader-brain">
              <img
                src="/assets/branding/dlx-brain-command-center.png"
                alt="Loading"
                className="cyber-loader-brain__image"
              />
              <div className="cyber-loader-brain__rings">
                <div className="cyber-loader-brain__ring cyber-loader-brain__ring--1"></div>
                <div className="cyber-loader-brain__ring cyber-loader-brain__ring--2"></div>
                <div className="cyber-loader-brain__ring cyber-loader-brain__ring--3"></div>
              </div>
            </div>
          </div>
        )}

        {variant === 'hexagon' && (
          <div className={loaderClasses}>
            <div className="cyber-loader-hexagon">
              <svg viewBox="0 0 100 100" className="cyber-loader-hexagon__svg">
                <polygon
                  points="50 3, 95 25, 95 75, 50 97, 5 75, 5 25"
                  className="cyber-loader-hexagon__shape"
                />
              </svg>
            </div>
          </div>
        )}

        {variant === 'spinner' && (
          <div className={loaderClasses}>
            <div className="cyber-loader-spinner">
              <div className="cyber-loader-spinner__circle"></div>
            </div>
          </div>
        )}

        {variant === 'dots' && (
          <div className={loaderClasses}>
            <div className="cyber-loader-dots">
              <span className="cyber-loader-dots__dot"></span>
              <span className="cyber-loader-dots__dot"></span>
              <span className="cyber-loader-dots__dot"></span>
            </div>
          </div>
        )}

        {variant === 'pulse' && (
          <div className={loaderClasses}>
            <div className="cyber-loader-pulse">
              <div className="cyber-loader-pulse__circle cyber-loader-pulse__circle--1"></div>
              <div className="cyber-loader-pulse__circle cyber-loader-pulse__circle--2"></div>
              <div className="cyber-loader-pulse__circle cyber-loader-pulse__circle--3"></div>
            </div>
          </div>
        )}

        {message && (
          <div className="cyber-loader-message">
            <p className="cyber-loader-message__text">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CyberLoader;
