import { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import '../../styles/MonitorLayoutManager.css';
import WindowFrame from '../Desktop/WindowFrame';
import WidgetFrame from '../Desktop/WidgetFrame';
import VibeEditor from '../VibeEditor/VibeEditor';
import GitHubPanel from '../GitHub/GitHubPanel';
import KaiCreativeRoom from '../RightPanel/KaiCreativeRoom';
import ProjectHealthWidget from '../Desktop/ProjectHealthWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DesktopEnvironment = () => {
  const initialLayout = JSON.parse(localStorage.getItem('desktop-layout') || '[]')
  const [layout, setLayout] = useState(initialLayout);

  const defaultLayout = [
    // Windows
    { i: 'editor', x: 0, y: 0, w: 9, h: 12 },
    { i: 'github', x: 9, y: 6, w: 3, h: 6 },
    { i: 'kai', x: 9, y: 0, w: 3, h: 6 },
    // Widgets
    { i: 'health', x: 0, y: 12, w: 4, h: 4, isResizable: false },
  ];

  // Set default layout if none is saved
  useEffect(() => {
    if (!initialLayout || initialLayout.length === 0) {
      setLayout(defaultLayout);
    }
  }, []);

  const handleLayoutChange = (newLayout: any) => {
    try {
      localStorage.setItem('desktop-layout', JSON.stringify(newLayout));
      setLayout(newLayout);
    } catch (e) {
      console.error("Failed to save layout to localStorage", e);
    }
  };

  return (
    <div className="desktop-environment">
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        onLayoutChange={(_currentLayout, allLayouts) => handleLayoutChange(allLayouts.lg)}
      >
        <div key="editor">
          <WindowFrame title="Vibe Editor">
            <VibeEditor />
          </WindowFrame>
        </div>
        <div key="github">
          <WindowFrame title="GitHub Panel">
            <GitHubPanel />
          </WindowFrame>
        </div>
        <div key="kai">
          <WindowFrame title="Kai Creative Room">
            <KaiCreativeRoom />
          </WindowFrame>
        </div>
        <div key="health">
          <WidgetFrame>
            <ProjectHealthWidget />
          </WidgetFrame>
        </div>
      </ResponsiveGridLayout>
    </div>
  );
};

export default DesktopEnvironment;

