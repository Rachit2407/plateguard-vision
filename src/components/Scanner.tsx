import React, { useRef, useState } from 'react';
import { Camera, Upload, Mic, MicOff, RefreshCw, AlertCircle } from 'lucide-react';
import type { ScanSample } from '../types';
import { DEMO_SAMPLES } from '../data/constants';
import { speechService } from '../services/speechService';
import { voiceInputService } from '../services/voiceInputService';

interface ScannerProps {
  onImageSelected: (imageDataUrl: string, sampleId?: string) => void;
  isAnalyzing: boolean;
  onVoiceCommandRecognized?: (transcript: string) => void;
}

export const Scanner: React.FC<ScannerProps> = ({ 
  onImageSelected, 
  isAnalyzing,
  onVoiceCommandRecognized 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [voiceStatus, setVoiceStatus] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Ensure stream attaches to video whenever stream changes or video element mounts
  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => console.warn("Video play interrupted:", err));
    }
  }, [stream, isCameraActive]);

  // Clean up media tracks when unmounting
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startLiveCamera = async () => {
    setCameraError(null);
    try {
      let mediaStream: MediaStream;
      try {
        // Try back camera first (ideal on phones)
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
          audio: false
        });
      } catch {
        // Fallback to any default camera available (webcam on desktop/laptop)
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      setStream(mediaStream);
      setIsCameraActive(true);
      speechService.speak("Camera active. Align food item or label within the view and select capture.");
    } catch (err: any) {
      console.error("Camera access failed", err);
      let errorMsg = "Camera access denied or unavailable. Please verify browser camera permissions.";
      if (err.name === 'NotAllowedError') {
        errorMsg = "Camera permission was blocked. Please click the camera icon in your browser address bar to allow access.";
      } else if (err.name === 'NotFoundError') {
        errorMsg = "No camera found on this device. Please choose an image file or test sample below.";
      }
      setCameraError(errorMsg);
    }
  };

  const stopLiveCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      stopLiveCamera();
      onImageSelected(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImageSelected(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleVoiceInput = () => {
    if (isListeningVoice) {
      voiceInputService.stopListening();
      setIsListeningVoice(false);
      setVoiceStatus('');
    } else {
      setIsListeningVoice(true);
      setVoiceStatus('Listening... Speak a meal name or command (e.g. "Pad Thai", "Ramen", "Scan camera")');
      voiceInputService.startListening(
        (transcript) => {
          setIsListeningVoice(false);
          setVoiceStatus(`Recognized: "${transcript}"`);
          const lower = transcript.toLowerCase();
          
          if (onVoiceCommandRecognized) {
            onVoiceCommandRecognized(transcript);
          }

          if (lower.includes('pad thai') || lower.includes('peanut') || lower.includes('thai')) {
            onImageSelected(DEMO_SAMPLES[0].imageUrl, DEMO_SAMPLES[0].id);
          } else if (lower.includes('ramen') || lower.includes('noodle') || lower.includes('miso')) {
            onImageSelected(DEMO_SAMPLES[1].imageUrl, DEMO_SAMPLES[1].id);
          } else if (lower.includes('quinoa') || lower.includes('salad') || lower.includes('garden')) {
            onImageSelected(DEMO_SAMPLES[2].imageUrl, DEMO_SAMPLES[2].id);
          } else if (lower.includes('granola') || lower.includes('honey')) {
            onImageSelected(DEMO_SAMPLES[3].imageUrl, DEMO_SAMPLES[3].id);
          } else if (lower.includes('pizza') || lower.includes('pepperoni')) {
            onImageSelected(DEMO_SAMPLES[4].imageUrl, DEMO_SAMPLES[4].id);
          } else if (lower.includes('camera') || lower.includes('live')) {
            startLiveCamera();
          } else {
            speechService.speak(`Searching database for ${transcript}`);
          }
        },
        () => {
          setIsListeningVoice(false);
          setVoiceStatus('Voice input ended.');
        },
        () => {
          setIsListeningVoice(false);
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Scanner Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Food & Ingredient Scanner</h2>
            <p className="text-xs text-slate-500">Inspect cooked meals, restaurant dishes, or packaged nutrition labels</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleVoiceInput}
              disabled={isAnalyzing}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                isListeningVoice
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              aria-label="Toggle voice input"
            >
              {isListeningVoice ? <MicOff className="w-3.5 h-3.5 text-rose-600" /> : <Mic className="w-3.5 h-3.5 text-slate-600" />}
              <span>{isListeningVoice ? 'Listening...' : 'Voice Search'}</span>
            </button>
          </div>
        </div>

        {voiceStatus && (
          <div className="px-5 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-700 flex items-center justify-between">
            <span>{voiceStatus}</span>
            <button onClick={() => setVoiceStatus('')} className="text-slate-400 hover:text-slate-600">×</button>
          </div>
        )}

        {cameraError && (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Viewport */}
        <div className="relative p-3 sm:p-6 bg-slate-50 min-h-[260px] sm:min-h-[300px] flex flex-col items-center justify-center">
          {isCameraActive ? (
            <div className="relative w-full max-w-2xl aspect-[3/4] sm:aspect-16/9 bg-black rounded-lg overflow-hidden border border-slate-300 shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-4 sm:inset-6 border border-white/60 rounded-md pointer-events-none" />

              <div className="absolute bottom-3 sm:bottom-4 inset-x-0 flex justify-center gap-2 sm:gap-3 px-3">
                <button
                  onClick={captureCameraFrame}
                  className="flex-1 max-w-[180px] py-2.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-sm transition"
                >
                  Capture Frame
                </button>
                <button
                  onClick={stopLiveCamera}
                  className="px-4 py-2.5 sm:py-2 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-white text-sm font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center max-w-md py-4 px-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-200 text-slate-700 flex items-center justify-center mb-3">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">Capture or Upload Meal Photo</h3>
              <p className="text-xs text-slate-500 mb-5 leading-normal max-w-xs mx-auto">
                Point your phone camera at a plate or packaged label, or choose an existing photo.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 w-full max-w-xs mx-auto sm:max-w-none">
                <button
                  onClick={startLiveCamera}
                  disabled={isAnalyzing}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-xs font-semibold shadow-xs transition active:scale-[0.98]"
                >
                  <Camera className="w-4 h-4" />
                  Use Device Camera
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm sm:text-xs font-semibold shadow-xs transition active:scale-[0.98]"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  Upload Photo
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center z-20">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-900">Evaluating Food Content & Allergen Rules</p>
              <p className="text-xs text-slate-500 mt-0.5">Checking ingredient profile against active health parameters...</p>
            </div>
          )}
        </div>
      </div>

      {/* Preset Test Case Library */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Test Case Reference Scenarios
          </h3>
          <span className="text-xs text-slate-500">Select any item to test evaluation logic immediately</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DEMO_SAMPLES.map((sample: ScanSample) => (
            <button
              key={sample.id}
              onClick={() => onImageSelected(sample.imageUrl, sample.id)}
              disabled={isAnalyzing}
              className="text-left p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors flex gap-3 group"
            >
              <img
                src={sample.imageUrl}
                alt={sample.title}
                className="w-14 h-14 rounded-md object-cover shrink-0 border border-slate-200"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                    {sample.category === 'dish' ? 'Meal Plate' : 'Packaging OCR'}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-900 truncate group-hover:text-blue-600">
                  {sample.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                  {sample.testProfileMatch}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
