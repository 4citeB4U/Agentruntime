import React, { useEffect, useState } from 'react';
import { Database, Table, Activity, Server, Network, Brain, History, CheckCircle, Moon, Sun, LineChart, Cog, VectorSquare, Cpu, Projector, HeartPulse } from 'lucide-react';

export default function DatabaseDashboard() {
  const [health, setHealth] = useState(96);

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(prev => Math.max(90, Math.min(100, prev + (Math.random() * 4 - 2))));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-full bg-transparent text-[#e0e7ff] font-['Outfit'] p-4 space-y-8">
      {/* Hero Section */}
      <section className="text-center py-8">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-[#6C47FF] via-[#00E3FF] to-[#FF4499] bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(108,71,255,0.3)]">
          Multi-Database Command Center
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Manage and monitor all your data sources in one place with Agent Lee's Database Management System
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto">
        {/* Left Column */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          {/* Database Cluster Card */}
          <div className="bg-[#0c0f23b3] backdrop-blur-xl rounded-3xl border border-[#6c47ff26] overflow-hidden shadow-[0_20px_60px_rgba(3,4,16,0.4)] hover:shadow-[0_0_40px_rgba(108,71,255,0.2)] transition-all">
            <div className="p-6 border-b border-[#6c47ff1a] bg-[#0c0f2380] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6c47ff26] flex items-center justify-center text-[#6C47FF]">
                  <Network size={20} />
                </div>
                <span className="text-lg font-semibold">Database Cluster</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#6c47ff26] text-xs font-medium text-gray-300">5 Nodes</span>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
                <div className="flex-1 flex justify-center w-full">
                  <svg width="240" height="240" viewBox="0 0 300 300" className="max-w-full h-auto">
                    <polygon points="150,30 270,120 220,260 80,260 30,120" fill="none" stroke="rgba(108, 71, 255, 0.3)" strokeWidth="2" />
                    <line x1="150" y1="30" x2="270" y2="120" stroke="rgba(0, 227, 255, 0.2)" strokeWidth="1" />
                    <line x1="270" y1="120" x2="220" y2="260" stroke="rgba(0, 227, 255, 0.2)" strokeWidth="1" />
                    <line x1="220" y1="260" x2="80" y2="260" stroke="rgba(0, 227, 255, 0.2)" strokeWidth="1" />
                    <line x1="80" y1="260" x2="30" y2="120" stroke="rgba(0, 227, 255, 0.2)" strokeWidth="1" />
                    <line x1="30" y1="120" x2="150" y2="30" stroke="rgba(0, 227, 255, 0.2)" strokeWidth="1" />
                    <circle cx="150" cy="30" r="18" fill="rgba(255, 68, 153, 0.2)" stroke="rgba(255, 68, 153, 0.8)" strokeWidth="2" />
                    <circle cx="270" cy="120" r="18" fill="rgba(108, 71, 255, 0.2)" stroke="rgba(108, 71, 255, 0.8)" strokeWidth="2" />
                    <circle cx="220" cy="260" r="18" fill="rgba(255, 193, 7, 0.2)" stroke="rgba(255, 193, 7, 0.8)" strokeWidth="2" />
                    <circle cx="80" cy="260" r="18" fill="rgba(71, 255, 190, 0.2)" stroke="rgba(71, 255, 190, 0.8)" strokeWidth="2" />
                    <circle cx="30" cy="120" r="18" fill="rgba(0, 227, 255, 0.2)" stroke="rgba(0, 227, 255, 0.8)" strokeWidth="2" />
                    <circle cx="150" cy="150" r="25" fill="rgba(108, 71, 255, 0.1)" stroke="rgba(108, 71, 255, 0.5)" strokeWidth="2" />
                    <text x="150" y="155" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">CORE</text>
                  </svg>
                </div>
                <div className="flex-1 w-full bg-[#0c0f234d] p-4 rounded-2xl border border-[#6c47ff26]">
                  <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-gray-400">Node Status</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'LLM Memory', color: 'bg-[#FF4499]' },
                      { label: 'Agent Center', color: 'bg-[#6C47FF]' },
                      { label: 'Worker Processes', color: 'bg-[#FFC107]' },
                      { label: 'Task & Todo List', color: 'bg-[#47FFBE]' },
                      { label: 'Metadata Storage', color: 'bg-[#00E3FF]' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className={`w-3 h-3 rounded-full ${item.color} shadow-[0_0_8px_rgba(0,0,0,0.5)]`}></div>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-[#0c0f234d] border-t-4 border-[#FF4499] border-x border-b border-[#6c47ff1a]">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <Brain size={20} className="text-[#FF4499]" />
                      <h3 className="font-bold">LLM Memory Cluster</h3>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">2 Databases</span>
                  </div>
                  <div className="space-y-3">
                    {['Vector Embeddings', 'LLM Cache'].map((db, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-[#0c0f2366] rounded-xl border border-[#6c47ff1a]">
                        <div className="w-10 h-10 rounded-lg bg-[#6c47ff1a] flex items-center justify-center text-[#FF4499]">
                          {i === 0 ? <VectorSquare size={18} /> : <Activity size={18} />}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold">{db}</div>
                          <div className="text-[10px] text-gray-500">{i === 0 ? 'VectorDB Storage' : 'Key-Value Store'}</div>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-[#00FFB3] shadow-[0_0_8px_#00FFB3] animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Database Health Card */}
          <div className="bg-[#0c0f23b3] backdrop-blur-xl rounded-3xl border border-[#6c47ff26] overflow-hidden shadow-[0_20px_60px_rgba(3,4,16,0.4)]">
            <div className="p-6 border-b border-[#6c47ff1a] bg-[#0c0f2380] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6c47ff26] flex items-center justify-center text-[#6C47FF]">
                  <HeartPulse size={20} />
                </div>
                <span className="text-lg font-semibold">Database Health</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#6c47ff26] text-xs font-medium text-gray-300">Real-time</span>
            </div>
            <div className="p-8 flex flex-col items-center">
              <div className="relative w-56 h-28 overflow-hidden rounded-t-full bg-[#0c0f2366] border border-[#6c47ff33]">
                <div 
                  className="absolute bottom-0 left-0 w-full h-56 rounded-full transition-transform duration-1000 ease-out"
                  style={{ 
                    background: 'conic-gradient(#FF4C6F 0%, #FFE14C 30%, #00FFB3 60%, #FFE14C 80%, #FF4C6F 100%)',
                    transform: `rotate(${(health / 100) * 180 - 90}deg)`,
                    transformOrigin: 'center bottom'
                  }}
                ></div>
                <div className="absolute bottom-[-90px] left-5 w-44 h-44 rounded-full bg-[#030410] shadow-inner"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                <div className="absolute top-[75px] left-0 w-full text-center text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(0,255,179,0.5)]">
                  {Math.round(health)}%
                </div>
              </div>
              <div className="mt-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Overall System Health</div>
              
              <div className="mt-8 w-full p-4 rounded-2xl bg-[#00FFB30d] border border-[#00FFB333] flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#00FFB31a] text-[#00FFB3] flex items-center justify-center border border-[#00FFB34d]">
                  <CheckCircle size={24} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#00FFB3]">All Systems Operational</div>
                  <div className="text-[10px] text-gray-400">All database connections are active and responding normally.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {/* Database Systems Card */}
          <div className="bg-[#0c0f23b3] backdrop-blur-xl rounded-3xl border border-[#6c47ff26] overflow-hidden shadow-[0_20px_60px_rgba(3,4,16,0.4)]">
            <div className="p-6 border-b border-[#6c47ff1a] bg-[#0c0f2380] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6c47ff26] flex items-center justify-center text-[#6C47FF]">
                  <Server size={20} />
                </div>
                <span className="text-lg font-semibold">Database Systems</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#6c47ff26] text-xs font-medium text-gray-300">5 Systems</span>
            </div>
            
            <div className="p-6 space-y-6">
              {[
                { name: 'IndexedDB', type: 'Browser Storage Engine', color: '#6C47FF', records: '48,291', size: '12.4 MB', perf: 95 },
                { name: 'SQL.js', type: 'In-Memory SQL Database', color: '#00E3FF', records: '32,178', size: '8.7 MB', perf: 87 },
                { name: 'Vector Database', type: 'Embeddings Storage', color: '#47FFBE', records: '15,621', size: '1,536 Dims', perf: 92 }
              ].map((sys, i) => (
                <div key={i} className="p-6 rounded-2xl bg-[#0c0f234d] border border-[#6c47ff1a] relative overflow-hidden group hover:bg-[#0c0f2380] transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 transition-all group-hover:h-1.5" style={{ backgroundColor: sys.color }}></div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{sys.name}</h3>
                      <div className="text-xs text-gray-500">{sys.type}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#00FFB31a] border border-[#00FFB34d] flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00FFB3] shadow-[0_0_10px_#00FFB3]"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-[#0c0f2366] border border-[#6c47ff0d]">
                      <div className="text-[10px] text-gray-500 mb-1 uppercase font-bold">Records</div>
                      <div className="text-sm font-bold">{sys.records}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0c0f2366] border border-[#6c47ff0d]">
                      <div className="text-[10px] text-gray-500 mb-1 uppercase font-bold">Storage</div>
                      <div className="text-sm font-bold">{sys.size}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0c0f2366] border border-[#6c47ff0d]">
                      <div className="text-[10px] text-gray-500 mb-1 uppercase font-bold">Tables</div>
                      <div className="text-sm font-bold">{i === 0 ? '8' : i === 1 ? '12' : '3'}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0c0f2366] border border-[#6c47ff0d]">
                      <div className="text-[10px] text-gray-500 mb-1 uppercase font-bold">Performance</div>
                      <div className="text-sm font-bold">{sys.perf}%</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                      <span>Performance</span>
                      <span>{sys.perf}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#0c0f23] overflow-hidden">
                      <div className="h-full transition-all duration-1000" style={{ width: `${sys.perf}%`, backgroundColor: sys.color }}></div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                {[
                  { label: 'Queries Per Hour', val: '42,897' },
                  { label: 'Active Systems', val: '5' },
                  { label: 'Uptime', val: '98.7%' }
                ].map((stat, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-[#0c0f234d] border border-[#6c47ff1a] text-center relative overflow-hidden group hover:bg-[#0c0f2380] transition-all">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6C47FF] to-[#00E3FF]"></div>
                    <div className="text-3xl font-black mb-2 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">{stat.val}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Data Explorer Card */}
          <div className="bg-[#0c0f23b3] backdrop-blur-xl rounded-3xl border border-[#6c47ff26] overflow-hidden shadow-[0_20px_60px_rgba(3,4,16,0.4)]">
            <div className="p-6 border-b border-[#6c47ff1a] bg-[#0c0f2380] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6c47ff26] flex items-center justify-center text-[#6C47FF]">
                  <Table size={20} />
                </div>
                <span className="text-lg font-semibold">Data Explorer</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#6c47ff26] text-xs font-medium text-gray-300">Agent Lee System</span>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Database Structure</h3>
                  <div className="space-y-3">
                    <div className="rounded-xl border border-[#6c47ff4d] bg-[#6c47ff1a] overflow-hidden">
                      <div className="p-3 bg-[#6c47ff1a] flex justify-between items-center border-b border-[#6c47ff1a]">
                        <span className="text-sm font-bold">agent_states</span>
                        <span className="text-[10px] bg-[#6c47ff33] px-2 py-0.5 rounded-full text-[#8F75FF]">12 fields</span>
                      </div>
                      <div className="p-2 space-y-1">
                        {[
                          { name: 'id', type: 'string' },
                          { name: 'agent_name', type: 'string' },
                          { name: 'status', type: 'enum' },
                          { name: 'last_active', type: 'timestamp' }
                        ].map((f, i) => (
                          <div key={i} className="flex justify-between items-center p-2 hover:bg-[#6c47ff0d] rounded-lg transition-colors">
                            <span className="font-mono text-xs text-[#8F75FF]">{f.name}</span>
                            <span className="text-[10px] text-gray-500 bg-[#0c0f2366] px-2 py-0.5 rounded-full border border-[#6c47ff1a]">{f.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {['tasks', 'memory_cache'].map((table, i) => (
                      <div key={i} className="p-3 rounded-xl border border-[#6c47ff1a] bg-[#0c0f2333] flex justify-between items-center hover:border-[#6c47ff4d] cursor-pointer transition-all">
                        <span className="text-sm font-bold text-gray-400">{table}</span>
                        <span className="text-[10px] text-gray-600 font-bold uppercase">{i === 0 ? '8' : '5'} fields</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Data Preview</h3>
                  <div className="rounded-xl border border-[#6c47ff1a] bg-[#0c0f2333] overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#6c47ff1a] text-[#8F75FF]">
                        <tr>
                          <th className="p-3 font-bold">id</th>
                          <th className="p-3 font-bold">agent_name</th>
                          <th className="p-3 font-bold">status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#6c47ff0d]">
                        {[
                          { id: 'ag_001', name: 'Lily', status: 'active' },
                          { id: 'ag_002', name: 'Gabriel', status: 'active' },
                          { id: 'ag_003', name: 'Adam', status: 'idle' },
                          { id: 'ag_004', name: 'Avery', status: 'active' },
                          { id: 'ag_005', name: 'Emma', status: 'active' }
                        ].map((row, i) => (
                          <tr key={i} className="hover:bg-[#6c47ff0d] transition-colors">
                            <td className="p-3 font-mono text-gray-400">{row.id}</td>
                            <td className="p-3 font-bold">{row.name}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${row.status === 'active' ? 'bg-[#00FFB31a] text-[#00FFB3]' : 'bg-gray-800 text-gray-500'}`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
