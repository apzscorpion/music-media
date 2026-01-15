import React from 'react';

const LYRICS = `
ചെറിയ ചിരിയിൽ
എത്ര warmth ഒളിച്ചു നീ
Late night callsിൽ
എന്നെ താങ്ങി നിന്നത് നീ

Random stories
നീ കേൾക്കും eyes full bright
Drama കൂടുമ്പോൾ
നീ calm ആക്കുന്ന light

ദിവ്യാ
എന്റെ ഹരിതക്കൊടി
Green flag പോലെ നീ sideil നിൽക്കും ready
എങ്ങോട്ട് വീണാലും
നീ catch cheyyum steady
നിന്നില്ലാതെ ഞാൻ ആരാ
Reshma's heartinte melody

"you got this
Chellam"
Text വരും just in time
Fail ആണെങ്കിലും
നീ കാണുന്ന shine

Small wins ആണെങ്കിലും
നീ celebrate cheyyum loud
Crowd ഇല്ലാത്തപ്പോഴും
നീ ആയിരുന്നു crowd

Bad hair day
Poyi
But നീ വന്നപ്പോൾ fine
Paniyayi mood
നീ turn cheythu sunshine

Photo okke blur
But memories crystal clear
Lifeinte chaosil
നിന്റെ voice മാത്രം dear
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
