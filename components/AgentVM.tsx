import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Globe, Brain, Code, Search, Loader2, Maximize2, Minimize2, X } from 'lucide-react';
import { cn } from '../lib/utils';

export type VMStatus = 'idle' | 'searching' | 'planning' | 'coding' | 'deploying';

interface AgentVMProps {
  status: VMStatus;
  task?: string;
  isVisible: boolean;
  onClose: () => void;
}

export const AgentVM: React.FC<AgentVMProps> = ({
  status,
  task,
  isVisible,
  onClose
}) => {
  const [logs, setLogs] = useState<{ msg: string; type: 'info' | 'success' | 'warn' }[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      setLogs([]);
      return;
    }

    const statusLogs: Record<VMStatus, string[]> = {
      idle: [],
      searching: [
        'Initializing web search module...',
        'Querying global knowledge graph...',
        'Analyzing search results for: ' + (task || 'current context'),
        'Extracting relevant data points...'
      ],
      planning: [
        'Synthesizing information...',
        'Generating task decomposition...',
        'Calculating optimal execution path...',
        'Verifying constraints and dependencies...'
      ],
      coding: [
        'Opening Code Studio buffer...',
        'Generating Three.js geometry...',
        'Optimizing voxel distribution...',
        'Compiling manifestation.js...'
      ],
      deploying: [
        'Preparing deployment package...',
        'Targeting Raspberry Pi node...',
        'Verifying checksums...',
        'Deployment successful.'
      ]
    };

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < statusLogs[status].length) {
        setLogs(prev => [...prev, { msg: statusLogs[status][currentLogIndex], type: 'info' }]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, task]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            width: isExpanded ? '600px' : '320px',
            height: isExpanded ? '450px' : '280px'
          }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed top-24 right-6 z-[60] bg-black/90 backdrop-blur-xl border border-white/20 rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Agent Lee Private VM</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors">
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="p-4 flex items-center gap-4 bg-white/5">
             <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                {status === 'searching' && <Search className="w-6 h-6 animate-pulse" />}
                {status === 'planning' && <Brain className="w-6 h-6 animate-pulse" />}
                {status === 'coding' && <Code className="w-6 h-6 animate-pulse" />}
                {status === 'deploying' && <Globe className="w-6 h-6 animate-spin-slow" />}
                {status === 'idle' && <Terminal className="w-6 h-6" />}
             </div>
             <div>
                <p className="text-xs font-bold text-white uppercase tracking-tight">{status === 'idle' ? 'System Idle' : `Agent Lee: ${status}`}</p>
                <p className="text-[10px] text-white/40 font-medium truncate max-w-[180px]">{task || 'Waiting for instructions...'}</p>
             </div>
          </div>

          {/* Terminal Logs */}
          <div className="flex-1 p-4 font-mono text-[9px] overflow-auto custom-scrollbar space-y-1.5">
             {logs.map((log, i) => (
               <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                key={i} 
                className="flex gap-2"
               >
                  <span className="text-primary/50">›</span>
                  <span className="text-white/70">{log.msg}</span>
               </motion.div>
             ))}
             {status !== 'idle' && (
               <div className="flex items-center gap-2 text-primary/50">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="animate-pulse">Processing...</span>
               </div>
             )}
          </div>

          {/* Footer Stats */}
          <div className="p-3 border-t border-white/10 bg-white/5 flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-white/30">
             <span>CPU: 42%</span>
             <span>RAM: 1.2GB</span>
             <span>NET: 128KB/s</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
