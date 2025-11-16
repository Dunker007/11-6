import { useEffect, useRef } from 'react';

/**
 * HolographicBackground Component
 * 
 * Canvas-based animated background with:
 * - Starfield with parallax layers
 * - Floating particles with glow effects
 * - Animated neural network connections
 * - Performance-optimized with requestAnimationFrame
 */

interface Particle {
  x: number;
  y: number;
  z: number; // for parallax
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  glowSize: number;
}

interface NeuralNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  connections: number[];
}

interface HolographicBackgroundProps {
  intensity?: 'low' | 'medium' | 'high';
  enableParticles?: boolean;
  enableNeuralNetwork?: boolean;
  enableStarfield?: boolean;
}

export function HolographicBackground({
  intensity = 'medium',
  enableParticles = true,
  enableNeuralNetwork = true,
  enableStarfield = true,
}: HolographicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Particle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const neuralNodesRef = useRef<NeuralNode[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle counts based on intensity
    const particleCounts = {
      low: { stars: 50, particles: 20, nodes: 5 },
      medium: { stars: 100, particles: 40, nodes: 8 },
      high: { stars: 200, particles: 80, nodes: 12 },
    };

    const counts = particleCounts[intensity];

    // Initialize starfield
    const initStarfield = () => {
      if (!enableStarfield) return;
      
      for (let i = 0; i < counts.stars; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 3, // 0-3 for parallax layers
          vx: 0,
          vy: Math.random() * 0.3 + 0.2, // Gentle drift
          radius: Math.random() * 2 + 1, // Small subtle stars
          color: '#ffffff',
          alpha: Math.random() * 0.4 + 0.3, // 0.3-0.7 subtle brightness
          glowSize: Math.random() * 3 + 2, // Small glow
        });
      }
    };

    // Initialize floating particles
    const initParticles = () => {
      if (!enableParticles) return;
      
      const colors = ['#06b6d4', '#8b5cf6', '#d946ef', '#f59e0b'];
      
      for (let i = 0; i < counts.particles; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: 0,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          radius: Math.random() * 3 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.4 + 0.5, // 0.5-0.9 range
          glowSize: Math.random() * 20 + 15, // Nice visible glow
        });
      }
    };

    // Initialize neural network nodes
    const initNeuralNetwork = () => {
      if (!enableNeuralNetwork) return;
      
      for (let i = 0; i < counts.nodes; i++) {
        neuralNodesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: 3,
          connections: [],
        });
      }

      // Create connections (each node connects to 2-3 nearest neighbors)
      neuralNodesRef.current.forEach((node) => {
        const distances = neuralNodesRef.current.map((other, j) => ({
          index: j,
          distance: Math.hypot(node.x - other.x, node.y - other.y),
        }));

        distances.sort((a, b) => a.distance - b.distance);
        
        // Connect to 2-3 nearest nodes (skip self at index 0)
        const connectionCount = Math.floor(Math.random() * 2) + 2;
        node.connections = distances.slice(1, connectionCount + 1).map(d => d.index);
      });
    };

    // Initialize all elements
    initStarfield();
    initParticles();
    initNeuralNetwork();
    
    // Debug log to confirm component is rendering
    console.log('[HolographicBackground] Canvas initialized:', {
      width: canvas.width,
      height: canvas.height,
      stars: starsRef.current.length,
      particles: particlesRef.current.length,
      nodes: neuralNodesRef.current.length,
    });

    // Animation loop
    let pulsePhase = 0;
    
    const animate = () => {
      // Subtle trail fade effect for smooth motion
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      pulsePhase += 0.02;

      // Draw and update starfield
      starsRef.current.forEach(star => {
        // Update position
        star.x += star.vx * (star.z + 1);
        star.y += star.vy * (star.z + 1);

        // Wrap around edges
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }

        // Draw star
        ctx.save();
        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw and update particles
      particlesRef.current.forEach(particle => {
        // Update position
        particle.x += particle.vx * (particle.z + 1);
        particle.y += particle.vy * (particle.z + 1);

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.save();
        ctx.globalAlpha = particle.alpha;

        // Glow effect
        if (particle.glowSize > 0) {
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.glowSize
          );
          gradient.addColorStop(0, particle.color);
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.fillRect(
            particle.x - particle.glowSize,
            particle.y - particle.glowSize,
            particle.glowSize * 2,
            particle.glowSize * 2
          );
        }

        // Core particle
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // Draw neural network
      if (enableNeuralNetwork) {
        neuralNodesRef.current.forEach((node, i) => {
          // Update node position
          node.x += node.vx;
          node.y += node.vy;

          // Bounce off edges
          if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
          if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

          // Draw connections
          node.connections.forEach(targetIndex => {
            const target = neuralNodesRef.current[targetIndex];
            const distance = Math.hypot(node.x - target.x, node.y - target.y);
            
            // Only draw if within reasonable distance
            if (distance < 300) {
              const alpha = 1 - distance / 300;
              
              // Pulsing effect
              const pulseAlpha = alpha * (0.2 + Math.sin(pulsePhase + i * 0.5) * 0.1);
              
              ctx.save();
              ctx.globalAlpha = pulseAlpha;
              ctx.strokeStyle = '#06b6d4';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(target.x, target.y);
              ctx.stroke();
              ctx.restore();
            }
          });

          // Draw node
          ctx.save();
          ctx.globalAlpha = 0.8 + Math.sin(pulsePhase + i) * 0.2;
          
          // Glow
          const gradient = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, 10
          );
          gradient.addColorStop(0, '#8b5cf6');
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.fillRect(node.x - 10, node.y - 10, 20, 20);

          // Node core
          ctx.fillStyle = '#d946ef';
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Clear arrays
      starsRef.current = [];
      particlesRef.current = [];
      neuralNodesRef.current = [];
    };
  }, [intensity, enableParticles, enableNeuralNetwork, enableStarfield]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1, // Above html background, below content
        pointerEvents: 'none',
      }}
    />
  );
}

export default HolographicBackground;

