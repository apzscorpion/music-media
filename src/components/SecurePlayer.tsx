'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Loader2, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import keys from '@/config/keys.json';
import { tracks } from '@/data/tracks';

export default function SecurePlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
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

  const currentTrack = tracks[currentTrackIndex];

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

  const decryptAudio = async (track: typeof tracks[0]) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Reset state for new track
      if (sourceNodeRef.current) {
          try { sourceNodeRef.current.stop(); } catch(e) {}
          sourceNodeRef.current.disconnect();
          sourceNodeRef.current = null;
      }
      pauseTimeRef.current = 0;
      setProgress(0);
      setIsPlaying(false);

      // Fetch encrypted file
      const response = await fetch(`/audio/${track.filename}`);
      if (!response.ok) throw new Error('Failed to fetch audio');
      const encryptedData = await response.arrayBuffer();

      // Get specific keys for this track
      // @ts-ignore
      const trackKeys = keys[track.keyId];
      if (!trackKeys) throw new Error('Decryption keys missing for this track');

      // Prepare Key
      const keyBytes = Uint8Array.from(atob(trackKeys.key), c => c.charCodeAt(0));
      const ivBytes = Uint8Array.from(atob(trackKeys.iv), c => c.charCodeAt(0));

      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );

      // Decrypt
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
        
        // Auto-play when changing tracks if previously playing or if manual change
        // For now, let's auto-play after load
        play(decodedAudio);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setError('Secure playback initialization failed.');
      setIsLoading(false);
    }
  };

  // Load track when index changes
  useEffect(() => {
    decryptAudio(currentTrack);
  }, [currentTrackIndex]);

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
        // Optional: Auto-advance to next track
        // handleNext(); 
        return;
    }

    const progressPercent = (currentTime / duration) * 100;
    setProgress(Math.min(progressPercent, 100));
    
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const play = async (buffer = audioBufferRef.current) => {
    if (!audioContextRef.current || !buffer) return;

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    // Stop existing source if any
    if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch(e) {}
        sourceNodeRef.current.disconnect();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNodeRef.current!);
    
    // Start from saved position
    const offset = pauseTimeRef.current;
    
    // Safety check: ensure offset is within bounds
    const safeOffset = Math.min(Math.max(0, offset), buffer.duration);
    
    source.start(0, safeOffset);
    
    // We record the time we started playing in AudioContext time
    // But we need to account for the offset.
    // effectiveStartTime = contextTime - offset
    startTimeRef.current = audioContextRef.current.currentTime - safeOffset;
    
    sourceNodeRef.current = source;
    
    setIsPlaying(true);
    
    // Start animation loop
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    updateProgress();
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

  const handlePrev = () => {
      setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  };

  const handleNext = () => {
      setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
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
    <div className="flex flex-col md:flex-row gap-8 items-start justify-center w-full max-w-5xl mx-auto">
        
        {/* Playlist Panel (Mobile: Top, Desktop: Left) */}
        <div className="w-full md:w-64 flex-shrink-0 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl max-h-[400px] overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Select Track</h3>
            <ul className="space-y-2">
                {tracks.map((track, idx) => (
                    <li key={track.id}>
                        <button 
                            onClick={() => setCurrentTrackIndex(idx)}
                            className={`w-full text-left p-3 rounded-lg text-sm transition-all flex items-center gap-3 ${
                                idx === currentTrackIndex 
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <span className="text-xs font-mono opacity-50">{(idx + 1).toString().padStart(2, '0')}</span>
                            <span className="truncate">{track.title}</span>
                            {idx === currentTrackIndex && isPlaying && (
                                <span className="ml-auto w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                            )}
                        </button>
                    </li>
                ))}
            </ul>
        </div>

        {/* Player Controls */}
        <div className="flex-grow w-full max-w-md bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Background Glow based on playing status */}
            {isPlaying && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyan-500/20 rounded-full blur-[50px] pointer-events-none"></div>
            )}
            
            <div className="flex flex-col gap-6 relative z-10">
                <div className="text-center space-y-1">
                    <div className="text-cyan-400 text-xs font-mono tracking-widest uppercase">Encrypted Audio Stream</div>
                    <div className="text-white font-bold text-lg tracking-tight truncate px-4">{currentTrack.title}</div>
                </div>

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

                <div className="flex items-center justify-between px-4">
                     <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="text-gray-500 hover:text-cyan-400 transition transform hover:scale-110"
                        aria-label={isMuted ? "Unmute" : "Mute"}
                     >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                     </button>

                    <div className="flex items-center gap-6">
                        <button 
                            onClick={handlePrev}
                            className="text-gray-400 hover:text-white transition transform hover:-translate-x-1"
                        >
                            <SkipBack size={24} />
                        </button>

                        <button 
                            onClick={togglePlay}
                            disabled={isLoading || !!error}
                            className="w-16 h-16 flex items-center justify-center bg-cyan-500 hover:bg-cyan-400 rounded-full text-black shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105 active:scale-95"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={28} />
                            ) : isPlaying ? (
                                <Pause size={28} fill="currentColor" />
                            ) : (
                                <Play size={28} fill="currentColor" className="ml-1" />
                            )}
                        </button>
                        
                        <button 
                            onClick={handleNext}
                            className="text-gray-400 hover:text-white transition transform hover:translate-x-1"
                        >
                            <SkipForward size={24} />
                        </button>
                    </div>

                    {/* Placeholder for balance to mute button */}
                    <div className="w-[18px]"></div>
                </div>
                
                {error && (
                    <div className="text-red-500 text-xs text-center font-mono bg-red-500/10 py-2 rounded">
                        {error}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
