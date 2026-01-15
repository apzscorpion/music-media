'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Loader2, Volume2, VolumeX } from 'lucide-react';
import keys from '@/config/keys.json';

export default function SecurePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  // Initialize AudioContext
  useEffect(() => {
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    audioContextRef.current = new AudioContextClass();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);

    return () => {
      audioContextRef.current?.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const decryptAudio = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch encrypted file
      const response = await fetch('/audio/track.enc');
      if (!response.ok) throw new Error('Failed to fetch audio');
      const encryptedData = await response.arrayBuffer();

      // Prepare Key
      const keyBytes = Uint8Array.from(atob(keys.key), c => c.charCodeAt(0));
      const ivBytes = Uint8Array.from(atob(keys.iv), c => c.charCodeAt(0));

      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );

      // Decrypt
      // Note: the auth tag is appended to the data, Web Crypto handles it automatically if passed as one buffer
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivBytes },
        cryptoKey,
        encryptedData
      );

      // Decode Audio
      if (audioContextRef.current) {
        const decodedAudio = await audioContextRef.current.decodeAudioData(decryptedBuffer);
        audioBufferRef.current = decodedAudio;
        setDuration(decodedAudio.duration);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setError('Secure playback initialization failed.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    decryptAudio();
  }, []);

    const updateProgress = () => {
    if (!audioContextRef.current || !isPlaying) return;
    
    // Calculate current time based on how long we've been playing + where we started
    const currentTime = audioContextRef.current.currentTime - startTimeRef.current;
    
    // Check if we passed duration (end of song)
    if (currentTime >= duration && duration > 0) {
        setIsPlaying(false);
        pauseTimeRef.current = 0;
        setProgress(0);
        cancelAnimationFrame(animationFrameRef.current);
        return;
    }

    const progressPercent = (currentTime / duration) * 100;
    setProgress(Math.min(progressPercent, 100));
    
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const play = async () => {
    if (!audioContextRef.current || !audioBufferRef.current) return;

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    // Stop existing source if any
    if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch(e) {}
        sourceNodeRef.current.disconnect();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(gainNodeRef.current!);
    
    // Start from saved position
    const offset = pauseTimeRef.current;
    
    // Safety check: ensure offset is within bounds
    const safeOffset = Math.min(Math.max(0, offset), audioBufferRef.current.duration);
    
    source.start(0, safeOffset);
    
    // We record the time we started playing in AudioContext time
    // But we need to account for the offset.
    // effectiveStartTime = contextTime - offset
    startTimeRef.current = audioContextRef.current.currentTime - safeOffset;
    
    sourceNodeRef.current = source;
    
    // onended fires for stop() too, so rely on loop for natural end or explicit pause
    setIsPlaying(true);
    
    // Start animation loop
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    updateProgress(); // Start progress immediately
  };

  const pause = () => {
    if (sourceNodeRef.current && audioContextRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e) {}
      
      // Save where we stopped
      pauseTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current;
      
      setIsPlaying(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const togglePlay = () => {
    if (isPlaying) pause();
    else play();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newProgress = Number(e.target.value);
      setProgress(newProgress);
      const newTime = (newProgress / 100) * duration;
      pauseTimeRef.current = newTime;
      
      if (isPlaying) {
          play(); // Restart from new time
      }
  };

  // Volume
  useEffect(() => {
      if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = isMuted ? 0 : volume;
      }
  }, [volume, isMuted]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSeconds = (progress / 100) * duration || 0;

  return (
    <div className="w-full max-w-md mx-auto bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl">
      <div className="flex flex-col gap-6">
        
        {/* Status / Title placeholder */}
        <div className="text-center space-y-1">
             <div className="text-cyan-400 text-xs font-mono tracking-widest uppercase">Encrypted Audio Stream</div>
             <div className="text-white font-bold text-lg tracking-tight">Secure Playback</div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 group">
            <input 
                type="range" 
                min="0" 
                max="100" 
                value={progress} 
                onChange={handleSeek}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:h-2 transition-all"
                disabled={isLoading || !audioBufferRef.current}
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>{formatTime(currentSeconds)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-8">
             <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-gray-500 hover:text-cyan-400 transition transform hover:scale-110"
                aria-label={isMuted ? "Unmute" : "Mute"}
             >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
             </button>

            <button 
                onClick={togglePlay}
                disabled={isLoading || !!error}
                className="w-14 h-14 flex items-center justify-center bg-cyan-500 hover:bg-cyan-400 rounded-full text-black shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105 active:scale-95"
            >
                {isLoading ? (
                    <Loader2 className="animate-spin" size={24} />
                ) : isPlaying ? (
                    <Pause size={24} fill="currentColor" />
                ) : (
                    <Play size={24} fill="currentColor" className="ml-1" />
                )}
            </button>
            
            {/* Dummy spacer or another control could go here */}
            <div className="w-5"></div> 
        </div>
        
        {error && (
            <div className="text-red-500 text-xs text-center font-mono bg-red-500/10 py-2 rounded">
                {error}
            </div>
        )}
      </div>
    </div>
  );
}
