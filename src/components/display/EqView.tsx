import React, { useState } from 'react';
import { ChannelState, EQBand } from '../../types/mixer';

interface EqViewProps {
  channel: ChannelState;
  onUpdateChannel: (updated: Partial<ChannelState>) => void;
  rtaData: number[];
}

export const EqView: React.FC<EqViewProps> = ({ channel, onUpdateChannel, rtaData }) => {
  const eq = channel.eq;
  const [selectedBandIdx, setSelectedBandIdx] = useState<number>(1); // Band 2 default

  const updateBand = (idx: number, patch: Partial<EQBand>) => {
    const newBands = [...eq.bands];
    newBands[idx] = { ...newBands[idx], ...patch };
    onUpdateChannel({
      eq: { ...eq, bands: newBands }
    });
  };

  const selectedBand = eq.bands[selectedBandIdx] || eq.bands[0];

  // Frequency mapping: 20Hz -> 0%, 20000Hz -> 100% on log scale
  const freqToX = (freq: number): number => {
    const minF = Math.log10(20);
    const maxF = Math.log10(20000);
    const curF = Math.log10(Math.max(20, Math.min(20000, freq)));
    return ((curF - minF) / (maxF - minF)) * 100;
  };

  // Gain mapping: +15dB -> 0%, -15dB -> 100%
  const gainToY = (gain: number): number => {
    const clamped = Math.max(-15, Math.min(15, gain));
    return 50 - (clamped / 15) * 45;
  };

  // Generate SVG curve points across 60 evaluation samples
  const curvePoints: string[] = [];
  const minLog = Math.log10(20);
  const maxLog = Math.log10(20000);

  for (let i = 0; i <= 60; i++) {
    const curLog = minLog + (i / 60) * (maxLog - minLog);
    const f = Math.pow(10, curLog);

    let totalGain = 0;
    if (eq.enabled) {
      eq.bands.forEach(b => {
        if (!b.active) return;
        const df = Math.log2(f / b.freq);
        const bandwidth = 1 / b.q;
        const bell = Math.exp(-0.5 * Math.pow(df / bandwidth, 2));

        if (b.type === 'LCut') {
          if (f < b.freq) totalGain -= Math.min(24, Math.log2(b.freq / f) * 12);
        } else if (b.type === 'HCut') {
          if (f > b.freq) totalGain -= Math.min(24, Math.log2(f / b.freq) * 12);
        } else if (b.type === 'LShelf') {
          if (f < b.freq) totalGain += b.gain;
          else totalGain += b.gain * Math.max(0, 1 - (f - b.freq) / (b.freq * 2));
        } else if (b.type === 'HShelf') {
          if (f > b.freq) totalGain += b.gain;
          else totalGain += b.gain * Math.max(0, (f / b.freq));
        } else {
          totalGain += b.gain * bell;
        }
      });
    }

    const x = (i / 60) * 100;
    const y = gainToY(totalGain);
    curvePoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  const polylineStr = curvePoints.join(' ');

  return (
    <div className="h-full flex flex-col p-3 gap-2 text-xs font-mono text-zinc-300">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-[#151921] px-3 py-1.5 rounded border border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold">
            4-BAND PARAMETRIC EQUALISER : CH {channel.number < 10 ? '0' : ''}{channel.number} [{channel.name}]
          </span>
          <span className={`w-2.5 h-2.5 rounded-full ${eq.enabled ? 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]' : 'bg-zinc-800'}`} />
        </div>
        <button
          onClick={() => onUpdateChannel({ eq: { ...eq, enabled: !eq.enabled } })}
          className={`px-3 py-1 rounded text-xs font-bold border transition ${
            eq.enabled ? 'bg-cyan-600 text-black border-cyan-300' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
          }`}
        >
          {eq.enabled ? 'EQ ACTIVE (IN)' : 'EQ BYPASSED (OUT)'}
        </button>
      </div>

      {/* Interactive EQ Curve Visualizer with RTA Overlay */}
      <div className="relative w-full h-44 bg-[#090b0e] border border-zinc-800 rounded p-1 overflow-hidden">
        {/* Frequency Grid Lines */}
        <div className="absolute inset-0 flex justify-between pointer-events-none px-4 opacity-20">
          {[50, 100, 200, 500, 1000, 2000, 5000, 10000].map(freq => (
            <div key={freq} style={{ left: `${freqToX(freq)}%` }} className="absolute top-0 bottom-0 border-l border-zinc-400">
              <span className="absolute bottom-1 -left-3 text-[8px] text-zinc-400 font-mono">
                {freq >= 1000 ? `${freq / 1000}k` : freq}
              </span>
            </div>
          ))}
        </div>

        {/* 0 dB Center Line */}
        <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-zinc-700 pointer-events-none opacity-40" />

        {/* Real RTA Spectrograph Overlay (Strictly silence if no audio) */}
        <div className="absolute inset-0 flex items-end opacity-30 pointer-events-none">
          {rtaData.map((val, idx) => {
            const h = Math.max(0, Math.min(100, ((val + 90) / 90) * 100));
            return (
              <div
                key={idx}
                style={{ height: `${h}%`, width: `${100 / rtaData.length}%` }}
                className="bg-emerald-400"
              />
            );
          })}
        </div>

        {/* Calculated SVG EQ Curve */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
            points={polylineStr}
          />
        </svg>

        {/* Band Center Handles */}
        {eq.bands.map((b, idx) => {
          const isSelected = selectedBandIdx === idx;
          const x = freqToX(b.freq);
          const y = gainToY(b.gain);
          return (
            <div
              key={idx}
              onClick={() => setSelectedBandIdx(idx)}
              style={{ left: `${x}%`, top: `${y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full cursor-pointer flex items-center justify-center font-bold text-[9px] shadow-lg transition-transform ${
                isSelected
                  ? 'bg-amber-400 text-black border-2 border-white scale-125 z-20'
                  : 'bg-zinc-800 text-cyan-300 border border-cyan-500/50 hover:scale-110 z-10'
              }`}
            >
              {idx + 1}
            </div>
          );
        })}
      </div>

      {/* Bottom Controls: Band Selection & Parameter Knobs */}
      <div className="grid grid-cols-12 gap-3 flex-1">
        {/* Band Selector Tabs */}
        <div className="col-span-3 bg-[#12161e] p-2 rounded border border-zinc-800 flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-amber-400 uppercase">SELECT BAND</span>
          {eq.bands.map((b, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedBandIdx(idx)}
              className={`py-1 px-2 rounded text-[10px] font-bold text-left flex justify-between items-center transition ${
                selectedBandIdx === idx
                  ? 'bg-amber-500 text-black shadow'
                  : 'bg-[#181d26] text-zinc-300 hover:bg-[#222934] border border-zinc-800'
              }`}
            >
              <span>BAND {idx + 1} ({b.type})</span>
              <span className="font-mono text-[9px]">
                {b.gain > 0 ? '+' : ''}{b.gain}dB
              </span>
            </button>
          ))}
        </div>

        {/* Selected Band Adjusters */}
        <div className="col-span-9 bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-around">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-1">
            <span className="text-cyan-300 font-bold text-[11px]">
              BAND {selectedBandIdx + 1} PARAMETERS
            </span>
            {/* Filter Mode Selector */}
            <div className="flex gap-1">
              {(['PEQ', 'VEQ', 'LShelf', 'HShelf', 'LCut', 'HCut'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => updateBand(selectedBandIdx, { type: mode })}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    selectedBand.type === mode ? 'bg-cyan-500 text-black' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Frequency */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-zinc-400">FREQUENCY</span>
                <span className="text-amber-300 font-bold">
                  {selectedBand.freq >= 1000 ? `${(selectedBand.freq / 1000).toFixed(2)} kHz` : `${selectedBand.freq} Hz`}
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="20000"
                step="10"
                value={selectedBand.freq}
                onChange={e => updateBand(selectedBandIdx, { freq: Number(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Gain */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-zinc-400">GAIN</span>
                <span className="text-amber-300 font-bold">
                  {selectedBand.gain > 0 ? '+' : ''}{selectedBand.gain} dB
                </span>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                step="0.5"
                value={selectedBand.gain}
                onChange={e => updateBand(selectedBandIdx, { gain: Number(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Q (Bandwidth) */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-zinc-400">Q (BANDWIDTH)</span>
                <span className="text-cyan-300 font-bold">{selectedBand.q.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="10"
                step="0.1"
                value={selectedBand.q}
                onChange={e => updateBand(selectedBandIdx, { q: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
