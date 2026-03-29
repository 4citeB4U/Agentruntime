import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface AgentLeeProps {
  voxelCode: string | null;
  savedVoxels?: any[];
  isSpeaking?: boolean;
  isChangingForm?: boolean;
  size?: 'large' | 'small';
  className?: string;
}

export const AgentLee: React.FC<AgentLeeProps> = ({
  voxelCode,
  savedVoxels = [],
  isSpeaking = false,
  isChangingForm = false,
  size = 'large',
  className
}) => {
  const rotationIframeRef = useRef<HTMLIFrameElement>(null);
  const customIframeRef = useRef<HTMLIFrameElement>(null);
  const [currentRotationIndex, setCurrentRotationIndex] = useState(0);

  // Default voxel images (example HTML files)
  const defaultVoxels = [
    { type: 'url', content: '/examples/example1.html' },
    { type: 'url', content: '/examples/example2.html' },
    { type: 'url', content: '/examples/example3.html' },
    { type: 'url', content: '/examples/example4.html' },
    { type: 'url', content: '/examples/example5.html' }
  ];

  // Combine defaults with saved ones for the rotation
  const rotationList = [
    ...defaultVoxels,
    ...savedVoxels.map(v => ({ type: 'code', content: v.code }))
  ];

  // Slideshow for rotation
  useEffect(() => {
    if (voxelCode) return;
    const interval = setInterval(() => {
      // Send dismantle message before switching
      if (rotationIframeRef.current?.contentWindow) {
        rotationIframeRef.current.contentWindow.postMessage({ type: 'DISMANTLE' }, '*');
      }

      setTimeout(() => {
        setCurrentRotationIndex((prev) => (prev + 1) % rotationList.length);
      }, 2500); // Wait for dismantle animation
    }, 60000); // Change every 60 seconds (1 minute)
    return () => clearInterval(interval);
  }, [voxelCode, rotationList.length]);

  const currentRotationItem = rotationList[currentRotationIndex];

  return (
    <div className={cn(
      "relative flex items-center justify-center overflow-visible transition-all duration-500",
      size === 'large' ? "w-full h-full" : "w-12 h-12 rounded-full border-2 border-primary/20 bg-black/5",
      className
    )}>
      <motion.div
        animate={isSpeaking ? "speaking" : "idle"}
        variants={{
          idle: { scale: 1, y: 0 },
          speaking: {
            // Only scale if small, to avoid iframe interaction issues on large view
            scale: size === 'small' ? [1, 1.05, 1] : 1,
            y: size === 'small' ? [0, -2, 0] : 0,
            transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
          }
        }}
        className="w-full h-full flex items-center justify-center relative pointer-events-none"
      >
        {/* Rotation Iframe (Always mounted but hidden when custom voxel is active) */}
        <iframe
          ref={rotationIframeRef}
          src={currentRotationItem?.type === 'url' ? currentRotationItem.content : undefined}
          srcDoc={currentRotationItem?.type === 'code' ? currentRotationItem.content : undefined}
          className={cn(
            "absolute inset-0 w-full h-full border-none transition-opacity duration-1000 pointer-events-auto",
            voxelCode ? "opacity-0 z-0" : "opacity-100 z-10"
          )}
          title="Agent Lee Default Rotation"
          sandbox="allow-scripts allow-same-origin"
        />

        {/* Custom Voxel Iframe (Only mounted when voxelCode is present) */}
        {voxelCode && (
          <iframe
            ref={customIframeRef}
            srcDoc={voxelCode}
            className="absolute inset-0 w-full h-full border-none pointer-events-auto z-20"
            title="Agent Lee Custom Voxel"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </motion.div>
    </div>
  );
};
