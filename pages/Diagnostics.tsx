import React from 'react';
import { Activity, Cpu, HardDrive, Network, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const Diagnostics: React.FC = () => {
  const stats = [
    { label: 'Neural Core', value: '98.4%', icon: Cpu, color: 'text-blue-500' },
    { label: 'Voxel Buffer', value: '2.4 GB', icon: HardDrive, color: 'text-purple-500' },
    { label: 'Sync Latency', value: '12ms', icon: Zap, color: 'text-yellow-500' },
    { label: 'Network Integrity', value: 'Secured', icon: ShieldCheck, color: 'text-green-500' },
  ];

  return (
    <div className="p-12 max-w-6xl mx-auto space-y-12">
      <div className="space-y-4">
        <h2 className="text-4xl font-black tracking-tighter">System <span className="text-primary">Diagnostics</span></h2>
        <p className="text-muted-foreground text-sm font-medium">Real-time monitoring of Agent Lee's neural and physical infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-white border border-black/5 rounded-3xl shadow-xl shadow-black/5 group hover:border-primary/20 transition-all"
          >
            <div className={stat.color}>
              <stat.icon className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-2xl font-black tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-8 bg-black text-white rounded-[40px] space-y-6">
           <h3 className="text-xl font-bold flex items-center gap-3">
              <Activity className="w-6 h-6 text-primary" />
              Neural Waveform
           </h3>
           <div className="h-48 flex items-end gap-1">
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [20, Math.random() * 100 + 20, 20] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}
                  className="flex-1 bg-primary/40 rounded-full"
                />
              ))}
           </div>
           <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-50">
              <span>0ms</span>
              <span>Processing Load</span>
              <span>1000ms</span>
           </div>
        </div>

        <div className="p-8 bg-white border border-black/5 rounded-[40px] space-y-6">
           <h3 className="text-xl font-bold flex items-center gap-3">
              <Network className="w-6 h-6 text-primary" />
              Voxel Distribution
           </h3>
           <div className="space-y-4">
              {['Geometry', 'Textures', 'Lighting', 'Physics'].map((item, i) => (
                <div key={item} className="space-y-2">
                   <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span>{item}</span>
                      <span>{Math.floor(Math.random() * 40 + 60)}%</span>
                   </div>
                   <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.floor(Math.random() * 40 + 60)}%` }}
                        transition={{ duration: 1, delay: i * 0.2 }}
                        className="h-full bg-primary"
                      />
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
