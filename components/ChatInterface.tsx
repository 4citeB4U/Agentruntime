import React, { useState, useRef } from 'react';
import { Send, Mic, Upload, Sparkles, Loader2, X, Database } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChatInterfaceProps {
  onSendMessage: (message: string) => void;
  onFileUpload: (file: File) => void;
  onGenerate: () => void;
  onSave?: () => void;
  hasVoxel?: boolean;
  isGenerating?: boolean;
  isListening?: boolean;
  className?: string;
  placeholder?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendMessage,
  onFileUpload,
  onGenerate,
  onSave,
  hasVoxel = false,
  isGenerating = false,
  isListening = false,
  className,
  placeholder = "Talk to Agent Lee..."
}) => {
  const [input, setInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto p-4", className)}>
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        {/* Save Button (Left) */}
        {hasVoxel && onSave && (
          <button
            type="button"
            onClick={onSave}
            className="bg-black/5 hover:bg-black/10 text-primary p-4 rounded-2xl transition-all shadow-sm flex items-center gap-2 group"
            title="Save to Engine Library"
          >
            <Database className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Save to Engine</span>
          </button>
        )}

        <div className="relative flex-1 group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-black/10 border border-primary/20 rounded-2xl px-6 py-4 pr-32 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-medium placeholder:text-muted-foreground"
          />
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-black/10 rounded-xl transition-colors text-muted-foreground hover:text-primary"
              title="Upload Image"
            >
              <Upload className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating || !input.trim()}
              className="p-2 hover:bg-black/10 rounded-xl transition-colors text-muted-foreground hover:text-primary disabled:opacity-50"
              title="Generate Voxel"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            </button>
            <button
              type="button"
              className={cn(
                "p-2 rounded-xl transition-all",
                isListening ? "bg-red-500/10 text-red-500 animate-pulse" : "hover:bg-black/10 text-muted-foreground hover:text-primary"
              )}
              title="Voice Input"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-primary text-primary-foreground p-4 rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          <Send className="w-5 h-5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </form>
    </div>
  );
};
