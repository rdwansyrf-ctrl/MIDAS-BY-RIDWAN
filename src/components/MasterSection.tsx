import React, { useRef } from 'react';
import { Mic, Disc, CircleDot, Volume2, Headphones } from 'lucide-react';

interface MasterSectionProps {
  masterFader: number;
  onMasterFaderChange: (valDb: number) => void;
  masterMuted: boolean;
  onToggleMasterMute: () => void;
  masterSolo: boolean;
  onToggleMasterSolo: () => void;
  monoCenterFader: number;
  onMonoCenterFaderChange: (valDb: number) => void;
  monoCenterMuted: boolean;
  onToggleMonoCenterMute: () => void;
  leftMeterDb: number;
  rightMeterDb: number;
  monoMeterDb: number;
  onClearSolo: () => void;
  hasActiveSolo: boolean;
  onStartRecord: () => void;
  onStopRecord: () => void;
  isRecording: boolean;
  onSelectUtilityTab: (tab: any) => void;
}

export const MasterSection: React.FC<MasterSectionProps> = ({
  masterFader,
  onMasterFaderChange,
  masterMuted,
  onToggleMasterMute,
  masterSolo,
  onToggleMasterSolo,
  monoCenterFader,
  onMonoCenterFaderChange,
  monoCenterMuted,
  onToggleMonoCenterMute,
  leftMeterDb,
  rightMeterDb,
  monoMeterDb,
  onClearSolo,
  hasActiveSolo,
  onStartRecord,
  onStopRecord,
  isRecording,
  onSelectUtilityTab
}) => {
  const faderTrackRef = useRef<HTMLDivElement>(null);
  const mcTrackRef = useRef<HTMLDivElement>(null);

  const dbToPercent = (db: number): number => {
    if (db <= -80) return 0;
    if (db <= -60) return ((db + 80) / 20) * 10;
    if (db <= -40) return 10 + ((db + 60) / 20) * 15;
    if (db <= -20) return 25 + ((db + 40) / 20) * 20;
    if (db <= -10) return 45 + ((db + 20) / 10) * 15;
    if (db <= 0) return 60 + ((db + 10) / 10) * 15;
    return 75 + (db / 10) * 25;
  };

  const percentToDb = (pct: number): number => {
    if (pct <= 0) return -90;
    if (pct <= 10) return -80 + (pct / 10) * 20;
    if (pct <= 25) return -60 + ((pct - 10) / 15) * 20;
    if (pct <= 45) return -40 + ((pct - 25) / 20) * 20;
    if (pct <= 60) return -20 + ((pct - 45) / 15) * 10;
    if (pct <= 75) return -10 + ((pct - 60) / 15) * 10;
    return (pct - 75) / 25 * 10;
  };

  const handleMasterMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const track = faderTrackRef.current;
    if (!track) return;

    const updateFromY = (clientY: number) => {
      const rect = track.getBoundingClientRect();
      const clickY = clientY - rect.top;
      const height = rect.height;
      const clampedY = Math.max(0, Math.min(height, clickY));
      const pct = (1 - clampedY / height) * 100;
      let rawDb = percentToDb(pct);
      if (Math.abs(rawDb) < 0.4) rawDb = 0;
      onMasterFaderChange(Math.round(rawDb * 10) / 10);
    };

    updateFromY(e.clientY);
    const onMouseMove = (me: MouseEvent) => updateFromY(me.clientY);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleMCMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const track = mcTrackRef.current;
    if (!track) return;

    const updateFromY = (clientY: number) => {
      const rect = track.getBoundingClientRect();
      const clickY = clientY - rect.top;
      const height = rect.height;
      const clampedY = Math.max(0, Math.min(height, clickY));
      const pct = (1 - clampedY / height) * 100;
      let rawDb = percentToDb(pct);
      if (Math.abs(rawDb) < 0.4) rawDb = 0;
      onMonoCenterFaderChange(Math.round(rawDb * 10) / 10);
    };

    updateFromY(e.clientY);
    const onMouseMove = (me: MouseEvent) => updateFromY(me.clientY);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // 24 segments from -57 to Clip (+10)
  const segments24 = [
    -57, -54, -51, -48, -45, -42, -39, -36, -33, -30, -27, -24,
    -21, -18, -15, -12, -9, -6, -4, -2, 0, 2, 4, 8
  ];

  return (
    <aside className="w-64 bg-[#0d1014] border-l border-[#242b35] flex flex-col p-2 gap-2 select-none shrink-0">
      {/* Top Section: Monitor & Phones & Solo */}
      <div className="bg-[#13171e] p-2 rounded border border-[#222a36] flex flex-col gap-2">
        <div className="flex justify-between items-center text-[10px] font-bold text-gray-300">
          <span>MONITOR / CONTROL ROOM</span>
          <button
            onClick={onClearSolo}
            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase transition ${
              hasActiveSolo
                ? 'bg-amber-500 text-black shadow-[0_0_8px_#f59e0b]'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            CLR SOLO
          </button>
        </div>

        {/* Rotary Dials representation: Monitor & Phones */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-[#0b0e13] p-1.5 rounded border border-zinc-800 flex flex-col items-center">
            <Volume2 className="w-3.5 h-3.5 text-zinc-400 mb-1" />
            <span className="text-[8px] text-zinc-400 font-mono">MON LEVEL</span>
            <input type="range" min="0" max="100" defaultValue="75" className="w-16 h-1 accent-cyan-400 mt-1" />
          </div>
          <div className="bg-[#0b0e13] p-1.5 rounded border border-zinc-800 flex flex-col items-center">
            <Headphones className="w-3.5 h-3.5 text-zinc-400 mb-1" />
            <span className="text-[8px] text-zinc-400 font-mono">PHONES</span>
            <input type="range" min="0" max="100" defaultValue="70" className="w-16 h-1 accent-cyan-400 mt-1" />
          </div>
        </div>

        {/* Talkback & Dim Buttons */}
        <div className="grid grid-cols-3 gap-1 text-[9px] font-bold">
          <button className="py-1 bg-[#1a202a] text-zinc-300 hover:bg-[#252e3d] rounded border border-zinc-700">
            TALK A
          </button>
          <button className="py-1 bg-[#1a202a] text-zinc-300 hover:bg-[#252e3d] rounded border border-zinc-700">
            TALK B
          </button>
          <button className="py-1 bg-[#1a202a] text-amber-300 hover:bg-[#252e3d] rounded border border-amber-800/60">
            DIM / MONO
          </button>
        </div>
      </div>

      {/* Real Master 24-Segment Stereo Meters & Faders Bay */}
      <div className="flex-1 bg-[#12161d] rounded border border-[#222a36] p-2 flex flex-col">
        {/* Top Header of Master Bay */}
        <div className="flex justify-between items-center text-[10px] font-black text-amber-400 border-b border-zinc-800 pb-1 mb-2">
          <span>MASTER OUTPUT</span>
          {/* WAV Live Recorder */}
          <button
            onClick={isRecording ? onStopRecord : onStartRecord}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold transition ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_8px_#ef4444]'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-600'
            }`}
            title="Record Main L/R to real WAV file"
          >
            {isRecording ? <CircleDot className="w-3 h-3 text-white" /> : <Disc className="w-3 h-3 text-rose-500" />}
            <span>{isRecording ? 'REC...' : 'REC WAV'}</span>
          </button>
        </div>

        {/* High-Resolution 24-Segment LED Meters: Left, Right, Mono */}
        <div className="bg-black p-1.5 rounded border border-zinc-900 flex justify-around items-center mb-2">
          <div className="flex flex-col items-center">
            <span className="text-[7px] text-zinc-400 font-mono mb-0.5">L</span>
            <div className="flex flex-col-reverse gap-[1px] h-28 w-2.5 bg-zinc-950 p-[1px] rounded-[1px]">
              {segments24.map((thresh, idx) => {
                const isLit = leftMeterDb >= thresh;
                const isClip = thresh >= 2;
                const isAmber = thresh >= -6 && thresh < 2;
                let color = 'bg-zinc-900';
                if (isLit) {
                  color = isClip ? 'bg-rose-500 shadow-[0_0_4px_#ef4444]' : isAmber ? 'bg-amber-400' : 'bg-emerald-500';
                }
                return <div key={idx} className={`w-full h-1 rounded-[0.5px] ${color}`} />;
              })}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[7px] text-zinc-400 font-mono mb-0.5">R</span>
            <div className="flex flex-col-reverse gap-[1px] h-28 w-2.5 bg-zinc-950 p-[1px] rounded-[1px]">
              {segments24.map((thresh, idx) => {
                const isLit = rightMeterDb >= thresh;
                const isClip = thresh >= 2;
                const isAmber = thresh >= -6 && thresh < 2;
                let color = 'bg-zinc-900';
                if (isLit) {
                  color = isClip ? 'bg-rose-500 shadow-[0_0_4px_#ef4444]' : isAmber ? 'bg-amber-400' : 'bg-emerald-500';
                }
                return <div key={idx} className={`w-full h-1 rounded-[0.5px] ${color}`} />;
              })}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[7px] text-zinc-400 font-mono mb-0.5">M/C</span>
            <div className="flex flex-col-reverse gap-[1px] h-28 w-2 bg-zinc-950 p-[1px] rounded-[1px]">
              {segments24.map((thresh, idx) => {
                const isLit = monoMeterDb >= thresh;
                const isClip = thresh >= 2;
                const isAmber = thresh >= -6 && thresh < 2;
                let color = 'bg-zinc-900';
                if (isLit) {
                  color = isClip ? 'bg-rose-500 shadow-[0_0_4px_#ef4444]' : isAmber ? 'bg-amber-400' : 'bg-emerald-500';
                }
                return <div key={idx} className={`w-full h-1 rounded-[0.5px] ${color}`} />;
              })}
            </div>
          </div>
        </div>

        {/* Master Faders: M/C and Stereo LR */}
        <div className="flex-1 flex justify-around items-center pt-2">
          {/* Mono / Center Fader */}
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-mono text-zinc-400 font-bold mb-1">M/C</span>
            <button
              onClick={onToggleMonoCenterMute}
              className={`w-9 py-0.5 text-[8px] font-black rounded-sm border transition mb-1 ${
                monoCenterMuted ? 'bg-rose-600 text-white' : 'bg-[#1e1418] text-rose-500 border-rose-950'
              }`}
            >
              MUTE
            </button>
            <div
              ref={mcTrackRef}
              onMouseDown={handleMCMouseDown}
              className="relative w-6 h-36 bg-[#080a0d] border border-zinc-800 rounded-sm cursor-pointer shadow-inner flex justify-center"
            >
              <div className="absolute top-2 bottom-2 w-0.5 bg-[#1b222c]" />
              <div
                style={{ bottom: `calc(${Math.max(0, Math.min(100, dbToPercent(monoCenterFader)))}% - 12px)` }}
                className="absolute w-5 h-6 bg-gradient-to-b from-zinc-300 to-zinc-600 rounded-[2px] border border-zinc-400 pointer-events-none"
              >
                <div className="w-full h-0.5 bg-black mt-2" />
              </div>
            </div>
            <span className="text-[8px] font-mono text-zinc-400 mt-1">
              {monoCenterFader <= -80 ? '-oo' : `${monoCenterFader.toFixed(1)}`}
            </span>
          </div>

          {/* Master Stereo LR Fader */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono text-amber-400 font-black mb-1">MAIN LR</span>
            <div className="flex gap-1 mb-1">
              <button
                onClick={onToggleMasterSolo}
                className={`px-1.5 py-0.5 text-[8px] font-bold rounded-sm border transition ${
                  masterSolo ? 'bg-amber-400 text-black' : 'bg-[#191d24] text-amber-500'
                }`}
              >
                SOLO
              </button>
              <button
                onClick={onToggleMasterMute}
                className={`px-2 py-0.5 text-[8px] font-black rounded-sm border transition ${
                  masterMuted ? 'bg-rose-600 text-white' : 'bg-[#1e1418] text-rose-500 border-rose-950'
                }`}
              >
                MUTE
              </button>
            </div>

            <div
              ref={faderTrackRef}
              onMouseDown={handleMasterMouseDown}
              className="relative w-8 h-36 bg-[#080a0d] border border-zinc-700 rounded-sm cursor-pointer shadow-inner flex justify-center"
            >
              <div className="absolute top-2 bottom-2 w-1 bg-[#1b222c]" />
              {/* Bold 0 dB Unity line */}
              <div className="absolute left-0 right-0 top-[25%] h-[2px] bg-amber-500 pointer-events-none" />

              <div
                style={{ bottom: `calc(${Math.max(0, Math.min(100, dbToPercent(masterFader)))}% - 14px)` }}
                className="absolute w-7 h-7 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 rounded-[2px] border border-amber-300 shadow-xl pointer-events-none"
              >
                <div className="w-full h-1 bg-black mt-2.5 opacity-90" />
              </div>
            </div>

            <span className="text-[9px] font-mono font-bold text-amber-400 bg-black/60 px-1 py-0.5 rounded border border-zinc-800 mt-1">
              {masterFader <= -80 ? '-oo dB' : `${masterFader > 0 ? '+' : ''}${masterFader.toFixed(1)} dB`}
            </span>
          </div>
        </div>
      </div>

      {/* Right-Side Utility Shortcuts (Section 4 & 47) */}
      <div className="grid grid-cols-4 gap-1 text-[8px] font-bold">
        <button
          onClick={() => onSelectUtilityTab('SETUP')}
          className="py-1 bg-[#151921] hover:bg-[#202733] text-gray-300 rounded border border-zinc-800"
        >
          SETUP
        </button>
        <button
          onClick={() => onSelectUtilityTab('ROUTING')}
          className="py-1 bg-[#151921] hover:bg-[#202733] text-gray-300 rounded border border-zinc-800"
        >
          ROUTING
        </button>
        <button
          onClick={() => onSelectUtilityTab('METERS')}
          className="py-1 bg-[#151921] hover:bg-[#202733] text-gray-300 rounded border border-zinc-800"
        >
          METER
        </button>
        <button
          onClick={() => onSelectUtilityTab('LIBRARY')}
          className="py-1 bg-[#151921] hover:bg-[#202733] text-gray-300 rounded border border-zinc-800"
        >
          LIBRARY
        </button>
        <button
          onClick={() => onSelectUtilityTab('SCENES')}
          className="py-1 bg-[#151921] hover:bg-[#202733] text-gray-300 rounded border border-zinc-800"
        >
          SCENES
        </button>
        <button
          onClick={() => onSelectUtilityTab('MONITOR')}
          className="py-1 bg-[#151921] hover:bg-[#202733] text-gray-300 rounded border border-zinc-800"
        >
          MONITOR
        </button>
        <button
          onClick={() => onSelectUtilityTab('UTILITY')}
          className="py-1 bg-[#151921] hover:bg-[#202733] text-gray-300 rounded border border-zinc-800"
        >
          UTILITY
        </button>
        <button
          onClick={() => onSelectUtilityTab('FX')}
          className="py-1 bg-[#151921] hover:bg-[#202733] text-gray-300 rounded border border-zinc-800"
        >
          FX RACK
        </button>
      </div>
    </aside>
  );
};
