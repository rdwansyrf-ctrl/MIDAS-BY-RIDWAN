import React from 'react';
import { ActiveTab, ChannelState, MixBusState, MatrixState, DCAState, MuteGroupState, FXSlot, RoutingState, AudioDeviceConfig, Scene } from '../types/mixer';
import { HomeView } from './display/HomeView';
import { ChannelView } from './display/ChannelView';
import { GateView } from './display/GateView';
import { DynView } from './display/DynView';
import { EqView } from './display/EqView';
import { SendsView } from './display/SendsView';
import { MetersView } from './display/MetersView';
import { RoutingView } from './display/RoutingView';
import { SetupView } from './display/SetupView';
import { FxRackView } from './display/FxRackView';
import { ScenesView } from './display/ScenesView';
import { MuteGrpView } from './display/MuteGrpView';
import { UtilityView } from './display/UtilityView';
import { MonitorView } from './display/MonitorView';
import { LibraryView } from './display/LibraryView';
import { TrainingView } from './display/TrainingView';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface CentralDisplayProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  selectedChannel: ChannelState;
  onUpdateChannel: (patch: Partial<ChannelState>) => void;
  channels: ChannelState[];
  buses: MixBusState[];
  matrixes: MatrixState[];
  dcas: DCAState[];
  muteGroups: MuteGroupState[];
  fxSlots: FXSlot[];
  routing: RoutingState;
  deviceConfig: AudioDeviceConfig;
  onUpdateRouting: (patch: Partial<RoutingState>) => void;
  onUpdateDeviceConfig: (patch: Partial<AudioDeviceConfig>) => void;
  onUpdateFXSlot: (slotId: number, patch: Partial<FXSlot>) => void;
  onToggleMuteGroup: (id: number) => void;
  onAssignChannelMuteGroup: (channelId: number, muteGroupId: number) => void;
  onRecallScene: (scene: Scene) => void;
  onOpenAudioSetup: () => void;
  onToggleTestSignal: (type: 'sine' | 'pink' | 'white', levelDb: number) => boolean;
  isTestSignalActive: boolean;
  rtaData: number[];
  mainLeftMeter: number;
  mainRightMeter: number;
  monoMeter: number;
  masterFader: number;
  sendsOnFaderActive: boolean;
  onSelectChannelById: (id: number) => void;
  userAudioFiles?: string[];
  onImportAudioFiles?: () => void;
  onUpdateChannelById?: (id: number, patch: Partial<ChannelState>) => void;
  missingFiles?: { name: string; path?: string }[];
  onLocateFile?: (fileName: string) => void;
}

