import React from 'react';
import { LYRICS_DATA } from '@/data/lyrics';

interface LyricsProps {
  currentTrackId: string;
}

export default function Lyrics({ currentTrackId }: LyricsProps) {
  const lyrics = LYRICS_DATA[currentTrackId] || "Lyrics not available for this track.";

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 text-center p-6 bg-black/20 rounded-xl backdrop-blur-sm border border-white/5">
      <h3 className="text-gray-500 text-xs font-mono mb-6 uppercase tracking-widest">Lyrics</h3>
      <div className="space-y-4 text-gray-300 font-light text-lg leading-relaxed whitespace-pre-line opacity-80 hover:opacity-100 transition-opacity drop-shadow-lg">
        {lyrics}
      </div>
    </div>
  );
}
