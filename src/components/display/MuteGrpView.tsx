import React from 'react';
import { MuteGroupState, ChannelState } from '../../types/mixer';

interface MuteGrpViewProps {
  muteGroups: MuteGroupState[];
  onToggleMuteGroup: (id: number) => void;
  channels: ChannelState[];
  onAssignChannelMuteGroup: (channelId: number, muteGroupId: number) => void;
}

export const MuteGrpView: React.FC<MuteGrpViewProps> = ({
  muteGroups,
  onToggleMuteGroup,
  channels,
  onAssignChannelMuteGroup
}) => {
  return (
    <div className="h-full flex flex-col p-3 gap-2 text-xs font-mono text-zinc-300">
      <div className="flex justify-between items-center bg-[#151921] px-3 py-1.5 rounded border border-zinc-800">
        <span className="text-amber-400 font-bold">MUTE GROUPS (6 GLOBAL HARDWARE MUTE GROUPS)</span>
        <span className="text-zinc-400 text-[10px]">LIVE ASSIGNMENT & ACTUATION</span>
      </div>

      <div className="grid grid-cols-6 gap-2 flex-1">
        {muteGroups.map(mg => {
          const assignedCount = channels.filter(c => c.muteGroups.includes(mg.id)).length;
          return (
            <div
              key={mg.id}
              className={`p-3 rounded border flex flex-col justify-between transition ${
                mg.active
                  ? 'bg-rose-950/60 border-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                  : 'bg-[#12161e] border-zinc-800'
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-amber-400 font-bold text-xs">MUTE GRP {mg.id}</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${mg.active ? 'bg-rose-500 animate-pulse' : 'bg-zinc-800'}`} />
                </div>
                <div className="text-[10px] text-zinc-300 font-bold mt-1">{mg.name}</div>
                <div className="text-[9px] text-zinc-500 mt-2">
                  Assigned Channels: <span className="text-cyan-300 font-bold">{assignedCount}</span>
                </div>
              </div>

              <button
                onClick={() => onToggleMuteGroup(mg.id)}
                className={`w-full py-3 rounded font-black text-xs transition border ${
                  mg.active
                    ? 'bg-rose-600 text-white border-rose-300 shadow-md'
                    : 'bg-[#1c222c] text-rose-500 border-rose-900/60 hover:bg-[#283240]'
                }`}
              >
                {mg.active ? 'MUTED' : 'MUTE GRP'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
