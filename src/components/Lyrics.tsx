import React from 'react';

const LYRICS = `
(Instrumental Intro)

This is a secure audio stream.
The file is encrypted at rest.
Decrypted only in memory.
No direct download link available.

(Verse 1)
Web Crypto API handles the keys.
AudioContext plays the sound.
Source buffer is raw PCM.
Hard to grab, safe and sound.

(Chorus)
Secure Player, playing tunes.
Hidden from the curious eyes.
Enjoy the music, enjoy the tech.
Underneath the digital skies.
`;

export default function Lyrics() {
  return (
    <div className="w-full max-w-2xl mx-auto mt-12 text-center p-6 bg-black/20 rounded-xl backdrop-blur-sm border border-white/5">
      <h3 className="text-gray-500 text-xs font-mono mb-6 uppercase tracking-widest">Lyrics</h3>
      <div className="space-y-4 text-gray-300 font-light text-lg leading-relaxed whitespace-pre-line opacity-80 hover:opacity-100 transition-opacity drop-shadow-lg">
        {LYRICS}
      </div>
    </div>
  );
}
