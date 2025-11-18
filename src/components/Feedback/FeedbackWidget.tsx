/**
 * FeedbackWidget.tsx
 *
 * In-app feedback widget for user feedback and bug reports
 */

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import './FeedbackWidget.css';

type FeedbackType = 'bug' | 'feature' | 'feedback' | 'love';

export const FeedbackWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('feedback');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Collect system info
    const systemInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timestamp: new Date().toISOString(),
    };

    const feedbackData = {
      type,
      message,
      email: email || 'anonymous',
      systemInfo,
    };

    console.log('Feedback submitted:', feedbackData);
    // TODO: Send to backend or email service

    setSubmitted(true);
    setTimeout(() => {
      setIsOpen(false);
      setSubmitted(false);
      setMessage('');
      setEmail('');
    }, 2000);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          className="feedback-fab"
          onClick={() => setIsOpen(true)}
          title="Send Feedback"
        >
          💬
        </button>
      )}

      {/* Feedback Modal */}
      {isOpen && (
        <div className="feedback-widget-overlay">
          <Card className="feedback-widget">
            <div className="feedback-header">
              <h3>Send Feedback</h3>
              <button className="feedback-close" onClick={() => setIsOpen(false)}>
                ✕
              </button>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit}>
                {/* Type Selection */}
                <div className="feedback-types">
                  <button
                    type="button"
                    className={`feedback-type-btn ${type === 'bug' ? 'active' : ''}`}
                    onClick={() => setType('bug')}
                  >
                    🐛 Bug
                  </button>
                  <button
                    type="button"
                    className={`feedback-type-btn ${type === 'feature' ? 'active' : ''}`}
                    onClick={() => setType('feature')}
                  >
                    💡 Feature
                  </button>
                  <button
                    type="button"
                    className={`feedback-type-btn ${type === 'feedback' ? 'active' : ''}`}
                    onClick={() => setType('feedback')}
                  >
                    💬 Feedback
                  </button>
                  <button
                    type="button"
                    className={`feedback-type-btn ${type === 'love' ? 'active' : ''}`}
                    onClick={() => setType('love')}
                  >
                    ❤️ Love
                  </button>
                </div>

                {/* Message */}
                <div className="feedback-field">
                  <label>Your {type === 'bug' ? 'Issue' : type === 'feature' ? 'Idea' : 'Message'}</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      type === 'bug'
                        ? 'Describe the bug...'
                        : type === 'feature'
                        ? 'Describe your feature idea...'
                        : type === 'love'
                        ? 'What do you love about DLX?'
                        : 'Your feedback...'
                    }
                    required
                    rows={5}
                  />
                </div>

                {/* Email */}
                <div className="feedback-field">
                  <label>Email (optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                  <span className="feedback-hint">
                    We'll only use this to follow up on your feedback
                  </span>
                </div>

                {/* Actions */}
                <div className="feedback-actions">
                  <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Send Feedback</Button>
                </div>
              </form>
            ) : (
              <div className="feedback-success">
                <div className="success-icon">✅</div>
                <h4>Thank you!</h4>
                <p>Your feedback has been submitted.</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
};

export default FeedbackWidget;
