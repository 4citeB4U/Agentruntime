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
WHERE = .Agent_Lee_OS\components\AgentLeeComputerCard.v2.tsx
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
    X,
} from "lucide-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { CodeStudio } from "./CodeStudio";
import {
    useWorkstation,
    WorkstationContext,
} from "../context/AgentLeeWorkstationContext";
import { buildApiUrl, buildWebSocketUrl } from "../utils/runtimeUrls";

// ── Type Definitions ──
interface ComputerCardProps {
  isOpen: boolean;
  onClose: () => void;
  activeContent?: "desktop" | "code" | "terminal" | "files";
  desktopFeed?: HTMLCanvasElement | null;
  terminalOutput?: string;
  onContentChange?: (content: string) => void;
  activeTab?: string;
  simulationRequest?: { id: string; filename: string };
  buildPlan?: { steps: string[]; taskName: string } | null;
  onBuildComplete?: () => void;
}

interface TerminalBubbleProps {
  isVisible: boolean;
  output: string;
  isActive: boolean;
}

// ── Floating Terminal Bubble ──
const TerminalBubble: React.FC<
  TerminalBubbleProps & { isConnected?: boolean }
> = ({ isVisible, output, isActive, isConnected = false }) => {
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
      className="absolute -top-56 right-0 h-52 w-[min(24rem,84vw)] rounded-[24px] bg-white/75 dark:bg-slate-900/75 backdrop-blur-lg border border-white/30 dark:border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div
        className={`h-11 px-5 flex items-center justify-between shrink-0 border-b border-white/20 dark:border-white/5 ${
          isActive
            ? "bg-cyan-500/15 dark:bg-cyan-500/10"
            : "bg-white/40 dark:bg-white/5"
        }`}
      >
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-red-400" />
          )}
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-gray-700 dark:text-gray-300">
            Terminal
          </span>
        </div>
        <span className="text-[8px] font-mono text-gray-500 dark:text-gray-500">
          {isConnected ? "LIVE" : "offline"}
        </span>
      </div>

      {/* Terminal Output */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[10px] text-gray-600 dark:text-green-300 leading-relaxed whitespace-pre-wrap break-words bg-gray-50 dark:bg-black/50"
      >
        {output || "[Terminal awaiting input...]\n$"}
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
  simulationRequest,
  buildPlan,
  onBuildComplete,
}) => {
  const workstationContext = useContext(WorkstationContext);
  const workstation = workstationContext ? useWorkstation() : null;

  const [isExpanded, setIsExpanded] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isTerminalConnected, setIsTerminalConnected] = useState(false);
  const [isDesktopConnected, setIsDesktopConnected] = useState(false);
  const [isManuallyOpened, setIsManuallyOpened] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["/home/agent_lee"]),
  );
  const [isFileTreeLoading, setIsFileTreeLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const termSessionRef = useRef<string | null>(null);
  const desktopIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // Use context state if available, otherwise use props
  const state = workstationContext?.state;
  const displayContent = activeContent;
  const displayTerminal = workstation
    ? state?.terminalOutput || ""
    : terminalOutput || state?.terminalOutput || "";

  // Auto-show/hide based on task count
  const taskCount = state?.tasks?.length || 0;
  const hasActiveTasks = taskCount > 0;

  // Track when user manually opens the card
  useEffect(() => {
    if (isOpen && !isManuallyOpened && hasActiveTasks) {
      setIsManuallyOpened(false); // Task-driven
    } else if (isOpen && !hasActiveTasks) {
      setIsManuallyOpened(true); // User-driven
    }
  }, [isOpen, hasActiveTasks]);

  // Auto-close when no tasks and wasn't manually opened
  useEffect(() => {
    if (!isManuallyOpened && !hasActiveTasks && isOpen) {
      onClose();
    }
  }, [hasActiveTasks, isManuallyOpened, isOpen, onClose]);

  // Update progress from context (real task progress, not decorative)
  // buildProgress is synced from TaskManager via useTaskManagerSync hook
  useEffect(() => {
    if (state?.buildProgress !== undefined) {
      setProgress(state.buildProgress);
    }
  }, [state?.buildProgress]);

  // Initialize terminal websocket connection
  useEffect(() => {
    if (!isOpen || !workstation) return;

    const handshake =
      (import.meta as any).env?.VITE_NEURAL_HANDSHAKE ||
      localStorage.getItem("AGENT_LEE_KEY") ||
      "AGENT_LEE_SOVEREIGN_V1";

    const initTerminal = async () => {
      try {
        // Step 1: Create terminal session
        const sessionRes = await fetch(buildApiUrl("/api/terminal/session"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(handshake ? { "x-neural-handshake": handshake } : {}),
          },
          body: JSON.stringify({ mode: "safe", cols: 120, rows: 30 }),
        });

        if (!sessionRes.ok) {
          workstation.appendTerminal(
            "[Error: Failed to create terminal session]\n",
          );
          setIsTerminalConnected(false);
          return;
        }

        const { sessionId } = await sessionRes.json();
        termSessionRef.current = sessionId;

        // Step 2: Connect to websocket
        const wsUrl = `${buildWebSocketUrl("/api/terminal/ws")}?sessionId=${sessionId}&handshake=${encodeURIComponent(handshake)}`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsTerminalConnected(true);
          workstation.appendTerminal("Connected to terminal.\n$ ");
        };

        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === "output") {
              // Clean ANSI escape sequences
              const clean = msg.data
                .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "")
                .replace(/\r/g, "");
              workstation.appendTerminal(clean);
            } else if (msg.type === "policy_block") {
              workstation.appendTerminal(`\n[BLOCKED] ${msg.reason}\n`);
            }
          } catch (err) {
            console.warn("[Terminal] Parse error:", err);
          }
        };

        ws.onerror = () => {
          setIsTerminalConnected(false);
          workstation.appendTerminal("\n[Terminal connection error]\n");
        };

        ws.onclose = () => {
          setIsTerminalConnected(false);
          workstation.appendTerminal("\n[Terminal disconnected]\n");
        };

        wsRef.current = ws;
      } catch (err) {
        setIsTerminalConnected(false);
        workstation.appendTerminal(`[Terminal init failed: ${String(err)}]\n`);
      }
    };

    initTerminal();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isOpen, workstation]);

  // Desktop screenshot polling
  useEffect(() => {
    if (!isOpen || !workstation) return;

    const handshake =
      (import.meta as any).env?.VITE_NEURAL_HANDSHAKE ||
      localStorage.getItem("AGENT_LEE_KEY") ||
      "AGENT_LEE_SOVEREIGN_V1";

    const pollDesktop = async () => {
      try {
        const res = await fetch(buildApiUrl("/api/device/screenshot"), {
          headers: {
            ...(handshake ? { "x-neural-handshake": handshake } : {}),
          },
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          workstation.setScreenshotUrl(url);
          setIsDesktopConnected(true);
        } else {
          setIsDesktopConnected(false);
        }
      } catch (err) {
        setIsDesktopConnected(false);
      }
    };

    // Poll immediately and then every 1200ms
    pollDesktop();
    desktopIntervalRef.current = setInterval(() => {
      pollDesktop();
    }, 1200);

    return () => {
      if (desktopIntervalRef.current) {
        clearInterval(desktopIntervalRef.current);
      }
    };
  }, [isOpen, workstation]);

  // Render desktop feed
  useEffect(() => {
    if (desktopFeed && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.drawImage(desktopFeed, 0, 0);
      }
    }
  }, [desktopFeed]);

  // VFS file tree fetching and navigation
  useEffect(() => {
    if (!isOpen || !workstation) return;

    const handshake =
      (import.meta as any).env?.VITE_NEURAL_HANDSHAKE ||
      localStorage.getItem("AGENT_LEE_KEY") ||
      "AGENT_LEE_SOVEREIGN_V1";

    const fetchVFS = async (path: string) => {
      setIsFileTreeLoading(true);
      try {
        const res = await fetch(
          buildApiUrl(`/api/vm/vfs?path=${encodeURIComponent(path)}`),
          {
            headers: {
              ...(handshake ? { "x-neural-handshake": handshake } : {}),
            },
          },
        );

        if (res.ok) {
          const data = await res.json();
          // Assume response is { children: WorkstationFile[] }
          const items = data.children || [];
          workstation.setFileTree(items);
          workstation.setCurrentPath(path);
        }
      } catch (err) {
        console.warn("[Files] VFS fetch error:", err);
      } finally {
        setIsFileTreeLoading(false);
      }
    };

    // Fetch initial file tree
    fetchVFS(state?.currentPath || "/home/agent_lee");
  }, [isOpen, workstation]);

  const renderContent = () => {
    switch (displayContent) {
      case "desktop":
        return (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 via-slate-75 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center overflow-hidden relative">
            {state?.screenshotUrl ? (
              <>
                <img
                  src={state.screenshotUrl}
                  className="w-full h-full object-cover"
                  alt="Live desktop"
                />
                <div className="absolute top-3 right-5 flex items-center gap-2 text-[9px] font-mono">
                  {isDesktopConnected ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-500 dark:text-green-400">
                        LIVE
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="text-yellow-600 dark:text-yellow-400">
                        LOADING
                      </span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center flex flex-col items-center gap-3">
                <Monitor
                  size={52}
                  className="text-gray-400 dark:text-gray-600"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {isDesktopConnected
                    ? "Loading desktop..."
                    : "Awaiting desktop feed"}
                </p>
              </div>
            )}
          </div>
        );

      case "terminal":
        return (
          <div className="w-full h-full bg-black/95 font-mono text-[11px] text-green-300 px-5 py-4 overflow-y-auto whitespace-pre-wrap break-words leading-relaxed selection:bg-green-300/20 flex flex-col relative">
            <div className="absolute top-3 right-5 flex items-center gap-2 text-[9px] font-mono">
              {isTerminalConnected ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-500">CONNECTED</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-red-500">OFFLINE</span>
                </>
              )}
            </div>
            <div className="flex-1 pt-6">
              {displayTerminal || "[Shell ready]\n$"}
            </div>
          </div>
        );

      case "code":
        return (
          <div className="w-full h-full overflow-hidden bg-[#050505]">
            <CodeStudio
              simulationRequest={simulationRequest}
              buildPlan={buildPlan}
              onBuildComplete={onBuildComplete}
            />
          </div>
        );

      case "files":
        return (
          <div className="w-full h-full bg-slate-100 dark:bg-slate-900 px-5 py-4 overflow-y-auto flex flex-col">
            {/* Breadcrumb Navigation */}
            <div className="text-[9px] text-gray-600 dark:text-gray-400 font-mono mb-3 pb-3 border-b border-gray-300 dark:border-gray-700">
              <span
                onClick={() => {
                  if (workstation) {
                    setExpandedFolders(new Set(["/home/agent_lee"]));
                  }
                }}
                className="cursor-pointer hover:text-cyan-500 transition-colors"
              >
                /
              </span>
              {state?.currentPath
                ?.split("/")
                .filter(Boolean)
                .map((segment, i, arr) => (
                  <span key={i}>
                    <span className="mx-1">/</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {segment}
                    </span>
                  </span>
                ))}
            </div>

            {/* File List */}
            {isFileTreeLoading ? (
              <div className="flex items-center justify-center h-32 opacity-40">
                <div className="text-[10px] text-gray-600 dark:text-gray-400">
                  Loading…
                </div>
              </div>
            ) : state?.fileTree && state.fileTree.length > 0 ? (
              <div className="space-y-1 flex-1">
                {state.fileTree.map((file, i) => {
                  const isSelected = state.activeFile?.path === file.path;
                  const isExpanded = expandedFolders.has(file.path);

                  return (
                    <div key={i}>
                      <div
                        onClick={() => {
                          if (file.type === "directory") {
                            // Toggle folder expansion
                            const newExpanded = new Set(expandedFolders);
                            if (isExpanded) {
                              newExpanded.delete(file.path);
                            } else {
                              newExpanded.add(file.path);
                            }
                            setExpandedFolders(newExpanded);
                          } else {
                            // Select file
                            if (workstation) {
                              workstation.setActiveFile(file);
                            }
                          }
                        }}
                        className={`text-[10px] flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 border border-cyan-500/50"
                            : "text-gray-700 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
                        }`}
                      >
                        {file.type === "directory" && (
                          <ChevronDown
                            size={12}
                            className={`shrink-0 transition-transform ${
                              isExpanded ? "rotate-0" : "-rotate-90"
                            }`}
                          />
                        )}
                        {!file.type && <div className="w-3" />}
                        {file.type === "directory" ? (
                          <FolderOpen
                            size={13}
                            className="text-blue-400 shrink-0"
                          />
                        ) : (
                          <Code size={13} className="text-cyan-400 shrink-0" />
                        )}
                        <span className="truncate text-xs">{file.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 opacity-40">
                <div className="text-center">
                  <FolderOpen size={40} className="mx-auto mb-2" />
                  <div className="text-[9px] text-gray-600 dark:text-gray-400">
                    Empty folder
                  </div>
                </div>
              </div>
            )}

            {/* Status Footer */}
            <div className="text-[8px] text-gray-600 dark:text-gray-500 mt-3 pt-3 border-t border-gray-300 dark:border-gray-700">
              {state?.activeFile ? (
                <span>
                  Selected:{" "}
                  <span className="font-mono text-cyan-600 dark:text-cyan-400">
                    {state.activeFile.name}
                  </span>
                </span>
              ) : (
                <span>Click a file to select</span>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const positionClassName =
    "fixed left-4 top-4 z-[95] pointer-events-auto max-w-[calc(100vw-2rem)]";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.82, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.82, opacity: 0, y: -20 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className={positionClassName}
      >
        {/* Main Computer Viewport Card Container*/}
        <div className="relative">
          {/* Main Card */}
          <motion.div
            layout
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className={`w-[min(92vw,860px)] bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg rounded-[36px] border border-white/45 dark:border-white/10 shadow-[0_28px_80px_rgba(0,0,0,0.2)] dark:shadow-[0_28px_80px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col ${
              isExpanded ? "h-[min(72vh,640px)]" : "h-[320px]"
            }`}
          >
            {/* ── HEADER / TITLE BAR ── */}
            <div className="h-15 px-8 flex items-center justify-between shrink-0 border-b border-white/25 dark:border-white/5 bg-gradient-to-b from-white/60 to-white/25 dark:from-white/15 dark:to-white/5">
              <div className="flex items-center gap-5">
                {/* Traffic Light */}
                <div className="flex gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-400/85 shadow-sm" />
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-400/85 shadow-sm" />
                  <div className="w-3.5 h-3.5 rounded-full bg-green-400/85 shadow-sm" />
                </div>
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-800 dark:text-gray-100">
                  Agent Lee's Computer
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2.5 hover:bg-black/8 dark:hover:bg-white/12 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <Minimize2 size={15} />
                  ) : (
                    <Maximize2 size={15} />
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="p-2.5 hover:bg-red-500/15 dark:hover:bg-red-500/20 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-red-700 dark:hover:text-red-400"
                  title="Close"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* ── CONTENT AREA ── */}
            <div className="flex-1 overflow-hidden relative bg-gradient-to-br from-slate-50 via-white to-slate-75 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
              {renderContent()}

              {/* ── CONTENT TABS ── */}
              <div className="absolute top-5 left-5 right-5 flex gap-2.5 pointer-events-auto">
                {[
                  { id: "desktop", icon: Monitor, label: "Desktop" },
                  { id: "code", icon: Code, label: "Studio" },
                  { id: "terminal", icon: TerminalIcon, label: "Shell" },
                  { id: "files", icon: FolderOpen, label: "Files" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onContentChange?.(tab.id)}
                    className={`px-3.5 py-2.5 rounded-lg flex items-center gap-2 text-[10px] font-mono font-bold transition-all duration-250 ${
                      displayContent === tab.id
                        ? "bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 border border-cyan-500/70 shadow-[0_0_20px_rgba(34,212,238,0.25)]"
                        : "bg-black/8 dark:bg-white/8 text-gray-700 dark:text-gray-400 border border-transparent hover:bg-black/12 dark:hover:bg-white/12"
                    }`}
                  >
                    <tab.icon size={13} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── TASK STATUS INDICATOR ── */}
              {state?.tasks && state.tasks.length > 0 && (
                <div className="absolute top-5 right-5 flex items-center gap-2.5 bg-black/10 dark:bg-white/8 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/15 dark:border-white/5">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[9px] font-mono text-gray-700 dark:text-gray-400 font-semibold">
                    {state.tasks.length}{" "}
                    {state.tasks.length !== 1 ? "tasks" : "task"}
                  </span>
                </div>
              )}
            </div>

            {/* ── BOTTOM CONTROL RAIL ── */}
            <div className="h-16 px-8 flex items-center justify-between shrink-0 border-t border-white/25 dark:border-white/5 bg-gradient-to-t from-white/60 to-white/25 dark:from-white/15 dark:to-white/5 relative">
              {/* Progress Bar with Task Label */}
              <div className="flex-1 mr-8 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  {state?.tasks && state.tasks.length > 0 && (
                    <span className="text-[8px] font-mono text-gray-600 dark:text-gray-400 font-bold truncate max-w-xs">
                      {state.tasks[0]?.name || "Running task"}
                    </span>
                  )}
                  <span className="text-[8px] font-mono text-gray-600 dark:text-gray-400 font-bold w-9 text-right">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="flex-1 h-2.5 bg-white/35 dark:bg-white/12 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 rounded-full shadow-[0_0_20px_rgba(34,212,238,0.6)]"
                  />
                </div>
              </div>

              {/* ── DOWN ARROW BUTTON (Floating Center) ── */}
              <motion.button
                onClick={() => setIsExpanded(!isExpanded)}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.93 }}
                className="absolute left-1/2 -translate-x-1/2 -bottom-8 w-14 h-14 rounded-full bg-white dark:bg-slate-800 border border-white/45 dark:border-white/15 flex items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)} text-gray-800 dark:text-gray-300 hover:shadow-[0_16px_50px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_16px_50px_rgba(0,0,0,0.6)] transition-shadow"
                title="Toggle expanded"
              >
                <ChevronDown
                  size={22}
                  className={`transition-transform duration-400 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </motion.button>

              {/* ── LIVE STATUS BADGE ── */}
              <div className="flex items-center gap-2.5 ml-auto">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/70 animate-pulse" />
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-gray-800 dark:text-gray-200">
                  LIVE
                </span>
              </div>
            </div>
          </motion.div>

          {/* ── FLOATING TERMINAL BUBBLE ── */}
          <TerminalBubble
            isVisible={isExpanded && displayContent !== "terminal"}
            output={displayTerminal}
            isActive={displayContent === "terminal"}
            isConnected={isTerminalConnected}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AgentLeeComputerCard;
