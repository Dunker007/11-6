// src/components/LLMOptimizer/IdeaLab.tsx
import { useState, useCallback } from 'react';
import IdeaList from './IdeaList';
import PlanningWorkspace from './PlanningWorkspace';
import IdeaLabKai from './IdeaLabKai';
import { Idea } from '@/services/idea/ideaInventoryService';
import { ideaInventoryService } from '@/services/idea/ideaInventoryService';
import '../../styles/LLMOptimizer.css';

function IdeaLab() {
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);

  const handleIdeaSelect = useCallback((idea: Idea | null) => {
    setSelectedIdea(idea);
  }, []);

  const handleIdeaSuggest = useCallback((ideaData: Omit<Idea, 'id' | 'status' | 'created'>) => {
    const newIdea: Idea = {
      ...ideaData,
      id: crypto.randomUUID(),
      status: 'pending',
      created: new Date(),
    };
    
    // addIdea returns the created idea, so we can use it directly
    const createdIdea = ideaInventoryService.addIdea(newIdea);
    
    // Select the newly created idea immediately using its unique ID
    setSelectedIdea(createdIdea);
  }, []);

  return (
    <div className="idea-lab-container">
      {/* Left Panel: Idea List */}
      <div className="idea-lab-left-panel">
        <IdeaList
          onIdeaSelect={handleIdeaSelect}
          selectedIdeaId={selectedIdea?.id || null}
        />
      </div>

      {/* Center Panel: Planning Workspace */}
      <div className="idea-lab-center-panel">
        <PlanningWorkspace selectedIdea={selectedIdea} />
      </div>

      {/* Right Panel: Kai Agent */}
      <div className="idea-lab-right-panel">
        <IdeaLabKai onIdeaSuggest={handleIdeaSuggest} />
      </div>
    </div>
  );
}

export default IdeaLab;
