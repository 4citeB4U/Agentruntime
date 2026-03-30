import React, { useState, useEffect } from 'react';
import {
  Database,
  FileText,
  Image as ImageIcon,
  Search,
  Trash2,
  ExternalLink,
  FolderOpen,
  RefreshCw,
  HardDrive,
  Smartphone,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

// ---------------------------------------------------------------------------
// Android file-system bridge (Capacitor Filesystem API)
// Falls back gracefully when running in a browser / without Capacitor.
// ---------------------------------------------------------------------------

interface FsEntry {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  uri?: string;
}

async function listDirectory(path: string): Promise<FsEntry[]> {
  try {
    // Dynamic import so the web build never hard-fails when Capacitor is absent.
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const result = await Filesystem.readdir({
      path,
      directory: Directory.ExternalStorage,
    });
    return result.files.map((f) => ({
      name: typeof f === 'string' ? f : f.name,
      type: (typeof f === 'object' && (f as any).type === 'directory') ? 'directory' : 'file',
      size: typeof f === 'object' ? (f as any).size : undefined,
      uri: typeof f === 'object' ? (f as any).uri : undefined,
    })) as FsEntry[];
  } catch {
    // Not on Android / Capacitor not installed → return empty list
    return [];
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MemoryLake: React.FC<MemoryLakeProps> = ({
  savedVoxels,
  onSelect,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'voxels' | 'filesystem'>('voxels');

  // File-system state
  const [fsPath, setFsPath] = useState('/');
  const [fsHistory, setFsHistory] = useState<string[]>([]);
  const [fsEntries, setFsEntries] = useState<FsEntry[]>([]);
  const [fsLoading, setFsLoading] = useState(false);
  const [fsError, setFsError] = useState<string | null>(null);
  const [isAndroid, setIsAndroid] = useState(false);

  // Detect Android / Capacitor
  useEffect(() => {
    import('@capacitor/core')
      .then(({ Capacitor }) => {
        setIsAndroid(Capacitor.getPlatform() === 'android');
      })
      .catch(() => setIsAndroid(false));
  }, []);

  const loadDirectory = async (path: string) => {
    setFsLoading(true);
    setFsError(null);
    try {
      const entries = await listDirectory(path);
      setFsEntries(entries);
    } catch {
      setFsError('Unable to read directory — check storage permissions.');
      setFsEntries([]);
    }
    setFsLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'filesystem') loadDirectory(fsPath);
  }, [activeTab, fsPath]);

  const navigateTo = (name: string) => {
    const newPath = fsPath === '/' ? `/${name}` : `${fsPath}/${name}`;
    setFsHistory(h => [...h, fsPath]);
    setFsPath(newPath);
  };

  const navigateBack = () => {
    const prev = fsHistory[fsHistory.length - 1] ?? '/';
    setFsHistory(h => h.slice(0, -1));
    setFsPath(prev);
  };

  const filtered = savedVoxels.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full bg-[#070d18] text-white overflow-hidden">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/30 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-[#39FF14] animate-pulse" />
          <div>
            <h2 className="text-sm font-black tracking-tight">
              Memory <span className="text-[#39FF14]">Lake</span>
            </h2>
            <p className="text-[9px] text-white/40 uppercase tracking-widest">
              Persistent Storage &amp; File System Echo
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('voxels')}
            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'voxels'
                ? 'bg-[#39FF14]/20 text-[#39FF14]'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <HardDrive className="w-3 h-3 inline mr-1" />
            Voxels
          </button>
          <button
            onClick={() => setActiveTab('filesystem')}
            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              activeTab === 'filesystem'
                ? 'bg-[#00f2ff]/20 text-[#00f2ff]'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            File System
            {isAndroid && (
              <span className="ml-1 px-1 bg-green-500/20 text-green-400 rounded text-[8px]">LIVE</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Voxels tab ────────────────────────────────────────────────── */}
      {activeTab === 'voxels' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search manifestations…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-5 py-3 text-sm font-medium placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#39FF14]/30 transition-all"
            />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white/5 rounded-[32px] border-2 border-dashed border-white/10">
                <Database className="w-14 h-14 text-white/10 mb-5" />
                <p className="text-base font-bold text-white/30">The Lake is empty.</p>
                <p className="text-xs text-white/20 mt-1">Generate a manifestation to begin.</p>
              </div>
            ) : (
              filtered.map((voxel, i) => (
                <motion.div
                  key={voxel.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="group relative bg-white/5 border border-white/10 rounded-[28px] overflow-hidden hover:border-[#39FF14]/30 hover:shadow-[0_0_30px_#39FF1410] transition-all"
                >
                  <div className="aspect-square relative overflow-hidden bg-black/20">
                    <img
                      src={voxel.image}
                      alt={voxel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                      <button
                        onClick={() => onSelect(voxel)}
                        className="p-3 bg-white/10 rounded-2xl hover:bg-[#39FF14]/20 hover:text-[#39FF14] transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(voxel.id)}
                        className="p-3 bg-white/10 rounded-2xl hover:bg-red-500/20 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold tracking-tight truncate flex-1">{voxel.name}</h4>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/20 ml-2">{voxel.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-white/30">
                      <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Image</span>
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Three.js</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── File System tab ───────────────────────────────────────────── */}
      {activeTab === 'filesystem' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-white/10 bg-black/20 shrink-0">
            <button
              onClick={navigateBack}
              disabled={fsHistory.length === 0}
              className="p-1.5 rounded-lg bg-white/5 disabled:opacity-30 hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 bg-white/5 rounded-xl px-3 py-1.5 text-xs font-mono text-white/60 truncate">
              {fsPath}
            </div>
            <button
              onClick={() => loadDirectory(fsPath)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Android notice */}
          {!isAndroid && (
            <div className="mx-6 mt-4 p-4 bg-[#00f2ff]/10 border border-[#00f2ff]/20 rounded-2xl text-xs text-[#00f2ff]/80 leading-relaxed shrink-0">
              <Smartphone className="w-4 h-4 inline mr-2" />
              <strong>File System Echo</strong> is active on Android devices. When the app runs on-device, this panel mirrors the device's real file system via the Capacitor Filesystem API, replacing the built-in file explorer.
              <br />
              <span className="text-white/30 text-[10px]">Running in browser mode — live directory listing unavailable.</span>
            </div>
          )}

          {/* Directory listing */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
            {fsLoading && (
              <div className="flex items-center gap-3 text-white/40 text-xs py-8 justify-center">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Reading directory…
              </div>
            )}
            {fsError && (
              <div className="text-red-400 text-xs bg-red-500/10 rounded-xl p-4">{fsError}</div>
            )}
            {!fsLoading && !fsError && fsEntries.length === 0 && isAndroid && (
              <div className="text-white/20 text-xs text-center py-12">Directory is empty.</div>
            )}
            <AnimatePresence>
              {fsEntries.map((entry, i) => (
                <motion.button
                  key={entry.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => {
                    if (entry.type === 'directory') navigateTo(entry.name);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-left group"
                >
                  {entry.type === 'directory' ? (
                    <FolderOpen className="w-5 h-5 text-[#f7d31b] shrink-0" />
                  ) : (
                    <FileText className="w-5 h-5 text-white/30 shrink-0" />
                  )}
                  <span className="flex-1 text-xs font-medium truncate">{entry.name}</span>
                  {entry.size !== undefined && (
                    <span className="text-[9px] text-white/20 font-mono">
                      {(entry.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                  {entry.type === 'directory' && (
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
