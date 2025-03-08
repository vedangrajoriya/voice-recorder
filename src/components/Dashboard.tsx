import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Mic, Trash2, Play, Pause, Save, Clock, Calendar, Search } from 'lucide-react';

interface DashboardProps {
  onStartRecording: () => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onStartRecording, onLogout }) => {
  const { user, recordings, deleteRecording } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<{[key: string]: HTMLAudioElement}>({});
  
  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Play recording
  const playRecording = (id: string, url: string) => {
    // Stop any currently playing audio
    if (currentlyPlaying && audioElements[currentlyPlaying]) {
      audioElements[currentlyPlaying].pause();
    }
    
    // If we're clicking the same recording that's playing, pause it
    if (currentlyPlaying === id) {
      setCurrentlyPlaying(null);
      return;
    }
    
    // Create or get audio element
    let audioElement = audioElements[id];
    if (!audioElement) {
      audioElement = new Audio(url);
      audioElement.addEventListener('ended', () => {
        setCurrentlyPlaying(null);
      });
      setAudioElements(prev => ({ ...prev, [id]: audioElement }));
    }
    
    // Play the audio
    audioElement.play();
    setCurrentlyPlaying(id);
  };
  
  // Filter recordings based on search term
  const filteredRecordings = recordings.filter(recording => 
    recording.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Sort recordings by date (newest first)
  const sortedRecordings = [...filteredRecordings].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            My Recordings
          </h2>
          <p className="text-white/70 mt-1">
            Welcome back, {user?.username}!
          </p>
        </div>
        
        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-lg bg-black/30 border border-white/10 text-white/80 hover:bg-black/40 transition-colors flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <button
          onClick={onStartRecording}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg flex items-center justify-center gap-2 flex-1"
        >
          <Mic className="w-5 h-5" />
          New Recording
        </button>
        
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search recordings..."
            className="w-full px-4 py-3 pl-10 rounded-lg bg-black/30 border border-purple-500/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
          />
          <Search className="w-5 h-5 text-white/50 absolute left-3 top-3" />
        </div>
      </div>
      
      {sortedRecordings.length === 0 ? (
        <div className="bg-black/20 rounded-xl p-8 text-center border border-white/10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Mic className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No recordings yet</h3>
          <p className="text-white/70 mb-6">
            Click the "New Recording" button to create your first voice recording.
          </p>
          <button
            onClick={onStartRecording}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg inline-flex items-center gap-2"
          >
            <Mic className="w-5 h-5" />
            Start Recording
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedRecordings.map((recording) => (
            <div 
              key={recording.id}
              className="bg-black/30 rounded-xl p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-white truncate pr-4" title={recording.title}>
                  {recording.title}
                </h3>
                <button
                  onClick={() => deleteRecording(recording.id)}
                  className="p-2 rounded-full hover:bg-red-500/20 text-red-400 transition-colors"
                  aria-label="Delete recording"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-white/60 text-sm">
                  <Clock className="w-4 h-4" />
                  {formatTime(recording.duration)}
                </div>
                <div className="flex items-center gap-1 text-white/60 text-sm">
                  <Calendar className="w-4 h-4" />
                  {formatDate(recording.date)}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => playRecording(recording.id, recording.audioUrl)}
                  className={`flex-1 py-2 rounded-lg ${
                    currentlyPlaying === recording.id
                      ? 'bg-cyan-500/30 text-cyan-300'
                      : 'bg-black/20 text-white/80 hover:bg-black/30'
                  } transition-colors flex items-center justify-center gap-2`}
                >
                  {currentlyPlaying === recording.id ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Play
                    </>
                  )}
                </button>
                
                <a
                  href={recording.audioUrl}
                  download={`${recording.title}.wav`}
                  className="flex-1 py-2 rounded-lg bg-black/20 text-white/80 hover:bg-black/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;