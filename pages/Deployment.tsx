import React from 'react';
import { Rocket, Server, Cloud, Cpu, Globe, Terminal, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Deployment: React.FC = () => {
  const steps = [
    { label: 'Neural Core Initialization', status: 'complete', time: '10:42:01' },
    { label: 'Voxel Engine Compilation', status: 'complete', time: '10:42:05' },
    { label: 'Raspberry Pi Target Sync', status: 'processing', time: '10:42:15' },
    { label: 'Offline Manifest Generation', status: 'pending', time: '--:--:--' },
  ];

  return (
    <div className="p-12 max-w-6xl mx-auto space-y-12">
      <div className="space-y-4">
        <h2 className="text-4xl font-black tracking-tighter">System <span className="text-primary">Deployment</span></h2>
        <p className="text-muted-foreground text-sm font-medium">Manifest Agent Lee onto physical or cloud infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="p-12 bg-white border border-black/5 rounded-[40px] shadow-xl shadow-black/5 space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-2xl font-bold flex items-center gap-3">
                    <Rocket className="w-8 h-8 text-primary" />
                    Deployment Pipeline
                 </h3>
                 <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-bold uppercase tracking-widest">
                    Active Session
                 </div>
              </div>

              <div className="space-y-6">
                 {steps.map((step, i) => (
                   <div key={step.label} className="flex items-center justify-between p-6 bg-black/5 rounded-3xl border border-black/5 group hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-4">
                         {step.status === 'complete' ? (
                           <CheckCircle2 className="w-6 h-6 text-green-500" />
                         ) : step.status === 'processing' ? (
                           <Loader2 className="w-6 h-6 text-primary animate-spin" />
                         ) : (
                           <div className="w-6 h-6 rounded-full border-2 border-dashed border-black/20" />
                         )}
                         <div>
                            <p className="font-bold text-sm tracking-tight">{step.label}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">{step.time}</p>
                         </div>
                      </div>
                      <div className="px-4 py-1 bg-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm">
                         {step.status}
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="p-12 bg-black text-white rounded-[40px] space-y-8">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                 <Terminal className="w-8 h-8 text-primary" />
                 Deployment Log
              </h3>
              <div className="font-mono text-xs text-white/50 space-y-2 max-h-48 overflow-auto custom-scrollbar">
                 <p>[10:42:01] Initializing deployment sequence...</p>
                 <p>[10:42:05] Neural core verified. Version: 1.0.0-alpha</p>
                 <p>[10:42:10] Target hardware detected: Raspberry Pi 5 (8GB)</p>
                 <p>[10:42:15] Syncing voxel manifestations to local storage...</p>
                 <p className="text-primary animate-pulse">[10:42:20] Processing geometry buffers...</p>
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="p-8 bg-white border border-black/5 rounded-[40px] space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-3">
                 <Server className="w-6 h-6 text-primary" />
                 Target Hardware
              </h3>
              <div className="space-y-4">
                 <div className="p-6 bg-black/5 rounded-3xl border-2 border-primary/50">
                    <div className="flex items-center gap-4 mb-4">
                       <Cpu className="w-8 h-8 text-primary" />
                       <div>
                          <p className="font-bold text-sm tracking-tight">Raspberry Pi 5</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Local Target</p>
                       </div>
                    </div>
                    <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                       <div className="h-full bg-primary w-3/4" />
                    </div>
                 </div>

                 <div className="p-6 bg-black/5 rounded-3xl border border-black/5 opacity-50 grayscale">
                    <div className="flex items-center gap-4 mb-4">
                       <Cloud className="w-8 h-8 text-muted-foreground" />
                       <div>
                          <p className="font-bold text-sm tracking-tight">Cloud Instance</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Remote Target</p>
                       </div>
                    </div>
                    <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                       <div className="h-full bg-black/10 w-0" />
                    </div>
                 </div>
              </div>
           </div>

           <div className="p-8 bg-white border border-black/5 rounded-[40px] space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-3">
                 <Globe className="w-6 h-6 text-primary" />
                 Global Sync
              </h3>
              <div className="text-center space-y-4">
                 <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
                    <Globe className="w-12 h-12 text-primary animate-spin-slow" />
                 </div>
                 <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Syncing to 4 nodes</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
