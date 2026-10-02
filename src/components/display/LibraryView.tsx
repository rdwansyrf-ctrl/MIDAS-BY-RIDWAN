import React, { useState } from 'react';

export const LibraryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CHANNEL' | 'EFFECTS' | 'ROUTING'>('CHANNEL');

  const channelPresets = [
    { id: 1, name: '01: ROCK KICK DRUM', type: 'Gate + 4-band EQ scoop + 4:1 Comp' },
    { id: 2, name: '02: CRACK SNARE TOP', type: 'Fast Gate + High Shelf boost + 1176 Comp' },
    { id: 3, name: '03: P-BASS FAT DI', type: 'HPF 40Hz + LA-2A Opto Comp + Warm Tube' },
    { id: 4, name: '04: FEMALE LEAD VOCAL', type: 'HPF 120Hz + Surgical Notch 3.2kHz + Opto Comp' },
    { id: 5, name: '05: MALE LEAD VOCAL', type: 'HPF 100Hz + De-esser + Fair Comp' },
    { id: 6, name: '06: ACOUSTIC GTR STRUM', type: 'HPF 150Hz + Low-Mid Scoop + Fast Peak Limiter' }
  ];

  return (
    <div className="h-full flex flex-col p-3 gap-2 text-xs font-mono text-zinc-300">
      <div className="flex justify-between items-center bg-[#151921] px-3 py-1.5 rounded border border-zinc-800">
        <div className="flex gap-2">
          {(['CHANNEL', 'EFFECTS', 'ROUTING'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded text-[10px] font-bold transition ${
                activeTab === tab ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {tab} PRESETS
            </button>
          ))}
        </div>
        <span className="text-zinc-400 text-[10px]">PRESET LIBRARY MANAGER</span>
      </div>

      <div className="grid grid-cols-12 gap-3 flex-1">
        <div className="col-span-6 bg-[#0a0c10] p-2 rounded border border-zinc-800 flex flex-col gap-1 overflow-y-auto">
          <span className="text-[10px] text-zinc-400 font-bold px-1 mb-1">AVAILABLE PRESETS</span>
          {channelPresets.map(p => (
            <div
              key={p.id}
              className="p-2 rounded bg-[#111419] border border-zinc-800 flex justify-between items-center hover:border-zinc-600 cursor-pointer"
            >
              <div>
                <span className="font-bold text-amber-300 block">{p.name}</span>
                <span className="text-[9px] text-zinc-500">{p.type}</span>
              </div>
              <button className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-[9px]">
                LOAD
              </button>
            </div>
          ))}
        </div>

        <div className="col-span-6 bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-between">
          <div>
            <span className="text-amber-400 font-bold text-xs block mb-2">STORE CURRENT CHANNEL PRESET</span>
            <div className="flex flex-col gap-2 my-2">
              <span className="text-[10px] text-zinc-400">Save complete DSP chain (EQ, Gate, Comp, HPF):</span>
              <input
                type="text"
                placeholder="Enter preset title..."
                className="w-full bg-black border border-zinc-700 text-amber-300 px-3 py-1.5 rounded text-xs"
              />
              <button className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs mt-1">
                SAVE PRESET TO LIBRARY
              </button>
            </div>
          </div>

          <div className="bg-black/50 p-2.5 rounded border border-zinc-800 text-[10px] text-zinc-400">
            Presets can be exported to USB stick or saved into .rdwnmix project show files for touring recall.
          </div>
        </div>
      </div>
    </div>
  );
};
