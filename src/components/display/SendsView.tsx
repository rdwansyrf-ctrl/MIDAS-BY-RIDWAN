import React from 'react';
import { ChannelState } from '../../types/mixer';

interface SendsViewProps {
  channel: ChannelState;
  onUpdateChannel: (updated: Partial<ChannelState>) => void;
}

export const SendsView: React.FC<SendsViewProps> = ({ channel, onUpdateChannel }) => {
  const updateSend = (busId: number, patch: Partial<(typeof channel.sends)[0]>) => {
    const newSends = channel.sends.map(s => (s.busId === busId ? { ...s, ...patch } : s));
    onUpdateChannel({ sends: newSends });
  };

  return (
    <div className="h-full flex flex-col p-3 gap-2 text-xs font-mono text-zinc-300">
      <div className="flex justify-between items-center bg-[#151921] px-3 py-1.5 rounded border border-zinc-800">
        <span className="text-amber-400 font-bold">
          BUS SENDS : CH {channel.number < 10 ? '0' : ''}{channel.number} [{channel.name}]
        </span>
        <span className="text-zinc-400 text-[10px]">16 AUX / MIX BUSES</span>
      </div>

      {/* Grid of 16 Bus Sends */}
      <div className="grid grid-cols-4 gap-2 flex-1 overflow-y-auto pr-1">
        {channel.sends.map(send => {
          const isSilent = send.level <= -80;
          return (
            <div
              key={send.busId}
              className="bg-[#12161e] p-2 rounded border border-zinc-800 flex flex-col justify-between"
            >
              <div className="flex justify-between items-center border-b border-zinc-800 pb-1">
                <span className="text-amber-400 font-bold text-[10px]">
                  BUS {send.busId < 10 ? '0' : ''}{send.busId}
                </span>
                <button
                  onClick={() => updateSend(send.busId, { muted: !send.muted })}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                    send.muted ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {send.muted ? 'MUTED' : 'ON'}
                </button>
              </div>

              {/* Send Level Slider & Display */}
              <div className="my-1.5">
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-zinc-400">LEVEL:</span>
                  <span className={!isSilent ? 'text-cyan-300 font-bold' : 'text-zinc-600'}>
                    {isSilent ? '-oo dB' : `${send.level > 0 ? '+' : ''}${send.level.toFixed(1)} dB`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="10"
                  step="0.5"
                  value={send.level}
                  onChange={e => updateSend(send.busId, { level: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Tap Point Selector */}
              <div className="flex items-center justify-between text-[9px] pt-1 border-t border-zinc-800">
                <span className="text-zinc-500">TAP:</span>
                <select
                  value={send.tap}
                  onChange={e => updateSend(send.busId, { tap: e.target.value as any })}
                  className="bg-black/60 border border-zinc-700 text-zinc-300 rounded px-1 text-[8px]"
                >
                  <option value="Pre-EQ">Pre-EQ</option>
                  <option value="Post-EQ">Post-EQ</option>
                  <option value="Pre-Fader">Pre-Fader</option>
                  <option value="Post-Fader">Post-Fader</option>
                  <option value="Sub-Group">Sub-Group</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
