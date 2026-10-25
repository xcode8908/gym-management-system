'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  Check,
  RefreshCw,
  Sparkles,
  User,
  Image as ImageIcon,
  SwitchCamera,
  CheckCircle2,
} from 'lucide-react';

interface PhotoUploadZoneProps {
  currentPhotoUrl: string;
  onPhotoSelected: (url: string) => void;
  label?: string;
}

// 6 Curated High-Definition Fitness Member Avatars for 1-Click Assignment
const CURATED_AVATARS = [
  {
    id: 'male-1',
    name: 'Male Athlete 1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=320&h=320&fit=crop&crop=face',
  },
  {
    id: 'male-2',
    name: 'Male Athlete 2',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&h=320&fit=crop&crop=face',
  },
  {
    id: 'male-3',
    name: 'Male Athlete 3',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=320&h=320&fit=crop&crop=face',
  },
  {
    id: 'female-1',
    name: 'Female Athlete 1',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=320&h=320&fit=crop&crop=face',
  },
  {
    id: 'female-2',
    name: 'Female Athlete 2',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=320&h=320&fit=crop&crop=face',
  },
  {
    id: 'female-3',
    name: 'Female Athlete 3',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=320&h=320&fit=crop&crop=face',
  },
];

export default function PhotoUploadZone({
  currentPhotoUrl,
  onPhotoSelected,
  label = 'Member Profile Photo',
}: PhotoUploadZoneProps) {
  const [photoUrl, setPhotoUrl] = useState<string>(currentPhotoUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setPhotoUrl(currentPhotoUrl || '');
  }, [currentPhotoUrl]);

  // Clean up camera stream on unmount or when camera deactivated
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    try {
      setCameraError(null);
      stopCamera();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(err.message || 'Unable to access camera. Please check permissions.');
      setIsCameraActive(false);
    }
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 640;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw mirrored if facing user
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPhotoUrl(dataUrl);
      onPhotoSelected(dataUrl);
      stopCamera();
    } catch (err: any) {
      setCameraError('Failed to capture snapshot: ' + err.message);
    }
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processAndUploadFile(file);
    }
  };

  const processAndUploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'PHOTO');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.fileUrl) {
        setPhotoUrl(data.fileUrl);
        onPhotoSelected(data.fileUrl);
      } else {
        throw new Error(data.error || 'Failed to upload photo');
      }
    } catch (err: any) {
      alert(err.message || 'Photo upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await processAndUploadFile(file);
    }
  };

  const selectCuratedAvatar = (url: string) => {
    setPhotoUrl(url);
    onPhotoSelected(url);
    stopCamera();
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    onPhotoSelected('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    stopCamera();
  };

  return (
    <div suppressHydrationWarning className="space-y-3.5">
      {/* Header Label */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <Camera className="w-4 h-4 text-amber-400" />
          <span>{label}</span>
          <span className="text-[10px] font-normal text-slate-400">(Live Snap or Upload)</span>
        </label>

        {photoUrl && (
          <button
            type="button"
            onClick={handleRemovePhoto}
            className="text-[11px] text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Remove Photo</span>
          </button>
        )}
      </div>

      {/* Main Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-3xl p-4 sm:p-5 border transition-all duration-300 ${
          isDragging
            ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
            : 'border-white/[0.08] bg-gradient-to-b from-[#101625] to-[#0c101a] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
        }`}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Live Camera View Mode */}
        {isCameraActive ? (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden aspect-square max-w-[320px] mx-auto bg-black border-2 border-amber-500/60 shadow-xl shadow-amber-500/10">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Viewfinder crosshairs */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-44 h-44 rounded-full border-2 border-dashed border-amber-400/60 animate-pulse"></div>
              </div>

              {/* Camera Switch button */}
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-amber-400 border border-white/20 transition-all"
                title="Switch Camera"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            </div>

            {/* Camera Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                className="btn-tactile px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-[0_8px_20px_-4px_rgba(245,158,11,0.4)]"
              >
                <Camera className="w-4 h-4" />
                <span>Snap Photo</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Avatar & Upload Controls */
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
            {/* Left: Avatar Hero with glowing ring */}
            <div className="relative group flex-shrink-0">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-slate-900 border-2 border-white/[0.12] group-hover:border-amber-400/60 transition-all duration-300 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.8)]">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Member Avatar Preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 group-hover:text-amber-400 transition-colors bg-gradient-to-br from-slate-900 to-slate-950">
                    <User className="w-10 h-10 stroke-[1.5]" />
                    <span className="text-[10px] font-bold mt-1 text-slate-400 uppercase tracking-wider">
                      No Photo
                    </span>
                  </div>
                )}

                {/* Subtle active status pill */}
                {photoUrl && (
                  <div className="absolute top-2 right-2 p-1 rounded-full bg-emerald-500 text-slate-950 shadow-md">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Shimmering pulse if photo attached */}
              {photoUrl && (
                <div className="absolute -inset-1 rounded-3xl bg-amber-500/10 -z-10 blur-sm pointer-events-none"></div>
              )}
            </div>

            {/* Right: Upload Actions & Instructions */}
            <div className="flex-1 text-center sm:text-left space-y-3 w-full">
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight flex items-center justify-center sm:justify-start gap-1.5">
                  <span>Capture or Upload Member ID Photo</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 font-bold uppercase">
                    R2 Cloud
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Drag and drop an image here, snap with the live webcam, or pick a pro fitness avatar below.
                </p>
              </div>

              {cameraError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                  {cameraError}
                </div>
              )}

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                {/* Device Upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="btn-tactile px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.1] text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isUploading ? 'Uploading to R2...' : photoUrl ? 'Change File' : 'Upload Image'}</span>
                </button>

                {/* Live Webcam Snap */}
                <button
                  type="button"
                  onClick={() => startCamera('user')}
                  className="btn-tactile px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-400/20 hover:from-amber-500/30 hover:to-amber-400/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Live Webcam Snap</span>
                </button>
              </div>

              {/* 1-Click Curated Fitness Avatars Strip */}
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-center sm:justify-start gap-1 mb-2">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Or select 1-click Pro Athlete Avatar:</span>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2 overflow-x-auto pb-1">
                  {CURATED_AVATARS.map((avatar) => {
                    const isSelected = photoUrl === avatar.url;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => selectCuratedAvatar(avatar.url)}
                        title={avatar.name}
                        className={`relative rounded-xl overflow-hidden w-9 h-9 sm:w-10 sm:h-10 transition-all duration-200 active:scale-90 flex-shrink-0 ${
                          isSelected
                            ? 'ring-2 ring-amber-400 scale-105 shadow-md shadow-amber-500/30'
                            : 'opacity-70 hover:opacity-100 border border-white/10 hover:border-amber-400/50'
                        }`}
                      >
                        <img
                          src={avatar.url}
                          alt={avatar.name}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-amber-500/30 backdrop-blur-[1px] flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white stroke-[2.5]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
