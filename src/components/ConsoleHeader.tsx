import React, { useState, useEffect } from 'react';
import { Settings2, Download, FolderOpen, FolderPlus, Play, Square, Mic, Radio, BookOpen } from 'lucide-react';
import { AudioDeviceConfig } from '../types/mixer';
import { NativeBridge } from '../audio/NativeBridge';

interface ConsoleHeaderProps {
  deviceConfig: AudioDeviceConfig;
  onOpenAudioSetup: () => void;
  onOpenReleaseModal: () => void;
  onOpenManualModal: () => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  onImportAudioFiles: () => void;
  onToggleMultitrack: () => void;
  isMultitrackPlaying: boolean;
  onToggleLiveMic: () => void;
  isLiveMicActive: boolean;
  onToggleLoopback: () => void;
  isLoopbackActive: boolean;
  onOpenTraining: () => void;
}

export const ConsoleHeader: React.FC<ConsoleHeaderProps> = ({
  deviceConfig,
  onOpenAudioSetup,
  onOpenReleaseModal,
  onOpenManualModal,
  onSaveProject,
  onLoadProject,
  onImportAudioFiles,
  onToggleMultitrack,
  isMultitrackPlaying,
  onToggleLiveMic,
  isLiveMicActive,
  onToggleLoopback,
  isLoopbackActive,
  onOpenTraining
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const isTauri = NativeBridge.getInstance().isNativeTauri();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine status color and text based on honest environment check
  let statusBadgeColor = 'bg-amber-950/80 text-amber-300 border-amber-600/60';
  let statusDotColor = 'bg-amber-400';
  let statusText = deviceConfig.status;

  if (!isTauri) {
    statusBadgeColor = 'bg-amber-950/70 text-amber-200 border-amber-700/60 hover:bg-amber-900/60';
    statusDotColor = 'bg-amber-400';
    statusText = 'BROWSER PREVIEW • NATIVE AUDIO UNAVAILABLE';
  } else if (deviceConfig.status === 'INPUT CONNECTED' || deviceConfig.status === 'AUDIO ENGINE ONLINE') {
    statusBadgeColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60';
    statusDotColor = 'bg-emerald-400 animate-pulse';
  } else if (deviceConfig.status === 'AUDIO ENGINE OFFLINE' || deviceConfig.status === 'DEVICE LOST' || deviceConfig.status === 'AUDIO ERROR') {
    statusBadgeColor = 'bg-rose-950/80 text-rose-300 border-rose-600/60';
    statusDotColor = 'bg-rose-500';
  }

  return (
    <header className="h-11 bg-[#0b0d10] border-b border-[#242931] flex items-center justify-between px-3 text-xs select-none">
      {/* Left: Branding & Model */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-black font-black text-sm px-2 py-0.5 rounded-sm tracking-wider shadow-sm">
            RDWN
          </div>
          <div className="leading-tight">
            <span className="text-white font-extrabold tracking-wide text-[11px] block">M32 LIVE TRAINING SIMULATOR</span>
            <span className="text-[#8892a0] text-[9px] font-mono tracking-wider">
              {isTauri ? 'WINDOWS x64 NATIVE AUDIO WORKSTATION' : 'DESKTOP SIMULATOR • DEV PREVIEW'}
            </span>
          </div>
        </div>

        {/* Real Audio Status Pill */}
        <button
          onClick={onOpenAudioSetup}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-[10px] font-bold transition ${statusBadgeColor}`}
          title={
            !isTauri
              ? 'Browser Preview: Direct Windows WASAPI Loopback requires the Windows desktop application (.exe).'
              : 'Click to open Windows Audio Diagnostics & Device Router'
          }
        >
          <span className={`w-2 h-2 rounded-full ${statusDotColor}`}></span>
          <span>{statusText}</span>
          <span className="text-[9px] opacity-70 bg-black/40 px-1 py-0.5 rounded">
            {deviceConfig.sampleRate / 1000}kHz / {deviceConfig.bufferSize}spl
          </span>
        </button>
      </div>

      {/* Center: Live Audio Sources */}
      <div className="flex items-center gap-2">
        <button
          onClick={onImportAudioFiles}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded font-bold transition text-[11px] bg-[#181d24] text-amber-400 hover:bg-[#222934] border border-amber-500/50 shadow-sm"
          title="Import user audio files (MP3, WAV, FLAC, OGG, M4A, AAC) from Windows Explorer"
        >
          <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
          <span>IMPORT AUDIO</span>
        </button>

        <button
          onClick={onToggleMultitrack}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold transition text-[11px] ${
            isMultitrackPlaying
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-900/50'
              : 'bg-[#181d24] text-gray-300 hover:bg-[#222934] border border-[#2c3543]'
          }`}
          title="Multitrack Stems Player (Feed to CH 01-40)"
        >
          {isMultitrackPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
          <span>{isMultitrackPlaying ? 'STEMS (PLAYING)' : 'STEMS (STOPPED)'}</span>
        </button>

        <button
          onClick={onToggleLoopback}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold transition text-[11px] ${
            isLoopbackActive
              ? 'bg-red-600 text-white shadow-lg shadow-red-900/50 animate-pulse'
              : 'bg-[#181d24] text-red-400 hover:bg-[#222934] border border-red-500/50'
          }`}
          title="Route YouTube / Chrome / Windows Audio Loopback to CH 01 & CH 02"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>{isLoopbackActive ? 'YOUTUBE (ON)' : 'YOUTUBE / LOOPBACK'}</span>
        </button>

        <button
          onClick={onToggleLiveMic}
          className={`flex items-center gap-1 px-2.5 py-1 rounded font-bold transition text-[11px] ${
            isLiveMicActive
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50'
              : 'bg-[#181d24] text-gray-300 hover:bg-[#222934] border border-[#2c3543]'
          }`}
          title="Route Physical Microphone / VB-CABLE to CH 01"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>{isLiveMicActive ? 'MIC (ON)' : 'INPUT MIC (OFF)'}</span>
        </button>

        <button
          onClick={onOpenTraining}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#202733] hover:bg-[#2b3546] border border-blue-500/40 text-blue-400 font-bold transition text-[11px]"
          title="Open Training & Tutorial Mode"
        >
          <span>TRAINING</span>
        </button>
      </div>

      {/* Right: Actions, Clock, Setup */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSaveProject}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#181d24] hover:bg-[#222934] border border-[#2c3543] text-gray-300 transition text-[10px]"
          title="Save .rdwnmix Project"
        >
          <FolderOpen className="w-3 h-3" />
          <span>SAVE</span>
        </button>

        <button
          onClick={onLoadProject}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#181d24] hover:bg-[#222934] border border-[#2c3543] text-gray-300 transition text-[10px]"
          title="Load .rdwnmix Project"
        >
          <Download className="w-3 h-3" />
          <span>LOAD</span>
        </button>

        <button
          onClick={onOpenManualModal}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#181d24] hover:bg-[#222934] border border-[#2c3543] text-gray-300 transition text-[10px]"
          title="Open M32 Manual Reference"
        >
          <BookOpen className="w-3 h-3" />
          <span>MANUAL</span>
        </button>

        <button
          onClick={onOpenReleaseModal}
          className="flex items-center gap-1 px-2 py-1 rounded bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-bold transition text-[10px] shadow"
          title="Windows Desktop Installer (.exe)"
        >
          <Download className="w-3 h-3" />
          <span>WIN RELEASE (.EXE)</span>
        </button>

        <button
          onClick={onOpenAudioSetup}
          className="flex items-center gap-1 p-1 rounded bg-[#181d24] hover:bg-[#222934] border border-[#2c3543] text-gray-300 transition"
          title="Audio Engine Settings & Diagnostics"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>

        {/* Hardware Clock */}
        <div className="bg-[#050608] px-2 py-0.5 rounded border border-[#1f242c] font-mono text-amber-400 font-bold text-[11px]">
          {currentTime || '12:00:00'}
        </div>
      </div>
    </header>
  );
};
