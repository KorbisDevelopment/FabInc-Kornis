import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface LiveFeedProps {
  streamUrl: string;
  className?: string;
}

export default function LiveFeed({ streamUrl, className }: LiveFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMock = streamUrl.includes('phone-main'); 

  useEffect(() => {
    let hls: Hls | null = null;

    if (isMock) {
      // Mock live state for demo purposes when relay is missing
      const timer = setTimeout(() => setIsLive(true), 1500);
      return () => clearTimeout(timer);
    }

    if (Hls.isSupported() && videoRef.current) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(e => console.error("Autoplay failed", e));
        setIsLive(true);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError("Network error. Retrying...");
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError("Media error. Recovering...");
              hls?.recoverMediaError();
              break;
            default:
              setError("Fatal error. Stopping.");
              hls?.destroy();
              break;
          }
        }
      });
    } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari support
      videoRef.current.src = streamUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play();
        setIsLive(true);
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamUrl]);

  return (
    <div className={`relative bg-black group overflow-hidden ${className}`}>
      {!isLive && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-cyan border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-mono uppercase text-primary-cyan tracking-widest animate-pulse">Establishing Connection...</p>
          </div>
        </div>
      )}

      {error && !isLive && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10 p-8 overflow-hidden">
          <div className="absolute inset-0 static-noise pointer-events-none opacity-20"></div>
          <div className="flex flex-col items-center gap-6 relative z-10">
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-error-red/40 text-[80px] mb-2">signal_disconnected</span>
              <div className="h-1 w-32 bg-error-red/20 mb-6"></div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-error-red tracking-[0.2em] mb-2 uppercase">NO_SIGNAL</h3>
              <p className="text-[10px] font-mono text-error-red/60 uppercase tracking-widest leading-relaxed">
                Source: {streamUrl.split('/').pop()}<br/>
                Status: ERR_CONN_REFUSED<br/>
                RELAY: OFFLINE
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-error-red/10 border border-error-red/30 text-error-red text-xs font-bold uppercase hover:bg-error-red/20 transition-all cursor-pointer"
            >
              Recalibrate Uplink
            </button>
          </div>
          
          {/* Diagnostic Grid overlay */}
          <div className="absolute inset-0 border-[40px] border-error-red/5 pointer-events-none"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 bg-error-red text-[8px] font-bold text-zinc-950 uppercase tracking-widest">
            Diagnostic Mode: Channel IDLE
          </div>
        </div>
      )}

      {isLive && isMock && (
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center overflow-hidden">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDV2oqa9eNEv6ZLoUr9y5zL4fpc-0GAhC5dzXfbx9it6x-FW-C0ulqeBpOi3vd1oSQmhgRuVcnBLXsVaBxd_DmQUePFqJ56F_6OdnNct-p7cAzGw06Q0Lemi5Y3dMrJFwKLMgpuzdJhuzDiDS_Mc8z2kid2HnmG8SZbZnvjAdukrJL2FVfxCZUnuJlfB-lTWW8Zp8dPTdcgu_dPbK4KKz-oUH75eKRAr0ghz26WIEi72rflGH_nPpOgI_hsq_HIVfLCWvaGJngbuDxr" 
            className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700" 
            alt="Simulated Feed"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute top-4 left-4 flex gap-3">
            <span className="flex items-center gap-2 bg-primary-cyan text-on-primary-cyan text-[10px] font-bold px-2 py-1">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              RECOVERY_LINK_ACTIVE
            </span>
          </div>
        </div>
      )}

      <video 
        ref={videoRef}
        className="w-full h-full object-cover opacity-80"
        playsInline
        muted
      />
      
      <div className="absolute inset-0 rugged-overlay"></div>
      
      {/* HUD Outlines */}
      <div className="absolute top-4 left-4 border-l-2 border-t-2 border-primary-cyan w-12 h-12"></div>
      <div className="absolute top-4 right-4 border-r-2 border-t-2 border-primary-cyan w-12 h-12"></div>
      <div className="absolute bottom-4 left-4 border-l-2 border-b-2 border-primary-cyan w-12 h-12"></div>
      <div className="absolute bottom-4 right-4 border-r-2 border-b-2 border-primary-cyan w-12 h-12"></div>
    </div>
  );
}
