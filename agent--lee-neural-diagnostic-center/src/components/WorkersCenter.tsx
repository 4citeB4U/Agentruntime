import React, { useEffect, useRef, useState } from 'react';
import { 
  Cpu, 
  Globe, 
  Settings, 
  ShieldCheck, 
  Stethoscope, 
  HeartPulse, 
  LayoutGrid, 
  ChevronLeft, 
  ChevronRight, 
  Microchip, 
  Minus, 
  Expand, 
  X, 
  Activity, 
  Gauge, 
  FileText, 
  Bot,
  Terminal,
  Database,
  Chrome,
  GitBranch,
  Monitor,
  Bug,
  Box,
  Palette,
  Zap,
  Server,
  Link
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface Worker {
  name: string;
  path: string;
  type: string;
  agent: string;
  status: 'active' | 'idle' | 'processing' | 'error';
  load: number;
  memory: number;
  tasks: number;
  category: 'embedded' | 'external' | 'supervisor';
  icon: React.ReactNode;
  pm2Name?: string;
  port?: number;
  prefix?: string;
  description?: string;
  diagnostics: any;
}

const WorkersCenter: React.FC = () => {
  const [selectedWorkerIndex, setSelectedWorkerIndex] = useState(0);
  const [currentCategory, setCurrentCategory] = useState<'all' | 'embedded' | 'external' | 'supervisor'>('all');
  const [activeTab, setActiveTab] = useState<'health' | 'resources' | 'logs' | 'autonomy' | 'service'>('health');
  const [isModalActive, setIsModalActive] = useState(false);
  const [isModalExpanded, setIsModalExpanded] = useState(false);
  const [isModalMinimized, setIsModalMinimized] = useState(false);
  
  const cyclesChartRef = useRef<HTMLCanvasElement>(null);
  const resourceChartRef = useRef<HTMLCanvasElement>(null);
  const responseChartRef = useRef<HTMLCanvasElement>(null);
  const modalPerformanceChartRef = useRef<HTMLCanvasElement>(null);
  
  const chartsRef = useRef<{ [key: string]: Chart | null }>({
    cycles: null,
    resources: null,
    response: null,
    modal: null
  });

  // Mock data generation (simplified from provided HTML)
  const [workerData, setWorkerData] = useState<Worker[]>([]);

  useEffect(() => {
    const generateDiagnosticData = (name: string) => ({
      uptime: Date.now() - Math.random() * 86400000,
      taskQueue: Math.floor(Math.random() * 10),
      runFrequency: Math.floor(Math.random() * 60) + 20,
      isPolling: Math.random() > 0.1,
      customInterval: [1000, 2000, 5000][Math.floor(Math.random() * 3)],
      backupTriggered: Math.random() < 0.1,
      autoRecovery: Math.random() > 0.05,
      lastTaskLog: `Task executed at ${new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString()}`,
      failedRuns: Math.random() < 0.1 ? [`Error: ${['Connection timeout', 'Memory overflow', 'Invalid input'][Math.floor(Math.random() * 3)]}`] : [],
      handledAgents: [`AGENT-${Math.floor(Math.random() * 255) + 1}`],
      cyclesHistory: Array.from({length: 20}, () => Math.floor(Math.random() * 80) + 20),
      resourceHistory: {
        cpu: Array.from({length: 20}, () => Math.floor(Math.random() * 100)),
        memory: Array.from({length: 20}, () => Math.floor(Math.random() * 200) + 50)
      },
      responseTimeHistory: Array.from({length: 10}, () => Math.floor(Math.random() * 500) + 50),
      handshake: 'AGENT_LEE_SOVEREIGN_V1',
      healthEndpoint: name.includes('MCP') ? `http://127.0.0.1:700${Math.floor(Math.random() * 9)}/health` : 'N/A'
    });

    const embeddedMCPs: Worker[] = [
      {
        name: "DashboardMCP",
        path: "services/dashboard-mcp",
        type: "Embedded MCP",
        agent: "AgentLee-DashboardMCP",
        status: 'active',
        load: 12,
        memory: 45,
        tasks: 1240,
        category: 'embedded',
        icon: <LayoutGrid size={24} />,
        pm2Name: "AgentLee-DashboardMCP",
        port: 7008,
        description: "Polls PM2 + backend health; exposes agent/LLM status; restart trigger",
        diagnostics: generateDiagnosticData("DashboardMCP")
      },
      {
        name: "BrowserMCP",
        path: "services/browser-mcp",
        type: "Embedded MCP",
        agent: "AgentLee-BrowserMCP",
        status: 'active',
        load: 28,
        memory: 156,
        tasks: 850,
        category: 'embedded',
        icon: <Globe size={24} />,
        pm2Name: "AgentLee-BrowserMCP",
        port: 7009,
        description: "Headless browser agent (Playwright or VM-exec fallback)",
        diagnostics: generateDiagnosticData("BrowserMCP")
      },
      {
        name: "VS Code Bridge",
        path: "services/vscode-bridge",
        type: "Embedded MCP",
        agent: "AgentLee-Bridge",
        status: 'active',
        load: 5,
        memory: 32,
        tasks: 4500,
        category: 'embedded',
        icon: <Terminal size={24} />,
        pm2Name: "AgentLee-Bridge",
        port: 7002,
        description: "VS Code file reads, symbol lookups, terminal relay",
        diagnostics: generateDiagnosticData("VS Code Bridge")
      },
      {
        name: "InsForge Bridge",
        path: "services/insforge-bridge",
        type: "Embedded MCP",
        agent: "AgentLee-InsForgeBridge",
        status: 'active',
        load: 18,
        memory: 64,
        tasks: 2100,
        category: 'embedded',
        icon: <Database size={24} />,
        pm2Name: "AgentLee-InsForgeBridge",
        port: 7007,
        description: "PostgreSQL CRUD relay to insforge.app",
        diagnostics: generateDiagnosticData("InsForge Bridge")
      }
    ];

    const externalMCPs: Worker[] = [
      {
        name: "InsForge DB",
        path: "external/insforge-db",
        type: "External Tool Set",
        agent: "mcp_io_github_ins_*",
        status: 'active',
        load: 15,
        memory: 120,
        tasks: 3200,
        category: 'external',
        icon: <Zap size={24} />,
        prefix: "mcp_io_github_ins_*",
        description: "Bucket ops, SQL, schema, function deploy",
        diagnostics: generateDiagnosticData("InsForge DB")
      },
      {
        name: "Chrome Automation",
        path: "external/chrome-auto",
        type: "External Tool Set",
        agent: "mcp_io_github_chr_*",
        status: 'active',
        load: 45,
        memory: 512,
        tasks: 1200,
        category: 'external',
        icon: <Chrome size={24} />,
        prefix: "mcp_io_github_chr_*",
        description: "Navigate, click, screenshot, network inspection",
        diagnostics: generateDiagnosticData("Chrome Automation")
      },
      {
        name: "GitKraken",
        path: "external/gitkraken",
        type: "External Tool Set",
        agent: "mcp_gitkraken_*",
        status: 'active',
        load: 8,
        memory: 85,
        tasks: 540,
        category: 'external',
        icon: <GitBranch size={24} />,
        prefix: "mcp_gitkraken_*",
        description: "Commit, push, blame, diff, PR workflows",
        diagnostics: generateDiagnosticData("GitKraken")
      },
      {
        name: "Desktop Commander",
        path: "external/desktop-cmd",
        type: "External Tool Set",
        agent: "mcp_desktop-comma_*",
        status: 'active',
        load: 12,
        memory: 45,
        tasks: 890,
        category: 'external',
        icon: <Monitor size={24} />,
        prefix: "mcp_desktop-comma_*",
        description: "File read/write, process management",
        diagnostics: generateDiagnosticData("Desktop Commander")
      },
      {
        name: "TestSprite",
        path: "external/testsprite",
        type: "External Tool Set",
        agent: "mcp_cigro_testspr_*",
        status: 'active',
        load: 22,
        memory: 110,
        tasks: 320,
        category: 'external',
        icon: <Bug size={24} />,
        prefix: "mcp_cigro_testspr_*",
        description: "Test plan generation, frontend/backend test code",
        diagnostics: generateDiagnosticData("TestSprite")
      },
      {
        name: "Spline 3D",
        path: "external/spline",
        type: "External Tool Set",
        agent: "mcp_spline-mcp_*",
        status: 'active',
        load: 65,
        memory: 1024,
        tasks: 150,
        category: 'external',
        icon: <Box size={24} />,
        prefix: "mcp_spline-mcp_*",
        description: "3D scene editor interactions",
        diagnostics: generateDiagnosticData("Spline 3D")
      },
      {
        name: "Stitch UI",
        path: "external/stitch",
        type: "External Tool Set",
        agent: "mcp_stitch-mcp_*",
        status: 'active',
        load: 35,
        memory: 256,
        tasks: 420,
        category: 'external',
        icon: <Palette size={24} />,
        prefix: "mcp_stitch-mcp_*",
        description: "UI screen generation from prompts",
        diagnostics: generateDiagnosticData("Stitch UI")
      },
      {
        name: "Agent Lee Self",
        path: "external/agentlee-self",
        type: "External Tool Set",
        agent: "mcp_agentlee_*",
        status: 'active',
        load: 10,
        memory: 64,
        tasks: 15000,
        category: 'external',
        icon: <Bot size={24} />,
        prefix: "mcp_agentlee_*",
        description: "Act, analyze, screen capture, memory query",
        diagnostics: generateDiagnosticData("Agent Lee Self")
      }
    ];

    const supervisorMCPs: Worker[] = [
      {
        name: "Core-Orchestrator",
        path: "supervisor/orchestrator",
        type: "Supervisor",
        agent: "AGENT-000",
        status: 'active',
        load: 5,
        memory: 128,
        tasks: 99999,
        category: 'supervisor',
        icon: <ShieldCheck size={24} />,
        description: "Main system coordinator and task dispatcher",
        diagnostics: generateDiagnosticData("Core-Orchestrator")
      }
    ];

    setWorkerData([...embeddedMCPs, ...externalMCPs, ...supervisorMCPs]);
  }, []);

  const filteredWorkers = workerData.filter(w => currentCategory === 'all' || w.category === currentCategory);
  const currentWorker = filteredWorkers[selectedWorkerIndex];

  useEffect(() => {
    if (!currentWorker) return;

    const initChart = (ref: React.RefObject<HTMLCanvasElement>, key: string, config: any) => {
      if (chartsRef.current[key]) chartsRef.current[key]?.destroy();
      if (ref.current) {
        chartsRef.current[key] = new Chart(ref.current, config);
      }
    };

    initChart(cyclesChartRef, 'cycles', {
      type: 'line',
      data: {
        labels: Array.from({length: 20}, (_, i) => i),
        datasets: [{
          label: 'Cycles/min',
          data: currentWorker.diagnostics.cyclesHistory,
          borderColor: '#00f2ff',
          backgroundColor: 'rgba(0, 242, 255, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { beginAtZero: true, ticks: { color: '#e0e7ff' } } }
      }
    });

    initChart(resourceChartRef, 'resources', {
      type: 'line',
      data: {
        labels: Array.from({length: 20}, (_, i) => i),
        datasets: [{
          label: 'CPU %',
          data: currentWorker.diagnostics.resourceHistory.cpu,
          borderColor: '#06d6a0',
          backgroundColor: 'rgba(6, 214, 160, 0.1)',
          tension: 0.4
        }, {
          label: 'Memory MB',
          data: currentWorker.diagnostics.resourceHistory.memory,
          borderColor: '#9854ff',
          backgroundColor: 'rgba(152, 84, 255, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: '#e0e7ff', font: { size: 8 } } } },
        scales: { x: { display: false }, y: { beginAtZero: true, ticks: { color: '#e0e7ff' } } }
      }
    });

    initChart(responseChartRef, 'response', {
      type: 'bar',
      data: {
        labels: Array.from({length: 10}, (_, i) => `T${i+1}`),
        datasets: [{
          label: 'Response Time (ms)',
          data: currentWorker.diagnostics.responseTimeHistory,
          backgroundColor: 'rgba(255, 42, 109, 0.6)',
          borderColor: '#ff2a6d',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { color: '#e0e7ff' } }, y: { beginAtZero: true, ticks: { color: '#e0e7ff' } } }
      }
    });

    return () => {
      Object.values(chartsRef.current).forEach((chart: any) => chart?.destroy());
    };
  }, [currentWorker, activeTab]);

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (!currentWorker) return <div className="p-10 text-center opacity-50">Initializing Workers Center...</div>;

  return (
    <div className="flex flex-col h-full bg-[#0a0e29] text-[#e0e7ff] font-['Inter'] overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 bg-black/40 border-b border-[#00f2ff26] flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00f2ff] to-[#9854ff] flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.4)]">
            <Cpu size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-['Orbitron'] text-xl md:text-2xl font-black text-white tracking-tighter flex items-center gap-2">
              MCP AGENTS <span className="text-[#ff2a6d] animate-pulse">SENSITIVE</span>
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-[#00f2ff] font-bold uppercase tracking-widest opacity-70">
              <div className="w-2 h-2 rounded-full bg-[#00f2ff] animate-ping" />
              Neural Network Active • {workerData.length} Nodes
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2">
          <button 
            onClick={() => { setCurrentCategory('all'); setSelectedWorkerIndex(0); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${currentCategory === 'all' ? 'bg-[#00f2ff] text-black shadow-[0_0_15px_rgba(0,242,255,0.5)]' : 'bg-white/5 border border-[#00f2ff26] hover:bg-white/10'}`}
          >
            <LayoutGrid size={12} /> ALL
          </button>
          <button 
            onClick={() => { setCurrentCategory('embedded'); setSelectedWorkerIndex(0); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${currentCategory === 'embedded' ? 'bg-[#00f2ff] text-black shadow-[0_0_15px_rgba(0,242,255,0.5)]' : 'bg-white/5 border border-[#00f2ff26] hover:bg-white/10'}`}
          >
            <Server size={12} /> EMBEDDED
          </button>
          <button 
            onClick={() => { setCurrentCategory('external'); setSelectedWorkerIndex(0); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${currentCategory === 'external' ? 'bg-[#00f2ff] text-black shadow-[0_0_15px_rgba(0,242,255,0.5)]' : 'bg-white/5 border border-[#00f2ff26] hover:bg-white/10'}`}
          >
            <Link size={12} /> EXTERNAL
          </button>
          <button 
            onClick={() => { setCurrentCategory('supervisor'); setSelectedWorkerIndex(0); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${currentCategory === 'supervisor' ? 'bg-[#00f2ff] text-black shadow-[0_0_15px_rgba(0,242,255,0.5)]' : 'bg-white/5 border border-[#00f2ff26] hover:bg-white/10'}`}
          >
            <ShieldCheck size={12} /> SUPERVISORS
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Display */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
          <div className="flex-1 bg-black/40 backdrop-blur-md rounded-xl border border-[#00f2ff26] flex flex-col overflow-hidden shadow-[0_0_20px_rgba(0,242,255,0.15)]">
            <div className="bg-[#181a2ccc] p-4 border-b border-[#00f2ff26] flex justify-between items-center">
              <div className="flex items-center gap-3 font-['Orbitron'] text-sm font-bold">
                <Microchip className="text-[#00f2ff]" size={18} /> AGENT LEE'S WORKER MONITOR
              </div>
              <div className="bg-black/40 px-3 py-1 rounded-full text-[10px] font-['Orbitron'] text-[#00f2ff] border border-[#00f2ff26]">
                {filteredWorkers.length} {currentCategory.toUpperCase()}
              </div>
            </div>

            <div className="flex-1 relative flex flex-col items-center justify-center p-8 overflow-hidden">
              <div className="absolute bottom-20 w-[300px] h-[10px] bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent rounded-full blur-[5px] opacity-70 shadow-[0_0_20px_rgba(0,242,255,0.6)]" />
              
              <div className="relative flex flex-col items-center animate-[float_4s_ease-in-out_infinite]">
                <div 
                  className={`w-24 h-24 rounded-2xl flex items-center justify-center relative mb-4 transition-all duration-500 ${
                    currentWorker.status === 'active' ? 'bg-gradient-to-br from-[#00f2ff33] to-[#9854ff33] border border-[#00f2ff44]' :
                    currentWorker.status === 'processing' ? 'bg-gradient-to-br from-[#f7d31b33] to-[#00f2ff33] border border-[#f7d31b44]' :
                    currentWorker.status === 'error' ? 'bg-gradient-to-br from-[#ff2a6d33] to-[#ff416c33] border border-[#ff2a6d44]' :
                    'bg-white/5 border border-white/10 opacity-40'
                  }`}
                >
                  <div className="text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.5)]">
                    {currentWorker.icon}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#00f2ff11] to-transparent opacity-30 animate-pulse rounded-2xl" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black border border-[#00f2ff26] flex items-center justify-center">
                    <div className={`w-2 h-2 rounded-full ${currentWorker.status === 'active' ? 'bg-[#1bf7cd]' : 'bg-gray-500'}`} />
                  </div>
                </div>
                
                <h2 className="font-['Orbitron'] text-2xl font-bold text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.7)] mb-1">{currentWorker.name}</h2>
                <p className="text-[10px] opacity-60 mb-2 font-mono tracking-widest uppercase">{currentWorker.path}</p>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-black/40 px-4 py-1.5 rounded-lg border border-[#ff2a6d] text-[10px] text-[#ff2a6d] uppercase tracking-widest font-bold">
                    {currentWorker.type}
                  </div>
                  <p className="text-[11px] text-center max-w-xs opacity-80 italic">"{currentWorker.description}"</p>
                </div>
              </div>
            </div>

            <div className="bg-black/30 p-4 border-t border-[#00f2ff26] relative overflow-hidden h-40">
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar h-full items-center">
                {filteredWorkers.map((worker, i) => (
                  <button 
                    key={worker.path}
                    onClick={() => setSelectedWorkerIndex(i)}
                    className={`shrink-0 w-28 h-28 bg-[#0a0e1e80] border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all group relative overflow-hidden ${selectedWorkerIndex === i ? 'border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.3)]' : 'border-[#00f2ff1a] hover:border-[#00f2ff44]'}`}
                  >
                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                      worker.status === 'active' ? 'bg-[#1bf7cd] shadow-[0_0_5px_#1bf7cd]' :
                      worker.status === 'processing' ? 'bg-[#f7d31b] shadow-[0_0_5px_#f7d31b]' :
                      worker.status === 'error' ? 'bg-[#ff2a6d] shadow-[0_0_5px_#ff2a6d]' :
                      'bg-[#0af] shadow-[0_0_5px_#0af]'
                    }`} />
                    <div className="text-[#00f2ff] opacity-80 group-hover:scale-110 transition-transform">
                      {worker.icon}
                    </div>
                    <div className="text-[10px] font-bold text-center truncate w-full">{worker.name}</div>
                    <div className="text-[8px] opacity-40 uppercase tracking-tighter">{worker.type}</div>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setSelectedWorkerIndex(prev => Math.max(0, prev - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 border border-[#00f2ff26] rounded-full flex items-center justify-center text-[#00f2ff] hover:bg-[#00f2ff26] transition-all z-10"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setSelectedWorkerIndex(prev => Math.min(filteredWorkers.length - 1, prev + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 border border-[#00f2ff26] rounded-full flex items-center justify-center text-[#00f2ff] hover:bg-[#00f2ff26] transition-all z-10"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Diagnostics */}
        <div className="bg-black/40 backdrop-blur-md rounded-xl border border-[#00f2ff26] flex flex-col overflow-hidden shadow-[0_0_20px_rgba(0,242,255,0.15)]">
          <div className="flex border-b border-[#00f2ff26] bg-[#181a2ccc]">
            {(['health', 'resources', 'logs', 'autonomy', 'service'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-[8px] font-bold uppercase tracking-widest transition-all border-r border-[#00f2ff26] last:border-r-0 ${activeTab === tab ? 'bg-[#00f2ff] text-black' : 'hover:bg-white/5 opacity-60'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {activeTab === 'health' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-[#00f2ff] uppercase tracking-widest flex items-center gap-2">
                    <HeartPulse size={12} /> Execution Health
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a]">
                      <div className="text-[8px] opacity-40 uppercase mb-1">Status</div>
                      <div className="text-xs font-bold text-[#1bf7cd]">{currentWorker.status.toUpperCase()}</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a]">
                      <div className="text-[8px] opacity-40 uppercase mb-1">Queue</div>
                      <div className="text-xs font-bold">{currentWorker.diagnostics.taskQueue}</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a]">
                      <div className="text-[8px] opacity-40 uppercase mb-1">Uptime</div>
                      <div className="text-xs font-bold">{formatUptime(Date.now() - currentWorker.diagnostics.uptime)}</div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a]">
                      <div className="text-[8px] opacity-40 uppercase mb-1">Frequency</div>
                      <div className="text-xs font-bold">{currentWorker.diagnostics.runFrequency} c/min</div>
                    </div>
                  </div>
                </div>
                <div className="h-40 bg-black/40 rounded-lg border border-[#00f2ff1a] p-2 relative">
                  <div className="absolute top-2 left-2 text-[8px] opacity-40 uppercase">Cycle Flux</div>
                  <canvas ref={cyclesChartRef} />
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-[#00f2ff] uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} /> Resource Usage
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                          <circle cx="40" cy="40" r="36" fill="none" stroke="#06d6a0" strokeWidth="4" strokeDasharray={`${2 * Math.PI * 36}`} strokeDashoffset={`${2 * Math.PI * 36 * (1 - currentWorker.load / 100)}`} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xs font-bold text-[#06d6a0]">{currentWorker.load}%</span>
                          <span className="text-[6px] opacity-40 uppercase">CPU</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                          <circle cx="40" cy="40" r="36" fill="none" stroke="#9854ff" strokeWidth="4" strokeDasharray={`${2 * Math.PI * 36}`} strokeDashoffset={`${2 * Math.PI * 36 * (1 - currentWorker.memory / 256)}`} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xs font-bold text-[#9854ff]">{currentWorker.memory}MB</span>
                          <span className="text-[6px] opacity-40 uppercase">RAM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-40 bg-black/40 rounded-lg border border-[#00f2ff1a] p-2">
                  <canvas ref={resourceChartRef} />
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-[#00f2ff] uppercase tracking-widest flex items-center gap-2">
                  <FileText size={12} /> System Logs
                </h3>
                <div className="space-y-3">
                  <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a] font-mono text-[9px]">
                    <div className="opacity-40 mb-1">LAST TASK LOG</div>
                    <div className="text-[#00f2ff]">{currentWorker.diagnostics.lastTaskLog}</div>
                  </div>
                  <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a] font-mono text-[9px]">
                    <div className="opacity-40 mb-1">FAILED RUNS</div>
                    {currentWorker.diagnostics.failedRuns.length > 0 ? (
                      currentWorker.diagnostics.failedRuns.map((err: string, i: number) => (
                        <div key={i} className="text-[#ff2a6d]">{err}</div>
                      ))
                    ) : (
                      <div className="opacity-30">No recent failures</div>
                    )}
                  </div>
                  <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a] font-mono text-[9px]">
                    <div className="opacity-40 mb-1">HANDLED AGENTS</div>
                    {currentWorker.diagnostics.handledAgents.map((agent: string, i: number) => (
                      <div key={i} className="text-[#1bf7cd] flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-[#1bf7cd]" /> {agent} - Task Sync Complete
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'service' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-[#00f2ff] uppercase tracking-widest flex items-center gap-2">
                    <Server size={12} /> Service Configuration
                  </h3>
                  <div className="space-y-2">
                    <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a]">
                      <div className="text-[8px] opacity-40 uppercase mb-1">Handshake Protocol</div>
                      <div className="text-[10px] font-mono text-[#00f2ff] break-all">{currentWorker.diagnostics.handshake}</div>
                    </div>
                    {currentWorker.port && (
                      <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a]">
                        <div className="text-[8px] opacity-40 uppercase mb-1">Service Port</div>
                        <div className="text-xs font-bold text-[#f7d31b]">{currentWorker.port}</div>
                      </div>
                    )}
                    {currentWorker.pm2Name && (
                      <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a]">
                        <div className="text-[8px] opacity-40 uppercase mb-1">PM2 Process Name</div>
                        <div className="text-xs font-bold text-[#9854ff]">{currentWorker.pm2Name}</div>
                      </div>
                    )}
                    {currentWorker.prefix && (
                      <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a]">
                        <div className="text-[8px] opacity-40 uppercase mb-1">Tool Prefix</div>
                        <div className="text-[10px] font-mono text-[#00f2ff]">{currentWorker.prefix}</div>
                      </div>
                    )}
                    <div className="bg-black/40 p-3 rounded-lg border border-[#00f2ff1a]">
                      <div className="text-[8px] opacity-40 uppercase mb-1">Health Check URL</div>
                      <div className="text-[10px] font-mono opacity-60 truncate">{currentWorker.diagnostics.healthEndpoint}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-[#00f2ff] uppercase tracking-widest flex items-center gap-2">
                    <Terminal size={12} /> Diagnostic Commands
                  </h3>
                  <div className="bg-black/60 p-3 rounded-lg border border-[#00f2ff1a] font-mono text-[9px] space-y-2">
                    <div className="text-white/40"># Check PM2 Status</div>
                    <div className="text-[#1bf7cd]">pm2 status {currentWorker.pm2Name || ''}</div>
                    <div className="text-white/40 mt-2"># Health Verification</div>
                    <div className="text-[#1bf7cd]">curl -H "x-neural-handshake: AGENT_LEE_SOVEREIGN_V1" {currentWorker.diagnostics.healthEndpoint}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default WorkersCenter;
