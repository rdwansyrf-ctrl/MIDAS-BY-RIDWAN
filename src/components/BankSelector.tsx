import React from 'react';
import { BankLayer } from '../types/mixer';

interface BankSelectorProps {
  activeBank: BankLayer;
  onSelectBank: (bank: BankLayer) => void;
  sendsOnFaderActive: boolean;
  onToggleSendsOnFader: () => void;
  selectedBusForSends: number;
  onSelectBusForSends: (busId: number) => void;
}

export const BankSelector: React.FC<BankSelectorProps> = ({
  activeBank,
  onSelectBank,
  sendsOnFaderActive,
  onToggleSendsOnFader,
  selectedBusForSends,
  onSelectBusForSends
}) => {
  const inputBanks: { id: BankLayer; label: string; desc: string }[] = [
    { id: '1-16', label: 'CH 01-16', desc: 'Inputs 1-16' },
    { id: '17-32', label: 'CH 17-32', desc: 'Inputs 17-32' },
    { id: 'AUX', label: 'AUX / RET', desc: 'Aux In / USB / FX' }
  ];

  const busBanks: { id: BankLayer; label: string; desc: string }[] = [
    { id: 'BUS 1-8', label: 'BUS 01-08', desc: 'Mix Buses 1-8' },
    { id: 'BUS 9-16', label: 'BUS 09-16', desc: 'Mix Buses 9-16' },
    { id: 'MTX', label: 'MTX 1-6', desc: 'Matrix 1-6 & Main C' },
    { id: 'DCA', label: 'DCA 1-8', desc: 'DCA Groups 1-8' }
  ];

  const userBanks: { id: BankLayer; label: string; desc: string }[] = [
    { id: 'USER 1', label: 'USER 1', desc: 'Custom Bank 1' },
    { id: 'USER 2', label: 'USER 2', desc: 'Custom Bank 2' }
  ];

  return (
    <aside className="w-28 bg-[#0e1115] border-r border-[#242b35] flex flex-col p-1.5 gap-2 select-none shrink-0">
      {/* SENDS ON FADER FLIP BUTTON */}
      <div className="bg-[#14181f] p-1.5 rounded border border-[#232b38]">
        <button
          onClick={onToggleSendsOnFader}
          className={`w-full py-2 px-1 rounded flex flex-col items-center justify-center gap-1 font-black transition-all ${
            sendsOnFaderActive
              ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse'
              : 'bg-[#1e2531] text-amber-400 hover:bg-[#283242] border border-amber-500/30'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
          <span className="text-[10px] uppercase leading-tight text-center">
            SENDS ON<br />FADER
          </span>
        </button>

        {sendsOnFaderActive && (
          <div className="mt-1.5 pt-1.5 border-t border-[#293240] text-[9px] text-gray-300">
            <span className="text-amber-400 font-bold block mb-0.5">TARGET BUS:</span>
            <select
              value={selectedBusForSends}
              onChange={e => onSelectBusForSends(Number(e.target.value))}
              className="w-full bg-[#0a0c10] border border-amber-500/50 text-amber-300 rounded px-1 py-0.5 text-[9px] font-mono"
            >
              {Array.from({ length: 16 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  BUS {i + 1 < 10 ? '0' : ''}{i + 1}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* INPUT BANKS */}
      <div className="flex flex-col gap-1">
        <span className="text-[8px] font-bold text-gray-500 px-1 tracking-wider uppercase">INPUT CHANNELS</span>
        {inputBanks.map(b => {
          const active = activeBank === b.id;
          return (
            <button
              key={b.id}
              onClick={() => onSelectBank(b.id)}
              className={`w-full py-1.5 px-2 rounded-sm text-left flex items-center justify-between text-[10px] font-bold tracking-tight transition ${
                active
                  ? 'bg-sky-600 text-white shadow-md border-l-2 border-sky-300'
                  : 'bg-[#181d24] text-gray-400 hover:text-gray-200 hover:bg-[#202732] border border-[#202632]'
              }`}
            >
              <span>{b.label}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-sky-300' : 'bg-transparent'}`} />
            </button>
          );
        })}
      </div>

      {/* BUSES / MASTERS */}
      <div className="flex flex-col gap-1">
        <span className="text-[8px] font-bold text-gray-500 px-1 tracking-wider uppercase">BUS / MASTERS</span>
        {busBanks.map(b => {
          const active = activeBank === b.id;
          return (
            <button
              key={b.id}
              onClick={() => onSelectBank(b.id)}
              className={`w-full py-1.5 px-2 rounded-sm text-left flex items-center justify-between text-[10px] font-bold tracking-tight transition ${
                active
                  ? 'bg-cyan-600 text-white shadow-md border-l-2 border-cyan-300'
                  : 'bg-[#181d24] text-gray-400 hover:text-gray-200 hover:bg-[#202732] border border-[#202632]'
              }`}
            >
              <span>{b.label}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-cyan-300' : 'bg-transparent'}`} />
            </button>
          );
        })}
      </div>

      {/* USER LAYERS */}
      <div className="flex flex-col gap-1 mt-auto">
        <span className="text-[8px] font-bold text-gray-500 px-1 tracking-wider uppercase">USER BANKS</span>
        {userBanks.map(b => {
          const active = activeBank === b.id;
          return (
            <button
              key={b.id}
              onClick={() => onSelectBank(b.id)}
              className={`w-full py-1.5 px-2 rounded-sm text-left flex items-center justify-between text-[10px] font-bold tracking-tight transition ${
                active
                  ? 'bg-purple-600 text-white shadow-md border-l-2 border-purple-300'
                  : 'bg-[#181d24] text-gray-400 hover:text-gray-200 hover:bg-[#202732] border border-[#202632]'
              }`}
            >
              <span>{b.label}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-purple-300' : 'bg-transparent'}`} />
            </button>
          );
        })}
      </div>
    </aside>
  );
};
