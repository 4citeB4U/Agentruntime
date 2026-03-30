/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { generateImage, generateVoxelScene } from './services/localLlm';
import { extractHtmlFromText, zoomCamera } from './utils/html';
import { Layout, PageId } from './components/Layout';
import { Home } from './pages/Home';
import { Diagnostics } from './pages/Diagnostics';
import { Settings } from './pages/Settings';
import { Deployment } from './pages/Deployment';
import { MemoryLake } from './pages/MemoryLake';
import { CodeStudio } from './pages/CodeStudio';
import { VMStatus } from './components/AgentVM';

interface SavedVoxel {
  id: string;
  name: string;
  image: string;
  code: string;
  date: string;
}

const App: React.FC = () => {
  // Navigation State
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  
  // Voxel State
  const [voxelCode, setVoxelCode] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  
  // App Status
  const [status, setStatus] = useState<'idle' | 'generating' | 'error'>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isChangingForm, setIsChangingForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // VM State
  const [vmStatus, setVmStatus] = useState<VMStatus>('idle');
  const [vmTask, setVmTask] = useState<string>('');
  const [isVMVisible, setIsVMVisible] = useState(false);

  // Memory Lake State
  const [savedVoxels, setSavedVoxels] = useState<SavedVoxel[]>([]);

  // Load saved voxels from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('agent_lee_memory_lake');
    if (saved) {
      try {
        setSavedVoxels(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse Memory Lake", e);
      }
    }
  }, []);

  // Save voxels to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('agent_lee_memory_lake', JSON.stringify(savedVoxels));
  }, [savedVoxels]);

  const handleSendMessage = async (message: string) => {
    setCurrentPrompt(message);
    setIsSpeaking(true);
    
    // If the message is a command to generate, we can trigger it
    if (message.toLowerCase().includes('generate') || message.toLowerCase().includes('create')) {
      handleGenerate();
    } else {
      // Simulate Agent Lee "thinking" and responding
      setVmStatus('searching');
      setVmTask(`Analyzing: "${message}"`);
      // setIsVMVisible(true); // Hide VM by default
      
      setTimeout(() => {
        setIsSpeaking(false);
        setVmStatus('idle');
        // setIsVMVisible(false);
      }, 3000);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCurrentImage(result);
      handleVoxelize(result);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!currentPrompt) return;
    
    setStatus('generating');
    setErrorMsg('');
    setIsChangingForm(true);
    setVmStatus('searching');
    setVmTask(`Generating image for: ${currentPrompt}`);
    // setIsVMVisible(true); // Hide VM during generation

    try {
      const imageUrl = await generateImage(currentPrompt);
      setCurrentImage(imageUrl);
      
      setVmStatus('coding');
      setVmTask('Translating image to Three.js voxel geometry...');
      
      await handleVoxelize(imageUrl);
    } catch (err: any) {
      setErrorMsg(err.message || "Generation failed.");
      setStatus('error');
      setIsChangingForm(false);
      setVmStatus('idle');
      setIsVMVisible(false);
    }
  };

  const triggerDismantle = () => {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'DISMANTLE' }, '*');
      }
    });
  };

  const handleVoxelize = async (image: string) => {
    setStatus('generating');
    
    try {
      const rawCode = await generateVoxelScene(image);
      let optimizedCode = rawCode;
      try {
        optimizedCode = zoomCamera(rawCode, 0.7);
      } catch (e) {
        console.error("Zoom camera failed", e);
      }
      
      // Trigger dismantle on current form
      triggerDismantle();

      // Wait for the dismantle animation to play out before switching code
      setTimeout(() => {
        setVoxelCode(optimizedCode);
        setStatus('idle');
        setVmStatus('idle');
        setIsVMVisible(false);
      }, 2500); // 2.5 seconds for the "break apart" effect
    } catch (err: any) {
      setErrorMsg(err.message || "Voxelization failed.");
      setStatus('error');
      setVmStatus('idle');
      setIsVMVisible(false);
    }
  };

  const handleSaveToLake = () => {
    if (!voxelCode || !currentImage) return;
    
    setVmStatus('planning');
    setVmTask('Saving manifestation to Memory Lake...');
    // setIsVMVisible(true);

    const newVoxel: SavedVoxel = {
      id: Date.now().toString(),
      name: currentPrompt || "Untitled Manifestation",
      image: currentImage,
      code: voxelCode,
      date: new Date().toLocaleDateString()
    };
    
    setTimeout(() => {
      setSavedVoxels(prev => [newVoxel, ...prev]);
      setVmStatus('idle');
      // setIsVMVisible(false);
      alert("Manifestation saved to Memory Lake.");
    }, 1500);
  };

  const handleDeleteFromLake = (id: string) => {
    setSavedVoxels(prev => prev.filter(v => v.id !== id));
  };

  const handleSelectFromLake = (voxel: SavedVoxel) => {
    setVmStatus('planning');
    setVmTask(`Retrieving: ${voxel.name}`);
    // setIsVMVisible(true);

    // Trigger dismantle on current form
    triggerDismantle();

    setTimeout(() => {
      setVoxelCode(voxel.code);
      setCurrentImage(voxel.image);
      setCurrentPrompt(voxel.name);
      
      setVmStatus('idle');
      // setIsVMVisible(false);
      setCurrentPage('home');
    }, 2500); // 2.5 seconds for the "break apart" effect
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Home 
            voxelCode={voxelCode}
            savedVoxels={savedVoxels}
            isSpeaking={isSpeaking}
            isChangingForm={isChangingForm}
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            onGenerate={handleGenerate}
            isGenerating={status === 'generating'}
          />
        );
      case 'diagnostics':
        return <Diagnostics />;
      case 'settings':
        return <Settings />;
      case 'deployment':
        return <Deployment />;
      case 'memory':
        return (
          <MemoryLake 
            savedVoxels={savedVoxels}
            onSelect={handleSelectFromLake}
            onDelete={handleDeleteFromLake}
          />
        );
      case 'code':
        return (
          <CodeStudio 
            code={voxelCode}
            onSave={handleSaveToLake}
            onCopy={() => {
              if (voxelCode) {
                navigator.clipboard.writeText(voxelCode);
                alert("Code copied to clipboard.");
              }
            }}
            onDownload={() => {
              if (voxelCode) {
                const blob = new Blob([voxelCode], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'agent-lee-manifestation.html';
                a.click();
              }
            }}
          />
        );
      default:
        return <Home 
          voxelCode={voxelCode}
          savedVoxels={savedVoxels}
          isSpeaking={isSpeaking}
          isChangingForm={isChangingForm}
          onSendMessage={handleSendMessage}
          onFileUpload={handleFileUpload}
          onGenerate={handleGenerate}
          isGenerating={status === 'generating'}
        />;
    }
  };

  return (
    <Layout 
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      voxelCode={voxelCode}
      isSpeaking={isSpeaking}
      isChangingForm={isChangingForm}
      onSendMessage={handleSendMessage}
      onFileUpload={handleFileUpload}
      onGenerate={handleGenerate}
      isGenerating={status === 'generating'}
      vmStatus={vmStatus}
      vmTask={vmTask}
      isVMVisible={isVMVisible}
      onCloseVM={() => setIsVMVisible(false)}
      savedVoxels={savedVoxels}
      onSaveToLake={handleSaveToLake}
      onSelectFromLake={handleSelectFromLake}
    >
      {renderPage()}
      
      {/* Global Error Overlay */}
      {errorMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce">
          <span className="font-bold uppercase text-xs">System Error: {errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="p-1 hover:bg-white/20 rounded-full">
             <span className="sr-only">Dismiss</span>
             &times;
          </button>
        </div>
      )}
    </Layout>
  );
};

export default App;
