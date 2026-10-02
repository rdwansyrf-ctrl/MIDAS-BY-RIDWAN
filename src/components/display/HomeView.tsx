import React from 'react';
import { ChannelState } from '../../types/mixer';

interface HomeViewProps {
  channel: ChannelState;
  onUpdateChannel: (updated: Partial<ChannelState>) => void;
  userAudioFiles?: string[];
}

export const HomeView: React.FC<HomeViewProps> = ({ channel, onUpdateChannel, userAudioFiles = [] }) => {
  return (
    <div className="h-full flex flex-col p-2 gap-2 text-xs font-mono text-zinc-300">
      {/* Top Banner: Selected Channel Info */}
      <div className="flex justify-between items-center bg-[#151921] px-3 py-1.5 rounded border border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-black text-sm">
            CH {channel.number < 10 ? '0' : ''}{channel.number} : {channel.name}
          </span>
          <div className="flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded border border-zinc-700 text-zinc-300 text-[10px]">
            <span className="text-zinc-500">SRC:</span>
            <select
              value={channel.source}
              onChange={e => onUpdateChannel({ source: e.target.value })}
              className="bg-transparent border-none text-amber-300 text-[10px] font-bold focus:outline-none cursor-pointer"
            >
              {userAudioFiles && userAudioFiles.length > 0 && (
                <optgroup label="USER FILES (REAL PCM)">
                  {userAudioFiles.map(f => (
                    <option key={f} value={f} className="bg-zinc-900 text-amber-300">
                      File: {f}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="INPUTS">
                <option value={`IN ${channel.number < 10 ? '0' : ''}${channel.number}`} className="bg-zinc-900 text-white">
                  Local IN {channel.number < 10 ? '0' : ''}{channel.number}
                </option>
                <option value="LOOPBACK L" className="bg-zinc-900 text-white">LOOPBACK L</option>
                <option value="LOOPBACK R" className="bg-zinc-900 text-white">LOOPBACK R</option>
                <option value="MIC" className="bg-zinc-900 text-white">MIC / LINE</option>
              </optgroup>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-zinc-400">DCA: {channel.dcaGroup > 0 ? channel.dcaGroup : 'NONE'}</span>
          <span className="text-zinc-400">|</span>
          <span className="text-emerald-400">{channel.mainLRAssign ? 'MAIN LR ON' : 'MAIN LR OFF'}</span>
        </div>
      </div>

      {/* Signal Flow Block Diagram */}
      <div className="grid grid-cols-6 gap-2 flex-1">
        {/* 1. PREAMP / CONFIG */}
        <div className="bg-[#12161e] p-2 rounded border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-amber-400 border-b border-zinc-800 pb-1">1. PREAMP</span>
          <div className="flex flex-col gap-1.5 my-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-zinc-400">GAIN:</span>
              <span className="text-amber-300 font-bold">{channel.preampGain > 0 ? '+' : ''}{channel.preampGain} dB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">48V:</span>
              <span className={channel.phantom48V ? 'text-rose-400 font-bold' : 'text-zinc-600'}>
                {channel.phantom48V ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">PHASE:</span>
              <span className={channel.phaseInvert ? 'text-amber-400 font-bold' : 'text-zinc-600'}>
                {channel.phaseInvert ? '180° INV' : 'NORMAL'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">LOW CUT:</span>
              <span className={channel.hpfEnabled ? 'text-cyan-400 font-bold' : 'text-zinc-600'}>
                {channel.hpfEnabled ? `${channel.hpfFreq} Hz` : 'BYPASS'}
              </span>
            </div>
          </div>
          <button
            onClick={() => onUpdateChannel({ phantom48V: !channel.phantom48V })}
            className={`py-1 text-[9px] font-bold rounded border ${
              channel.phantom48V ? 'bg-rose-900/50 text-rose-300 border-rose-700' : 'bg-[#181d26] text-zinc-400 border-zinc-700'
            }`}
          >
            +48V PHANTOM
          </button>
        </div>

        {/* 2. NOISE GATE */}
        <div className="bg-[#12161e] p-2 rounded border border-zinc-800 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-1">
            <span className="text-[10px] font-bold text-amber-400">2. GATE</span>
            <span className={`w-2 h-2 rounded-full ${channel.gate.enabled && channel.gateOpen ? 'bg-emerald-400' : 'bg-zinc-800'}`} />
          </div>
          <div className="flex flex-col gap-1 my-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-zinc-400">STATUS:</span>
              <span className={channel.gate.enabled ? 'text-emerald-400 font-bold' : 'text-zinc-600'}>
                {channel.gate.enabled ? 'IN' : 'OUT'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">THRESH:</span>
              <span>{channel.gate.threshold} dB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">RANGE:</span>
              <span>{channel.gate.range} dB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">ATTACK:</span>
              <span>{channel.gate.attack} ms</span>
            </div>
          </div>
          <button
            onClick={() => onUpdateChannel({ gate: { ...channel.gate, enabled: !channel.gate.enabled } })}
            className={`py-1 text-[9px] font-bold rounded border ${
              channel.gate.enabled ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700' : 'bg-[#181d26] text-zinc-400 border-zinc-700'
            }`}
          >
            GATE IN/OUT
          </button>
        </div>

        {/* 3. 4-BAND PEQ */}
        <div className="bg-[#12161e] p-2 rounded border border-zinc-800 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-1">
            <span className="text-[10px] font-bold text-amber-400">3. EQUALISER</span>
            <span className={`w-2 h-2 rounded-full ${channel.eq.enabled ? 'bg-cyan-400' : 'bg-zinc-800'}`} />
          </div>
          <div className="flex flex-col gap-1 my-1 text-[9px]">
            {channel.eq.bands.map((b, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="text-zinc-400">B{idx + 1} ({b.type}):</span>
                <span className={b.gain !== 0 ? 'text-amber-300 font-bold' : 'text-zinc-500'}>
                  {b.freq >= 1000 ? `${(b.freq / 1000).toFixed(1)}k` : `${b.freq}Hz`} / {b.gain > 0 ? '+' : ''}{b.gain}dB
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => onUpdateChannel({ eq: { ...channel.eq, enabled: !channel.eq.enabled } })}
            className={`py-1 text-[9px] font-bold rounded border ${
              channel.eq.enabled ? 'bg-cyan-900/50 text-cyan-300 border-cyan-700' : 'bg-[#181d26] text-zinc-400 border-zinc-700'
            }`}
          >
            EQ IN/OUT
          </button>
        </div>

        {/* 4. COMPRESSOR */}
        <div className="bg-[#12161e] p-2 rounded border border-zinc-800 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-1">
            <span className="text-[10px] font-bold text-amber-400">4. COMPRESSOR</span>
            <span className={`w-2 h-2 rounded-full ${channel.comp.enabled && channel.gainReduction > 0.5 ? 'bg-amber-400' : 'bg-zinc-800'}`} />
          </div>
          <div className="flex flex-col gap-1 my-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-zinc-400">THRESH:</span>
              <span>{channel.comp.threshold} dB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">RATIO:</span>
              <span>{channel.comp.ratio}:1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">GR:</span>
              <span className="text-amber-400 font-bold">-{channel.gainReduction.toFixed(1)} dB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">MAKEUP:</span>
              <span>+{channel.comp.makeupGain} dB</span>
            </div>
          </div>
          <button
            onClick={() => onUpdateChannel({ comp: { ...channel.comp, enabled: !channel.comp.enabled } })}
            className={`py-1 text-[9px] font-bold rounded border ${
              channel.comp.enabled ? 'bg-amber-900/50 text-amber-300 border-amber-700' : 'bg-[#181d26] text-zinc-400 border-zinc-700'
            }`}
          >
            COMP IN/OUT
          </button>
        </div>

        {/* 5. BUS SENDS */}
        <div className="bg-[#12161e] p-2 rounded border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-amber-400 border-b border-zinc-800 pb-1">5. BUS SENDS</span>
          <div className="grid grid-cols-2 gap-1 my-1 text-[8px]">
            {channel.sends.slice(0, 8).map(s => (
              <div key={s.busId} className="bg-black/40 p-1 rounded border border-zinc-800 flex justify-between">
                <span className="text-zinc-500">B{s.busId < 10 ? '0' : ''}{s.busId}:</span>
                <span className={s.level > -80 ? 'text-cyan-300 font-bold' : 'text-zinc-600'}>
                  {s.level <= -80 ? '-oo' : `${s.level.toFixed(0)}dB`}
                </span>
              </div>
            ))}
          </div>
          <div className="text-[8px] text-zinc-500 text-center font-mono">16 TOTAL SENDS</div>
        </div>

        {/* 6. MAIN BUS & DCA */}
        <div className="bg-[#12161e] p-2 rounded border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-amber-400 border-b border-zinc-800 pb-1">6. MAIN & OUTPUT</span>
          <div className="flex flex-col gap-1.5 my-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-zinc-400">PAN:</span>
              <span className="text-amber-300 font-bold">
                {channel.pan === 0 ? 'CENTER' : channel.pan < 0 ? `L${Math.abs(channel.pan)}` : `R${channel.pan}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">FADER:</span>
              <span className="font-bold text-zinc-200">
                {channel.fader <= -80 ? '-oo dB' : `${channel.fader.toFixed(1)} dB`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">MUTE:</span>
              <span className={channel.muted ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
                {channel.muted ? 'MUTED' : 'UNMUTED'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">SOLO:</span>
              <span className={channel.solo ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
                {channel.solo ? 'SOLO' : 'OFF'}
              </span>
            </div>
          </div>
          <button
            onClick={() => onUpdateChannel({ mainLRAssign: !channel.mainLRAssign })}
            className={`py-1 text-[9px] font-bold rounded border ${
              channel.mainLRAssign ? 'bg-sky-900/50 text-sky-300 border-sky-700' : 'bg-[#181d26] text-zinc-400 border-zinc-700'
            }`}
          >
            MAIN LR ASSIGN
          </button>
        </div>
      </div>
    </div>
  );
};
