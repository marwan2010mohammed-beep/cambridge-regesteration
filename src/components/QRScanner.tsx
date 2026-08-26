import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Start camera stream
    async function startCamera() {
      setIsInitializing(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
          videoRef.current.play();
        }
        setHasPermission(true);
        setIsInitializing(false);
      } catch (err: any) {
        console.error('Camera access error:', err);
        setErrorMsg(err.message || 'Could not access the camera. Please grant permission.');
        setHasPermission(false);
        setIsInitializing(false);
      }
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  // Stop camera helper
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Run the scanning loop once the video is playing
  const handlePlay = () => {
    const scanLoop = () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
          // Adjust canvas size to video size
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Draw current video frame to canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Extract image data for jsQR
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            // Success! Stop camera and return decoded QR data
            stopCamera();
            onScanSuccess(code.data);
            return;
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(scanLoop);
    };

    animationFrameRef.current = requestAnimationFrame(scanLoop);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(9, 14, 36, 0.98)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header controls */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          borderBottom: '1px solid var(--line)',
          paddingBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a3e635' }}>
          <Camera size={16} />
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', fontWeight: 600 }}>
            SOE QR CODE SCANNER
          </span>
        </div>
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--line)',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
          }}
          title="Cancel scanning"
        >
          <X size={14} />
        </button>
      </div>

      {/* Main scanner stage */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '360px',
          aspectRatio: '4/3',
          background: '#040714',
          border: '1px solid var(--line-strong)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}
      >
        {isInitializing && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--text-dim)', fontSize: '12px' }}>
            <RefreshCw size={20} className="animate-spin" />
            <span style={{ fontFamily: 'var(--font-mono)' }}>Initializing Camera Feed...</span>
          </div>
        )}

        {hasPermission === false && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px', textAlign: 'center', boxSizing: 'border-box' }}>
            <AlertTriangle size={28} color="#f87171" />
            <div style={{ color: '#f87171', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              CAMERA ACCESS DENIED
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '11px', margin: 0, lineHeight: 1.5 }}>
              {errorMsg || 'Please enable camera permissions in your browser or iframe settings to scan your Statement of Entry document.'}
            </p>
          </div>
        )}

        {hasPermission && (
          <>
            {/* Standard HTML Video */}
            <video
              ref={videoRef}
              onPlay={handlePlay}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              playsInline
              muted
            />

            {/* Hidden canvas for image data processing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Cyberpunk scanning HUD overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Target bracket borders */}
              <div
                style={{
                  position: 'relative',
                  width: '60%',
                  height: '60%',
                  border: '1px dashed rgba(163, 230, 53, 0.4)',
                  boxShadow: '0 0 0 400px rgba(4, 7, 20, 0.4)',
                }}
              >
                {/* Neon scanning laser animation */}
                <motion.div
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #a3e635, transparent)',
                    boxShadow: '0 0 10px #a3e635, 0 0 2px #a3e635',
                  }}
                />

                {/* Brackets around scanner target */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '12px', height: '12px', borderTop: '2.5px solid #a3e635', borderLeft: '2.5px solid #a3e635' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '12px', height: '12px', borderTop: '2.5px solid #a3e635', borderRight: '2.5px solid #a3e635' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '12px', height: '12px', borderBottom: '2.5px solid #a3e635', borderLeft: '2.5px solid #a3e635' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderBottom: '2.5px solid #a3e635', borderRight: '2.5px solid #a3e635' }} />
              </div>
            </div>
          </>
        )}
      </div>

      <p
        style={{
          marginTop: '16px',
          color: 'var(--text-dim)',
          fontSize: '11px',
          lineHeight: 1.5,
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          maxWidth: '300px',
        }}
      >
        Hold up the <strong style={{ color: '#fff' }}>Statement of Entry PDF QR Code</strong> in front of your camera to quickly import your candidate status.
      </p>
    </div>
  );
};
