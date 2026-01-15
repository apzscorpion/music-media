'use client';

import { useEffect, useState } from 'react';
import SecurePlayer from '@/components/SecurePlayer';
import Lyrics from '@/components/Lyrics';
import { tracks } from '@/data/tracks';

export default function Home() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  
  useEffect(() => {
    // Disable Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable Key Shortcuts (F12, Ctrl+Shift+I, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
      }
      // Ctrl+Shift+I / Cmd+Opt+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
      }
       // Ctrl+Shift+J / Cmd+Opt+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
      }
      // Ctrl+U / Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
      }
      // Ctrl+S / Cmd+S (Save)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white flex flex-col items-center justify-center p-4 selection:bg-cyan-500/30 overflow-hidden">
      <div className="w-full max-w-5xl relative z-10">
        <header className="mb-12 text-center">
             <div className="inline-block relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg blur opacity-25"></div>
                <h1 className="relative text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
                    SONIC VAULT
                </h1>
             </div>
             <p className="text-gray-500 font-mono text-sm mt-2 uppercase tracking-widest">Encrypted Audio Experience</p>
        </header>
        
        <SecurePlayer 
            currentTrackIndex={currentTrackIndex} 
            onTrackChange={setCurrentTrackIndex} 
        />
        <Lyrics currentTrackId={tracks[currentTrackIndex].id} />
        
        <footer className="mt-16 text-center text-gray-700 text-xs">
            <p>© 2026 Secure Audio Systems. Protection Active.</p>
        </footer>
      </div>
      
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl"></div>
      </div>
    </main>
  );
}
