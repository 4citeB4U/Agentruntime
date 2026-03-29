import React from 'react';
import { Settings as SettingsIcon, User, Shield, Bell, Globe, Moon, Palette, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';

export const Settings: React.FC = () => {
  const sections = [
    { label: 'Profile', icon: User, color: 'text-blue-500', desc: 'Manage Agent Lee identity and persona.' },
    { label: 'Security', icon: Shield, color: 'text-green-500', desc: 'Neural encryption and access control.' },
    { label: 'Notifications', icon: Bell, color: 'text-yellow-500', desc: 'System alerts and manifestation updates.' },
    { label: 'Interface', icon: Palette, color: 'text-purple-500', desc: 'Visual theme and layout configuration.' },
    { label: 'Network', icon: Globe, color: 'text-cyan-500', desc: 'Offline mode and Raspberry Pi optimization.' },
    { label: 'Advanced', icon: Sliders, color: 'text-red-500', desc: 'LLM parameters and voxel engine tuning.' },
  ];

  return (
    <div className="p-12 max-w-6xl mx-auto space-y-12">
      <div className="space-y-4">
        <h2 className="text-4xl font-black tracking-tighter">System <span className="text-primary">Settings</span></h2>
        <p className="text-muted-foreground text-sm font-medium">Configure the core parameters of Agent Lee Voxel OS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sections.map((section, i) => (
          <motion.div
            key={section.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-white border border-black/5 rounded-[40px] shadow-xl shadow-black/5 group hover:border-primary/20 transition-all cursor-pointer"
          >
            <div className={section.color}>
              <section.icon className="w-8 h-8 mb-6 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-xl font-bold mb-2">{section.label}</h3>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">{section.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="p-12 bg-black text-white rounded-[40px] space-y-12">
         <div className="space-y-4">
            <h3 className="text-2xl font-bold">Voxel Interaction Controls</h3>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/5 px-6 py-4 rounded-3xl">
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Live Interaction Active
               </div>
               <div className="w-px h-6 bg-white/10" />
               <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
                  <span className="cursor-pointer hover:text-primary transition-colors">Orbit</span>
                  <span className="cursor-pointer hover:text-primary transition-colors">Pan</span>
                  <span className="cursor-pointer hover:text-primary transition-colors">Zoom</span>
               </div>
            </div>
         </div>

         <div className="h-px bg-white/10" />

         <div className="flex items-center justify-between">
            <div className="space-y-2">
               <h3 className="text-2xl font-bold">Offline Mode</h3>
               <p className="text-sm text-white/50 font-medium">Enable local-first processing for Raspberry Pi deployment.</p>
            </div>
            <div className="w-16 h-8 bg-primary rounded-full relative p-1 cursor-pointer">
               <div className="w-6 h-6 bg-white rounded-full absolute right-1" />
            </div>
         </div>
         
         <div className="h-px bg-white/10" />
         
         <div className="flex items-center justify-between">
            <div className="space-y-2">
               <h3 className="text-2xl font-bold">Voxel Optimization</h3>
               <p className="text-sm text-white/50 font-medium">Reduce polygon count for low-power hardware.</p>
            </div>
            <div className="w-16 h-8 bg-white/10 rounded-full relative p-1 cursor-pointer">
               <div className="w-6 h-6 bg-white rounded-full absolute left-1" />
            </div>
         </div>
      </div>
    </div>
  );
};
