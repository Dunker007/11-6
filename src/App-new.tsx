import { useState } from 'react';
import Studio from './studio/Studio';
import VibedEdChat from './vibed-ed/VibedEdChat';
import './styles-new/index.css';

function App() {
  const [isEdMinimized, setIsEdMinimized] = useState(false);

  return (
    <div className="app">
      <Studio />

      <VibedEdChat
        isMinimized={isEdMinimized}
        onToggleMinimize={() => setIsEdMinimized(!isEdMinimized)}
      />
    </div>
  );
}

export default App;
