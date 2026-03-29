import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ParticleTransitionProps {
  isActive: boolean;
  color?: string;
  mode?: 'explode' | 'implode' | 'both';
}

export const ParticleTransition: React.FC<ParticleTransitionProps> = ({ 
  isActive, 
  color = '#00FF00',
  mode = 'both'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [internalActive, setInternalActive] = useState(false);

  useEffect(() => {
    if (isActive) {
      setInternalActive(true);
    } else {
      // Small delay to let animation finish if needed
      const timer = setTimeout(() => setInternalActive(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  useEffect(() => {
    if (!internalActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const updateSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    updateSize();

    const particles: any[] = [];
    const particleCount = 400;
    const centerX = canvas.offsetWidth / 2;
    const centerY = canvas.offsetHeight / 2;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 15 + 5;
      const distance = mode === 'implode' ? 400 : 0;
      
      particles.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        targetX: centerX,
        targetY: centerY,
        vx: mode === 'implode' ? 0 : Math.cos(angle) * speed,
        vy: mode === 'implode' ? 0 : Math.sin(angle) * speed,
        size: Math.random() * 6 + 3,
        life: 1,
        decay: Math.random() * 0.01 + 0.005,
        color: color,
        phase: mode === 'both' ? 'explode' : mode
      });
    }

    let animationFrame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let allFinished = true;
      particles.forEach(p => {
        if (p.life > 0) {
          allFinished = false;
          
          if (p.phase === 'explode') {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.life -= p.decay;
            
            if (mode === 'both' && p.life < 0.3) {
              p.phase = 'implode';
              p.life = 0.3; // Reset life for return trip
              // Set velocity towards center
              const dx = centerX - p.x;
              const dy = centerY - p.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              p.vx = (dx / dist) * 25;
              p.vy = (dy / dist) * 25;
            }
          } else if (p.phase === 'implode') {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay * 1.5;
            
            // Check if reached center
            const dx = centerX - p.x;
            const dy = centerY - p.y;
            if (Math.sqrt(dx*dx + dy*dy) < 10) {
              p.life = 0;
            }
          }
          
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.life);
          // Draw square "voxels"
          ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        }
      });

      if (!allFinished) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => cancelAnimationFrame(animationFrame);
  }, [internalActive, color, mode]);

  return (
    <AnimatePresence>
      {internalActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ maxWidth: '1000px', maxHeight: '1000px' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
