import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, X } from 'lucide-react';

interface SaveRecordingModalProps {
  audioBlob: Blob;
  duration: number;
  onClose: () => void;
  onSaved: () => void;
}

const SaveRecordingModal: React.FC<SaveRecordingModalProps> = ({ 
  audioBlob, 
  duration, 
  onClose,
  onSaved
}) => {
  const [title, setTitle] = useState(`Recording ${new Date().toLocaleString()}`);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { saveRecording } = useAuth();
  
  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a title for your recording');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      await saveRecording(title, audioBlob, duration);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recording');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-xl p-6 border border-purple-500/30 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Save Recording</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-white/90">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <label htmlFor="recording-title" className="block text-white/80 mb-2 font-medium">
            Recording Title
          </label>
          <input
            id="recording-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-black/30 border border-purple-500/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            placeholder="Enter a title for your recording"
          />
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg bg-black/30 text-white/80 hover:bg-black/40 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex-1 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
              isSaving ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white/90 rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Recording</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveRecordingModal;