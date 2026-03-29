/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI
TAG: UI.COMPONENT.AGENTLEECOMPUTERCARD.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = Agent Lee Computer Card (Floating Viewport)
WHY = Unified VM + Code Studio display
WHO = LEEWAY Align Agent
WHERE = .Agent_Lee_OS\components\AgentLeeComputerCard.tsx
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { AnimatePresence, motion } from "framer-motion";
import {
    ChevronDown,
    Code,
    FolderOpen,
    Maximize2,
    Minimize2,
    Monitor,
    Terminal as TerminalIcon,
    X
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

// ── Type Definitions ──
interface ComputerCardProps {
  isOpen: boolean;
  onClose: () => void;
  activeContent: "desktop" | "code" | "terminal" | "files";
  desktopFeed?: HTMLCanvasElement | null; // Live desktop screenshot
  terminalOutput?: string;
  onContentChange?: (content: string) => void;
}

interface TerminalBubbleProps {
  isVisible: boolean;
  output: string;
  isActive: boolean;
}

// ── Floating Terminal Bubble ──
// Positioned above and to the right of the main viewport
const TerminalBubble: React.FC<TerminalBubbleProps> = ({
  isVisible,
  output,
  isActive,
}) => {
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="absolute bottom-[480px] right-0 w-80 h-48 rounded-[20px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div
        className={`h-10 px-4 flex items-center justify-between shrink-0 border-b border-white/10 ${
          isActive ? "bg-cyan-500/10" : "bg-white/5"
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isActive ? "bg-cyan-400 animate-pulse" : "bg-gray-400"
            }`}
          />
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-gray-700 dark:text-gray-300">
            Terminal
          </span>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[10px] text-gray-600 dark:text-green-300 leading-relaxed whitespace-pre-wrap break-words bg-gray-50 dark:bg-black/40"
      >
        {output || "[Waiting for output...]"}
      </div>
    </motion.div>
  );
};

// ── Main Computer Viewport Card ──
export const AgentLeeComputerCard: React.FC<ComputerCardProps> = ({
  isOpen,
  onClose,
  activeContent = "desktop",
  desktopFeed,
  terminalOutput = "",
  onContentChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [progress, setProgress] = useState(65); // Simulated progress (0-100)
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulate progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 15;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Render desktop feed if available
  useEffect(() => {
    if (desktopFeed && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.drawImage(desktopFeed, 0, 0);
      }
    }
  }, [desktopFeed]);

  const renderContent = () => {
    switch (activeContent) {
      case "desktop":
        return (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center">
            {desktopFeed ? (
              <canvas ref={canvasRef} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Monitor size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Desktop feed offline
                </p>
              </div>
            )}
          </div>
        );
      case "terminal":
        return (
          <div className="w-full h-full bg-black/80 font-mono text-[11px] text-green-300 p-4 overflow-y-auto">
            {terminalOutput || "[Terminal ready]"}
          </div>
        );
      case "code":
        return (
          <div className="w-full h-full bg-slate-900 text-white p-4 overflow-y-auto flex items-center justify-center">
            <div className="text-center">
              <Code size={40} className="mx-auto mb-2 text-cyan-400" />
              <p className="text-xs text-gray-400">Code Studio</p>
            </div>
          </div>
        );
      case "files":
        return (
          <div className="w-full h-full bg-slate-100 dark:bg-slate-900 p-4 overflow-y-auto flex items-center justify-center">
            <div className="text-center">
              <FolderOpen size={40} className="mx-auto mb-2 text-blue-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                File Explorer
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-auto"
      >
        {/* Main Computer Viewport Card */}
        <div className="relative">
          <motion.div
            animate={{ height: isExpanded ? 480 : 240 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-[580px] bg-white/85 dark:bg-slate-800/85 backdrop-blur-md rounded-[28px] border border-white/30 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
          >
            {/* Header / Title Bar */}
            <div className="h-12 px-6 flex items-center justify-between shrink-0 border-b border-white/20 dark:border-white/5 bg-white/40 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400 shadow-sm" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm" />
                  <div className="w-3 h-3 rounded-full bg-green-400 shadow-sm" />
                </div>
                <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-gray-700 dark:text-gray-300">
                  Agent Lee's Computer
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 hover:bg-white/30 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <Minimize2 size={14} />
                  ) : (
                    <Maximize2 size={14} />
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-red-500/20 dark:hover:bg-red-500/20 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
              {renderContent()}

              {/* Content Type Tabs */}
              <div className="absolute top-4 left-4 flex gap-2 pointer-events-auto">
                {[
                  { id: "desktop", icon: Monitor, label: "Desktop" },
                  { id: "code", icon: Code, label: "Code" },
                  { id: "terminal", icon: TerminalIcon, label: "Shell" },
                  { id: "files", icon: FolderOpen, label: "Files" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onContentChange?.(tab.id)}
                    className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-mono font-bold transition-all ${
                      activeContent === tab.id
                        ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/50"
                        : "bg-white/20 dark:bg-white/5 text-gray-700 dark:text-gray-400 border border-transparent hover:bg-white/40 dark:hover:bg-white/10"
                    }`}
                  >
                    <tab.icon size={12} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Control Rail */}
            <div className="h-12 px-6 flex items-center justify-between shrink-0 border-t border-white/20 dark:border-white/5 bg-white/40 dark:bg-white/5">
              {/* Progress Bar */}
              <div className="flex-1 mr-4 h-1.5 bg-white/30 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-lg shadow-cyan-500/50"
                />
              </div>

              {/* Down Arrow Button (Center) */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute left-1/2 -translate-x-1/2 -bottom-6 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 border border-white/30 dark:border-white/10 flex items-center justify-center shadow-lg hover:scale-110 transition-transform text-gray-700 dark:text-gray-300"
                title="Toggle expanded"
              >
                <ChevronDown
                  size={18}
                  className={`transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* LIVE Label */}
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-gray-700 dark:text-gray-300">
                  LIVE
                </span>
              </div>
            </div>
          </motion.div>

          {/* Floating Terminal Bubble - Positioned above and to the right */}
          <TerminalBubble
            isVisible={isExpanded}
            output={terminalOutput}
            isActive={activeContent === "terminal"}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AgentLeeComputerCard;
