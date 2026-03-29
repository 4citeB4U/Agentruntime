import React, { useState, useEffect } from 'react';
import { Brain, Stethoscope, Database, RefreshCw, ShieldCheck, Recycle, Eye, Cog, History, Activity, Network, UserCog, ListTodo, X, LineChart, Terminal, Cpu, HardDrive, Zap, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import { LineChart as ReLineChart, Line as ReLine, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar as ReBar, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie } from 'recharts';
import BrainVisualization from './BrainVisualization';
import MemoryLake from './MemoryLake';
import DatabaseDashboard from './DatabaseDashboard';
import AgentCenter from './AgentCenter';
import TodoList from './TodoList';
import WorkersCenter from './WorkersCenter';
import MatrixDashboard from './MatrixDashboard';

export default function CognitiveCore() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [isLogsCollapsed, setIsLogsCollapsed] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [expandedRightSections, setExpandedRightSections] = useState<string[]>(['logs', 'datacore', 'agents']);
  const [todos, setTodos] = useState<{ id: string; text: string; completed: boolean; source: string }[]>([
    { id: '1', text: 'Calibrate neural pathways', completed: false, source: 'LLM' },
    { id: '2', text: 'Sync memory buffers', completed: true, source: 'AGENT' },
    { id: '3', text: 'Check system vitals', completed: false, source: 'USER' }
  ]);
  const [newTodo, setNewTodo] = useState('');
  const [notes, setNotes] = useState('System is running at peak efficiency. All neural pathways are clear.');
  const [telemetry, setTelemetry] = useState({
    cpuCores: Array.from({ length: 8 }, (_, i) => ({ name: `C${i}`, temp: 40 + Math.random() * 20 })),
    battery: { current: -450, voltage: 3.8, cycles: 142, level: 85 },
    storage: { read: 120, write: 45 },
    hinge: 180,
    gyro: { x: 0, y: 0, z: 0 },
    network: { rsrp: -95, rsrq: -12, latency: 45 },
    inference: { latency: 120, tokens: 45, drift: 0.12 },
    security: { handshakes: 99.8, violations: 0, quarantine: 0 },
    memory: { retrieval: 12, mcpLatency: 25 },
    agentDb: {
      health: 99.9,
      latency: 12,
      throughput: 850,
      readRate: 1200,
      writeRate: 450,
      transferRate: 320,
      processRate: 150,
      uptime: '142d 06h 24m',
      connections: 12,
      history: Array.from({ length: 20 }, (_, i) => ({ time: i, latency: 10 + Math.random() * 5, throughput: 800 + Math.random() * 100 }))
    },
    persona: [
      { subject: 'Professional', A: 120, fullMark: 150 },
      { subject: 'Rhythmic', A: 98, fullMark: 150 },
      { subject: 'Technical', A: 86, fullMark: 150 },
      { subject: 'Direct', A: 99, fullMark: 150 },
      { subject: 'Sovereign', A: 85, fullMark: 150 },
    ]
  });

  const toggleRightSection = (section: string) => {
    setExpandedRightSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const [logs, setLogs] = useState<{ time: string; message: string; type: 'info' | 'warn' | 'error' | 'success' }[]>([
    { time: '06:24:15', message: 'NOMINAL: System integrity verified', type: 'success' },
    { time: '06:24:16', message: 'LINK: GLM 4.7 Flash synchronized', type: 'info' },
    { time: '06:24:17', message: 'LINK: GLM 4.6V Flash synchronized', type: 'info' },
    { time: '06:24:18', message: 'LINK: Llama 3 (Local) synchronized', type: 'info' },
    { time: '06:24:19', message: 'LINK: Notebook LM synchronized', type: 'info' },
    { time: '06:24:20', message: 'LINK: Qwen 2.5 (Local) synchronized', type: 'info' },
    { time: '06:24:21', message: 'DATA: Vector pipeline active', type: 'success' }
  ]);
  const [metrics, setMetrics] = useState({ agents: 110, workers: 255, queue: 47, memory: 94, cpu: 65, latency: 42, tokens: 1240 });
  const [isAZRActive, setIsAZRActive] = useState(false);
  const [signalData, setSignalData] = useState<{ value: number }[]>(Array.from({ length: 30 }, () => ({ value: Math.random() * 100 })));

  const logActivity = (message: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), message, type }, ...prev.slice(0, 99)]);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        agents: Math.max(100, prev.agents + Math.floor(Math.random() * 5) - 2),
        workers: Math.max(200, prev.workers + Math.floor(Math.random() * 10) - 5),
        queue: Math.max(0, prev.queue + Math.floor(Math.random() * 10) - 5),
        memory: Math.max(70, Math.min(99, prev.memory + Math.floor(Math.random() * 3) - 1)),
        cpu: Math.max(40, Math.min(95, prev.cpu + Math.floor(Math.random() * 10) - 5)),
        latency: Math.max(20, Math.min(100, prev.latency + Math.floor(Math.random() * 10) - 5)),
        tokens: prev.tokens + Math.floor(Math.random() * 50)
      }));

      setSignalData(prev => [...prev.slice(1), { value: Math.random() * 100 }]);

      setTelemetry(prev => ({
        ...prev,
        cpuCores: prev.cpuCores.map(c => ({ ...c, temp: Math.max(30, Math.min(90, c.temp + (Math.random() * 4 - 2))) })),
        battery: { ...prev.battery, current: -400 + Math.random() * 100 },
        storage: { read: Math.random() * 200, write: Math.random() * 100 },
        gyro: { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() * 2 - 1 },
        network: { ...prev.network, latency: 30 + Math.random() * 30 },
        inference: { ...prev.inference, latency: 100 + Math.random() * 50, tokens: 30 + Math.random() * 20 },
        agentDb: {
          ...prev.agentDb,
          latency: Math.max(0.4, Math.min(1.5, prev.agentDb.latency + (Math.random() * 0.2 - 0.1))),
          throughput: Math.max(800, Math.min(1500, prev.agentDb.throughput + (Math.random() * 100 - 50))),
          readRate: Math.max(800, Math.min(1200, prev.agentDb.readRate + (Math.random() * 40 - 20))),
          writeRate: Math.max(300, Math.min(600, prev.agentDb.writeRate + (Math.random() * 20 - 10))),
          transferRate: Math.max(100, Math.min(400, prev.agentDb.transferRate + (Math.random() * 10 - 5))),
          processRate: Math.max(4000, Math.min(6000, prev.agentDb.processRate + (Math.random() * 200 - 100))),
          history: [...prev.agentDb.history.slice(1), { 
            time: Date.now(), 
            latency: Math.max(0.4, Math.min(1.5, prev.agentDb.latency + (Math.random() * 0.2 - 0.1))), 
            throughput: Math.max(800, Math.min(1500, prev.agentDb.throughput + (Math.random() * 100 - 50))) 
          }]
        }
      }));

      if (Math.random() > 0.7) {
        const activities: { msg: string; type: 'info' | 'warn' | 'error' | 'success' }[] = [
          { msg: 'Neural pathway optimized', type: 'success' },
          { msg: 'Memory sync completed', type: 'success' },
          { msg: 'Agent task redistributed', type: 'info' },
          { msg: 'Worker health check passed', type: 'info' },
          { msg: 'Database backup verified', type: 'success' },
          { msg: 'Minor latency spike detected', type: 'warn' },
          { msg: 'Gemini 3.1 Pro token usage high', type: 'warn' },
          { msg: 'Llama 3 local inference stable', type: 'success' },
          { msg: 'Mistral local context window full', type: 'warn' },
          { msg: 'Qwen 2.5 local weights optimized', type: 'success' }
        ];
        const act = activities[Math.floor(Math.random() * activities.length)];
        logActivity(act.msg, act.type);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const telemetryData = [
    { name: 'Agents', value: metrics.agents, color: '#ff2a6d' },
    { name: 'Latency', value: metrics.latency, color: '#f7d31b' },
    { name: 'Load', value: metrics.cpu, color: '#1bf7cd' },
    { name: 'Memory', value: metrics.memory, color: '#9854ff' }
  ];

  const resourceData = [
    { name: 'CPU', value: metrics.cpu, fill: '#00f2ff' },
    { name: 'RAM', value: metrics.memory, fill: '#9854ff' },
    { name: 'GPU', value: 45, fill: '#ff2a6d' },
    { name: 'NET', value: metrics.latency, fill: '#1bf7cd' }
  ];

  return (
    <div className="min-h-screen lg:h-screen bg-[#030410] text-[#e0e7ff] font-['Inter'] relative overflow-x-hidden lg:overflow-hidden flex flex-col">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,242,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-40 -z-10 animate-[gridMove_30s_linear_infinite]"></div>
      
      {/* Header */}
      <header className="w-full bg-[#0a0e29cc] border-b border-[#00f2ff26] p-3 md:p-4 backdrop-blur-xl z-50 flex justify-between items-center shadow-[0_0_30px_rgba(0,242,255,0.1)]">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#00f2ff] to-[#9854ff] rounded-lg flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,242,255,0.5)]">
            <Brain size={16} className="text-white" />
          </div>
          <div>
            <h1 className="font-['Orbitron'] text-sm md:text-xl font-bold tracking-tighter text-[#00f2ff]">
              AGENT -LEE NEURAL-DIAGNOSTIC-CENTER
            </h1>
            <div className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Neural Matrix v2026.03</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <div className="text-[9px] text-gray-500 uppercase font-bold">Status</div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1bf7cd] shadow-[0_0_8px_#1bf7cd] animate-pulse"></div>
              <span className="text-[10px] font-bold text-[#1bf7cd]">NOMINAL</span>
            </div>
          </div>
          <button onClick={() => setActiveModal('settings')} className="animated-border p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <Cog size={18} className="text-gray-400" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        
        {/* Mobile Backdrop Left */}
        {isLeftSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]" 
            onClick={() => setIsLeftSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar: Advanced Diagnostics & Telemetry */}
        <aside className={`fixed inset-y-0 left-0 z-[200] w-full bg-[#0a0e29f8] border-r border-[#00f2ff1a] flex flex-col shrink-0 p-4 md:p-8 gap-6 no-scrollbar overflow-y-auto transition-transform duration-500 ease-in-out transform ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Close Button */}
          <button onClick={() => setIsLeftSidebarOpen(false)} className="absolute top-6 right-6 text-[#ff2a6d] hover:scale-110 transition-transform p-2 bg-white/5 rounded-full border border-white/10">
            <X size={24} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-[#00f2ff]" />
            <h2 className="font-['Orbitron'] text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Health</h2>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {/* Section: Vessel Vitals */}
            <button 
              onClick={() => setActiveModal('vitals')}
              className="w-full py-2.5 bg-gradient-to-r from-[#00f2ff22] to-[#00f2ff44] border border-[#00f2ff44] rounded-lg flex items-center gap-3 px-4 hover:bg-[#00f2ff33] transition-all group"
            >
              <Cpu className="text-[#00f2ff] group-hover:scale-110 transition-transform" size={18} />
              <span className="font-['Orbitron'] text-[9px] font-bold text-white uppercase tracking-wider">System Health</span>
            </button>

            {/* Section: Sensory Streams */}
            <button 
              onClick={() => setActiveModal('sensory')}
              className="w-full py-2.5 bg-gradient-to-r from-[#ff2a6d22] to-[#ff2a6d44] border border-[#ff2a6d44] rounded-lg flex items-center gap-3 px-4 hover:bg-[#ff2a6d33] transition-all group"
            >
              <Zap className="text-[#ff2a6d] group-hover:scale-110 transition-transform" size={18} />
              <span className="font-['Orbitron'] text-[9px] font-bold text-white uppercase tracking-wider">Sensory Streams</span>
            </button>

            {/* Section: Network Integrity */}
            <button 
              onClick={() => setActiveModal('network')}
              className="w-full py-2.5 bg-gradient-to-r from-[#1bf7cd22] to-[#1bf7cd44] border border-[#1bf7cd44] rounded-lg flex items-center gap-3 px-4 hover:bg-[#1bf7cd33] transition-all group"
            >
              <Network className="text-[#1bf7cd] group-hover:scale-110 transition-transform" size={18} />
              <span className="font-['Orbitron'] text-[9px] font-bold text-white uppercase tracking-wider">Network Integrity</span>
            </button>

            {/* Section: Mind Inference */}
            <button 
              onClick={() => setActiveModal('mind')}
              className="w-full py-2.5 bg-gradient-to-r from-[#9854ff22] to-[#9854ff44] border border-[#9854ff44] rounded-lg flex items-center gap-3 px-4 hover:bg-[#9854ff33] transition-all group"
            >
              <Brain className="text-[#9854ff] group-hover:scale-110 transition-transform" size={18} />
              <span className="font-['Orbitron'] text-[9px] font-bold text-white uppercase tracking-wider">Mind Inference</span>
            </button>

            {/* Section: Security & Sovereignty */}
            <button 
              onClick={() => setActiveModal('security')}
              className="w-full py-2.5 bg-gradient-to-r from-[#1bf7cd22] to-[#1bf7cd44] border border-[#1bf7cd44] rounded-lg flex items-center gap-3 px-4 hover:bg-[#1bf7cd33] transition-all group"
            >
              <UserCog className="text-[#1bf7cd] group-hover:scale-110 transition-transform" size={18} />
              <span className="font-['Orbitron'] text-[9px] font-bold text-white uppercase tracking-wider">Safety & Security</span>
            </button>

            {/* Section: Memory & Tooling */}
            <button 
              onClick={() => setActiveModal('tooling')}
              className="w-full py-2.5 bg-gradient-to-r from-[#00f2ff22] to-[#00f2ff44] border border-[#00f2ff44] rounded-lg flex items-center gap-3 px-4 hover:bg-[#00f2ff33] transition-all group"
            >
              <Database className="text-[#00f2ff] group-hover:scale-110 transition-transform" size={18} />
              <span className="font-['Orbitron'] text-[9px] font-bold text-white uppercase tracking-wider">Memory & Tooling</span>
            </button>

            {/* Section: Signal Waves */}
            <button 
              onClick={() => setActiveModal('spectral')}
              className="w-full py-2.5 bg-gradient-to-r from-[#f7d31b22] to-[#f7d31b44] border border-[#f7d31b44] rounded-lg flex items-center gap-3 px-4 hover:bg-[#f7d31b33] transition-all group"
            >
              <LineChart className="text-[#f7d31b] group-hover:scale-110 transition-transform" size={18} />
              <span className="font-['Orbitron'] text-[9px] font-bold text-white uppercase tracking-wider">Signal Waves</span>
            </button>

            {/* Section: Stability */}
            <button 
              onClick={() => setActiveModal('quantum')}
              className="w-full py-2.5 bg-gradient-to-r from-[#1bf7cd22] to-[#1bf7cd44] border border-[#1bf7cd44] rounded-lg flex items-center gap-3 px-4 hover:bg-[#1bf7cd33] transition-all group"
            >
              <Zap className="text-[#1bf7cd] group-hover:scale-110 transition-transform" size={18} />
              <span className="font-['Orbitron'] text-[9px] font-bold text-white uppercase tracking-wider">Quantum Balance</span>
            </button>
          </div>
        </aside>

        {/* Center: 3D Brain Visualization */}
        <main className="flex-1 relative flex flex-col bg-gradient-to-b from-transparent to-[#00f2ff05] overflow-hidden min-h-0">
          {/* Sidebar Toggles */}
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between pointer-events-none">
            <button onClick={() => setIsLeftSidebarOpen(true)} className="animated-border p-2 rounded-lg bg-black/60 border border-white/10 text-[#00f2ff] pointer-events-auto hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,242,255,0.3)]">
              <Activity size={20} />
            </button>
            <button onClick={() => setIsRightSidebarOpen(true)} className="animated-border p-2 rounded-lg bg-black/60 border border-white/10 text-[#ff2a6d] pointer-events-auto hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,42,109,0.3)]">
              <Terminal size={20} />
            </button>
          </div>

          <div className="flex-1 relative w-full h-full flex items-center justify-center min-h-0">
            <BrainVisualization 
              onRegionClick={(id) => {
                setSelectedRegion(id);
              }} 
              autoRotate={!selectedRegion} 
              selectedRegionId={selectedRegion}
              isLeftSidebarOpen={isLeftSidebarOpen}
              isRightSidebarOpen={isRightSidebarOpen}
            />

            {/* Quick Diagnostic Overlay */}
            {selectedRegion && (
              <div className="absolute z-30 w-72 bg-[#050a15cc] backdrop-blur-md border border-[#00f2ff33] rounded-2xl p-4 shadow-[0_0_30px_rgba(0,242,255,0.2)] animated-border pointer-events-auto pointer-events-auto" style={{ top: '10%', right: '5%' }}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-bold text-[#00f2ff] uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} /> Quick Diagnostic
                  </h3>
                  <button onClick={() => setSelectedRegion(null)} className="text-gray-500 hover:text-[#ff2a6d]">
                    <X size={14} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[8px] text-gray-500 uppercase font-bold">Target Node</div>
                      <div className="text-sm font-bold text-white uppercase">{selectedRegion.replace(/-/g, ' ')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] text-gray-500 uppercase font-bold">Status</div>
                      <div className="text-[10px] text-[#1bf7cd] font-bold uppercase tracking-tighter">Operational</div>
                    </div>
                  </div>

                  <div className="h-24 w-full bg-black/40 rounded-lg border border-white/5 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedRegion === 'agent-db' ? telemetry.agentDb.history : Array.from({ length: 10 }, (_, i) => ({ name: i, val: 40 + Math.random() * 40 }))}>
                        <Area type="monotone" dataKey={selectedRegion === 'agent-db' ? "throughput" : "val"} stroke="#00f2ff" fill="#00f2ff33" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 p-2 rounded border border-white/5">
                      <div className="text-[7px] text-gray-500 uppercase font-bold">Latency</div>
                      <div className="text-xs font-bold text-[#9854ff]">
                        {selectedRegion === 'agent-db' ? `${telemetry.agentDb.latency.toFixed(1)}ms` : `${(10 + Math.random() * 20).toFixed(1)}ms`}
                      </div>
                    </div>
                    <div className="bg-white/5 p-2 rounded border border-white/5">
                      <div className="text-[7px] text-gray-500 uppercase font-bold">Load</div>
                      <div className="text-xs font-bold text-[#ff2a6d]">
                        {selectedRegion === 'agent-db' ? `${(telemetry.agentDb.throughput / 10).toFixed(1)}%` : `${(40 + Math.random() * 30).toFixed(1)}%`}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (selectedRegion.startsWith('workers-')) {
                        setActiveModal('workers');
                      } else {
                        setActiveModal(selectedRegion);
                      }
                      setSelectedRegion(null);
                    }}
                    className="w-full py-2 bg-[#00f2ff22] border border-[#00f2ff] rounded-lg text-[9px] font-bold text-[#00f2ff] uppercase hover:bg-[#00f2ff] hover:text-black transition-all flex items-center justify-center gap-2"
                  >
                    <Maximize2 size={12} /> Expand Full Diagnostics
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Mobile Backdrop Right */}
        {isRightSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]" 
            onClick={() => setIsRightSidebarOpen(false)}
          />
        )}

        {/* Right Sidebar: System Logs & Status */}
        <aside className={`fixed inset-y-0 right-0 z-[200] w-full bg-[#0a0e29f8] border-l border-[#00f2ff1a] flex flex-col shrink-0 p-4 md:p-8 gap-6 no-scrollbar overflow-y-auto transition-transform duration-500 ease-in-out transform ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Close Button */}
          <button onClick={() => setIsRightSidebarOpen(false)} className="absolute top-6 left-6 text-[#ff2a6d] hover:scale-110 transition-transform p-2 bg-white/5 rounded-full border border-white/10">
            <X size={24} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <Terminal size={16} className="text-[#ff2a6d]" />
            <h2 className="font-['Orbitron'] text-xs font-bold text-white uppercase tracking-widest">System Control</h2>
          </div>

          {/* Section: Logs */}
          <button 
            onClick={() => setActiveModal('logs')}
            className="w-full py-4 bg-gradient-to-r from-[#ff2a6d22] to-[#ff2a6d44] border border-[#ff2a6d44] rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#ff2a6d33] transition-all group"
          >
            <Terminal className="text-[#ff2a6d] group-hover:scale-110 transition-transform" size={24} />
            <span className="font-['Orbitron'] text-[10px] font-bold text-white uppercase tracking-[0.2em]">Logs</span>
          </button>

          {/* Core Module Buttons */}
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={() => setActiveModal('workers')}
              className="w-full py-4 bg-gradient-to-r from-[#00f2ff22] to-[#9854ff22] border border-[#00f2ff44] rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#00f2ff33] transition-all group"
            >
              <Cpu className="text-[#00f2ff] group-hover:scale-110 transition-transform" size={24} />
              <span className="font-['Orbitron'] text-[10px] font-bold text-white uppercase tracking-[0.2em]">mcp agents</span>
            </button>

            <button 
              onClick={() => setActiveModal('matrix')}
              className="w-full py-4 bg-gradient-to-r from-[#1bf7cd22] to-[#00f2ff22] border border-[#1bf7cd44] rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#1bf7cd33] transition-all group"
            >
              <ListTodo className="text-[#1bf7cd] group-hover:scale-110 transition-transform" size={24} />
              <span className="font-['Orbitron'] text-[10px] font-bold text-white uppercase tracking-[0.2em]">to-do-list</span>
            </button>
          </div>

          <button 
            onClick={() => setActiveModal('datacore')}
            className="w-full py-4 bg-gradient-to-r from-[#6C47FF22] to-[#9854ff22] border border-[#6C47FF44] rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#6C47FF33] transition-all group"
          >
            <Database className="text-[#6C47FF] group-hover:scale-110 transition-transform" size={24} />
            <span className="font-['Orbitron'] text-[10px] font-bold text-white uppercase tracking-[0.2em]">Database</span>
          </button>

          {/* Section: Agents */}
          <button 
            onClick={() => setActiveModal('agents')}
            className="w-full py-4 bg-gradient-to-r from-[#ff2a6d22] to-[#ff2a6d44] border border-[#ff2a6d44] rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#ff2a6d33] transition-all group mb-4"
          >
            <UserCog className="text-[#ff2a6d] group-hover:scale-110 transition-transform" size={24} />
            <span className="font-['Orbitron'] text-[10px] font-bold text-white uppercase tracking-[0.2em]">Agents</span>
          </button>

          {/* Memory Lake Mini Diagnostics */}
          <div className="bg-black/40 border border-[#00ff8833] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-[#00ff88]" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Memory Lake</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_5px_#00ff88]" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[8px] text-gray-500 uppercase font-bold">Read/Write</span>
                <span className="text-[10px] text-white font-mono">{telemetry.agentDb.readRate}/{telemetry.agentDb.writeRate} MB/s</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#00ff88]" style={{ width: `${(telemetry.agentDb.readRate / 1000) * 100}%` }} />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[8px] text-gray-500 uppercase font-bold">Latency</span>
                <span className="text-[10px] text-[#00f2ff] font-mono">{telemetry.agentDb.latency.toFixed(1)}ms</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[8px] text-gray-500 uppercase font-bold">Health</span>
                <span className="text-[10px] text-[#1bf7cd] font-mono">{telemetry.agentDb.health}%</span>
              </div>
            </div>
            
            <button 
              onClick={() => setActiveModal('agent-db')}
              className="w-full py-2 bg-[#00ff8811] border border-[#00ff8833] rounded-lg text-[8px] font-bold text-[#00ff88] uppercase hover:bg-[#00ff8822] transition-all"
            >
              Full Analytics
            </button>
          </div>
        </aside>
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[1000] flex items-center justify-center p-2 md:p-10 animate-in fade-in zoom-in duration-300">
          <div className="w-full h-full max-w-[1600px] bg-[#0a0e29cc] border border-[#00f2ff26] rounded-2xl shadow-[0_0_60px_rgba(0,242,255,0.2)] flex flex-col overflow-hidden">
            <div className="p-4 md:p-6 bg-[#181a2ccc] border-b border-[#00f2ff26] flex justify-between items-center">
              <h2 className="font-['Orbitron'] text-lg md:text-xl font-bold text-[#00f2ff] flex items-center gap-4">
                {activeModal === 'datacore' && <><Database className="text-[#6C47FF]" /> ESES: DATABASE ANALYTICS</>}
                {activeModal === 'agent-db' && <><Database className="text-[#00ff88]" /> AGENT DB: MEMORY LAKE</>}
                {activeModal === 'agents' && <><UserCog className="text-[#ff2a6d]" /> ESES: AGENT CENTER</>}
                {activeModal === 'workers' && <><Cpu className="text-[#00f2ff]" /> MCP AGENTS</>}
                {activeModal === 'matrix' && <><ListTodo className="text-[#1bf7cd]" /> TO-DO-LIST</>}
                {activeModal === 'logs' && <><Terminal className="text-[#ff2a6d]" /> SYSTEM LOGS</>}
                {activeModal === 'vitals' && <><Cpu className="text-[#00f2ff]" /> BODY HEALTH</>}
                {activeModal === 'sensory' && <><Zap className="text-[#ff2a6d]" /> SENSORY STREAMS</>}
                {activeModal === 'network' && <><Network className="text-[#1bf7cd]" /> NETWORK INTEGRITY</>}
                {activeModal === 'mind' && <><Brain className="text-[#9854ff]" /> PERSONALITY CORE</>}
                {activeModal === 'security' && <><UserCog className="text-[#1bf7cd]" /> SAFETY & SECURITY</>}
                {activeModal === 'tooling' && <><Database className="text-[#00f2ff]" /> MEMORY & TOOLING</>}
                {activeModal === 'spectral' && <><LineChart className="text-[#f7d31b]" /> BRAIN WAVES</>}
                {activeModal === 'quantum' && <><Zap className="text-[#1bf7cd]" /> QUANTUM BALANCE</>}
                {activeModal === 'todo' && <><ListTodo className="text-[#1bf7cd]" /> TASKS</>}
                {activeModal === 'glm-4-7-flash' && <><Brain className="text-[#00f2ff]" /> GLM 4.7 FLASH CORE</>}
                {activeModal === 'glm-4-6v-flash' && <><Brain className="text-[#9854ff]" /> GLM 4.6V FLASH CORE</>}
                {activeModal === 'notebook-lm' && <><Brain className="text-[#1bf7cd]" /> NOTEBOOK LM CORE</>}
                {activeModal === 'llama-3-local' && <><Brain className="text-[#1bf7cd]" /> LLAMA 3 LOCAL CORE</>}
                {activeModal === 'qwen-local' && <><Brain className="text-[#ff2a6d]" /> QWEN 2.5 LOCAL CORE</>}
                {activeModal === 'settings' && <><Cog className="text-gray-400" /> SYSTEM SETTINGS</>}
              </h2>
              <button onClick={() => setActiveModal(null)} className="animated-border w-10 h-10 rounded-full bg-white/5 border border-white/10 text-[#ff2a6d] flex items-center justify-center hover:bg-[#ff2a6d33] transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 md:p-8 no-scrollbar">
              {activeModal === 'datacore' && <DatabaseDashboard />}
              {activeModal === 'agent-db' && <MemoryLake telemetry={telemetry} />}
              {activeModal === 'agents' && <AgentCenter />}
              {activeModal === 'workers' && <WorkersCenter />}
              {activeModal === 'matrix' && <MatrixDashboard />}
              {activeModal === 'vitals' && (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="bg-black/40 rounded-2xl border border-[#00f2ff33] p-8">
                    <h3 className="text-xl font-bold text-[#00f2ff] mb-6 uppercase tracking-widest flex items-center gap-3">
                      <Cpu /> Processor Temperature
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={telemetry.cpuCores}>
                          <defs>
                            <linearGradient id="modalColorTemp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" stroke="#555" />
                          <YAxis stroke="#555" />
                          <ReTooltip contentStyle={{ backgroundColor: '#0a0e29', border: '1px solid rgba(0,242,255,0.2)' }} />
                          <Area type="monotone" dataKey="temp" stroke="#00f2ff" fillOpacity={1} fill="url(#modalColorTemp)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/40 p-6 rounded-xl border border-white/10 flex justify-between items-center">
                      <div>
                        <div className="text-sm opacity-60 uppercase font-bold">Battery Level</div>
                        <div className="text-3xl font-black text-[#1bf7cd]">{telemetry.battery.level}%</div>
                      </div>
                      <Zap size={40} className="text-[#1bf7cd] opacity-20" />
                    </div>
                    <div className="bg-black/40 p-6 rounded-xl border border-white/10 flex justify-between items-center">
                      <div>
                        <div className="text-sm opacity-60 uppercase font-bold">System Voltage</div>
                        <div className="text-3xl font-black text-[#9854ff]">{telemetry.battery.voltage}V</div>
                      </div>
                      <Activity size={40} className="text-[#9854ff] opacity-20" />
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'sensory' && (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="bg-black/40 rounded-2xl border border-[#ff2a6d33] p-8">
                    <h3 className="text-xl font-bold text-[#ff2a6d] mb-6 uppercase tracking-widest flex items-center gap-3">
                      <Zap /> Movement Sensors
                    </h3>
                    <div className="h-64 flex items-end gap-2">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-gradient-to-t from-[#ff2a6d] to-[#ff2a6d33] rounded-t-lg shadow-[0_0_15px_rgba(255,42,109,0.3)]" 
                          style={{ height: `${20 + Math.random() * 80}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="bg-black/40 p-8 rounded-2xl border border-white/10 flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="text-lg opacity-60 uppercase font-bold tracking-widest">Current Hinge Angle</div>
                      <div className="text-6xl font-black text-white">{telemetry.hinge}°</div>
                    </div>
                    <RefreshCw size={80} className="text-[#ff2a6d] animate-spin-slow opacity-20" />
                  </div>
                </div>
              )}
              {activeModal === 'network' && (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/40 p-8 rounded-2xl border border-[#1bf7cd33] flex flex-col items-center justify-center text-center">
                      <div className="text-sm opacity-60 uppercase font-bold mb-2">Signal Strength</div>
                      <div className="text-5xl font-black text-[#1bf7cd]">{telemetry.network.rsrp} <span className="text-xl">dBm</span></div>
                    </div>
                    <div className="bg-black/40 p-8 rounded-2xl border border-[#1bf7cd33] flex flex-col items-center justify-center text-center">
                      <div className="text-sm opacity-60 uppercase font-bold mb-2">Average Latency</div>
                      <div className="text-5xl font-black text-[#1bf7cd]">{telemetry.network.latency.toFixed(0)} <span className="text-xl">ms</span></div>
                    </div>
                  </div>
                  <div className="bg-black/40 rounded-2xl border border-[#1bf7cd33] p-8">
                    <h3 className="text-xl font-bold text-[#1bf7cd] mb-6 uppercase tracking-widest flex items-center gap-3">
                      <Network /> Signal Stability
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={signalData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <ReBar dataKey="value" fill="#1bf7cd" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'mind' && (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-black/40 p-8 rounded-2xl border border-[#9854ff33]">
                      <h3 className="text-xl font-bold text-[#9854ff] mb-8 uppercase tracking-widest flex items-center gap-3">
                        <Brain /> Personality Radar
                      </h3>
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={telemetry.persona}>
                            <PolarGrid stroke="#ffffff20" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff60', fontSize: 12 }} />
                            <Radar name="Persona" dataKey="A" stroke="#9854ff" fill="#9854ff" fillOpacity={0.5} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="bg-[#9854ff1a] rounded-2xl p-6 border border-[#9854ff40] flex items-center gap-4">
                        <Brain size={32} className="text-[#9854ff] animate-pulse" />
                        <div>
                          <div className="text-lg font-bold text-[#9854ff] uppercase">Core Personality</div>
                          <div className="text-sm opacity-60 uppercase">Stable, Technical & Friendly</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/40 p-6 rounded-xl border border-white/10">
                          <div className="text-xs opacity-60 uppercase font-bold">Tokens/Sec</div>
                          <div className="text-2xl font-black text-[#9854ff]">{telemetry.inference.tokens.toFixed(1)}</div>
                        </div>
                        <div className="bg-black/40 p-6 rounded-xl border border-white/10">
                          <div className="text-xs opacity-60 uppercase font-bold">Inference Latency</div>
                          <div className="text-2xl font-black text-[#9854ff]">{telemetry.inference.latency.toFixed(0)}ms</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'security' && (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="bg-black/40 rounded-2xl border border-[#1bf7cd33] p-8">
                    <h3 className="text-xl font-bold text-[#1bf7cd] mb-8 uppercase tracking-widest flex items-center gap-3">
                      <ShieldCheck /> Security Matrix
                    </h3>
                    <div className="grid grid-cols-10 gap-2">
                      {Array.from({ length: 100 }).map((_, i) => (
                        <div key={i} className={`aspect-square rounded-md shadow-inner ${Math.random() > 0.95 ? 'bg-[#ff2a6d] animate-pulse shadow-[0_0_10px_#ff2a6d]' : 'bg-[#1bf7cd]/20'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-black/40 p-8 rounded-2xl border border-white/10 flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="text-sm opacity-60 uppercase font-bold tracking-widest">Handshake Integrity</div>
                      <div className="text-5xl font-black text-[#1bf7cd]">{telemetry.security.handshakes}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm opacity-60 uppercase font-bold tracking-widest">Violations Blocked</div>
                      <div className="text-5xl font-black text-[#ff2a6d]">{telemetry.security.violations}</div>
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'tooling' && (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="bg-black/40 rounded-2xl border border-[#00f2ff33] p-8">
                    <h3 className="text-xl font-bold text-[#00f2ff] mb-8 uppercase tracking-widest flex items-center gap-3">
                      <Database /> Memory Retrieval Performance
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Retrieval', val: telemetry.memory.retrieval }, 
                          { name: 'MCP Latency', val: telemetry.memory.mcpLatency },
                          { name: 'Cache Hit', val: 94 },
                          { name: 'Disk I/O', val: 45 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" stroke="#555" />
                          <YAxis stroke="#555" />
                          <ReTooltip contentStyle={{ backgroundColor: '#0a0e29', border: '1px solid rgba(0,242,255,0.2)' }} />
                          <ReBar dataKey="val" fill="#00f2ff" radius={[4, 4, 0, 0]}>
                            {resourceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#00f2ff', '#9854ff', '#1bf7cd', '#ff2a6d'][index % 4]} />
                            ))}
                          </ReBar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'spectral' && (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="bg-black/40 rounded-2xl border border-[#f7d31b33] p-8">
                    <h3 className="text-xl font-bold text-[#f7d31b] mb-8 uppercase tracking-widest flex items-center gap-3">
                      <LineChart /> Brain Wave Analysis
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart data={signalData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis hide />
                          <YAxis stroke="#555" />
                          <ReTooltip contentStyle={{ backgroundColor: '#0a0e29', border: '1px solid rgba(247,211,27,0.2)' }} />
                          <ReLine type="monotone" dataKey="value" stroke="#f7d31b" strokeWidth={3} dot={false} />
                        </ReLineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'quantum' && (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-black/40 p-8 rounded-2xl border border-[#1bf7cd33] flex flex-col items-center justify-center">
                      <h3 className="text-xl font-bold text-[#1bf7cd] mb-8 uppercase tracking-widest">Stability Balance</h3>
                      <div className="relative w-64 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Stable', value: 85 },
                                { name: 'Entangled', value: 15 }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              <Cell fill="#1bf7cd" />
                              <Cell fill="#1bf7cd33" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-4xl font-black text-[#1bf7cd]">85%</div>
                          <div className="text-[10px] opacity-60 uppercase font-bold">Stable</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-black/40 p-8 rounded-2xl border border-white/10 flex flex-col justify-center space-y-6">
                      <div className="space-y-2">
                        <div className="text-sm opacity-60 uppercase font-bold tracking-widest">Coherence Level</div>
                        <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden border border-white/10">
                          <div className="bg-[#1bf7cd] h-full w-[85%] shadow-[0_0_15px_#1bf7cd]"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm opacity-60 uppercase font-bold tracking-widest">Entanglement Risk</div>
                        <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden border border-white/10">
                          <div className="bg-[#ff2a6d] h-full w-[15%] shadow-[0_0_15px_#ff2a6d]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'logs' && (
                <div className="max-w-4xl mx-auto space-y-4">
                  <div className="bg-black/40 rounded-xl border border-[#ff2a6d33] p-6 font-mono text-xs overflow-y-auto custom-scrollbar max-h-[70vh] space-y-3">
                    {logs.map((log, i) => (
                      <div key={i} className={`p-3 rounded-lg border-l-4 bg-white/5 shadow-lg ${
                        log.type === 'success' ? 'border-[#1bf7cd] text-[#1bf7cd]' :
                        log.type === 'warn' ? 'border-[#f7d31b] text-[#f7d31b]' :
                        log.type === 'error' ? 'border-[#ff2a6d] text-[#ff2a6d]' :
                        'border-[#00f2ff] text-gray-400'
                      }`}>
                        <div className="flex justify-between mb-2 opacity-60 text-[10px] font-bold">
                          <span>{log.time}</span>
                          <span className="uppercase tracking-widest">{log.type}</span>
                        </div>
                        <div className="leading-relaxed break-words text-sm">{log.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeModal === 'todo' && <TodoList />}
              {(activeModal === 'glm-4-7-flash' || activeModal === 'glm-4-6v-flash' || activeModal === 'notebook-lm' || activeModal === 'llama-3-local' || activeModal === 'qwen-local') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-bold text-[#00f2ff] mb-6 flex items-center gap-3">
                      <Activity /> Synaptic Flux
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={Array.from({ length: 20 }, (_, i) => ({ name: i, value: Math.random() * 20 + 80 }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis hide />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10 }} />
                          <ReTooltip 
                            contentStyle={{ backgroundColor: '#0a0e29', border: '1px solid rgba(0,242,255,0.2)', borderRadius: '8px' }}
                            itemStyle={{ color: '#e0e7ff' }}
                          />
                          <Area type="monotone" dataKey="value" stroke="#00f2ff" fill="rgba(0, 242, 255, 0.1)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-bold text-[#00f2ff] mb-6 flex items-center gap-3">
                      <Terminal /> System Parameters
                    </h3>
                    <div className="space-y-4 font-mono text-sm">
                      <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-500">Model ID:</span>
                        <span className="text-[#00f2ff] uppercase">{activeModal.replace(/-/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-500">Connectivity:</span>
                        <span className="text-[#1bf7cd]">STABLE / WOKE</span>
                      </div>
                      <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-500">Register:</span>
                        <span className="text-[#9854ff]">MENTOR_CALM</span>
                      </div>
                      <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-500">Intent Confidence:</span>
                        <span className="text-[#f7d31b]">0.98</span>
                      </div>
                      <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-500">Context Window:</span>
                        <span className="text-[#ff2a6d]">{activeModal.includes('4-6v') || activeModal.includes('4-7') ? '128K' : '32K'}</span>
                      </div>
                      {activeModal === 'qwen-local' && (
                        <div className="mt-4 p-4 bg-[#ff2a6d1a] border border-[#ff2a6d33] rounded-xl text-[10px] text-gray-300 space-y-2">
                          <div className="flex items-center gap-2 text-[#ff2a6d] font-bold">
                            <Terminal size={12} /> LOCAL MODEL PATH
                          </div>
                          <div className="font-mono break-all bg-black/40 p-2 rounded border border-white/5">
                            D:\Portable-VSCode-MCP-Kit\models\qwen2.5-0.5b
                          </div>
                          <div className="flex justify-between text-[8px] opacity-60">
                            <span>Architecture: Qwen2.5</span>
                            <span>Size: 0.5B Parameters</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'settings' && (
                <div className="max-w-2xl mx-auto bg-black/40 p-8 rounded-2xl border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-8 uppercase tracking-widest">System Settings</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold">Auto-Optimization</div>
                        <div className="text-xs text-gray-500">Allow system to self-tune neural pathways</div>
                      </div>
                      <div className="w-12 h-6 bg-[#00f2ff] rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold">Android Compatibility Mode</div>
                        <div className="text-xs text-gray-500">Optimize UI for mobile diagnostic performance</div>
                      </div>
                      <div className="w-12 h-6 bg-[#00f2ff] rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold">Memory Pipeline Logging</div>
                        <div className="text-xs text-gray-500">Detailed reporting of all data transactions</div>
                      </div>
                      <div className="w-12 h-6 bg-white/10 rounded-full relative">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white/40 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 30px 30px; }
        }
        @keyframes borderRotate {
          0% { border-color: #00f2ff; box-shadow: 0 0 5px #00f2ff; }
          33% { border-color: #9854ff; box-shadow: 0 0 5px #9854ff; }
          66% { border-color: #ff2a6d; box-shadow: 0 0 5px #ff2a6d; }
          100% { border-color: #00f2ff; box-shadow: 0 0 5px #00f2ff; }
        }
        .animated-border {
          border-width: 1px;
          animation: borderRotate 4s linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #00f2ff33;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
