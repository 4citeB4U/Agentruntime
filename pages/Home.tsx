import React from 'react';
import { AgentLee } from '../components/AgentLee';
import { ChatInterface } from '../components/ChatInterface';
import { motion } from 'framer-motion';

interface HomeProps {
  voxelCode: string | null;
  savedVoxels: any[];
  isSpeaking: boolean;
  isChangingForm: boolean;
  onSendMessage: (msg: string) => void;
  onFileUpload: (file: File) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const Home: React.FC<HomeProps> = ({
  voxelCode,
  savedVoxels,
  isSpeaking,
  isChangingForm,
  onSendMessage,
  onFileUpload,
  onGenerate,
  isGenerating
}) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full h-full flex flex-col items-center justify-center z-10"
      >
        <div className="w-full h-full relative flex items-center justify-center">
          <AgentLee 
            voxelCode={voxelCode}
            savedVoxels={savedVoxels}
            isSpeaking={isSpeaking}
            isChangingForm={isChangingForm}
            size="large"
            className="w-full h-full max-w-none"
          />
        </div>
      </motion.div>
    </div>
  );
};
