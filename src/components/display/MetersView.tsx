import React, { useState } from 'react';
import { ChannelState, MixBusState, MatrixState } from '../../types/mixer';

interface MetersViewProps {
  channels: ChannelState[];
  buses: MixBusState[];
  matrixes: MatrixState[];
  mainLeftMeter: number;
  mainRightMeter: number;
  monoMeter: number;
  rtaData: number[];
}

export const MetersView: React.FC<MetersViewProps> = ({
  channels,
  buses,
  matrixes,
  mainLeftMeter,
  mainRightMeter,
  monoMeter,
  rtaData
}) => {
  const [activeMeterTab, setActiveMeterTab] = useState<'CHANNELS' | 'BUSES' | 'MATRIX' | 'RTA'>('CHANNELS');

  const renderMeterBar = (dbVal: number, heightPx: number = 90) => {
    // dbVal -90 to +10 dB
    const pct = Math.max(0, Math.min(100, ((dbVal + 90) / 100) * 100));
    const isClip = dbVal >= 2;
    const isAmber = dbVal >= -6 && dbVal < 2;

    return (
      <div
        style={{ height: `${heightPx}px` }}
        className="w-2.5 bg-black rounded-[1px] p-[1px] flex flex-col justify-end border border-zinc-900"
      >
        <div
          style={{ height: `${pct}%` }}
          className={`w-full rounded-[0.5px] transition-all duration-75 ${
            isClip
              ? 'bg-rose-500 shadow-[0_0_4px_#ef4444]'
              : isAmber
              ? 'bg-amber-400'
              : 'bg-emerald-500'
          }`}
        />
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-3 gap-2 text-xs font-mono text-zinc-300">
      {/* Top Selector for Meter Pages */}
      <div className="flex justify-between items-center bg-[#151921] px-3 py-1.5 rounded border border-zinc-800">
        <div className="flex gap-2">
          {(['CHANNELS', 'BUSES', 'MATRIX', 'RTA'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveMeterTab(tab)}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition ${
                activeMeterTab === tab
                  ? 'bg-amber-500 text-black shadow'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-zinc-400">MAIN LR:</span>
          <span className="text-emerald-400 font-bold">{mainLeftMeter.toFixed(1)} / {mainRightMeter.toFixed(1)} dB</span>
        </div>
      </div>

      {/* CHANNELS 1-32 METER SCREEN */}
      {activeMeterTab === 'CHANNELS' && (
        <div className="flex-1 bg-[#0b0e13] p-2 rounded border border-zinc-800 flex flex-col justify-between overflow-x-auto">
          <div className="flex gap-2 items-end justify-between px-1 h-44">
            {channels.slice(0, 32).map(ch => (
              <div key={ch.id} className="flex flex-col items-center">
                {renderMeterBar(ch.meterLevel, 130)}
                <span className="text-[8px] font-mono text-zinc-400 mt-1">
                  {ch.number < 10 ? `0${ch.number}` : ch.number}
                </span>
                <span className="text-[7px] text-zinc-500 font-bold truncate w-6 text-center">
                  {ch.meterLevel <= -80 ? '-oo' : ch.meterLevel.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
          <div className="text-[9px] text-zinc-500 text-center border-t border-zinc-900 pt-1">
            CHANNELS 01 - 32 REAL PEAK AUDIO METERS (-90 dBFS TO +10 dBFS)
          </div>
        </div>
      )}

      {/* BUSES 1-16 METER SCREEN */}
      {activeMeterTab === 'BUSES' && (
        <div className="flex-1 bg-[#0b0e13] p-3 rounded border border-zinc-800 flex flex-col justify-between">
          <div className="flex gap-4 items-end justify-center h-44">
            {buses.map(bus => (
              <div key={bus.id} className="flex flex-col items-center">
                {renderMeterBar(bus.meterLevel, 130)}
                <span className="text-[9px] font-mono text-cyan-400 font-bold mt-1">
                  B{bus.number < 10 ? `0${bus.number}` : bus.number}
                </span>
                <span className="text-[8px] text-zinc-400 font-mono">
                  {bus.meterLevel <= -80 ? '-oo' : `${bus.meterLevel.toFixed(0)}`}
                </span>
              </div>
            ))}
          </div>
          <div className="text-[9px] text-zinc-500 text-center border-t border-zinc-900 pt-1">
            MIX BUS 01 - 16 OUTPUT SIGNAL METERS
          </div>
        </div>
      )}

      {/* MATRIX & MAIN METER SCREEN */}
      {activeMeterTab === 'MATRIX' && (
        <div className="flex-1 bg-[#0b0e13] p-3 rounded border border-zinc-800 flex flex-col justify-between">
          <div className="flex gap-6 items-end justify-center h-44">
            {matrixes.map(mtx => (
              <div key={mtx.id} className="flex flex-col items-center">
                {renderMeterBar(mtx.meterLevel, 130)}
                <span className="text-[9px] font-mono text-amber-400 font-bold mt-1">
                  MTX {mtx.number}
                </span>
                <span className="text-[8px] text-zinc-400 font-mono truncate w-14 text-center">
                  {mtx.name}
                </span>
              </div>
            ))}
            <div className="w-[1px] h-36 bg-zinc-800 mx-2" />
            <div className="flex flex-col items-center">
              {renderMeterBar(mainLeftMeter, 130)}
              <span className="text-[9px] text-zinc-300 font-bold mt-1">MAIN L</span>
            </div>
            <div className="flex flex-col items-center">
              {renderMeterBar(mainRightMeter, 130)}
              <span className="text-[9px] text-zinc-300 font-bold mt-1">MAIN R</span>
            </div>
            <div className="flex flex-col items-center">
              {renderMeterBar(monoMeter, 130)}
              <span className="text-[9px] text-zinc-300 font-bold mt-1">M / C</span>
            </div>
          </div>
          <div className="text-[9px] text-zinc-500 text-center border-t border-zinc-900 pt-1">
            MATRIX 1-6 & MASTER PHYSICAL OUTPUT METERS
          </div>
        </div>
      )}

      {/* 100-BAND REAL-TIME ANALYZER (RTA) */}
      {activeMeterTab === 'RTA' && (
        <div className="flex-1 bg-[#080a0d] p-3 rounded border border-zinc-800 flex flex-col justify-between">
          <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-1">
            <span>REAL-TIME ANALYZER (100 LOG BANDS • 20 Hz - 20 kHz)</span>
            <span className="text-emerald-400 font-bold">SOURCE: MAIN LR POST-FADER</span>
          </div>

          <div className="relative w-full h-40 bg-zinc-950 border border-zinc-800 rounded p-1 flex items-end">
            {rtaData.map((val, idx) => {
              const h = Math.max(0, Math.min(100, ((val + 90) / 90) * 100));
              return (
                <div
                  key={idx}
                  style={{ height: `${h}%`, width: `${100 / rtaData.length}%` }}
                  className="bg-emerald-400/90 border-r border-black/40 hover:bg-emerald-300"
                />
              );
            })}
          </div>

          <div className="flex justify-between text-[8px] font-mono text-zinc-500 pt-1">
            <span>20 Hz</span>
            <span>100 Hz</span>
            <span>500 Hz</span>
            <span>1 kHz</span>
            <span>5 kHz</span>
            <span>10 kHz</span>
            <span>20 kHz</span>
          </div>
        </div>
      )}
    </div>
  );
};
