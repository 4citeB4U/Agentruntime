import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, HardDrive, Network, ShieldCheck, Zap, Brain, ChevronDown, RotateCcw } from 'lucide-react';
import BrainVisualization from '../components/BrainVisualization';

const REGION_INFO: Record<string, { title: string; desc: string; status: string; color: string }> = {
  'agent-db': {
    title: 'AGENT DB — Memory Lake',
    desc: 'Central persistent memory store. All episodic records, voxel manifests, and session data are anchored here.',
    status: 'ONLINE',
    color: '#00ff88',
  },
  'glm-4-7-flash': {
    title: 'GLM-4.7-Flash',
    desc: 'High-throughput text transformer. Handles fast-path reasoning and chat completions.',
    status: 'LINKED',
    color: '#00f2ff',
  },
  'glm-4-6v-flash': {
    title: 'GLM-4.6V-Flash',
    desc: 'Multi-modal vision-language model. Image understanding and scene analysis.',
    status: 'LINKED',
    color: '#9854ff',
  },
  'notebook-lm': {
    title: 'Notebook LM',
    desc: 'Long-context document intelligence. Indexes research corpora and source material.',
    status: 'LINKED',
    color: '#1bf7cd',
  },
  'llama-3-local': {
    title: 'Llama 3 (Local)',
    desc: 'On-device language model. Runs fully offline; no external API required.',
    status: 'LOCAL',
    color: '#f7d31b',
  },
  'qwen-local': {
    title: 'Qwen 2.5 (Local)',
    desc: 'Primary local transformer. Powers voxel generation, chat, and code synthesis on-device via Ollama.',
    status: 'ACTIVE',
    color: '#ff2a6d',
  },
  agents: {
    title: 'Consciousness Engine',
    desc: 'Agent orchestration layer. Routes intent to sub-agents and manages task decomposition.',
    status: 'RUNNING',
    color: '#ff2a6d',
  },
  datacore: {
    title: 'Episodic Memory',
    desc: 'Time-indexed experience replay. Stores and retrieves past interactions.',
    status: 'ONLINE',
    color: '#6C47FF',
  },
  todo: {
    title: 'Intent Classifier',
    desc: 'Real-time NLU pipeline. Classifies incoming messages and routes to the correct handler.',
    status: 'ONLINE',
    color: '#00f2ff',
  },
  'workers-dashboard': {
    title: 'Dashboard MCP',
    desc: 'Model Context Protocol bridge to the monitoring dashboard.',
    status: 'LINKED',
    color: '#1bf7cd',
  },
  'workers-browser': {
    title: 'Browser MCP',
    desc: 'MCP bridge for web-based tool use and external data retrieval.',
    status: 'LINKED',
    color: '#00f2ff',
  },
  'workers-bridge': {
    title: 'Bridge MCP',
    desc: 'Inter-system protocol bridge. Connects backend services to the front-end runtime.',
    status: 'LINKED',
    color: '#9854ff',
  },
};

const quickStats = [
  { label: 'Neural Core', value: '98.4%', icon: Cpu, color: 'text-blue-400' },
  { label: 'Voxel Buffer', value: '2.4 GB', icon: HardDrive, color: 'text-purple-400' },
  { label: 'Sync Latency', value: '12ms', icon: Zap, color: 'text-yellow-400' },
  { label: 'Net Integrity', value: 'Secured', icon: ShieldCheck, color: 'text-green-400' },
];

export const Diagnostics: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showStats, setShowStats] = useState(false);

  const info = selectedRegion ? REGION_INFO[selectedRegion] : null;

  return (
    <div className="flex flex-col h-full w-full bg-[#070d18] text-white overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/30 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-[#00f2ff] animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#00f2ff]">
            Neural Diagnostic Center
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAutoRotate(r => !r)}
            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${
              autoRotate
                ? 'border-[#00f2ff]/50 text-[#00f2ff] bg-[#00f2ff]/10'
                : 'border-white/20 text-white/40'
            }`}
          >
            <RotateCcw className="w-3 h-3 inline mr-1" />
            {autoRotate ? 'Auto-rotate ON' : 'Auto-rotate OFF'}
          </button>
          <button
            onClick={() => setShowStats(s => !s)}
            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/20 text-white/40 hover:text-white/80 transition-all flex items-center gap-1"
          >
            <Activity className="w-3 h-3" />
            Stats
            <ChevronDown className={`w-3 h-3 transition-transform ${showStats ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick stats (collapsible) */}
      {showStats && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="grid grid-cols-4 gap-3 px-6 py-3 bg-black/20 border-b border-white/10 shrink-0"
        >
          {quickStats.map(stat => (
            <div key={stat.label} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">{stat.label}</p>
                <p className="text-sm font-black">{stat.value}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Main content — brain + info panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* 3D Brain */}
        <div className="flex-1 relative">
          <BrainVisualization
            onRegionClick={setSelectedRegion}
            autoRotate={autoRotate}
            selectedRegionId={selectedRegion}
          />

          {/* Tap-to-select hint */}
          {!selectedRegion && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-white/30 pointer-events-none select-none">
              Tap a region to inspect
            </div>
          )}
        </div>

        {/* Region info panel */}
        {info && (
          <motion.div
            key={selectedRegion}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="w-72 bg-black/60 backdrop-blur-xl border-l border-white/10 p-6 flex flex-col gap-5 shrink-0 overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ background: info.color, boxShadow: `0 0 12px ${info.color}` }}
              />
              <span
                className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: `${info.color}22`, color: info.color, border: `1px solid ${info.color}44` }}
              >
                {info.status}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-black tracking-tight mb-2" style={{ color: info.color }}>
                {info.title}
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">{info.desc}</p>
            </div>

            <div className="space-y-2 mt-auto">
              {[
                { label: 'Uptime', value: '142d 06h' },
                { label: 'Latency', value: '12 ms' },
                { label: 'Throughput', value: '850 req/s' },
                { label: 'Health', value: '99.9%' },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-white/30">{row.label}</span>
                  <span className="text-white/80">{row.value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedRegion(null)}
              className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white/70 transition-colors"
            >
              &times; Close
            </button>
          </motion.div>
        )}
      </div>

      {/* System-wide waveform footer */}
      <div className="px-6 py-3 border-t border-white/10 bg-black/30 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Network className="w-3 h-3 text-[#00f2ff]" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Live Neural Waveform</span>
        </div>
        <div className="flex items-end gap-0.5 h-8">
          {[...Array(60)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [4, Math.random() * 28 + 4, 4] }}
              transition={{ duration: 1.2 + Math.random() * 0.8, repeat: Infinity, delay: i * 0.03 }}
              className="flex-1 rounded-full"
              style={{ background: `hsl(${180 + i * 2}, 100%, 60%)`, opacity: 0.6 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
