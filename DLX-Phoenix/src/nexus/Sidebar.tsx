import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Sparkles,
    Settings,
    Menu,
    Cpu,
    Database,
    Gem,
    Server
} from 'lucide-react';
import { clsx } from 'clsx';

const menuItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'gems', label: 'Gem Nexus', icon: Gem },
    { id: 'generator', label: 'Idea Forge', icon: Sparkles },
    { id: 'agents', label: 'Agent Studio', icon: Cpu },
    { id: 'optimize', label: 'Optimization', icon: Sparkles },
    { id: 'mining', label: 'Neural Mining', icon: Cpu },
    { id: 'luxrig', label: 'LuxRig Monitor', icon: Server },
    { id: 'vault', label: 'Data Vault', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
    activePage: string;
    onNavigate: (page: string) => void;
}

export const Sidebar = ({ activePage, onNavigate }: SidebarProps) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <motion.div
            className={clsx(
                "h-screen glass border-r border-white/10 flex flex-col transition-all duration-300 z-50",
                isOpen ? "w-64" : "w-20"
            )}
            initial={false}
        >
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-neon-purple/20 rounded-lg">
                        <Cpu className="w-6 h-6 text-neon-purple animate-pulse-glow" />
                    </div>
                    {isOpen && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-bold text-lg tracking-wider text-white whitespace-nowrap"
                        >
                            DLX <span className="text-hologram-blue">PHOENIX</span>
                        </motion.span>
                    )}
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-1 hover:bg-white/5 rounded-md transition-colors"
                >
                    <Menu className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Menu */}
            <div className="flex-1 py-6 flex flex-col gap-2 px-3">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={clsx(
                            "flex items-center gap-4 p-3 rounded-xl transition-all group relative overflow-hidden",
                            activePage === item.id
                                ? "bg-white/10 text-hologram-blue shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        {activePage === item.id && (
                            <motion.div
                                layoutId="activeGlow"
                                className="absolute inset-0 bg-gradient-to-r from-hologram-blue/10 to-transparent"
                                initial={false}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        <item.icon className={clsx(
                            "w-6 h-6 min-w-[24px] transition-transform group-hover:scale-110",
                            activePage === item.id && "animate-pulse-glow"
                        )} />
                        {isOpen && (
                            <span className="font-medium tracking-wide truncate">
                                {item.label}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Footer Status */}
            <div className="p-4 border-t border-white/5">
                <div className={clsx(
                    "flex items-center gap-3 p-2 rounded-lg bg-black/40 border border-white/5",
                    !isOpen && "justify-center"
                )}>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {isOpen && (
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-400 uppercase tracking-wider">System Status</span>
                            <span className="text-xs text-green-400 font-mono">ONLINE</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
