import React, { useRef } from 'react';
import { ChannelState, ScribbleColor } from '../types/mixer';

interface ChannelStripProps {
  channel: ChannelState;
  isSelected: boolean;
  onSelect: () => void;
  onFaderChange: (valDb: number) => void;
  onPanChange: (pan: number) => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onToggleStereoLink?: () => void;
  isStereoLinked?: boolean;
  stereoRole?: 'L' | 'R';
  sendsOnFaderActive: boolean;
  selectedBusId: number;
  onSendFaderChange: (busId: number, levelDb: number) => void;
}

export const ChannelStrip: React.FC<ChannelStripProps> = ({
  channel,
  isSelected,
  onSelect,
  onFaderChange,
  onPanChange,
  onToggleMute,
  onToggleSolo,
  onToggleStereoLink,
  isStereoLinked = false,
  stereoRole,
  sendsOnFaderActive,
  selectedBusId,
  onSendFaderChange
}) => {
  const faderTrackRef = useRef<HTMLDivElement>(null);

  // In sends-on-faders mode, display and control the target bus send level
  const activeSend = channel.sends.find(s => s.busId === selectedBusId);
  const currentFaderDb = sendsOnFaderActive ? (activeSend?.level ?? -90) : channel.fader;

  // Convert dB (-90 to +10) to percentage 0%..100%
  // Using a natural audio fader taper:
  // -inf (-90) = 0%
  // -60 dB = 10%
  // -40 dB = 25%
  // -20 dB = 45%
  // -10 dB = 60%
  // 0 dB   = 75%
  // +10 dB = 100%
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

  const faderPercent = Math.max(0, Math.min(100, dbToPercent(currentFaderDb)));

  const handleFaderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const track = faderTrackRef.current;
    if (!track) return;

    const updateFaderFromY = (clientY: number) => {
      const rect = track.getBoundingClientRect();
      const clickY = clientY - rect.top;
      const height = rect.height;
      const clampedY = Math.max(0, Math.min(height, clickY));
      const pct = (1 - clampedY / height) * 100;
      let rawDb = percentToDb(pct);
      // Snap near 0 dB
      if (Math.abs(rawDb) < 0.4) rawDb = 0;
      const roundedDb = Math.round(rawDb * 10) / 10;

      if (sendsOnFaderActive) {
        onSendFaderChange(selectedBusId, roundedDb);
      } else {
        onFaderChange(roundedDb);
      }
    };

    updateFaderFromY(e.clientY);

    const onMouseMove = (moveEvent: MouseEvent) => {
      updateFaderFromY(moveEvent.clientY);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Color mapping for LCD scribble strip
  const colorMap: Record<ScribbleColor, string> = {
    black: 'bg-black text-white border-zinc-700',
    red: 'bg-red-950 text-red-300 border-red-800',
    green: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    yellow: 'bg-amber-950 text-amber-300 border-amber-700',
    blue: 'bg-blue-950 text-blue-300 border-blue-800',
    magenta: 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-800',
    cyan: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    white: 'bg-zinc-800 text-zinc-100 border-zinc-500'
  };

  // Real LED meter levels (10 segments)
  const meterDb = channel.meterLevel;
  const segments = [-48, -36, -24, -18, -12, -6, -3, 0, 3, 6];

  return (
    <div
      className={`w-[78px] min-w-[74px] max-w-[82px] bg-[#12161c] border-r border-[#222934] flex flex-col items-center py-1 select-none shrink-0 transition-colors ${
        isSelected ? 'bg-[#18202b]' : ''
      }`}
    >
      {/* Top Source & Channel ID */}
      <div className="w-full px-1 flex items-center justify-between text-[9px] font-mono text-zinc-400 mb-1">
        <span className="font-bold text-amber-400">CH{channel.number < 10 ? '0' : ''}{channel.number}</span>
        <span className="text-[8px] truncate text-zinc-500">{channel.source}</span>
      </div>

      {/* Meter & Indicators Block */}
      <div className="flex items-center gap-1.5 px-1 py-1 w-full justify-center bg-[#0a0c10] border-y border-[#1c222b]">
        {/* Real LED Meter Bar */}
        <div className="flex flex-col-reverse gap-[1.5px] h-20 w-2.5 bg-black p-[1px] rounded-sm">
          {segments.map((thresh, idx) => {
            const isLit = meterDb >= thresh;
            const isClip = thresh >= 3;
            const isAmber = thresh >= -6 && thresh < 3;
            let color = 'bg-zinc-800';
            if (isLit) {
              color = isClip ? 'bg-rose-500 shadow-[0_0_4px_#ef4444]' : isAmber ? 'bg-amber-400 shadow-[0_0_4px_#f59e0b]' : 'bg-emerald-500 shadow-[0_0_3px_#10b981]';
            }
            return <div key={idx} className={`w-full h-1.5 rounded-[0.5px] ${color}`} />;
          })}
        </div>

        {/* Status Indicators: GATE & COMP */}
        <div className="flex flex-col gap-2 text-[8px] font-mono">
          <div className="flex flex-col items-center">
            <span
              className={`w-2 h-2 rounded-full mb-0.5 ${
                channel.comp.enabled && channel.gainReduction > 0.5
                  ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                  : 'bg-zinc-800'
              }`}
            />
            <span className="text-[7px] text-zinc-500 font-bold">COMP</span>
          </div>

          <div className="flex flex-col items-center">
            <span
              className={`w-2 h-2 rounded-full mb-0.5 ${
                channel.gate.enabled && channel.gateOpen
                  ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                  : 'bg-zinc-800'
              }`}
            />
            <span className="text-[7px] text-zinc-500 font-bold">GATE</span>
          </div>
        </div>
      </div>

      {/* Hardware Buttons: STEREO LINK, SEL, SOLO, MUTE */}
      <div className="w-full px-1.5 my-1 flex flex-col gap-1">
        {/* Stereo Link Button (for Ch 1/2 or linked channels) */}
        {onToggleStereoLink && (
          <button
            onClick={onToggleStereoLink}
            className={`w-full py-0.5 text-[8px] font-black rounded-xs border transition ${
              isStereoLinked
                ? 'bg-cyan-600 text-black border-cyan-300 shadow-[0_0_6px_#06b6d4]'
                : 'bg-[#151a24] text-zinc-500 border-zinc-800 hover:text-zinc-300'
            }`}
            title="Stereo Link Left/Right channels (YouTube / Loopback / Stereo Input)"
          >
            {isStereoLinked ? `LINK [${stereoRole || 'ST'}]` : 'LINK'}
          </button>
        )}

        {/* SEL Button */}
        <button
          onClick={onSelect}
          className={`w-full py-1 text-[10px] font-black rounded-sm border transition shadow-sm ${
            isSelected
              ? 'bg-sky-500 text-black border-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.7)]'
              : 'bg-[#1b222d] text-sky-400 border-sky-900/60 hover:bg-[#252f3f]'
          }`}
        >
          SEL
        </button>

        {/* SOLO Button */}
        <button
          onClick={onToggleSolo}
          className={`w-full py-0.5 text-[9px] font-extrabold rounded-sm border transition ${
            channel.solo
              ? 'bg-amber-400 text-black border-amber-200 shadow-[0_0_8px_#f59e0b]'
              : 'bg-[#191d24] text-amber-500/80 border-[#2b3341] hover:bg-[#232933]'
          }`}
        >
          SOLO
        </button>

        {/* MUTE Button */}
        <button
          onClick={onToggleMute}
          className={`w-full py-1 text-[10px] font-black rounded-sm border transition ${
            channel.muted
              ? 'bg-rose-600 text-white border-rose-300 shadow-[0_0_8px_#ef4444]'
              : 'bg-[#1e1418] text-rose-500 border-rose-950/80 hover:bg-[#2e1c22]'
          }`}
        >
          MUTE
        </button>
      </div>

      {/* Pan Rotary Knob Representation */}
      <div className="flex flex-col items-center mb-1">
        <span className="text-[7px] text-zinc-500 uppercase font-mono">PAN</span>
        <input
          type="range"
          min="-100"
          max="100"
          value={channel.pan}
          onChange={e => onPanChange(Number(e.target.value))}
          className="w-12 h-1 accent-amber-400 cursor-pointer"
        />
        <span className="text-[8px] font-mono text-zinc-400">
          {channel.pan === 0 ? 'C' : channel.pan < 0 ? `L${Math.abs(channel.pan)}` : `R${channel.pan}`}
        </span>
      </div>

      {/* Fader Track & Travel */}
      <div className="flex-1 w-full px-1 flex items-center justify-center my-1">
        <div className="flex items-center gap-1 h-44">
          {/* dB Scale Markings */}
          <div className="flex flex-col justify-between h-full text-[7px] font-mono text-zinc-500 select-none text-right pr-0.5">
            <span>+10</span>
            <span>+5</span>
            <span className="text-amber-400 font-bold">0</span>
            <span>-5</span>
            <span>-10</span>
            <span>-20</span>
            <span>-30</span>
            <span>-40</span>
            <span>-60</span>
            <span>-oo</span>
          </div>

          {/* Fader Track */}
          <div
            ref={faderTrackRef}
            onMouseDown={handleFaderMouseDown}
            className="relative w-7 h-full bg-[#080a0d] border border-[#212732] rounded-sm cursor-pointer shadow-inner flex justify-center"
          >
            {/* Center Slot Line */}
            <div className="absolute top-2 bottom-2 w-0.5 bg-[#1b222c]" />

            {/* Unity (0 dB) Marker Line across slot */}
            <div className="absolute left-0 right-0 top-[25%] h-[1px] bg-amber-500/40 pointer-events-none" />

            {/* Physical Console Fader Knob Handle */}
            <div
              style={{ bottom: `calc(${faderPercent}% - 14px)` }}
              className={`absolute w-6 h-7 rounded-[2px] transition-transform duration-75 shadow-lg flex flex-col justify-center items-center pointer-events-none ${
                sendsOnFaderActive
                  ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 border border-amber-300'
                  : 'bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-600 border border-zinc-300'
              }`}
            >
              <div className="w-full h-0.5 bg-black mb-1 opacity-80" />
              <div className="w-full h-0.5 bg-zinc-700 opacity-60" />
            </div>
          </div>
        </div>
      </div>

      {/* Fader Numeric dB Badge */}
      <div className="text-[9px] font-mono font-bold text-zinc-300 bg-black/60 px-1 py-0.5 rounded border border-zinc-800 mb-1">
        {currentFaderDb <= -80 ? '-oo dB' : `${currentFaderDb > 0 ? '+' : ''}${currentFaderDb.toFixed(1)} dB`}
      </div>

      {/* Dynamic LCD Scribble Strip */}
      <div
        className={`w-[70px] h-12 rounded border p-1 flex flex-col justify-between shadow-inner ${colorMap[channel.scribbleColor]}`}
      >
        <div className="flex justify-between items-center text-[8px] font-mono leading-tight">
          <span className="font-extrabold">{channel.number}</span>
          <span className="text-[7px] opacity-75">{channel.scribbleIcon}</span>
        </div>
        <div className="text-[9px] font-bold tracking-tight truncate text-center uppercase leading-tight font-sans">
          {sendsOnFaderActive ? `SND > B${selectedBusId}` : channel.name}
        </div>
        <div className="text-[7px] text-center font-mono opacity-80">
          {sendsOnFaderActive ? `${currentFaderDb.toFixed(0)}dB` : channel.dcaGroup > 0 ? `DCA ${channel.dcaGroup}` : 'LR'}
        </div>
      </div>
    </div>
  );
};
