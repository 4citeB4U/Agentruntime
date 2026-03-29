import React, { useState } from 'react';
import { Home, Activity, Settings, Rocket, Database, Code, Menu, X, ChevronUp, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { AgentLee } from './AgentLee';
import { ChatInterface } from './ChatInterface';
import { AgentVM, VMStatus } from './AgentVM';

export type PageId = 'home' | 'diagnostics' | 'settings' | 'deployment' | 'memory' | 'code';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: PageId;
  onPageChange: (page: PageId) => void;
  voxelCode: string | null;
  isSpeaking?: boolean;
  isChangingForm?: boolean;
  onSendMessage: (msg: string) => void;
  onFileUpload: (file: File) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  vmStatus: VMStatus;
  vmTask?: string;
  isVMVisible: boolean;
  onCloseVM: () => void;
  savedVoxels: any[];
  onSaveToLake: () => void;
  onSelectFromLake: (voxel: any) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentPage,
  onPageChange,
  voxelCode,
  isSpeaking = false,
  isChangingForm = false,
  onSendMessage,
  onFileUpload,
  onGenerate,
  isGenerating = false,
  vmStatus,
  vmTask,
  isVMVisible,
  onCloseVM,
  savedVoxels,
  onSaveToLake,
  onSelectFromLake
}) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isWidgetMode, setIsWidgetMode] = useState(false);
  const [isQuickSelectOpen, setIsQuickSelectOpen] = useState(false);

  const navItems: { id: PageId; label: string; icon: any }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'diagnostics', label: 'Diagnostics', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'deployment', label: 'Deployment', icon: Rocket },
    { id: 'memory', label: 'Memory Lake', icon: Database },
    { id: 'code', label: 'Code Studio', icon: Code },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-black font-sans selection:bg-primary/20 flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-xl shadow-black/10">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Agent Lee <span className="text-primary font-mono text-xs ml-1 opacity-50 uppercase">Voxel OS v1.0</span></h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-none">System Status: Optimal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick Select Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsQuickSelectOpen(!isQuickSelectOpen)}
              className="px-4 py-2 bg-black/5 hover:bg-black/10 rounded-xl transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
            >
              <Database className="w-4 h-4" />
              Engine Library
              <ChevronDown className={cn("w-3 h-3 transition-transform", isQuickSelectOpen && "rotate-180")} />
            </button>
            
            <AnimatePresence>
              {isQuickSelectOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-64 bg-white border border-black/10 rounded-2xl shadow-2xl z-[100] overflow-hidden"
                >
                  <div className="p-4 border-b border-black/5 bg-black/5">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-50">Saved Manifestations</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {savedVoxels.length === 0 ? (
                      <div className="p-4 text-center text-[10px] text-muted-foreground uppercase tracking-widest">No shapes saved</div>
                    ) : (
                      savedVoxels.map((voxel) => (
                        <button
                          key={voxel.id}
                          onClick={() => {
                            onSelectFromLake(voxel);
                            setIsQuickSelectOpen(false);
                          }}
                          className="w-full flex items-center gap-3 p-2 hover:bg-black/5 rounded-xl transition-all text-left group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-black/10 overflow-hidden flex-shrink-0">
                            <img src={voxel.image} alt={voxel.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{voxel.name}</p>
                            <p className="text-[9px] text-muted-foreground uppercase">{voxel.date}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-black/5">
                    <button 
                      onClick={() => {
                        onPageChange('memory');
                        setIsQuickSelectOpen(false);
                      }}
                      className="w-full py-2 text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 rounded-lg transition-all"
                    >
                      View All in Memory Lake
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => setIsWidgetMode(!isWidgetMode)}
            className="p-3 hover:bg-black/5 rounded-2xl transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
          >
            {isWidgetMode ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            {isWidgetMode ? 'Full View' : 'Widget Mode'}
          </button>
          <button 
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="p-3 hover:bg-black/5 rounded-2xl transition-all md:hidden"
          >
            {isNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center pb-64">
          {children}
        </div>
      </main>

      {/* Agent VM Floating Card */}
      <AgentVM 
        status={vmStatus}
        task={vmTask}
        isVisible={isVMVisible}
        onClose={onCloseVM}
      />

      {/* Unified Console (Chat + Nav) */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 flex flex-col items-center pointer-events-none",
        isWidgetMode ? "p-4" : "p-8"
      )}>
        <div className={cn(
          "max-w-4xl w-full flex flex-col gap-4 pointer-events-auto transition-all duration-500",
          isWidgetMode && "max-w-xs"
        )}>
          
          {/* Integrated Console Unit */}
          <div className={cn(
            "bg-white/95 backdrop-blur-3xl border border-black/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-500",
            isWidgetMode ? "rounded-[32px]" : "rounded-[48px]"
          )}>
            {/* Chat Interface - Hidden in widget mode if desired, or kept for functionality */}
            <ChatInterface 
              onSendMessage={onSendMessage}
              onFileUpload={onFileUpload}
              onGenerate={onGenerate}
              isGenerating={isGenerating}
              onSave={onSaveToLake}
              hasVoxel={!!voxelCode}
              className={cn("bg-transparent border-none shadow-none p-4", isWidgetMode && "hidden")}
            />

            {/* Navigation Dock (Integrated) */}
            <nav className={cn(
              "border-t border-black/5 p-2 flex items-center justify-between bg-black/5",
              isWidgetMode && "border-none"
            )}>
              <div className="flex items-center gap-1">
                {/* Minimized Agent Lee - Only next to Home button on other pages OR in Widget Mode */}
                <AnimatePresence>
                  {(currentPage !== 'home' || isWidgetMode) && (
                    <motion.div 
                      initial={{ width: 0, opacity: 0, scale: 0.5 }}
                      animate={{ width: 'auto', opacity: 1, scale: 1 }}
                      exit={{ width: 0, opacity: 0, scale: 0.5 }}
                      className="relative group px-2 overflow-hidden"
                    >
                      <AgentLee 
                        voxelCode={voxelCode}
                        isSpeaking={isSpeaking}
                        isChangingForm={isChangingForm}
                        size="small"
                        className="w-12 h-12 shadow-xl border-white/50 backdrop-blur-xl bg-white/30"
                      />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isWidgetMode && navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onPageChange(item.id);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all relative group",
                        isActive ? "text-primary bg-white shadow-sm" : "text-muted-foreground hover:text-black hover:bg-white/50"
                      )}
                    >
                      <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "animate-pulse")} />
                      <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-active"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                        />
                      )}
                    </button>
                  );
                })}

                {isWidgetMode && (
                  <button
                    onClick={() => setIsWidgetMode(false)}
                    className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all text-primary bg-white shadow-sm"
                  >
                    <Maximize2 className="w-5 h-5" />
                    <span className="text-[9px] font-bold uppercase tracking-tighter">Expand</span>
                  </button>
                )}
              </div>
              
              {!isWidgetMode && (
                <div className="px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-30 hidden md:block">
                   {/* Console text removed as per user request to remove overlays */}
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isNavOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] md:hidden"
            onClick={() => setIsNavOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 bottom-0 w-64 bg-white p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onPageChange(item.id);
                      setIsNavOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl transition-all",
                      currentPage === item.id ? "bg-primary/10 text-primary" : "hover:bg-black/5"
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
