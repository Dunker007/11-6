import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from './GamificationStore';
import { Trophy, Star, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export const LevelUpModal = () => {
    const { level, achievements } = useGamificationStore();
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [prevLevel, setPrevLevel] = useState(level);
    const [lastAchievementCount, setLastAchievementCount] = useState(achievements.length);
    const [newAchievement, setNewAchievement] = useState<string | null>(null);

    useEffect(() => {
        if (level > prevLevel) {
            setShowLevelUp(true);
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            setPrevLevel(level);
        }
    }, [level, prevLevel]);

    useEffect(() => {
        if (achievements.length > lastAchievementCount) {
            const latest = achievements[achievements.length - 1];
            setNewAchievement(latest); // In a real app, we'd look up the details
            setLastAchievementCount(achievements.length);

            // Auto-dismiss achievement after 3s
            setTimeout(() => setNewAchievement(null), 3000);
        }
    }, [achievements, lastAchievementCount]);

    return (
        <AnimatePresence>
            {/* Level Up Modal */}
            {showLevelUp && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.5, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.5, y: 50 }}
                        className="bg-gray-900 border border-neon-purple/50 p-8 rounded-2xl max-w-md w-full text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-purple to-hologram-blue" />

                        <button
                            onClick={() => setShowLevelUp(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mb-6 flex justify-center">
                            <div className="w-20 h-20 bg-neon-purple/20 rounded-full flex items-center justify-center border-2 border-neon-purple shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                                <Trophy className="w-10 h-10 text-neon-purple" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-2">Level Up!</h2>
                        <p className="text-gray-400 mb-6">Congratulations! You've reached <span className="text-neon-purple font-bold">Level {level}</span></p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-xs text-gray-400">New Features</div>
                                <div className="text-white font-bold">Unlocked</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-xs text-gray-400">Token Limit</div>
                                <div className="text-white font-bold">+500</div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowLevelUp(false)}
                            className="w-full py-3 bg-neon-purple hover:bg-neon-purple/80 text-white font-bold rounded-lg transition-colors"
                        >
                            Awesome!
                        </button>
                    </motion.div>
                </motion.div>
            )}

            {/* Achievement Toast */}
            {newAchievement && (
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    className="fixed bottom-8 right-8 z-50 bg-gray-900 border border-yellow-500/50 p-4 rounded-xl shadow-lg flex items-center gap-4 max-w-sm"
                >
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <Star className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                        <div className="text-xs text-yellow-500 font-bold uppercase tracking-wider">Achievement Unlocked</div>
                        <div className="text-white font-bold">New Milestone Reached!</div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
