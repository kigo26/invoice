import { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCcw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsReady(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please ensure permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4"
    >
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="relative w-full max-w-lg aspect-[3/4] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl">
        {capturedImage ? (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!isReady && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                <p className="text-rose-400 text-sm">{error}</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-8 flex items-center gap-6">
        {capturedImage ? (
          <>
            <button
              onClick={retake}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-700 transition-colors">
                <RefreshCcw size={24} />
              </div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Retake</span>
            </button>
            <button
              onClick={confirm}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white group-hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">
                <Check size={28} />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Confirm</span>
            </button>
          </>
        ) : (
          <button
            onClick={takePhoto}
            disabled={!isReady}
            className="flex flex-col items-center gap-2 group disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-white" />
            </div>
            <span className="text-[10px] font-bold text-white uppercase tracking-widest mt-1">Capture</span>
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}