export const CentralDisplay: React.FC<CentralDisplayProps> = ({
  activeTab,
  onSelectTab,
  selectedChannel,
  onUpdateChannel,
  channels,
  buses,
  matrixes,
  dcas,
  muteGroups,
  fxSlots,
  routing,
  deviceConfig,
  onUpdateRouting,
  onUpdateDeviceConfig,
  onUpdateFXSlot,
  onToggleMuteGroup,
  onAssignChannelMuteGroup,
  onRecallScene,
  onOpenAudioSetup,
  onToggleTestSignal,
  isTestSignalActive,
  rtaData,
  mainLeftMeter,
  mainRightMeter,
  monoMeter,
  masterFader,
  sendsOnFaderActive,
  onSelectChannelById,
  userAudioFiles = [],
  onImportAudioFiles,
  onUpdateChannelById,
  missingFiles = [],
  onLocateFile
}) => {
  return (
    <div className="flex-1 bg-[#10141a] flex flex-col p-2 select-none overflow-hidden border-b border-[#242c38]">
      {/* 7-Inch TFT Screen Outer Bezel */}
      <div className="flex-1 bg-[#090b0f] rounded-md border-2 border-[#1f2632] flex flex-col shadow-2xl overflow-hidden">
        {/* TFT Top Status Header (Permanent on M32 Display) */}
        <div className="h-6 bg-[#121620] border-b border-[#222a38] px-3 flex items-center justify-between text-[10px] font-mono select-none">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-black">
              CH{selectedChannel.number < 10 ? '0' : ''}{selectedChannel.number} : {selectedChannel.name}
            </span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">SCENE: 01 NOMINAL</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-zinc-300 font-bold">AES50-A</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-zinc-300 font-bold">DN32-USB</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-zinc-300 font-bold">48.0k INT</span>
            </div>
          </div>
        </div>

        {/* TFT Screen Main Content Body */}
        <div className="flex-1 overflow-hidden relative">
          {(activeTab === 'MIXER' || activeTab === 'HOME') && (
            <HomeView
              channel={selectedChannel}
              onUpdateChannel={onUpdateChannel}
              userAudioFiles={userAudioFiles}
            />
          )}
          {(activeTab === 'CHANNEL' || activeTab === 'CONFIG') && (
            <ChannelView
              channel={selectedChannel}
              onUpdateChannel={onUpdateChannel}
              userAudioFiles={userAudioFiles}
              onImportAudioFiles={onImportAudioFiles}
            />
          )}
          {activeTab === 'GATE' && (
            <GateView channel={selectedChannel} onUpdateChannel={onUpdateChannel} />
          )}
          {activeTab === 'DYN' && (
            <DynView channel={selectedChannel} onUpdateChannel={onUpdateChannel} />
          )}
          {activeTab === 'EQ' && (
            <EqView channel={selectedChannel} onUpdateChannel={onUpdateChannel} rtaData={rtaData} />
          )}
          {activeTab === 'SENDS' && (
            <SendsView channel={selectedChannel} onUpdateChannel={onUpdateChannel} />
          )}
          {activeTab === 'MAIN' && (
            <HomeView
              channel={selectedChannel}
              onUpdateChannel={onUpdateChannel}
              userAudioFiles={userAudioFiles}
            />
          )}
          {activeTab === 'METERS' && (
            <MetersView
              channels={channels}
              buses={buses}
              matrixes={matrixes}
              mainLeftMeter={mainLeftMeter}
              mainRightMeter={mainRightMeter}
              monoMeter={monoMeter}
              rtaData={rtaData}
            />
          )}
          {activeTab === 'ROUTING' && (
            <RoutingView
              routing={routing}
              onUpdateRouting={onUpdateRouting}
              channels={channels}
              onUpdateChannel={onUpdateChannelById || ((id, p) => { if (id === selectedChannel.id) onUpdateChannel(p); })}
              userAudioFiles={userAudioFiles}
              onImportAudioFiles={onImportAudioFiles}
              missingFiles={missingFiles}
              onLocateFile={onLocateFile}
            />
          )}
          {activeTab === 'SETUP' && (
            <SetupView
              deviceConfig={deviceConfig}
              onUpdateDeviceConfig={onUpdateDeviceConfig}
              channels={channels}
              onUpdateChannel={onUpdateChannelById || ((id, p) => {
                if (id === selectedChannel.id) onUpdateChannel(p);
              })}
              onOpenAudioSetup={onOpenAudioSetup}
              mainLeftMeter={mainLeftMeter}
              mainRightMeter={mainRightMeter}
            />
          )}
          {activeTab === 'FX' && (
            <FxRackView fxSlots={fxSlots} onUpdateFXSlot={onUpdateFXSlot} />
          )}
          {activeTab === 'SCENES' && (
            <ScenesView
              channels={channels}
              buses={buses}
              dcas={dcas}
              masterFader={masterFader}
              onRecallScene={onRecallScene}
            />
          )}
          {activeTab === 'MUTE GRP' && (
            <MuteGrpView
              muteGroups={muteGroups}
              onToggleMuteGroup={onToggleMuteGroup}
              channels={channels}
              onAssignChannelMuteGroup={onAssignChannelMuteGroup}
            />
          )}
          {activeTab === 'UTILITY' && (
            <UtilityView
              onToggleTestSignal={onToggleTestSignal}
              isTestSignalActive={isTestSignalActive}
            />
          )}
          {activeTab === 'MONITOR' && <MonitorView />}
          {activeTab === 'LIBRARY' && <LibraryView />}
          {activeTab === 'TRAINING' && (
            <TrainingView
              channels={channels}
              masterFader={masterFader}
              sendsOnFaderActive={sendsOnFaderActive}
              onSelectChannel={onSelectChannelById}
              onNavigateTab={onSelectTab}
            />
          )}
        </div>
      </div>

      {/* Hardware 6 Push-Encoders and Cursor Navigation Bar */}
      <div className="h-10 bg-[#0c0f14] border-t border-[#1d232e] mt-1 px-3 flex items-center justify-between">
        {/* Navigation arrow buttons */}
        <div className="flex items-center gap-1">
          <button className="p-1 rounded bg-[#181d26] text-zinc-400 hover:text-white border border-zinc-700">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex flex-col gap-0.5">
            <button className="px-1 py-0.5 rounded bg-[#181d26] text-zinc-400 hover:text-white border border-zinc-700">
              <ChevronUp className="w-3 h-3" />
            </button>
            <button className="px-1 py-0.5 rounded bg-[#181d26] text-zinc-400 hover:text-white border border-zinc-700">
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <button className="p-1 rounded bg-[#181d26] text-zinc-400 hover:text-white border border-zinc-700">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 6 Hardware Push-Encoders Representation */}
        <div className="flex items-center gap-6">
          {[1, 2, 3, 4, 5, 6].map(encNum => (
            <div key={encNum} className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-600 shadow flex items-center justify-center cursor-pointer hover:border-amber-400">
                <div className="w-1 h-2 bg-amber-400 rounded-full" />
              </div>
              <span className="text-[7px] text-zinc-500 font-mono mt-0.5">ENC {encNum}</span>
            </div>
          ))}
        </div>

        <div className="text-[9px] font-mono text-zinc-500">
          PUSH & ROTARY ENCODERS 1-6
        </div>
      </div>
    </div>
  );
};
