import React, { useEffect, useRef, useState } from 'react';
import { 
  Network, 
  Activity, 
  Brain, 
  Database, 
  ListTodo, 
  FileText, 
  CheckCircle2, 
  Plus, 
  Zap, 
  ShieldCheck, 
  Server, 
  Cpu, 
  Wifi, 
  RefreshCw, 
  History, 
  Maximize2, 
  Minimize2, 
  X
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import * as anime from 'animejs';
import p5 from 'p5';

Chart.register(...registerables);

interface TaskStep {
  id: string;
  description: string;
  tools: string[];
  status: 'pending' | 'completed';
  timestamp?: string;
  explanation?: string;
}

interface Task {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  source: 'LLM' | 'AGENT' | 'WORKER' | 'MCP';
  completed: boolean;
  date: string;
  time: string;
  plan: TaskStep[];
}

const MatrixDashboard: React.FC = () => {
  const [leftOpen, setLeftOpen] = useState(window.innerWidth > 1024);
  const [rightOpen, setRightOpen] = useState(window.innerWidth > 1024);
  const [todos, setTodos] = useState<Task[]>([
    { 
      id: '1', 
      text: 'Diagnose failing LLM neural pathways', 
      priority: 'high', 
      source: 'LLM', 
      completed: false,
      date: '2026-03-29',
      time: '09:00',
      plan: [
        { id: 's1', description: 'Scan neural weights for anomalies', tools: ['NeuralScanner', 'WeightAnalyzer'], status: 'completed', timestamp: '09:05', explanation: 'Identified 3 nodes with drifting weights.' },
        { id: 's2', description: 'Re-calibrate attention heads', tools: ['HeadCalibrator'], status: 'pending' }
      ]
    },
    { 
      id: '2', 
      text: 'Verify agent plan integrity', 
      priority: 'medium', 
      source: 'AGENT', 
      completed: false,
      date: '2026-03-29',
      time: '09:15',
      plan: [
        { id: 's1', description: 'Cross-reference plan with safety protocols', tools: ['SafetyChecker'], status: 'pending' }
      ]
    },
    { 
      id: '3', 
      text: 'Cache vector store in memory', 
      priority: 'low', 
      source: 'WORKER', 
      completed: true,
      date: '2026-03-29',
      time: '08:30',
      plan: [
        { id: 's1', description: 'Initialize cache buffer', tools: ['MemManager'], status: 'completed', timestamp: '08:35', explanation: 'Buffer allocated successfully.' },
        { id: 's2', description: 'Stream vector data to RAM', tools: ['DataStreamer'], status: 'completed', timestamp: '08:45', explanation: '1.2GB of vectors cached.' }
      ]
    },
    { 
      id: '4', 
      text: 'Sync InsForge Bridge data', 
      priority: 'high', 
      source: 'MCP', 
      completed: false,
      date: '2026-03-29',
      time: '09:30',
      plan: [
        { id: 's1', description: 'Establish handshake with InsForge', tools: ['InsForgeBridge'], status: 'completed', timestamp: '09:32', explanation: 'Handshake AGENT_LEE_SOVEREIGN_V1 verified.' },
        { id: 's2', description: 'Pull latest database schema', tools: ['SQLTool'], status: 'pending' }
      ]
    }
  ]);
  const [newTodo, setNewTodo] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notepadContent, setNotepadContent] = useState(`🔷 Agent Lee's Task Memory Core initialized.
🧠 Pentagon Brain Network: 5 nodes connected.
📡 TaskMemoryBus: Active and monitoring.
💓 Vital Signs: All systems nominal.
🔄 Task Flow: Processing 14 active tasks.
🧠 Memory: State retention at 99.4%.
📞 Communication: Message rate 34.2/min.
⚙️ Autonomy: Decision triggers functioning.
📡 Dependencies: 5/6 APIs synchronized.
🚀 Latency: Response time 84ms average.
🗃️ Database: Connection stable, backup current.
📝 Notepad: Mirror sync verified at 96%.`);

  const [syncStats, setSyncStats] = useState({
    connected: 5,
    lastSync: 'Now',
    mirror: 96
  });

  const p5ContainerRef = useRef<HTMLDivElement>(null);
  const diagnosticsChartRef = useRef<HTMLCanvasElement>(null);
  const taskAnalyticsChartRef = useRef<HTMLCanvasElement>(null);
  const memoryStreamChartRef = useRef<HTMLCanvasElement>(null);
  const taskWorkflowChartRef = useRef<HTMLCanvasElement>(null);
  const databaseHealthChartRef = useRef<HTMLCanvasElement>(null);

  const chartsRef = useRef<{ [key: string]: Chart | null }>({});

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setLeftOpen(false);
        setRightOpen(false);
      } else {
        setLeftOpen(true);
        setRightOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // P5 Grid Background
    const sketch = (p: p5) => {
      let animationPhase = 0;
      p.setup = () => {
        const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.position(0, 0);
        canvas.style('z-index', '-1');
        canvas.style('pointer-events', 'none');
      };

      p.draw = () => {
        p.clear(0, 0, 0, 0);
        const gridSize = 50;
        
        // Base grid
        p.stroke('rgba(0, 174, 255, 0.05)');
        p.strokeWeight(1);
        for (let x = 0; x <= p.width; x += gridSize) {
          p.line(x, 0, x, p.height);
        }
        for (let y = 0; y <= p.height; y += gridSize) {
          p.line(0, y, p.width, y);
        }

        // Animated highlights
        p.stroke(`rgba(0, 238, 255, ${0.1 + Math.sin(animationPhase) * 0.1})`);
        p.strokeWeight(2);
        const highlightX = (animationPhase * 50) % p.width;
        const highlightY = (animationPhase * 30) % p.height;
        p.line(highlightX, 0, highlightX, p.height);
        p.line(0, highlightY, p.width, highlightY);
        
        animationPhase += 0.01;
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };
    };

    const p5Instance = new p5(sketch, p5ContainerRef.current!);

    // Charts Initialization
    const initChart = (ref: React.RefObject<HTMLCanvasElement>, key: string, config: any) => {
      if (chartsRef.current[key]) chartsRef.current[key]?.destroy();
      if (ref.current) {
        chartsRef.current[key] = new Chart(ref.current, config);
      }
    };

    initChart(diagnosticsChartRef, 'diagnostics', {
      type: 'line',
      data: {
        labels: Array.from({length: 20}, (_, i) => i),
        datasets: [{
          label: 'System Health',
          data: Array.from({length: 20}, () => Math.random() * 40 + 60),
          borderColor: '#00eeff',
          backgroundColor: 'rgba(0, 238, 255, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false, min: 0, max: 100 } },
        elements: { point: { radius: 0 } }
      }
    });

    initChart(taskAnalyticsChartRef, 'taskAnalytics', {
      type: 'bar',
      data: {
        labels: ['Queued', 'Processing', 'Complete', 'Failed'],
        datasets: [{
          data: [45, 123, 892, 12],
          backgroundColor: ['#f7d31b', '#00eeff', '#1bf7cd', '#f73a1b'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#aaf', font: { size: 8 } }, grid: { display: false } },
          y: { ticks: { color: '#aaf', font: { size: 8 } }, grid: { color: 'rgba(0, 174, 255, 0.1)' } }
        }
      }
    });

    initChart(memoryStreamChartRef, 'memoryStream', {
      type: 'line',
      data: {
        labels: Array.from({length: 50}, (_, i) => i),
        datasets: [{
          data: Array.from({length: 50}, () => Math.random() * 60 + 20),
          borderColor: '#1bf7cd',
          backgroundColor: 'rgba(27, 247, 205, 0.1)',
          borderWidth: 1.5,
          fill: true,
          tension: 0.6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
        elements: { point: { radius: 0 } }
      }
    });

    initChart(taskWorkflowChartRef, 'taskWorkflow', {
      type: 'doughnut',
      data: {
        labels: ['LLM', 'Agents', 'Workers', 'Services'],
        datasets: [{
          data: [25, 35, 30, 10],
          backgroundColor: ['#f7d31b', '#00eeff', '#1bf7cd', '#f73a1b'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { 
            display: true,
            position: 'bottom',
            labels: { color: '#aaf', font: { size: 8 }, usePointStyle: true }
          }
        }
      }
    });

    initChart(databaseHealthChartRef, 'databaseHealth', {
      type: 'polarArea',
      data: {
        labels: ['Todo Tasks', 'Task History', 'Memory Cache', 'Log Storage'],
        datasets: [{
          data: [95, 87, 93, 89],
          backgroundColor: [
            'rgba(27, 247, 205, 0.7)',
            'rgba(0, 238, 255, 0.7)',
            'rgba(247, 211, 27, 0.7)',
            'rgba(247, 58, 27, 0.7)'
          ],
          borderWidth: 2,
          borderColor: '#00eeff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: true, position: 'bottom', labels: { color: '#aaf', font: { size: 8 } } }
        },
        scales: {
          r: {
            ticks: { color: '#aaf', font: { size: 8 }, backdropColor: 'transparent' },
            grid: { color: 'rgba(0, 174, 255, 0.1)' }
          }
        }
      }
    });

    return () => {
      p5Instance.remove();
      Object.values(chartsRef.current).forEach((chart: any) => chart?.destroy());
    };
  }, []);

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const priorityLevels = ['high', 'medium', 'low'] as const;
    const sourceTypes = ['LLM', 'AGENT', 'WORKER', 'MCP'] as const;
    const now = new Date();
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTodo,
      priority: priorityLevels[Math.floor(Math.random() * 3)],
      source: sourceTypes[Math.floor(Math.random() * 4)],
      completed: false,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      plan: [
        { id: 's1', description: 'Initialize task processing', tools: ['CoreEngine'], status: 'pending' }
      ]
    };
    setTodos([newTask, ...todos]);
    setNewTodo('');
  };

  const updateTask = (updatedTask: Task) => {
    setTodos(todos.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  return (
    <div className="flex flex-col h-full bg-[#001529] text-[#aaf] font-['Inter'] p-4 md:p-6 gap-6 relative overflow-hidden">
      <div ref={p5ContainerRef} className="absolute inset-0 -z-10 pointer-events-none" />

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#001e3c]/90 to-[#00325a]/90 border-2 border-[#00eeff] rounded-xl p-4 md:p-6 text-center shadow-[0_0_25px_rgba(0,238,255,0.3)] backdrop-blur-md relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00eeff1a] to-transparent -translate-x-full animate-[scanline_4s_linear_infinite]" />
        <h1 className="font-['Orbitron'] text-xl md:text-3xl font-black text-[#00eeff] drop-shadow-[0_0_15px_rgba(0,238,255,0.7)] tracking-widest uppercase mb-1">
          Agent Lee's Dynamic To-Do List
        </h1>
        <p className="text-[10px] md:text-sm text-[#3fd2f8] font-light tracking-[2px] uppercase">and Shared Notepad</p>
      </div>

      {/* Sidebar Toggle Buttons (Mobile & Desktop) */}
      <div className="flex justify-between items-center px-2 shrink-0">
        <button 
          onClick={() => setLeftOpen(!leftOpen)}
          className={`p-2 rounded-lg border transition-all ${leftOpen ? 'bg-[#00eeff22] border-[#00eeff]' : 'bg-black/40 border-white/10 opacity-50'}`}
          title="Toggle Diagnostics"
        >
          <Maximize2 size={16} className={leftOpen ? 'text-[#00eeff]' : 'text-white'} />
        </button>
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">System Matrix Core</div>
        <button 
          onClick={() => setRightOpen(!rightOpen)}
          className={`p-2 rounded-lg border transition-all ${rightOpen ? 'bg-[#00eeff22] border-[#00eeff]' : 'bg-black/40 border-white/10 opacity-50'}`}
          title="Toggle Notepad"
        >
          <Maximize2 size={16} className={rightOpen ? 'text-[#00eeff]' : 'text-white'} />
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
        {/* Left Column: Diagnostics & Tasks */}
        <div className={`${leftOpen ? 'flex' : 'hidden'} flex-col gap-6 w-full lg:w-80 shrink-0 min-h-0 overflow-y-auto no-scrollbar`}>
          <div className="bg-[#001e3c]/70 border border-[#0af] rounded-lg p-4 backdrop-blur-sm shadow-[0_0_15px_rgba(0,174,255,0.2)] flex flex-col shrink-0 h-48">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-[#00eeff] uppercase tracking-widest">Diagnostics Overview</span>
              <span className="text-[8px] bg-[#1bf7cd33] text-[#1bf7cd] px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            </div>
            <div className="flex-1 min-h-0">
              <canvas ref={diagnosticsChartRef} />
            </div>
          </div>

          <div className="bg-[#001e3c]/70 border border-[#0af] rounded-lg p-4 backdrop-blur-sm shadow-[0_0_15px_rgba(0,174,255,0.2)] flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-[#00eeff] uppercase tracking-widest">Agent To-Do List Manager</span>
              <span className="text-[8px] bg-[#1bf7cd33] text-[#1bf7cd] px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 mb-3 min-h-[200px]">
              {todos.map(todo => (
                <div 
                  key={todo.id} 
                  onClick={() => setSelectedTask(todo)}
                  className={`flex items-center gap-3 bg-black/40 p-2 rounded border-l-4 transition-all hover:bg-black/60 cursor-pointer ${todo.priority === 'high' ? 'border-[#f73a1b]' : todo.priority === 'medium' ? 'border-[#f7d31b]' : 'border-[#1bf7cd]'}`}
                >
                  <input 
                    type="checkbox" 
                    checked={todo.completed}
                    onChange={(e) => {
                      e.stopPropagation();
                      setTodos(todos.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t));
                    }}
                    className="w-4 h-4 rounded border-[#0af] bg-transparent text-[#1bf7cd] focus:ring-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs truncate ${todo.completed ? 'line-through opacity-40' : ''}`}>{todo.text}</div>
                    <div className="text-[8px] opacity-50">{todo.date} {todo.time}</div>
                  </div>
                  <span className={`text-[8px] px-2 py-0.5 rounded-full ${todo.source === 'LLM' ? 'bg-[#f7d31b33] text-[#f7d31b]' : todo.source === 'AGENT' ? 'bg-[#00eeff33] text-[#00eeff]' : todo.source === 'MCP' ? 'bg-[#9854ff33] text-[#9854ff]' : 'bg-[#1bf7cd33] text-[#1bf7cd]'}`}>
                    {todo.source}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                placeholder="Add new task..."
                className="flex-1 bg-black/40 border border-[#0af] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#00eeff]"
              />
              <button onClick={addTodo} className="bg-[#00eeff] text-[#001529] px-3 py-1.5 rounded font-bold text-lg hover:bg-[#0af] transition-all">+</button>
            </div>
          </div>
        </div>

        {/* Center Column: Neural Core */}
        <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto no-scrollbar">
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[300px]">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 font-['Orbitron'] text-5xl font-black text-[#00eeff] drop-shadow-[0_0_15px_rgba(0,238,255,0.7)] flex items-center justify-center">LLM</div>
              <svg className="w-full h-full absolute inset-0 filter drop-shadow-[0_0_10px_#00eeff]">
                <path d="M60,50 C30,30 10,60 20,90 C25,110 45,120 70,115 C90,125 120,120 140,110 C160,125 190,120 200,100 C210,80 190,50 170,40 C150,20 130,25 110,35 C90,25 70,30 60,50 Z" stroke="#0af" strokeWidth="2" fill="none" />
              </svg>
            </div>
            
            <div className="mt-12 w-full grid grid-cols-2 md:grid-cols-4 gap-4">
              {['AI AGENTS', 'MCP SERVICES', 'LLM NODES', 'SPECIALIZED'].map((title, i) => (
                <div key={title} className="bg-gradient-to-b from-[#002c56] to-[#001529] border border-[#0af] rounded-lg p-3 flex flex-col items-center gap-2 transform hover:scale-105 transition-all">
                  <div className="text-[8px] font-bold text-[#00eeff] text-center leading-tight">{title}</div>
                  <div className="text-xl font-bold">{[125, 13, 5, 15][i]}</div>
                  <div className="grid grid-cols-4 gap-1 w-full">
                    {Array.from({length: 12}).map((_, j) => (
                      <div key={j} className={`h-1.5 rounded-sm border border-[#0af] ${Math.random() > 0.4 ? 'bg-[#00eeff] shadow-[0_0_5px_#00eeff]' : 'bg-[#0af2]'}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#001e3c]/70 border border-[#0af] rounded-lg p-4 backdrop-blur-sm shadow-[0_0_15px_rgba(0,174,255,0.2)] h-64 shrink-0">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-[#00eeff] uppercase tracking-widest">Database Health & To-Do Tasks</span>
              <span className="text-[8px] bg-[#1bf7cd33] text-[#1bf7cd] px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            </div>
            <div className="h-full pb-8">
              <canvas ref={databaseHealthChartRef} />
            </div>
          </div>
        </div>

        {/* Right Column: Memory & Notepad */}
        <div className={`${rightOpen ? 'flex' : 'hidden'} flex-col gap-6 w-full lg:w-80 shrink-0 min-h-0 overflow-y-auto no-scrollbar`}>
          <div className="bg-[#001e3c]/70 border border-[#0af] rounded-lg p-4 backdrop-blur-sm shadow-[0_0_15px_rgba(0,174,255,0.2)] flex flex-col h-48 shrink-0">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-[#00eeff] uppercase tracking-widest">Memory Stream</span>
              <span className="text-[8px] bg-[#1bf7cd33] text-[#1bf7cd] px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            </div>
            <div className="flex-1 min-h-0">
              <canvas ref={memoryStreamChartRef} />
            </div>
          </div>

          <div className="bg-[#001e3c]/70 border border-[#0af] rounded-lg p-4 backdrop-blur-sm shadow-[0_0_15px_rgba(0,174,255,0.2)] flex flex-col h-48 shrink-0">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-[#00eeff] uppercase tracking-widest">Task Workflow</span>
              <span className="text-[8px] bg-[#1bf7cd33] text-[#1bf7cd] px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            </div>
            <div className="flex-1 min-h-0">
              <canvas ref={taskWorkflowChartRef} />
            </div>
          </div>

          <div className="bg-[#001e3c]/70 border border-[#0af] rounded-lg p-4 backdrop-blur-sm shadow-[0_0_15px_rgba(0,174,255,0.2)] flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-[#00eeff] uppercase tracking-widest">Shared Notepad & Database Sync</span>
              <span className="text-[8px] bg-[#1bf7cd33] text-[#1bf7cd] px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            </div>
            <textarea 
              value={notepadContent}
              onChange={(e) => setNotepadContent(e.target.value)}
              className="flex-1 bg-black/40 border border-[#0af] rounded p-3 font-mono text-[10px] resize-none focus:outline-none focus:border-[#00eeff] custom-scrollbar min-h-[150px]"
              placeholder="Agent Lee is listening..."
            />
            <div className="flex justify-between mt-3 text-[8px] opacity-70">
              <div className="flex items-center gap-1">📡 Connected: <span className="text-[#00eeff]">{syncStats.connected}/5</span></div>
              <div className="flex items-center gap-1">🔄 Last Sync: <span className="text-[#00eeff]">{syncStats.lastSync}</span></div>
              <div className="flex items-center gap-1">💾 DB Mirror: <span className="text-[#00eeff]">{syncStats.mirror}%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-[#001e3c]/80 border border-[#0af] rounded-full px-4 md:px-6 py-2 flex flex-wrap items-center justify-center gap-3 md:gap-6 backdrop-blur-md self-center mb-4 shadow-[0_0_20px_rgba(0,174,255,0.3)] shrink-0">
        <select className="bg-transparent text-[#00eeff] text-[8px] md:text-[10px] border border-[#0af] rounded-full px-2 md:px-3 py-1 focus:outline-none">
          <option value="all">All Components</option>
          <option value="ai-agents">Active AI Agents</option>
        </select>
        <button className="text-[#00eeff] text-[8px] md:text-[10px] border border-[#0af] rounded-full px-3 md:px-4 py-1 hover:bg-[#0af2] transition-all">Enable Zoom</button>
        <select className="bg-transparent text-[#00eeff] text-[8px] md:text-[10px] border border-[#0af] rounded-full px-2 md:px-3 py-1 focus:outline-none">
          <option value="1">Playback: 1x</option>
          <option value="5">Playback: 5x</option>
        </select>
        <button className="text-[#00eeff] text-[8px] md:text-[10px] border border-[#0af] rounded-full px-3 md:px-4 py-1 hover:bg-[#0af2] transition-all whitespace-nowrap">↻ Replay Last 10 Min</button>
      </div>
      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#001e3c] border-2 border-[#00eeff] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,238,255,0.3)] overflow-hidden">
            <div className="p-4 border-b border-[#00eeff22] flex justify-between items-center bg-gradient-to-r from-[#00eeff11] to-transparent">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${selectedTask.priority === 'high' ? 'bg-[#f73a1b]' : selectedTask.priority === 'medium' ? 'bg-[#f7d31b]' : 'bg-[#1bf7cd]'}`} />
                <h2 className="font-['Orbitron'] text-sm font-bold text-[#00eeff] uppercase tracking-widest">Task Intelligence Core</h2>
              </div>
              <button onClick={() => { setSelectedTask(null); setIsEditing(false); }} className="text-[#aaf] hover:text-white transition-all"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
              {/* Task Header Info */}
              <div className="space-y-4">
                {isEditing ? (
                  <input 
                    type="text" 
                    value={selectedTask.text}
                    onChange={(e) => updateTask({ ...selectedTask, text: e.target.value })}
                    className="w-full bg-black/40 border border-[#00eeff] rounded px-4 py-2 text-lg font-bold text-white focus:outline-none"
                  />
                ) : (
                  <h3 className="text-2xl font-bold text-white">{selectedTask.text}</h3>
                )}
                
                <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-widest font-bold">
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded border border-[#00eeff22]">
                    <span className="opacity-50 text-[#aaf]">Source:</span>
                    <span className="text-[#00eeff]">{selectedTask.source}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded border border-[#00eeff22]">
                    <span className="opacity-50 text-[#aaf]">Priority:</span>
                    <span className={selectedTask.priority === 'high' ? 'text-[#f73a1b]' : selectedTask.priority === 'medium' ? 'text-[#f7d31b]' : 'text-[#1bf7cd]'}>{selectedTask.priority}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded border border-[#00eeff22]">
                    <span className="opacity-50 text-[#aaf]">Created:</span>
                    <span className="text-white">{selectedTask.date} {selectedTask.time}</span>
                  </div>
                </div>
              </div>

              {/* Plan Breakdown */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-bold text-[#00eeff] uppercase tracking-widest">Strategic Plan Breakdown</h4>
                  <button 
                    onClick={() => {
                      const newStep: TaskStep = { id: Date.now().toString(), description: 'New step...', tools: [], status: 'pending' };
                      updateTask({ ...selectedTask, plan: [...selectedTask.plan, newStep] });
                      setIsEditing(true);
                    }}
                    className="text-[10px] bg-[#00eeff22] text-[#00eeff] px-3 py-1 rounded border border-[#00eeff] hover:bg-[#00eeff44] transition-all"
                  >
                    + Add Step
                  </button>
                </div>
                
                <div className="space-y-4">
                  {selectedTask.plan.map((step, idx) => (
                    <div key={step.id} className="relative pl-8 before:absolute before:left-3 before:top-0 before:bottom-0 before:w-px before:bg-[#00eeff22]">
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${step.status === 'completed' ? 'bg-[#1bf7cd] border-[#1bf7cd] text-black' : 'bg-[#001e3c] border-[#00eeff] text-[#00eeff]'}`}>
                        {step.status === 'completed' ? '✓' : idx + 1}
                      </div>
                      
                      <div className="bg-black/40 border border-[#00eeff11] rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          {isEditing ? (
                            <textarea 
                              value={step.description}
                              onChange={(e) => {
                                const newPlan = [...selectedTask.plan];
                                newPlan[idx].description = e.target.value;
                                updateTask({ ...selectedTask, plan: newPlan });
                              }}
                              className="flex-1 bg-transparent border-b border-[#00eeff22] text-sm text-white focus:outline-none focus:border-[#00eeff] resize-none"
                            />
                          ) : (
                            <p className={`text-sm ${step.status === 'completed' ? 'text-white/60 line-through' : 'text-white'}`}>{step.description}</p>
                          )}
                          <div className="flex gap-2 ml-4">
                            <button 
                              onClick={() => {
                                const newPlan = [...selectedTask.plan];
                                newPlan[idx].status = newPlan[idx].status === 'completed' ? 'pending' : 'completed';
                                if (newPlan[idx].status === 'completed') {
                                  newPlan[idx].timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                  newPlan[idx].explanation = 'Task step completed by Agent Lee.';
                                }
                                updateTask({ ...selectedTask, plan: newPlan });
                              }}
                              className={`text-[8px] px-2 py-1 rounded border transition-all ${step.status === 'completed' ? 'bg-[#1bf7cd33] border-[#1bf7cd] text-[#1bf7cd]' : 'bg-black/40 border-white/20 text-white/40 hover:border-[#00eeff] hover:text-[#00eeff]'}`}
                            >
                              {step.status === 'completed' ? 'COMPLETED' : 'MARK DONE'}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {step.tools.map(tool => (
                            <span key={tool} className="text-[8px] bg-[#00eeff11] text-[#00eeff] px-2 py-0.5 rounded border border-[#00eeff22] flex items-center gap-1">
                              <Zap size={8} /> {tool}
                            </span>
                          ))}
                          {isEditing && (
                            <button 
                              onClick={() => {
                                const tool = prompt('Enter tool name:');
                                if (tool) {
                                  const newPlan = [...selectedTask.plan];
                                  newPlan[idx].tools = [...newPlan[idx].tools, tool];
                                  updateTask({ ...selectedTask, plan: newPlan });
                                }
                              }}
                              className="text-[8px] border border-dashed border-[#00eeff44] text-[#00eeff44] px-2 py-0.5 rounded hover:border-[#00eeff] hover:text-[#00eeff] transition-all"
                            >
                              + Tool
                            </button>
                          )}
                        </div>

                        {step.status === 'completed' && (
                          <div className="pt-2 border-t border-[#00eeff11] flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-[8px] font-bold text-[#1bf7cd] uppercase tracking-widest">
                              <CheckCircle2 size={10} /> Accomplished at {step.timestamp}
                            </div>
                            <p className="text-[10px] text-white/50 italic leading-relaxed">"{step.explanation}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#00eeff22] bg-black/40 flex justify-between items-center">
              <button 
                onClick={() => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    setTodos(todos.filter(t => t.id !== selectedTask.id));
                    setSelectedTask(null);
                  }
                }}
                className="text-[10px] text-[#f73a1b] hover:underline uppercase tracking-widest font-bold"
              >
                Terminate Task
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-6 py-2 rounded-full border font-bold text-[10px] uppercase tracking-widest transition-all ${isEditing ? 'bg-[#1bf7cd33] border-[#1bf7cd] text-[#1bf7cd]' : 'border-[#00eeff] text-[#00eeff] hover:bg-[#00eeff22]'}`}
                >
                  {isEditing ? 'LOCK CHANGES' : 'EDIT INTELLIGENCE'}
                </button>
                <button 
                  onClick={() => { setSelectedTask(null); setIsEditing(false); }}
                  className="px-8 py-2 rounded-full bg-[#00eeff] text-[#001529] font-bold text-[10px] uppercase tracking-widest hover:bg-[#0af] transition-all shadow-[0_0_15px_rgba(0,238,255,0.5)]"
                >
                  SAVE & CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatrixDashboard;
