import { motion } from 'framer-motion';

export const Background = () => {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-deep-space">
            {/* Radial Glow */}
            <div className="absolute inset-0 bg-glow-radial opacity-40 pointer-events-none" />

            {/* Animated Grid - Smooth & Subtle */}
            <motion.div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'linear-gradient(rgba(0, 243, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.08) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                }}
                animate={{
                    backgroundPosition: ['0px 0px', '50px 50px'],
                }}
                transition={{
                    duration: 40,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />

            {/* Floating Particles (Abstract) */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full bg-neon-purple blur-3xl opacity-10"
                    style={{
                        width: Math.random() * 300 + 100,
                        height: Math.random() * 300 + 100,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        x: [0, 100, 0],
                        y: [0, -100, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
};
