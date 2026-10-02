import React from 'react';
import { ChannelState } from '../../types/mixer';

interface ChannelViewProps {
  channel: ChannelState;
  onUpdateChannel: (updated: Partial<ChannelState>) => void;
  userAudioFiles?: string[];
  onImportAudioFiles?: () => void;
}

export const ChannelView: React.FC<ChannelViewProps> = ({
  channel,
  onUpdateChannel,
  userAudioFiles = [],
  onImportAudioFiles
}) => {
  return (
    <div className="h-full flex flex-col p-3 gap-3 text-xs font-mono text-zinc-300">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#151921] px-3 py-1.5 rounded border border-zinc-800">
        <span className="text-amber-400 font-bold">
          CONFIG / PREAMP : CH {channel.number < 10 ? '0' : ''}{channel.number} [{channel.name}]
        </span>
        <span className="text-zinc-400 text-[10px]">MIDAS PRO DIGITAL PREAMP</span>
      </div>

      <div className="grid grid-cols-4 gap-3 flex-1">
        {/* Preamp Gain & Trim */}
        <div className="bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-between">
          <div>
            <span className="text-amber-400 font-bold block mb-2">ANALOGUE PREAMP GAIN</span>
            <div className="flex flex-col items-center my-3">
              <span className="text-2xl font-black text-amber-300 mb-1">
                {channel.preampGain > 0 ? '+' : ''}{channel.preampGain} dB
              </span>
              <input
                type="range"
                min="-12"
                max="60"
                step="0.5"
                value={channel.preampGain}
                onChange={e => onUpdateChannel({ preampGain: Number(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] text-zinc-500 mt-1">-12 dB to +60 dB</span>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800">
            <span className="text-zinc-400 text-[10px] block mb-1">DIGITAL TRIM</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="-18"
                max="18"
                step="0.5"
                value={channel.trim}
                onChange={e => onUpdateChannel({ trim: Number(e.target.value) })}
                className="flex-1 accent-zinc-400 cursor-pointer"
              />
              <span className="w-12 text-right text-[10px] text-zinc-300">
                {channel.trim > 0 ? '+' : ''}{channel.trim}dB
              </span>
            </div>
          </div>
        </div>

        {/* 48V Phantom & Phase */}
        <div className="bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-between">
          <div>
            <span className="text-amber-400 font-bold block mb-2">INPUT OPTIONS</span>
            <div className="flex flex-col gap-2 my-2">
              <button
                onClick={() => onUpdateChannel({ phantom48V: !channel.phantom48V })}
                className={`py-2 px-3 rounded font-bold text-center border transition flex items-center justify-between ${
                  channel.phantom48V
                    ? 'bg-rose-900/60 text-rose-200 border-rose-600 shadow-[0_0_8px_#ef4444]'
                    : 'bg-[#181d26] text-zinc-400 border-zinc-700 hover:bg-[#202734]'
                }`}
              >
                <span>+48V PHANTOM</span>
                <span className={`w-2 h-2 rounded-full ${channel.phantom48V ? 'bg-rose-500 animate-pulse' : 'bg-zinc-700'}`} />
              </button>

              <button
                onClick={() => onUpdateChannel({ phaseInvert: !channel.phaseInvert })}
                className={`py-2 px-3 rounded font-bold text-center border transition flex items-center justify-between ${
                  channel.phaseInvert
                    ? 'bg-amber-900/60 text-amber-200 border-amber-600'
                    : 'bg-[#181d26] text-zinc-400 border-zinc-700 hover:bg-[#202734]'
                }`}
              >
                <span>PHASE INVERT (Ø 180°)</span>
                <span className={`w-2 h-2 rounded-full ${channel.phaseInvert ? 'bg-amber-400' : 'bg-zinc-700'}`} />
              </button>
            </div>
          </div>

          <div className="bg-black/40 p-2 rounded border border-zinc-800 text-[10px] text-zinc-400">
            Phase reverse cancels acoustic phase cancellations on multi-miked instruments like snare top/bottom or kick inside/outside.
          </div>
        </div>

        {/* Low Cut / HPF Filter */}
        <div className="bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-amber-400 font-bold">LOW CUT / HPF</span>
              <button
                onClick={() => onUpdateChannel({ hpfEnabled: !channel.hpfEnabled })}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  channel.hpfEnabled ? 'bg-cyan-600 text-black border-cyan-400' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {channel.hpfEnabled ? 'IN' : 'OUT'}
              </button>
            </div>

            <div className="flex flex-col items-center my-3">
              <span className="text-2xl font-black text-cyan-300 mb-1">
                {channel.hpfFreq} Hz
              </span>
              <input
                type="range"
                min="20"
                max="400"
                step="5"
                disabled={!channel.hpfEnabled}
                value={channel.hpfFreq}
                onChange={e => onUpdateChannel({ hpfFreq: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer disabled:opacity-30"
              />
              <span className="text-[10px] text-zinc-500 mt-1">20 Hz to 400 Hz (12 dB/Oct)</span>
            </div>
          </div>

          <div className="bg-black/40 p-2 rounded border border-zinc-800 text-[10px] text-zinc-400">
            High-Pass Filter attenuates sub-bass rumble, stage resonance, and plosive mic pops.
          </div>
        </div>

        {/* Digital Line Delay & Source Patch */}
        <div className="bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-between">
          <div>
            <span className="text-amber-400 font-bold block mb-2">DIGITAL DELAY & SOURCE</span>
            <div className="my-2">
              <span className="text-[10px] text-zinc-400 block mb-1">DELAY: {channel.delayMs} ms</span>
              <input
                type="range"
                min="0"
                max="500"
                step="1"
                value={channel.delayMs}
                onChange={e => onUpdateChannel({ delayMs: Number(e.target.value) })}
                className="w-full accent-zinc-400 cursor-pointer"
              />
              <span className="text-[9px] text-zinc-500 block text-right mt-0.5">
                {(channel.delayMs * 0.343).toFixed(2)} m / {(channel.delayMs * 1.125).toFixed(2)} ft
              </span>
            </div>

            <div className="mt-3">
              <span className="text-[10px] text-zinc-400 block mb-1">PATCHED PHYSICAL SOURCE:</span>
              <select
                value={channel.source}
                onChange={e => onUpdateChannel({ source: e.target.value })}
                className="w-full bg-[#0a0c10] border border-zinc-700 text-zinc-200 rounded px-2 py-1 text-xs"
              >
                {userAudioFiles.length > 0 && (
                  <optgroup label="USER IMPORTED AUDIO FILES (REAL PCM)">
                    {userAudioFiles.map(filename => (
                      <option key={filename} value={filename}>
                        File: {filename}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="HARDWARE & BUS INPUTS">
                  {Array.from({ length: 32 }, (_, i) => (
                    <option key={i + 1} value={`IN ${i + 1 < 10 ? '0' : ''}${i + 1}`}>
                      Local XLR In {i + 1}
                    </option>
                  ))}
                  {Array.from({ length: 8 }, (_, i) => (
                    <option key={`aux-${i + 1}`} value={`AUX ${i + 1}`}>
                      Aux Return {i + 1}
                    </option>
                  ))}
                  <option value="WASAPI Loopback">WASAPI Loopback Stream</option>
                  <option value="VB-CABLE In">VB-CABLE Virtual Input</option>
                  <option value="USB Play 1">USB Audio Interface L</option>
                  <option value="USB Play 2">USB Audio Interface R</option>
                </optgroup>
              </select>

              {onImportAudioFiles && (
                <button
                  type="button"
                  onClick={onImportAudioFiles}
                  className="mt-1.5 w-full py-1 px-2 rounded bg-[#181e28] hover:bg-[#222c3c] border border-amber-600/50 text-amber-400 text-[10px] font-bold flex items-center justify-center gap-1 transition"
                >
                  <span>+ IMPORT AUDIO FILE FROM PC...</span>
                </button>
              )}
            </div>
          </div>

          <div className="text-[9px] text-zinc-500 font-mono">
            40-bit Floating Point Architecture
          </div>
        </div>
      </div>
    </div>
  );
};
