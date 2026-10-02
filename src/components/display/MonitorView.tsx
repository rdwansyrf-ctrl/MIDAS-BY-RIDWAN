import React, { useState } from 'react';

export const MonitorView: React.FC = () => {
  const [soloMode, setSoloMode] = useState<'exclusive' | 'pfl' | 'afl'>('pfl');
  const [soloFollowsSelect, setSoloFollowsSelect] = useState<boolean>(true);
  const [dimLevelDb, setDimLevelDb] = useState<number>(-20);
  const [delayMs, setDelayMs] = useState<number>(0);
  const [monitorSource, setMonitorSource] = useState<string>('LR Bus');

  return (
    <div className="h-full flex flex-col p-3 gap-2 text-xs font-mono text-zinc-300">
      <div className="flex justify-between items-center bg-[#151921] px-3 py-1.5 rounded border border-zinc-800">
        <span className="text-amber-400 font-bold">MONITOR & SOLO BUS CONFIGURATION</span>
        <span className="text-zinc-400 text-[10px]">CONTROL ROOM & HEADPHONES</span>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1">
        {/* Solo Options */}
        <div className="bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-between">
          <div>
            <span className="text-amber-400 font-bold text-xs block mb-2">SOLO BUS OPTIONS</span>
            <div className="flex flex-col gap-2 my-2">
              <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                <input
                  type="radio"
                  name="soloMode"
                  checked={soloMode === 'pfl'}
                  onChange={() => setSoloMode('pfl')}
                  className="accent-amber-400"
                />
                <span>PFL (Pre-Fader Listen - Default)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                <input
                  type="radio"
                  name="soloMode"
                  checked={soloMode === 'afl'}
                  onChange={() => setSoloMode('afl')}
                  className="accent-amber-400"
                />
                <span>AFL (After-Fader Listen)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                <input
                  type="radio"
                  name="soloMode"
                  checked={soloMode === 'exclusive'}
                  onChange={() => setSoloMode('exclusive')}
                  className="accent-amber-400"
                />
                <span>Exclusive Solo (Last Pressed)</span>
              </label>

              <div className="pt-2 border-t border-zinc-800">
                <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={soloFollowsSelect}
                    onChange={e => setSoloFollowsSelect(e.target.checked)}
                    className="accent-amber-400"
                  />
                  <span>Solo Follows Channel Select</span>
                </label>
              </div>
            </div>
          </div>
          <div className="text-[9px] text-zinc-500">PFL listens before channel fader & mute</div>
        </div>

        {/* Monitor Source & Dim */}
        <div className="bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-between">
          <div>
            <span className="text-amber-400 font-bold text-xs block mb-2">MONITOR SOURCE & DIM</span>
            <div className="mb-3">
              <span className="text-[10px] text-zinc-400 block mb-1">DEFAULT MONITOR SOURCE:</span>
              <select
                value={monitorSource}
                onChange={e => setMonitorSource(e.target.value)}
                className="w-full bg-black border border-zinc-700 text-amber-300 rounded p-1 text-xs"
              >
                <option value="LR Bus">Main LR Bus (Master)</option>
                <option value="LR + C/M">Main LR + Center/Mono</option>
                <option value="Aux In 5/6">Auxiliary Returns 5/6</option>
                <option value="Aux In 7/8">USB Player (Aux 7/8)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-zinc-400">DIM ATTENUATION:</span>
                <span className="text-amber-300 font-bold">{dimLevelDb} dB</span>
              </div>
              <input
                type="range"
                min="-40"
                max="0"
                step="1"
                value={dimLevelDb}
                onChange={e => setDimLevelDb(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>
          <div className="text-[9px] text-zinc-500">Dim momentarily reduces speaker volume by set amount</div>
        </div>

        {/* FOH Speaker Delay Alignment */}
        <div className="bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-between">
          <div>
            <span className="text-amber-400 font-bold text-xs block mb-2">FOH DELAY ALIGNMENT</span>
            <div className="mb-2">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-zinc-400">DELAY TIME:</span>
                <span className="text-cyan-300 font-bold">{delayMs} ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="1"
                value={delayMs}
                onChange={e => setDelayMs(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[9px] text-zinc-500 block text-right mt-1">
                Distance: {(delayMs * 0.343).toFixed(2)} m / {(delayMs * 1.125).toFixed(2)} ft
              </span>
            </div>
          </div>
          <div className="bg-black/50 p-2 rounded border border-zinc-800 text-[10px] text-zinc-400">
            Aligns headphones with physical sound waves arriving from stage speakers at front-of-house position.
          </div>
        </div>
      </div>
    </div>
  );
};
