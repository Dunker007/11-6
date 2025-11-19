import { Background } from './Background';
import { Sidebar } from './Sidebar';

interface LayoutProps {
    children?: React.ReactNode;
    activePage: string;
    onNavigate: (page: string) => void;
}

export const Layout = ({ children, activePage, onNavigate }: LayoutProps) => {
    return (
        <div className="flex h-screen w-full text-white font-sans selection:bg-hologram-blue/30 selection:text-hologram-blue">
            <Background />
            <Sidebar activePage={activePage} onNavigate={onNavigate} />

            <main className="flex-1 relative overflow-hidden flex flex-col">
                {/* Top Bar / Header Area (Optional, for window controls or breadcrumbs) */}
                <header className="h-16 flex items-center px-8 border-b border-white/5 backdrop-blur-sm z-10">
                    <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                        COMMAND CENTER
                    </h1>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-8 relative z-0 scroll-smooth">
                    <div className="max-w-7xl mx-auto">
                        {children || (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Placeholder Content to show layout */}
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="glass p-6 rounded-2xl h-64 flex items-center justify-center border border-white/5 hover:border-hologram-blue/30 transition-colors group">
                                        <span className="text-gray-500 group-hover:text-hologram-blue transition-colors">Module {i} Initializing...</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
