import React, { useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformVisualizerProps {
  isRecording: boolean;
  audioBlob: Blob | null;
  analyser: AnalyserNode | null;
  audioUrl: string | null;
  isPlaying: boolean;
  audioElementRef: React.RefObject<HTMLAudioElement>;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isRecording,
  audioBlob,
  analyser,
  audioUrl,
  isPlaying,
  audioElementRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const animationRef = useRef<number | null>(null);

  // Live waveform visualization during recording
  useEffect(() => {
    if (!isRecording || !analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!canvasCtx || !analyser) return;
      
      animationRef.current = requestAnimationFrame(draw);
      
      analyser.getByteTimeDomainData(dataArray);
      
      // Clear canvas
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set line style
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(102, 217, 232)';
      canvasCtx.shadowBlur = 10;
      canvasCtx.shadowColor = 'rgb(102, 217, 232)';
      
      canvasCtx.beginPath();
      
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * (canvas.height / 2);
        
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };
    
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, analyser]);

  // Initialize WaveSurfer for recorded audio playback
  useEffect(() => {
    if (!audioUrl || !waveformRef.current) return;
    
    // Clean up previous instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }
    
    // Create new WaveSurfer instance
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(102, 217, 232, 0.6)',
      progressColor: 'rgba(172, 127, 244, 0.8)',
      cursorColor: 'rgba(255, 255, 255, 0.5)',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 256,
      normalize: true,
      backend: 'WebAudio',
    });
    
    wavesurfer.load(audioUrl);
    wavesurferRef.current = wavesurfer;
    
    // Sync with audio element
    if (audioElementRef.current) {
      wavesurfer.on('ready', () => {
        audioElementRef.current?.addEventListener('play', () => {
          wavesurfer.play();
        });
        
        audioElementRef.current?.addEventListener('pause', () => {
          wavesurfer.pause();
        });
        
        audioElementRef.current?.addEventListener('seeked', () => {
          wavesurfer.seekTo(audioElementRef.current!.currentTime / audioElementRef.current!.duration);
        });
      });
    }
    
    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl, audioElementRef]);

  // Resize canvas on window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth;
        canvasRef.current.height = canvasRef.current.offsetHeight;
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {isRecording && (
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full"
        />
      )}
      
      {!isRecording && audioUrl && (
        <div 
          ref={waveformRef} 
          className="absolute inset-0 w-full h-full"
        />
      )}
      
      {!isRecording && !audioUrl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex space-x-2">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className="w-1 h-12 bg-purple-400/30 rounded-full"
                style={{
                  animation: `pulse 1.5s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WaveformVisualizer;