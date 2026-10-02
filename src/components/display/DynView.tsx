import React from 'react';
import { ChannelState } from '../../types/mixer';

interface DynViewProps {
  channel: ChannelState;
  onUpdateChannel: (updated: Partial<ChannelState>) => void;
}

export const DynView: React.FC<DynViewProps> = ({ channel, onUpdateChannel }) => {
  const comp = channel.comp;

  const updateComp = (fields: Partial<typeof comp>) => {
    onUpdateChannel({
      comp: { ...comp, ...fields }
    });
  };

  return (
    <div className="h-full flex flex-col p-3 gap-3 text-xs font-mono text-zinc-300">
      <div className="flex justify-between items-center bg-[#151921] px-3 py-1.5 rounded border border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold">
            DYNAMICS COMPRESSOR : CH {channel.number < 10 ? '0' : ''}{channel.number} [{channel.name}]
          </span>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              comp.enabled && channel.gainReduction > 0.5 ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-zinc-800'
            }`}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateComp({ preEQ: !comp.preEQ })}
            className={`px-2 py-1 rounded text-[10px] font-bold border ${
              comp.preEQ ? 'bg-sky-900/60 text-sky-300 border-sky-600' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {comp.preEQ ? 'POS: PRE-EQ' : 'POS: POST-EQ'}
          </button>
          <button
            onClick={() => updateComp({ enabled: !comp.enabled })}
            className={`px-3 py-1 rounded text-xs font-bold border transition ${
              comp.enabled ? 'bg-amber-500 text-black border-amber-300' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            {comp.enabled ? 'COMP ACTIVE (IN)' : 'COMP BYPASSED (OUT)'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 flex-1">
        {/* Dynamic Compression Curve Graph & Gain Reduction Meter */}
        <div className="col-span-5 bg-[#0a0c10] p-3 rounded border border-zinc-800 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-400 font-bold">COMPRESSION CHARACTERISTIC</span>
            <span className="text-amber-400 font-bold text-[10px]">
              GR: -{channel.gainReduction.toFixed(1)} dB
            </span>
          </div>

          <div className="relative w-full h-40 bg-zinc-950 border border-zinc-800 rounded p-1 flex">
            {/* Real Gain Reduction Vertical Meter Bar */}
            <div className="w-4 h-full bg-black border-r border-zinc-800 flex flex-col justify-end p-0.5 mr-1">
              <div
                style={{ height: `${Math.min(100, (channel.gainReduction / 24) * 100)}%` }}
                className="w-full bg-gradient-to-t from-amber-500 to-rose-500 transition-all duration-75 rounded-xs"
              />
            </div>

            {/* SVG Compression Transfer Curve */}
            <div className="flex-1 relative">
              <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-15 pointer-events-none">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="border border-zinc-500" />
                ))}
              </div>

              {/* Threshold Line */}
              <div
                style={{ left: `${((comp.threshold + 60) / 60) * 100}%` }}
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400 pointer-events-none"
              >
                <span className="absolute -top-4 -left-3 text-[8px] text-amber-300 font-bold">
                  {comp.threshold}dB
                </span>
              </div>

              {/* Real Input Level Indicator */}
              <div
                style={{ left: `${Math.max(0, Math.min(100, ((channel.meterLevel + 60) / 60) * 100))}%` }}
                className="absolute top-0 bottom-0 w-1 bg-emerald-500 pointer-events-none transition-all duration-75"
              />

              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* 1:1 linear line up to threshold */}
                <line
                  x1="0"
                  y1="100"
                  x2={((comp.threshold + 60) / 60) * 100}
                  y2={100 - ((comp.threshold + 60) / 60) * 100}
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />
                {/* Compressed slope according to ratio */}
                <line
                  x1={((comp.threshold + 60) / 60) * 100}
                  y1={100 - ((comp.threshold + 60) / 60) * 100}
                  x2="100"
                  y2={100 - (((comp.threshold + 60) / 60) * 100 + ((100 - ((comp.threshold + 60) / 60) * 100) / comp.ratio))}
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          </div>

          <div className="flex justify-between text-[9px] text-zinc-500">
            <span>INPUT: {channel.meterLevel.toFixed(1)} dB</span>
            <span className="text-zinc-400">RATIO: {comp.ratio}:1</span>
          </div>
        </div>

        {/* Primary Dynamics: Threshold, Ratio, Knee, Makeup Gain */}
        <div className="col-span-4 bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-around">
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-zinc-400 font-bold">THRESHOLD</span>
              <span className="text-amber-300 font-black">{comp.threshold} dB</span>
            </div>
            <input
              type="range"
              min="-60"
              max="0"
              step="0.5"
              value={comp.threshold}
              onChange={e => updateComp({ threshold: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-zinc-400 font-bold">RATIO</span>
              <span className="text-amber-300 font-black">{comp.ratio}:1</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={comp.ratio}
              onChange={e => updateComp({ ratio: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-zinc-400 font-bold">MAKEUP GAIN</span>
              <span className="text-amber-300 font-black">+{comp.makeupGain} dB</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="0.5"
              value={comp.makeupGain}
              onChange={e => updateComp({ makeupGain: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
            <span className="text-zinc-400 text-[10px] font-bold">KNEE:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(k => (
                <button
                  key={k}
                  onClick={() => updateComp({ knee: k })}
                  className={`w-6 py-0.5 rounded text-[9px] font-bold ${
                    comp.knee === k ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Envelope Timings: Attack, Hold, Release & Senses */}
        <div className="col-span-3 bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-around">
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-zinc-400">ATTACK</span>
              <span className="text-cyan-300 font-bold">{comp.attack} ms</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="100"
              step="0.5"
              value={comp.attack}
              onChange={e => updateComp({ attack: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-zinc-400">HOLD</span>
              <span className="text-cyan-300 font-bold">{comp.hold} ms</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="5"
              value={comp.hold}
              onChange={e => updateComp({ hold: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-zinc-400">RELEASE</span>
              <span className="text-cyan-300 font-bold">{comp.release} ms</span>
            </div>
            <input
              type="range"
              min="10"
              max="2000"
              step="10"
              value={comp.release}
              onChange={e => updateComp({ release: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="flex justify-between pt-1 border-t border-zinc-800 text-[9px]">
            <button
              onClick={() => updateComp({ mode: comp.mode === 'peak' ? 'rms' : 'peak' })}
              className="px-2 py-1 rounded bg-[#181d26] text-amber-300 border border-zinc-700"
            >
              {comp.mode.toUpperCase()}
            </button>
            <button
              onClick={() => updateComp({ curve: comp.curve === 'linear' ? 'log' : 'linear' })}
              className="px-2 py-1 rounded bg-[#181d26] text-cyan-300 border border-zinc-700"
            >
              {comp.curve.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
