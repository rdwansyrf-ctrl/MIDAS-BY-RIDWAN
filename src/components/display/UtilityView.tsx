import React, { useState } from 'react';

interface UtilityViewProps {
  onToggleTestSignal: (type: 'sine' | 'pink' | 'white', levelDb: number) => boolean;
  isTestSignalActive: boolean;
}

export const UtilityView: React.FC<UtilityViewProps> = ({ onToggleTestSignal, isTestSignalActive }) => {
  const [signalType, setSignalType] = useState<'sine' | 'pink' | 'white'>('sine');
  const [signalLevel, setSignalLevel] = useState<number>(-18);

  const handleToggle = () => {
    onToggleTestSignal(signalType, signalLevel);
  };

  return (
    <div className="h-full flex flex-col p-3 gap-2 text-xs font-mono text-zinc-300">
      <div className="flex justify-between items-center bg-[#151921] px-3 py-1.5 rounded border border-zinc-800">
        <span className="text-amber-400 font-bold">UTILITY & OSCILLATOR TEST GENERATOR</span>
        <span className="text-zinc-400 text-[10px]">DIAGNOSTIC SIGNAL TOOLS</span>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {/* Test Signal Generator (Default OFF per Section 36) */}
        <div className="bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-between">
          <div>
            <span className="text-amber-400 font-bold text-xs block mb-2">ONBOARD TEST OSCILLATOR</span>
            <div className="text-[10px] text-zinc-400 mb-3">
              Standard calibration generator for checking gain staging, system alignment, and loudspeaker pink-noise tuning.
            </div>

            {/* Type selector */}
            <div className="flex gap-2 mb-3">
              {(['sine', 'pink', 'white'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setSignalType(t)}
                  className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition ${
                    signalType === t ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {t === 'sine' ? '1 kHz Sine Wave' : t === 'pink' ? 'Pink Noise' : 'White Noise'}
                </button>
              ))}
            </div>

            {/* Level slider */}
            <div className="mb-2">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-zinc-400">OSCILLATOR LEVEL:</span>
                <span className="text-amber-300 font-bold">{signalLevel} dBFS</span>
              </div>
              <input
                type="range"
                min="-40"
                max="0"
                step="1"
                value={signalLevel}
                onChange={e => setSignalLevel(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <button
              onClick={handleToggle}
              className={`w-full py-2.5 rounded font-black text-xs transition border ${
                isTestSignalActive
                  ? 'bg-rose-600 text-white border-rose-300 animate-pulse shadow-lg shadow-rose-900/40'
                  : 'bg-[#181d26] text-amber-400 border-amber-600/40 hover:bg-[#202734]'
              }`}
            >
              {isTestSignalActive ? 'STOP TEST SIGNAL (ACTIVE)' : 'START TEST SIGNAL (DEFAULT OFF)'}
            </button>
            <span className="text-[8px] text-zinc-500 text-center block mt-1">
              Test signal routes into Channel 1 for signal tracing
            </span>
          </div>
        </div>

        {/* Console Clipboard & Utilities */}
        <div className="bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-between">
          <div>
            <span className="text-amber-400 font-bold text-xs block mb-2">CONSOLE CLIPBOARD</span>
            <div className="grid grid-cols-2 gap-2 my-2">
              <button className="py-2 bg-[#181d26] hover:bg-[#202734] text-zinc-300 rounded border border-zinc-700 font-bold text-[10px]">
                COPY CHANNEL DSP
              </button>
              <button className="py-2 bg-[#181d26] hover:bg-[#202734] text-zinc-300 rounded border border-zinc-700 font-bold text-[10px]">
                PASTE CHANNEL DSP
              </button>
              <button className="py-2 bg-[#181d26] hover:bg-[#202734] text-zinc-300 rounded border border-zinc-700 font-bold text-[10px]">
                COPY 4-BAND EQ
              </button>
              <button className="py-2 bg-[#181d26] hover:bg-[#202734] text-zinc-300 rounded border border-zinc-700 font-bold text-[10px]">
                PASTE 4-BAND EQ
              </button>
            </div>
          </div>

          <div className="bg-black/50 p-2.5 rounded border border-zinc-800 text-[10px] text-zinc-400">
            Allows swift replication of dialed-in channel presets across multiple vocalists or drum microphones.
          </div>
        </div>
      </div>
    </div>
  );
};
