import React from 'react';
import { ActiveTab } from '../types/mixer';

interface TopNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { id: ActiveTab; label: string; group?: string }[] = [
    { id: 'MIXER', label: 'MIXER' },
    { id: 'CHANNEL', label: 'CHANNEL' },
    { id: 'CONFIG', label: 'CONFIG' },
    { id: 'GATE', label: 'GATE' },
    { id: 'DYN', label: 'DYN' },
    { id: 'EQ', label: 'EQ' },
    { id: 'SENDS', label: 'SENDS' },
    { id: 'MAIN', label: 'MAIN' },
    { id: 'METERS', label: 'METERS' },
    { id: 'ROUTING', label: 'ROUTING' },
    { id: 'SETUP', label: 'SETUP' },
    { id: 'FX', label: 'FX RACK' },
    { id: 'SCENES', label: 'SCENES' },
    { id: 'MUTE GRP', label: 'MUTE GRP' },
    { id: 'UTILITY', label: 'UTILITY' },
    { id: 'MONITOR', label: 'MONITOR' },
    { id: 'LIBRARY', label: 'LIBRARY' },
    { id: 'TRAINING', label: 'TRAINING' }
  ];

  return (
    <nav className="h-9 bg-[#111419] border-b border-[#262c36] flex items-center px-2 gap-1 overflow-x-auto select-none no-scrollbar">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`relative px-3 py-1 text-[11px] font-bold tracking-wider rounded-sm uppercase transition-all duration-150 flex items-center gap-1.5 ${
              isActive
                ? 'bg-[#2b3546] text-amber-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.5)] border-t-2 border-amber-400'
                : 'bg-[#181d24] text-gray-400 hover:text-gray-200 hover:bg-[#202732] border border-[#202632]'
            }`}
          >
            {/* Illuminated LED */}
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isActive
                  ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                  : 'bg-[#2c3442]'
              }`}
            />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
};
