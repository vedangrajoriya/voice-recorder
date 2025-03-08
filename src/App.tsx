import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";
import WaveformVisualizer from "./components/WaveformVisualizer";
import SaveRecordingModal from "./components/SaveRecordingModal";
import { Mic, Square, Play, Pause } from "lucide-react";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const { user, logout } = useAuth();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    const audioElement = audioElementRef.current;
    if (!audioElement) return;

    const handleEnded = () => setIsPlaying(false);
    audioElement.addEventListener("ended", handleEnded);

    return () => {
      audioElement.removeEventListener("ended", handleEnded);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyserRef.current = analyser;

      audioChunksRef.current = [];
      setAudioBlob(null);
      setAudioUrl(null);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        stream.getTracks().forEach((track) => track.stop());
        setShowSaveModal(true);
      };

      mediaRecorder.start();
      setIsRecording(true);

      let startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setRecordingTime((Date.now() - startTime) / 1000);
      }, 100);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert(
        "Unable to access microphone. Please ensure you have granted permission."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const togglePlayback = () => {
    if (!audioElementRef.current || !audioUrl) return;

    if (isPlaying) {
      audioElementRef.current.pause();
    } else {
      audioElementRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        {" "}
        <LoginForm onSuccess={() => setShowRecorder(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      {showRecorder ? (
        <div className="w-full max-w-2xl bg-black/30 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
          <div className="mb-8 h-48">
            <WaveformVisualizer
              isRecording={isRecording}
              audioBlob={audioBlob}
              analyser={analyserRef.current}
              audioUrl={audioUrl}
              isPlaying={isPlaying}
              audioElementRef={audioElementRef}
            />
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-6 rounded-full transition-all duration-300 ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-purple-500 hover:bg-purple-600"
              }`}
            >
              {isRecording ? (
                <Square className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>

            {audioUrl && (
              <button
                onClick={togglePlayback}
                className="p-6 rounded-full bg-blue-500 hover:bg-blue-600 transition-all duration-300"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>
            )}
          </div>

          {audioElementRef.current && (
            <audio ref={audioElementRef} src={audioUrl || undefined} />
          )}

          <button
            onClick={() => setShowRecorder(false)}
            className="mt-6 text-white/70 hover:text-white transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      ) : (
        <Dashboard
          onStartRecording={() => setShowRecorder(true)}
          onLogout={logout}
        />
      )}

      {showSaveModal && audioBlob && (
        <SaveRecordingModal
          audioBlob={audioBlob}
          duration={recordingTime}
          onClose={() => setShowSaveModal(false)}
          onSaved={() => {
            setShowSaveModal(false);
            setShowRecorder(false);
            setAudioBlob(null);
            setAudioUrl(null);
            setRecordingTime(0);
          }}
        />
      )}
    </div>
  );
}

export default App;
