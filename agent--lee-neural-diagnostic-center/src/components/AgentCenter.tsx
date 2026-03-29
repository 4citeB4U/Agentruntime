import React, { useState, useEffect, useRef } from 'react';
import { Bot, Cpu, Globe, Shield, Stethoscope, HeartPulse, ChevronLeft, ChevronRight, Microchip, Info, ChartLine, Terminal, Activity, Zap, User } from 'lucide-react';

const initialAgents = [
  { id: 'NEXUS-AGENT-001', name: 'Lily', function: 'context_weaver()', category: 'Core Cognitive & Orchestration', 
    description: 'Advanced context weaving agent responsible for connecting information across knowledge domains.',
    tools: ['Transformers.js', 'TensorFlow.js', 'LangChain', 'WebWorkers'],
    performance: 92, efficiency: 87, avatar: '👩‍💼', status: 'active', type: 'Supervisor', path: '/core/lily', agent: 'SUPERVISOR' },
  { id: 'NEXUS-AGENT-002', name: 'Gabriel', function: 'spec_enforcer()', category: 'Core Cognitive & Orchestration',
    description: 'Ensures all data and operations conform to predefined specifications and standards.',
    tools: ['JSON Schema', 'Validator.js', 'OpenAPI', 'TypeScript'],
    performance: 89, efficiency: 94, avatar: '👨‍💻', status: 'active', type: 'Supervisor', path: '/core/gabriel', agent: 'SUPERVISOR' },
  { id: 'NEXUS-AGENT-003', name: 'Adam', function: 'knowledge_grafter()', category: 'Core Cognitive & Orchestration',
    description: 'Integrates new knowledge and information into existing knowledge structures.',
    tools: ['Vector DB', 'GraphQL', 'Semantic Networks', 'LLM Integration'],
    performance: 85, efficiency: 91, avatar: '🧠', status: 'idle', type: 'Supervisor', path: '/core/adam', agent: 'SUPERVISOR' },
  { id: 'NEXUS-AGENT-004', name: 'Avery', function: 'polyglot_compiler()', category: 'Code & Package Management',
    description: 'Translates and compiles code between multiple programming languages.',
    tools: ['Babel', 'TypeScript', 'WebAssembly', 'Rust'],
    performance: 96, efficiency: 88, avatar: '🔄', status: 'active', type: 'Supervisor', path: '/core/avery', agent: 'SUPERVISOR' },
  { id: 'NEXUS-AGENT-005', name: 'Emma', function: 'smart_fetch()', category: 'Web & Network Operations',
    description: 'Optimized data fetching with intelligent caching and retry strategies.',
    tools: ['Fetch API', 'Service Workers', 'Caching', 'WebSockets'],
    performance: 91, efficiency: 89, avatar: '📡', status: 'active', type: 'Supervisor', path: '/core/emma', agent: 'SUPERVISOR' }
];

const webWorkerNames = ["Cipher", "Byte", "Pixel", "Vector", "Tensor", "Matrix", "Nexion", "Prism", "Neuron", "Cortex"];
const serviceWorkerNames = ["Guardian", "Sentinel", "Aegis", "Bastion", "Citadel"];

const allAgents = [...initialAgents];
for (let i = 5; i < 110; i++) {
  const isWeb = i < 80;
  const name = isWeb ? webWorkerNames[i % webWorkerNames.length] : serviceWorkerNames[i % serviceWorkerNames.length];
  allAgents.push({
    id: `NEXUS-AGENT-${(i+1).toString().padStart(3, '0')}`,
    name: `${name}-${i}`,
    function: isWeb ? 'async_processor()' : 'cache_manager()',
    category: isWeb ? 'Web & Network Operations' : 'Service & Background Operations',
    description: `Specialized ${isWeb ? 'Web' : 'Service'} worker for high-concurrency tasks.`,
    tools: isWeb ? ['WebWorkers', 'Fetch'] : ['Cache API', 'ServiceWorker'],
    performance: Math.floor(Math.random() * 15) + 80,
    efficiency: Math.floor(Math.random() * 15) + 80,
    avatar: isWeb ? '🌐' : '🛡️',
    status: Math.random() > 0.3 ? 'active' : 'idle',
    type: isWeb ? 'Web Worker' : 'Service Worker',
    path: isWeb ? `/web/${name.toLowerCase()}` : `/service/${name.toLowerCase()}`,
    agent: isWeb ? 'WEB_WORKER' : 'SERVICE_WORKER'
  });
}

