import React from 'react';
import { Code, Copy, Download, Play, Save, Terminal, FileCode } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface CodeStudioProps {
  code: string | null;
  onSave: () => void;
  onCopy: () => void;
  onDownload: () => void;
}

export const CodeStudio: React.FC<CodeStudioProps> = ({
  code,
  onSave,
  onCopy,
  onDownload
}) => {
  return (
    <div className="h-full flex flex-col p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-end justify-between">
        <div className="space-y-4">
          <h2 className="text-4xl font-black tracking-tighter">Code <span className="text-primary">Studio</span></h2>
          <p className="text-muted-foreground text-sm font-medium">Direct access to Agent Lee's neural output and Three.js geometry.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
            onClick={onCopy}
            className="flex items-center gap-2 px-6 py-3 bg-black/5 hover:bg-black/10 rounded-2xl transition-all text-xs font-bold uppercase tracking-widest"
           >
              <Copy className="w-4 h-4" /> Copy
           </button>
           <button 
            onClick={onDownload}
            className="flex items-center gap-2 px-6 py-3 bg-black/5 hover:bg-black/10 rounded-2xl transition-all text-xs font-bold uppercase tracking-widest"
           >
              <Download className="w-4 h-4" /> Export
           </button>
           <button 
            onClick={onSave}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-white hover:opacity-90 rounded-2xl transition-all text-xs font-bold uppercase tracking-widest shadow-xl shadow-primary/20"
           >
              <Save className="w-4 h-4" /> Save to Lake
           </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
        <div className="lg:col-span-2 flex flex-col bg-black rounded-[40px] overflow-hidden shadow-2xl shadow-black/20 border border-white/10">
           <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                 </div>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                    <FileCode className="w-3 h-3" /> manifestation.js
                 </span>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/30">
                 <span>UTF-8</span>
                 <span>JavaScript</span>
              </div>
           </div>
           
           <div className="flex-1 overflow-auto p-8 font-mono text-sm text-white/80 leading-relaxed selection:bg-primary/40 custom-scrollbar">
              {code ? (
                <pre className="whitespace-pre-wrap">
                  <code>{code}</code>
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-4">
                   <Terminal className="w-16 h-16 opacity-10" />
                   <p className="text-sm font-bold uppercase tracking-widest">No code generated yet.</p>
                </div>
              )}
           </div>
        </div>

        <div className="space-y-8 overflow-auto pr-2 custom-scrollbar">
           <div className="p-8 bg-white border border-black/5 rounded-[40px] space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-3">
                 <Play className="w-6 h-6 text-primary" />
                 Live Preview
              </h3>
              <div className="aspect-square bg-black/5 rounded-3xl overflow-hidden border border-black/5 relative group">
                 {code ? (
                    <iframe 
                      srcDoc={code} 
                      className="w-full h-full border-none pointer-events-none"
                      title="Preview"
                    />
                 ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                       <Code className="w-12 h-12" />
                    </div>
                 )}
              </div>
           </div>

           <div className="p-8 bg-white border border-black/5 rounded-[40px] space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-3">
                 <Terminal className="w-6 h-6 text-primary" />
                 Console
              </h3>
              <div className="space-y-4">
                 {[
                   { type: 'info', msg: 'Neural core initialized.', time: '10:42:01' },
                   { type: 'success', msg: 'Voxel geometry compiled successfully.', time: '10:42:05' },
                   { type: 'warn', msg: 'Memory usage approaching threshold.', time: '10:42:10' },
                 ].map((log, i) => (
                   <div key={i} className="flex items-start gap-3 text-[10px] font-mono">
                      <span className="text-muted-foreground">[{log.time}]</span>
                      <span className={cn(
                        "uppercase font-bold",
                        log.type === 'info' ? "text-blue-500" : log.type === 'success' ? "text-green-500" : "text-yellow-500"
                      )}>{log.type}:</span>
                      <span className="text-muted-foreground">{log.msg}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
