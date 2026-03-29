import React from 'react';
import { Database, FileText, Image as ImageIcon, Search, Trash2, Download, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface SavedVoxel {
  id: string;
  name: string;
  image: string;
  code: string;
  date: string;
}

interface MemoryLakeProps {
  savedVoxels: SavedVoxel[];
  onSelect: (voxel: SavedVoxel) => void;
  onDelete: (id: string) => void;
}

export const MemoryLake: React.FC<MemoryLakeProps> = ({
  savedVoxels,
  onSelect,
  onDelete
}) => {
  return (
    <div className="p-12 max-w-7xl mx-auto space-y-12">
      <div className="flex items-end justify-between">
        <div className="space-y-4">
          <h2 className="text-4xl font-black tracking-tighter">Memory <span className="text-primary">Lake</span></h2>
          <p className="text-muted-foreground text-sm font-medium">Persistent storage of Agent Lee's architectural manifestations.</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search manifestations..." 
            className="bg-black/5 border border-black/5 rounded-2xl pl-12 pr-6 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {savedVoxels.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 bg-black/5 rounded-[40px] border-2 border-dashed border-black/10">
             <Database className="w-16 h-16 text-muted-foreground mb-6 opacity-20" />
             <p className="text-xl font-bold text-muted-foreground">The Lake is empty.</p>
             <p className="text-sm text-muted-foreground opacity-50">Generate or upload a manifestation to begin.</p>
          </div>
        ) : (
          savedVoxels.map((voxel, i) => (
            <motion.div
              key={voxel.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group relative bg-white border border-black/5 rounded-[32px] overflow-hidden shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-primary/10 transition-all"
            >
              <div className="aspect-square relative overflow-hidden bg-black/5">
                <img 
                  src={voxel.image} 
                  alt={voxel.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                   <button 
                    onClick={() => onSelect(voxel)}
                    className="p-3 bg-white rounded-2xl hover:bg-primary hover:text-white transition-all shadow-xl"
                   >
                      <ExternalLink className="w-5 h-5" />
                   </button>
                   <button 
                    onClick={() => onDelete(voxel.id)}
                    className="p-3 bg-white rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-xl"
                   >
                      <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              </div>
              
              <div className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                   <h4 className="font-bold tracking-tight truncate flex-1">{voxel.name}</h4>
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">{voxel.date}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                   <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Image</span>
                   <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Three.js</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