export default function AgentCenter() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [metrics, setMetrics] = useState({ active: 110, load: 73, efficiency: 94 });
  const listRef = useRef<HTMLDivElement>(null);

  const filteredAgents = currentCategory === 'all' 
    ? allAgents 
    : allAgents.filter(a => {
        if (currentCategory === 'web') return a.type === 'Web Worker';
        if (currentCategory === 'service') return a.type === 'Service Worker';
        if (currentCategory === 'supervisor') return a.type === 'Supervisor';
        return true;
      });

  const selectedAgent = filteredAgents[selectedIndex] || filteredAgents[0];

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        load: Math.max(40, Math.min(95, prev.load + (Math.random() * 10 - 5))),
        efficiency: Math.max(85, Math.min(99, prev.efficiency + (Math.random() * 2 - 1)))
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    if (listRef.current) {
      const scrollAmount = dir === 'left' ? -200 : 200;
      listRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-full bg-transparent text-[#e0e7ff] font-['Inter'] p-4 space-y-6">
      {/* Header */}
      <header className="relative z-10 bg-gradient-to-r from-[#0a0e29cc] to-[#1e0f46cc] backdrop-blur-xl border-b border-[#00f2ff26] p-6 rounded-t-3xl shadow-[0_5px_25px_rgba(0,242,255,0.15)]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-2 border-[#00f2ff] rounded-full animate-pulse"></div>
              <div className="absolute inset-[20%] border border-[#9854ff] rounded-full animate-pulse delay-300"></div>
              <div className="absolute inset-[35%] bg-[#ff2a6d] rounded-full shadow-[0_0_10px_#ff2a6d]"></div>
            </div>
            <h1 className="font-['Orbitron'] text-2xl font-bold text-[#00f2ff] drop-shadow-[0_0_15px_rgba(0,242,255,0.7)]">
              Agent Lee's <span className="text-[#ff2a6d] drop-shadow-[0_0_10px_rgba(255,42,109,0.5)]">Integrated MCPS & Workers Center</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-[#10142899] px-5 py-2 rounded-full border border-[#00f2ff26] shadow-[0_0_15px_rgba(0,242,255,0.2)]">
            <div className="w-3 h-3 rounded-full bg-[#06d6a0] shadow-[0_0_10px_#06d6a0] animate-pulse"></div>
            <span className="text-sm font-medium">All Systems Operational</span>
          </div>
        </div>
      </header>

      {/* Control Bar */}
      <div className="bg-[#10142866] backdrop-blur-xl rounded-2xl border border-[#00f2ff26] p-4 flex flex-wrap justify-center gap-3 shadow-[0_0_20px_rgba(0,242,255,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00f2ff1a] to-transparent -translate-x-full animate-[scanline_8s_linear_infinite] pointer-events-none"></div>
        {[
          { id: 'all', label: 'All Workers', icon: <Cpu size={16} /> },
          { id: 'web', label: 'Web Workers', icon: <Globe size={16} /> },
          { id: 'service', label: 'Service Workers', icon: <Zap size={16} /> },
          { id: 'supervisor', label: 'Supervisors', icon: <User size={16} /> }
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => { setCurrentCategory(btn.id); setSelectedIndex(0); }}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all hover:-translate-y-1 hover:shadow-[0_0_10px_rgba(0,242,255,0.3)] ${
              currentCategory === btn.id 
                ? 'bg-gradient-to-r from-[#00f2ff] to-[#9854ff] border-transparent text-white font-bold' 
                : 'bg-[#0e162db3] border-[#00f2ff26] text-gray-300'
            }`}
          >
            {btn.icon} {btn.label}
          </button>
        ))}
        <button className="px-4 py-2 rounded-lg border border-[#9854ff] bg-[#0e162db3] text-gray-300 flex items-center gap-2 hover:-translate-y-1 transition-all">
          <Stethoscope size={16} /> Run Diagnostic
        </button>
        <button className="px-4 py-2 rounded-lg border border-[#ff2a6d] bg-gradient-to-br from-[#0e162db3] to-[#9854ff4d] text-gray-300 flex items-center gap-2 hover:-translate-y-1 transition-all">
          <HeartPulse size={16} className="text-[#ff2a6d] animate-pulse" /> Heartbeat Check
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-350px)] lg:min-h-[600px]">
        {/* Left: Worker Monitor */}
        <div className="lg:col-span-8 bg-[#10142866] backdrop-blur-xl rounded-2xl border border-[#00f2ff26] flex flex-col overflow-hidden shadow-[0_0_20px_rgba(0,242,255,0.15)] min-h-[500px] lg:min-h-0">
          <div className="bg-[#181a2ccc] p-4 border-b border-[#00f2ff26] flex justify-between items-center">
            <h2 className="font-['Orbitron'] text-lg font-semibold flex items-center gap-3">
              <Microchip size={20} className="text-[#00f2ff]" /> Agent Lee's Worker Monitor
            </h2>
            <div className="bg-black/20 px-3 py-1 rounded-full border border-[#00f2ff26] text-[#00f2ff] font-['Orbitron'] text-sm">
              {filteredAgents.length} {currentCategory === 'all' ? 'Total' : currentCategory}
            </div>
          </div>

          {/* Holographic Display */}
          <div className="flex-1 relative bg-gradient-to-br from-black/20 to-[#00f2ff05] flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute bottom-24 w-72 h-3 bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent rounded-[50%] blur-[5px] opacity-70 shadow-[0_0_20px_rgba(0,242,255,0.6)]"></div>
            
            <div className="relative w-48 h-72 flex flex-col items-center animate-[float-hologram_4s_ease-in-out_infinite]">
              <div className={`w-24 h-44 relative transition-all duration-500 scale-125 ${
                selectedAgent.status === 'active' ? 'bg-gradient-to-b from-[#00f2ff] to-[#9854ff] opacity-70' :
                selectedAgent.status === 'idle' ? 'bg-gradient-to-b from-[#00d1ff] to-[#9854ff] opacity-60' :
                'bg-gradient-to-b from-[#ff416c] to-[#ff2a6d] opacity-90'
              }`} style={{ clipPath: 'polygon(30% 0%, 70% 0%, 70% 10%, 80% 10%, 80% 20%, 70% 20%, 70% 40%, 80% 45%, 80% 50%, 70% 55%, 70% 80%, 60% 100%, 40% 100%, 30% 80%, 30% 55%, 20% 50%, 20% 45%, 30% 40%, 30% 20%, 20% 20%, 20% 10%, 30% 10%)' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-[#00f2ff] to-transparent opacity-30 animate-pulse"></div>
              </div>
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent animate-[scan-worker_3s_ease-in-out_infinite] blur-[2px] opacity-70"></div>
              
              <div className="mt-8 text-center">
                <h3 className="font-['Orbitron'] text-2xl font-bold text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.6)]">{selectedAgent.name}</h3>
                <div className="text-sm text-gray-400 font-medium">{selectedAgent.path || selectedAgent.id}</div>
                <div className="text-sm text-gray-300 font-semibold mb-3">{selectedAgent.agent || 'SUPERVISOR'}</div>
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-[#ff2a6d] bg-black/30 text-[#ff2a6d] text-xs font-bold">
                  {selectedAgent.type}
                </div>
              </div>
            </div>
          </div>

          {/* Carousel */}
          <div className="bg-black/30 p-5 border-t border-[#00f2ff26] relative h-44">
            <div className="absolute inset-y-0 left-0 flex items-center px-2 z-10 pointer-events-none">
              <button onClick={() => scroll('left')} className="w-10 h-10 rounded-full bg-black/50 border border-[#00f2ff26] text-[#00f2ff] flex items-center justify-center hover:bg-[#00f2ff33] transition-all pointer-events-auto">
                <ChevronLeft size={24} />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 z-10 pointer-events-none">
              <button onClick={() => scroll('right')} className="w-10 h-10 rounded-full bg-black/50 border border-[#00f2ff26] text-[#00f2ff] flex items-center justify-center hover:bg-[#00f2ff33] transition-all pointer-events-auto">
                <ChevronRight size={24} />
              </button>
            </div>
            
            <div ref={listRef} className="flex gap-4 overflow-x-auto no-scrollbar h-full items-center px-12">
              {filteredAgents.map((agent, i) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedIndex(i)}
                  className={`min-w-[120px] h-32 rounded-xl border p-3 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${
                    i === selectedIndex ? 'border-[#00f2ff] bg-[#00f2ff1a] shadow-[0_0_15px_rgba(0,242,255,0.3)]' : 'border-[#00f2ff26] bg-[#0a0e1e80] hover:bg-[#00f2ff0d]'
                  }`}
                >
                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full border border-white/20 ${
                    agent.status === 'active' ? 'bg-[#06d6a0] shadow-[0_0_6px_#06d6a0]' : 'bg-[#00d1ff] shadow-[0_0_6px_#00d1ff]'
                  }`}></div>
                  <div className="text-2xl mb-2 relative">
                    {agent.avatar}
                    <div className="absolute inset-0 border border-[#00f2ff] rounded-full scale-125 opacity-40"></div>
                  </div>
                  <div className="text-xs font-bold text-center truncate w-full">{agent.name}</div>
                  <div className="text-[9px] text-[#9854ff] font-medium">{agent.type}</div>
                  <div className="text-[9px] text-gray-500 font-['Orbitron']">{agent.id.split('-').pop()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Diagnostics */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#10142866] backdrop-blur-xl rounded-2xl border border-[#00f2ff26] overflow-hidden shadow-[0_0_20px_rgba(0,242,255,0.15)] flex flex-col h-full">
            <div className="bg-[#181a2ccc] flex border-b border-[#00f2ff26]">
              {['health', 'resources', 'logs'].map(tab => (
                <button
                  key={tab}
                  className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest border-r border-[#00f2ff26] last:border-0 hover:bg-[#00f2ff1a] transition-all"
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              <section>
                <h3 className="font-['Orbitron'] text-sm font-bold text-[#00f2ff] mb-4 flex items-center gap-2">
                  <Activity size={16} /> Execution Health
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Status', val: selectedAgent.status.toUpperCase(), color: 'text-[#06d6a0]' },
                    { label: 'Task Queue', val: '0', color: 'text-[#00f2ff]' },
                    { label: 'Uptime', val: '14h 22m', color: 'text-[#9854ff]' },
                    { label: 'Frequency', val: '42 c/min', color: 'text-[#ffd166]' }
                  ].map((m, i) => (
                    <div key={i} className="bg-black/30 p-3 rounded-xl border border-white/5">
                      <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">{m.label}</div>
                      <div className={`text-sm font-['Orbitron'] font-bold ${m.color}`}>{m.val}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="font-['Orbitron'] text-sm font-bold text-[#00f2ff] mb-4 flex items-center gap-2">
                  <ChartLine size={16} /> Resource Usage
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Cognitive Load', val: selectedAgent.performance, color: '#06d6a0' },
                    { label: 'Memory Saturation', val: selectedAgent.efficiency, color: '#9854ff' }
                  ].map((m, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-400">{m.label}</span>
                        <span style={{ color: m.color }}>{m.val}%</span>
                      </div>
                      <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full transition-all duration-1000" style={{ width: `${m.val}%`, backgroundColor: m.color }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="font-['Orbitron'] text-sm font-bold text-[#00f2ff] mb-4 flex items-center gap-2">
                  <Terminal size={16} /> Agent Protocol Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.tools.map((tool, i) => (
                    <span key={i} className="px-3 py-1 bg-[#00f2ff0d] border border-[#00f2ff4d] rounded-full text-[10px] text-[#00f2ff] font-bold">
                      {tool}
                    </span>
                  ))}
                </div>
              </section>

              <section className="bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="text-[10px] text-gray-500 uppercase font-bold mb-3">Last Task Log</div>
                <div className="font-mono text-[10px] text-[#00d1ff] leading-relaxed">
                  <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span> Task executed successfully. Memory parity verified.
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
