// src/components/RightPanel/AddIdeaModal.tsx
import React, { useState } from 'react';
import { useProjectStore } from '../../services/project/projectStore';
import TechIcon from '../Icons/TechIcon';
import { ICON_MAP } from '../Icons/IconSet';
import '../../styles/Modal.css';

interface AddIdeaModalProps {
  onClose: () => void;
}

const AddIdeaModal = ({ onClose }: AddIdeaModalProps) => {
  const [ideaTitle, setIdeaTitle] = useState('');
  const { createProject } = useProjectStore();

  const handleSubmit = () => {
    if (ideaTitle.trim()) {
      createProject(ideaTitle.trim());
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><TechIcon icon={ICON_MAP.mindmap} />Quick Add Idea</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p>Capture a new idea for a passive income project. It will be added to your 'idea' backlog.</p>
          <input
            type="text"
            value={ideaTitle}
            onChange={(e) => setIdeaTitle(e.target.value)}
            placeholder="e.g., AI-powered newsletter for designers"
            className="modal-input"
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        <div className="modal-footer">
          <button className="modal-button-secondary" onClick={onClose}>Cancel</button>
          <button className="modal-button-primary" onClick={handleSubmit}>Add to Backlog</button>
        </div>
      </div>
    </div>
  );
};

export default AddIdeaModal;
