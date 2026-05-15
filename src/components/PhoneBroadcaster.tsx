import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';

export default function PhoneBroadcaster() {
  const { streamId } = useParams<{ streamId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startStreaming = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsStreaming(true);
      
      // In a real implementation with MediaMTX:
      // const pc = new RTCPeerConnection();
      // mediaStream.getTracks().forEach(track => pc.addTrack(track, mediaStream));
      // const offer = await pc.createOffer();
      // await pc.setLocalDescription(offer);
      // await fetch(`https://stream.fabinc.com/${streamId}/whip`, {
      //   method: 'POST',
      //   body: offer.sdp,
      //   headers: { 'Content-Type': 'application/sdp' }
      // });
    } catch (err) {
      console.error("Failed to get camera", err);
      setError("Camera access denied or unavailable.");
    }
  };

  const stopStreaming = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsStreaming(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="flex flex-col h-screen bg-surface-container-lowest text-on-surface font-mono overflow-hidden">
      <header className="p-4 bg-surface-container border-b-2 border-outline-variant flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-cyan animate-pulse">videocam</span>
          <h1 className="text-sm font-bold uppercase tracking-widest text-primary-cyan">Camera_Node: {streamId}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-primary-cyan animate-pulse' : 'bg-on-surface-variant opacity-30'}`}></div>
          <span className="text-[10px] font-bold uppercase">{isStreaming ? 'Broadcasting' : 'Standby'}</span>
        </div>
      </header>

      <main className="flex-1 relative bg-black flex items-center justify-center">
        {error ? (
          <div className="text-center p-8 space-y-4">
            <span className="material-symbols-outlined text-4xl text-error-red">warning</span>
            <p className="text-xs text-error-red uppercase font-bold tracking-widest">{error}</p>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover ${isStreaming ? 'opacity-100' : 'opacity-20 grayscale'}`}
            />
            {!isStreaming && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 pointer-events-none">
                <span className="material-symbols-outlined text-6xl text-primary-cyan/20">camera_alt</span>
                <p className="text-[10px] text-primary-cyan/40 mt-4 uppercase tracking-[0.2em]">Ready for initialization</p>
              </div>
            )}
            <div className="absolute inset-0 rugged-overlay pointer-events-none"></div>
          </>
        )}
      </main>

      <footer className="p-8 bg-surface-container-high border-t-2 border-outline-variant flex flex-col items-center gap-6">
        <div className="flex gap-4 w-full justify-center">
          <div className="bg-surface-container-low border border-outline-variant px-4 py-2 flex flex-col items-center">
            <span className="text-[8px] text-on-surface-variant font-black uppercase">Res</span>
            <span className="text-xs font-bold">720P</span>
          </div>
          <div className="bg-surface-container-low border border-outline-variant px-4 py-2 flex flex-col items-center">
            <span className="text-[8px] text-on-surface-variant font-black uppercase">FPS</span>
            <span className="text-xs font-bold">30</span>
          </div>
          <div className="bg-surface-container-low border border-outline-variant px-4 py-2 flex flex-col items-center">
            <span className="text-[8px] text-on-surface-variant font-black uppercase">Source</span>
            <span className="text-xs font-bold uppercase tracking-tighter">REAR_ENV</span>
          </div>
        </div>

        <button 
          onClick={isStreaming ? stopStreaming : startStreaming}
          className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all active:scale-90 ${isStreaming ? 'bg-error-red border-white/20' : 'bg-primary-cyan border-white/20'}`}
        >
          <span className="material-symbols-outlined text-4xl text-surface-dark font-black">
            {isStreaming ? 'stop' : 'podcasts'}
          </span>
        </button>

        <p className="text-[10px] text-on-surface-variant uppercase tracking-widest text-center max-w-xs">
          Maintain steady connection and ensure external power source is connected for continuous field operation.
        </p>
      </footer>
    </div>
  );
}
