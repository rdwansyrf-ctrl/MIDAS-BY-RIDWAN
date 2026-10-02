import React, { useState } from 'react';
import { FXSlot, FXType } from '../../types/mixer';

interface FxRackViewProps {
  fxSlots: FXSlot[];
  onUpdateFXSlot: (slotId: number, patch: Partial<FXSlot>) => void;
}

export const FxRackView: React.FC<FxRackViewProps> = ({ fxSlots, onUpdateFXSlot }) => {
  const [selectedSlotId, setSelectedSlotId] = useState<number>(1);
  const curSlot = fxSlots.find(s => s.id === selectedSlotId) || fxSlots[0];

  const availableEffects: FXType[] = [
    'Hall Reverb',
    'Vintage Room',
    'Plate Reverb',
    'Stereo Delay',
    'Triple Delay',
    'Stereo Chorus',
    'Stereo Flanger',
    'Dimension-C',
    'Wave Designer',
    'Precision Limiter',
    'Combinator',
    'Fair Comp',
    'Stereo Leisure Comp',
    'Stereo Ultimo Comp',
    'Dual Graphic EQ',
    'Dual TruEQ',
    'Dual DeEsser',
    'Sound Maxer',
    'Stereo Tube Stage'
  ];

  const updateParam = (key: string, val: number | string | boolean) => {
    onUpdateFXSlot(curSlot.id, {
      parameters: { ...curSlot.parameters, [key]: val }
    });
  };

  return (
    <div className="h-full flex flex-col p-3 gap-2 text-xs font-mono text-zinc-300">
      <div className="flex justify-between items-center bg-[#151921] px-3 py-1.5 rounded border border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold">VIRTUAL FX RACK (8 STEREO PROCESSORS)</span>
          <span className="text-[10px] text-zinc-500">| SLOTS 1-4: INSERTS & SENDS • SLOTS 5-8: INSERTS</span>
        </div>
        <button
          onClick={() => onUpdateFXSlot(curSlot.id, { muted: !curSlot.muted })}
          className={`px-3 py-0.5 rounded text-[10px] font-bold ${
            curSlot.muted ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-black'
          }`}
        >
          {curSlot.muted ? 'MUTED' : 'ACTIVE'}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-3 flex-1">
        {/* 8-Slot Rack Chassis Navigation */}
        <div className="col-span-4 bg-[#0a0c10] p-2 rounded border border-zinc-800 flex flex-col gap-1 overflow-y-auto">
          <span className="text-[9px] text-zinc-500 font-bold px-1 mb-1">RACK UNITS 1-8</span>
          {fxSlots.map(slot => (
            <button
              key={slot.id}
              onClick={() => setSelectedSlotId(slot.id)}
              className={`p-2 rounded border text-left flex flex-col justify-between transition ${
                selectedSlotId === slot.id
                  ? 'bg-[#1e2533] border-amber-400 text-white shadow-md'
                  : 'bg-[#111419] border-zinc-800 text-zinc-400 hover:bg-[#181d24]'
              }`}
            >
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-amber-400">SLOT {slot.id}</span>
                <span className="text-[8px] bg-black/60 px-1 rounded text-zinc-400">{slot.type}</span>
              </div>
              <div className="text-[9px] truncate text-zinc-300 mt-1">{slot.name}</div>
              <div className="text-[8px] text-zinc-500 flex justify-between mt-1">
                <span>IN: {slot.inputSourceL}</span>
                <span className={slot.muted ? 'text-rose-400' : 'text-emerald-400'}>
                  {slot.muted ? 'MUTE' : 'ON'}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Effect Faceplate and Controls */}
        <div className="col-span-8 bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-between">
          {/* Hardware Style Faceplate Bezel */}
          <div className="bg-gradient-to-r from-zinc-900 via-[#181d26] to-zinc-900 p-3 rounded border border-zinc-700 shadow-inner flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-zinc-700/60 pb-2">
              <div>
                <span className="text-amber-400 font-black text-sm block tracking-wide">{curSlot.name}</span>
                <span className="text-[10px] text-zinc-400">ALGORITHM: {curSlot.type}</span>
              </div>

              {/* Type Switcher */}
              <select
                value={curSlot.type}
                onChange={e => onUpdateFXSlot(curSlot.id, { type: e.target.value as FXType, name: `FX ${curSlot.id}: ${e.target.value.toUpperCase()}` })}
                className="bg-black border border-zinc-700 text-amber-300 rounded px-2 py-1 text-xs"
              >
                {availableEffects.map(fx => (
                  <option key={fx} value={fx}>{fx}</option>
                ))}
              </select>
            </div>

            {/* Effect Parameter Knobs and Sliders */}
            <div className="grid grid-cols-3 gap-3 my-3">
              {curSlot.type === 'Vintage Room' || curSlot.type === 'Hall Reverb' || curSlot.type === 'Plate Reverb' ? (
                <>
                  <div className="bg-black/50 p-2 rounded border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block mb-1">DECAY TIME (s)</span>
                    <input
                      type="range"
                      min="0.4"
                      max="8"
                      step="0.1"
                      value={Number(curSlot.parameters.decay || 2.2)}
                      onChange={e => updateParam('decay', Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <span className="text-amber-300 font-bold text-xs">{curSlot.parameters.decay || 2.2} s</span>
                  </div>

                  <div className="bg-black/50 p-2 rounded border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block mb-1">PRE-DELAY (ms)</span>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      step="1"
                      value={Number(curSlot.parameters.predelay || 25)}
                      onChange={e => updateParam('predelay', Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <span className="text-amber-300 font-bold text-xs">{curSlot.parameters.predelay || 25} ms</span>
                  </div>

                  <div className="bg-black/50 p-2 rounded border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block mb-1">ROOM SIZE (%)</span>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="1"
                      value={Number(curSlot.parameters.size || 80)}
                      onChange={e => updateParam('size', Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <span className="text-amber-300 font-bold text-xs">{curSlot.parameters.size || 80} %</span>
                  </div>
                </>
              ) : curSlot.type === 'Stereo Delay' || curSlot.type === 'Triple Delay' ? (
                <>
                  <div className="bg-black/50 p-2 rounded border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block mb-1">DELAY TIME L (ms)</span>
                    <input
                      type="range"
                      min="10"
                      max="2000"
                      step="5"
                      value={Number(curSlot.parameters.timeL || 375)}
                      onChange={e => updateParam('timeL', Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-cyan-300 font-bold text-xs">{curSlot.parameters.timeL || 375} ms</span>
                  </div>

                  <div className="bg-black/50 p-2 rounded border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block mb-1">DELAY TIME R (ms)</span>
                    <input
                      type="range"
                      min="10"
                      max="2000"
                      step="5"
                      value={Number(curSlot.parameters.timeR || 500)}
                      onChange={e => updateParam('timeR', Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-cyan-300 font-bold text-xs">{curSlot.parameters.timeR || 500} ms</span>
                  </div>

                  <div className="bg-black/50 p-2 rounded border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block mb-1">FEEDBACK (%)</span>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="1"
                      value={Number(curSlot.parameters.feedbackL || 35)}
                      onChange={e => updateParam('feedbackL', Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-cyan-300 font-bold text-xs">{curSlot.parameters.feedbackL || 35} %</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-black/50 p-2 rounded border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block mb-1">DRIVE / SQUEEZE</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={Number(curSlot.parameters.drive || 30)}
                      onChange={e => updateParam('drive', Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <span className="text-amber-300 font-bold text-xs">{curSlot.parameters.drive || 30} %</span>
                  </div>

                  <div className="bg-black/50 p-2 rounded border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block mb-1">MIX WET / DRY (%)</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={Number(curSlot.parameters.mix || 50)}
                      onChange={e => updateParam('mix', Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <span className="text-amber-300 font-bold text-xs">{curSlot.parameters.mix || 50} %</span>
                  </div>

                  <div className="bg-black/50 p-2 rounded border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block mb-1">OUTPUT GAIN (dB)</span>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={Number(curSlot.parameters.gain || 0)}
                      onChange={e => updateParam('gain', Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <span className="text-amber-300 font-bold text-xs">{curSlot.parameters.gain || 0} dB</span>
                  </div>
                </>
              )}
            </div>

            {/* I/O Routing for this FX slot */}
            <div className="flex justify-between items-center text-[10px] pt-2 border-t border-zinc-700/60">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">INPUT SOURCE:</span>
                <select
                  value={curSlot.inputSourceL}
                  onChange={e => onUpdateFXSlot(curSlot.id, { inputSourceL: e.target.value, inputSourceR: e.target.value })}
                  className="bg-black border border-zinc-700 text-zinc-300 rounded px-1.5 py-0.5 text-[9px]"
                >
                  <option value="MixBus 09">Mix Bus 09</option>
                  <option value="MixBus 10">Mix Bus 10</option>
                  <option value="MixBus 11">Mix Bus 11</option>
                  <option value="MixBus 12">Mix Bus 12</option>
                  <option value="MixBus 13">Mix Bus 13</option>
                  <option value="Insert Main L/R">Insert Main L/R</option>
                  <option value="Insert Drum Sub">Insert Drum Sub (Bus 13-14)</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateFXSlot(curSlot.id, { parameters: { decay: 2.5, predelay: 20, size: 80, timeL: 350, timeR: 500, mix: 50 } })}
                  className="px-2 py-0.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded text-[9px]"
                >
                  FACTORY RESET
                </button>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-zinc-500 font-mono">
            Modeled after iconic hardware: Lexicon 480L / PCM70, EMT250, Teletronix LA-2A, Urei 1176, Pultec EQP-1A, TC Electronic D-Two, and SPL Transient Designer.
          </div>
        </div>
      </div>
    </div>
  );
};
