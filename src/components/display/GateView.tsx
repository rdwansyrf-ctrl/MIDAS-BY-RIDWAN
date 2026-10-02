import React from 'react';
import { ChannelState } from '../../types/mixer';

interface GateViewProps {
  channel: ChannelState;
  onUpdateChannel: (updated: Partial<ChannelState>) => void;
}

export const GateView: React.FC<GateViewProps> = ({ channel, onUpdateChannel }) => {
  const gate = channel.gate;

  const updateGate = (fields: Partial<typeof gate>) => {
    onUpdateChannel({
      gate: { ...gate, ...fields }
    });
  };

  return (
    <div className="h-full flex flex-col p-3 gap-3 text-xs font-mono text-zinc-300">
      <div className="flex justify-between items-center bg-[#151921] px-3 py-1.5 rounded border border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold">
            GATE / DUCKER : CH {channel.number < 10 ? '0' : ''}{channel.number} [{channel.name}]
          </span>
          <span className={`w-2.5 h-2.5 rounded-full ${gate.enabled && channel.gateOpen ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-zinc-800'}`} />
        </div>
        <button
          onClick={() => updateGate({ enabled: !gate.enabled })}
          className={`px-3 py-1 rounded text-xs font-bold border transition ${
            gate.enabled ? 'bg-emerald-600 text-black border-emerald-300' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
          }`}
        >
          {gate.enabled ? 'GATE ACTIVE (IN)' : 'GATE BYPASSED (OUT)'}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-3 flex-1">
        {/* Dynamic Gate Graph Visualizer */}
        <div className="col-span-5 bg-[#0a0c10] p-3 rounded border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-400 font-bold">TRANSFER CHARACTERISTIC</span>
          <div className="relative w-full h-40 bg-zinc-950 border border-zinc-800 rounded p-1">
            {/* Grid lines */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-15 pointer-events-none">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="border border-zinc-500" />
              ))}
            </div>

            {/* Threshold Line */}
            <div
              style={{ left: `${((gate.threshold + 80) / 80) * 100}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 pointer-events-none"
            >
              <span className="absolute -top-4 -left-3 text-[8px] text-amber-300 font-bold">
                {gate.threshold}dB
              </span>
            </div>

            {/* Real meter level needle */}
            <div
              style={{ left: `${Math.max(0, Math.min(100, ((channel.meterLevel + 80) / 80) * 100))}%` }}
              className="absolute top-0 bottom-0 w-1 bg-emerald-500 pointer-events-none transition-all duration-75"
            />

            {/* SVG Gate Transfer Curve */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Closed region line */}
              <line
                x1="0"
                y1={100 - ((gate.threshold + 80 + gate.range) / 80) * 40}
                x2={((gate.threshold + 80) / 80) * 100}
                y2={100 - ((gate.threshold + 80) / 80) * 100}
                stroke="#f59e0b"
                strokeWidth="2.5"
              />
              {/* Open unity line */}
              <line
                x1={((gate.threshold + 80) / 80) * 100}
                y1={100 - ((gate.threshold + 80) / 80) * 100}
                x2="100"
                y2="0"
                stroke="#10b981"
                strokeWidth="2.5"
              />
            </svg>
          </div>

          <div className="flex justify-between text-[9px] text-zinc-500">
            <span>INPUT: {channel.meterLevel.toFixed(1)} dB</span>
            <span className={channel.gateOpen ? 'text-emerald-400 font-bold' : 'text-zinc-600'}>
              {channel.gateOpen ? 'GATE OPEN' : 'GATE CLOSED'}
            </span>
          </div>
        </div>

        {/* Primary Controls: Threshold & Range */}
        <div className="col-span-4 bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-around">
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-zinc-400 font-bold">THRESHOLD</span>
              <span className="text-amber-300 font-black">{gate.threshold} dB</span>
            </div>
            <input
              type="range"
              min="-80"
              max="0"
              step="1"
              value={gate.threshold}
              onChange={e => updateGate({ threshold: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-zinc-400 font-bold">RANGE (ATTENUATION)</span>
              <span className="text-amber-300 font-black">{gate.range} dB</span>
            </div>
            <input
              type="range"
              min="-60"
              max="0"
              step="1"
              value={gate.range}
              onChange={e => updateGate({ range: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Mode: Gate vs Ducker */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <span className="text-zinc-400 font-bold text-[10px]">MODE:</span>
            <div className="flex gap-2">
              <button
                onClick={() => updateGate({ mode: 'gate' })}
                className={`px-3 py-1 rounded text-[10px] font-bold ${
                  gate.mode === 'gate' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                GATE
              </button>
              <button
                onClick={() => updateGate({ mode: 'duck' })}
                className={`px-3 py-1 rounded text-[10px] font-bold ${
                  gate.mode === 'duck' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                DUCKER
              </button>
            </div>
          </div>
        </div>

        {/* Envelope Timings: Attack, Hold, Release */}
        <div className="col-span-3 bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-around">
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-zinc-400">ATTACK</span>
              <span className="text-cyan-300 font-bold">{gate.attack} ms</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="100"
              step="0.5"
              value={gate.attack}
              onChange={e => updateGate({ attack: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-zinc-400">HOLD</span>
              <span className="text-cyan-300 font-bold">{gate.hold} ms</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="5"
              value={gate.hold}
              onChange={e => updateGate({ hold: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-zinc-400">RELEASE</span>
              <span className="text-cyan-300 font-bold">{gate.release} ms</span>
            </div>
            <input
              type="range"
              min="5"
              max="2000"
              step="10"
              value={gate.release}
              onChange={e => updateGate({ release: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
