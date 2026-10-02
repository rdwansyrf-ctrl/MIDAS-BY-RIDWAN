import React, { useState, useEffect, useRef } from 'react';
import {
  ChannelState,
  MixBusState,
  MatrixState,
  DCAState,
  MuteGroupState,
  FXSlot,
  RoutingState,
  AudioDeviceConfig,
  ActiveTab,
  BankLayer,
  Scene
} from './types/mixer';
import {
  createInitialChannels,
  createInitialMixBuses,
  createInitialMatrixes,
  createInitialDCAs,
  createInitialMuteGroups,
  createInitialFXSlots,
  createInitialRouting,
  createInitialAudioDeviceConfig
} from './data/initialMixerState';
import { AudioEngine } from './audio/AudioEngine';
import { NativeBridge } from './audio/NativeBridge';
import { ConsoleHeader } from './components/ConsoleHeader';
import { TopNav } from './components/TopNav';
import { BankSelector } from './components/BankSelector';
import { ChannelStrip } from './components/ChannelStrip';
import { MasterSection } from './components/MasterSection';
import { CentralDisplay } from './components/CentralDisplay';
import { WindowsAudioModal } from './components/WindowsAudioModal';
import { ReleasePackageModal } from './components/ReleasePackageModal';
import { ManualModal } from './components/ManualModal';

export default function App() {
  // Console state
  const [channels, setChannels] = useState<ChannelState[]>(createInitialChannels);
  const [buses, setBuses] = useState<MixBusState[]>(createInitialMixBuses);
  const [matrixes, setMatrixes] = useState<MatrixState[]>(createInitialMatrixes);
  const [dcas, setDcas] = useState<DCAState[]>(createInitialDCAs);
  const [muteGroups, setMuteGroups] = useState<MuteGroupState[]>(createInitialMuteGroups);
  const [fxSlots, setFxSlots] = useState<FXSlot[]>(createInitialFXSlots);
  const [routing, setRouting] = useState<RoutingState>(createInitialRouting);
  const [deviceConfig, setDeviceConfig] = useState<AudioDeviceConfig>(createInitialAudioDeviceConfig);

  // Navigation & selection
  const [activeTab, setActiveTab] = useState<ActiveTab>('MIXER');
  const [activeBank, setActiveBank] = useState<BankLayer>('1-16');
  const [selectedChannelId, setSelectedChannelId] = useState<number>(1);
  const [sendsOnFaderActive, setSendsOnFaderActive] = useState<boolean>(false);
  const [selectedBusForSends, setSelectedBusForSends] = useState<number>(1);

  // Master output state
  const [masterFader, setMasterFader] = useState<number>(-90); // starts at silence
  const [masterMuted, setMasterMuted] = useState<boolean>(false);
  const [masterSolo, setMasterSolo] = useState<boolean>(false);
  const [monoCenterFader, setMonoCenterFader] = useState<number>(-90);
  const [monoCenterMuted, setMonoCenterMuted] = useState<boolean>(false);

  // Stereo Link for CH01 & CH02 (Mandatory Stereo YouTube / Loopback Test)
  const [isStereoLinked12, setIsStereoLinked12] = useState<boolean>(true);

  // Real Audio Engine runtime meters (strictly 0 if no audio!)
  const [mainLeftMeter, setMainLeftMeter] = useState<number>(-90);
  const [mainRightMeter, setMainRightMeter] = useState<number>(-90);
  const [monoMeter, setMonoMeter] = useState<number>(-90);
  const [rtaData, setRtaData] = useState<number[]>(new Array(100).fill(-90));

  // Audio stream state
  const [isLiveMicActive, setIsLiveMicActive] = useState<boolean>(false);
  const [isLoopbackActive, setIsLoopbackActive] = useState<boolean>(false);
  const [isMultitrackPlaying, setIsMultitrackPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTestSignalActive, setIsTestSignalActive] = useState<boolean>(false);

  // User Imported Audio Files & Stems
  const [userAudioFiles, setUserAudioFiles] = useState<string[]>([]);
  const [userFileMetadata, setUserFileMetadata] = useState<{ name: string; path: string; duration: number }[]>([]);
  const [missingFiles, setMissingFiles] = useState<{ name: string; path?: string }[]>([]);

  // Hidden file inputs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const locateFileInputRef = useRef<HTMLInputElement | null>(null);
  const targetLocateFileNameRef = useRef<string | null>(null);

  // Modals
  const [isAudioModalOpen, setIsAudioModalOpen] = useState<boolean>(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState<boolean>(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);

  const audioEngine = useRef(AudioEngine.getInstance()).current;

  // Selected channel object
  const selectedChannel = channels.find(c => c.id === selectedChannelId) || channels[0];

  // Initialize audio engine on first user click anywhere
  useEffect(() => {
    const handleFirstClick = () => {
      audioEngine.initialize();
      window.removeEventListener('click', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);
    return () => window.removeEventListener('click', handleFirstClick);
  }, [audioEngine]);

  // Real-time audio polling animation loop for meters & RTA
  useEffect(() => {
    let animId: number;

    const pollMeters = () => {
      // 1. Fetch channel meters from Web Audio Analyser nodes
      const chMeters = audioEngine.getChannelMeters();
      if (chMeters && chMeters.length > 0) {
        setChannels(prev =>
          prev.map(c => {
            const m = chMeters.find(cm => cm.id === c.id);
            if (m) {
              return {
                ...c,
                meterLevel: m.level,
                gainReduction: m.gainReduction,
                gateOpen: m.gateOpen
              };
            }
            return c;
          })
        );
      }

      // 2. Fetch master meters
      const mm = audioEngine.getMasterMeters();
      setMainLeftMeter(mm.left);
      setMainRightMeter(mm.right);
      setMonoMeter(mm.mono);

      // 3. Fetch RTA spectrum data (100 bands)
      const rta = audioEngine.getRTAData();
      setRtaData(rta);

      animId = requestAnimationFrame(pollMeters);
    };

    animId = requestAnimationFrame(pollMeters);
    return () => cancelAnimationFrame(animId);
  }, [audioEngine]);

  // Sync Master Faders to Audio Engine
  useEffect(() => {
    audioEngine.updateMasterFader(masterFader, masterMuted);
  }, [masterFader, masterMuted, audioEngine]);

  useEffect(() => {
    audioEngine.updateMonoCenterFader(monoCenterFader, monoCenterMuted);
  }, [monoCenterFader, monoCenterMuted, audioEngine]);

  // Sync Channels to Audio Engine (including DCA scaling and Solo-In-Place)
  useEffect(() => {
    const anySolo = channels.some(c => c.solo);
    channels.forEach(ch => {
      // Check if any active mute group includes this channel
      const isMuteGroupActive = muteGroups.some(mg => mg.active && ch.muteGroups.includes(mg.id));
      // Solo-In-Place: when any channel is soloed, any non-soloed channel is muted in the mix
      const isMutedBySolo = anySolo && !ch.solo;

      // Calculate DCA multiplier
      let dcaMultiplier = 1.0;
      if (ch.dcaGroup > 0) {
        const dca = dcas.find(d => d.id === ch.dcaGroup);
        if (dca) {
          if (dca.muted) {
            dcaMultiplier = 0;
          } else {
            dcaMultiplier = Math.pow(10, dca.fader / 20);
          }
        }
      }

      const effectiveChannel = {
        ...ch,
        muted: ch.muted || isMuteGroupActive || isMutedBySolo
      };

      audioEngine.updateChannel(effectiveChannel, dcaMultiplier);
    });
  }, [channels, dcas, muteGroups, audioEngine]);

  // --- Handlers ---

  const handleToggleStereoLink12 = () => {
    const nextLinked = !isStereoLinked12;
    setIsStereoLinked12(nextLinked);
    NativeBridge.getInstance().setStereoLink(nextLinked);

    setChannels(prev =>
      prev.map(c => {
        if (c.id === 1) {
          return {
            ...c,
            stereoLinked: nextLinked,
            pan: nextLinked ? -100 : 0,
            name: nextLinked ? 'YOUTUBE L' : 'CH 01',
            source: nextLinked ? 'LOOPBACK L' : 'IN 01'
          };
        }
        if (c.id === 2) {
          const ch1 = prev.find(ch => ch.id === 1);
          return {
            ...c,
            stereoLinked: nextLinked,
            pan: nextLinked ? 100 : 0,
            name: nextLinked ? 'YOUTUBE R' : 'CH 02',
            source: nextLinked ? 'LOOPBACK R' : 'IN 02',
            fader: nextLinked && ch1 ? ch1.fader : c.fader,
            muted: nextLinked && ch1 ? ch1.muted : c.muted
          };
        }
        return c;
      })
    );
  };

  const handleUpdateChannel = (id: number, patch: Partial<ChannelState>) => {
    setChannels(prev => {
      if (isStereoLinked12 && (id === 1 || id === 2)) {
        const otherId = id === 1 ? 2 : 1;
        // Exclude pan from being linked symmetrically
        const linkedPatch = { ...patch };
        delete linkedPatch.pan;
        delete linkedPatch.name;
        delete linkedPatch.source;

        return prev.map(c => {
          if (c.id === id) return { ...c, ...patch };
          if (c.id === otherId) return { ...c, ...linkedPatch };
          return c;
        });
      }
      return prev.map(c => (c.id === id ? { ...c, ...patch } : c));
    });

    // Update real audio DSP source immediately
    if (patch.source !== undefined) {
      audioEngine.setChannelSource(id, patch.source);
    }

    if (patch.fader !== undefined) {
      NativeBridge.getInstance().setChannelFader(id - 1, patch.fader);
      if (isStereoLinked12 && (id === 1 || id === 2)) {
        NativeBridge.getInstance().setChannelFader(id === 1 ? 1 : 0, patch.fader);
      }
    }
    if (patch.preampGain !== undefined) {
      NativeBridge.getInstance().setChannelGain(id - 1, patch.preampGain);
      if (isStereoLinked12 && (id === 1 || id === 2)) {
        NativeBridge.getInstance().setChannelGain(id === 1 ? 1 : 0, patch.preampGain);
      }
    }
  };

  const handleToggleMute = (id: number) => {
    setChannels(prev => {
      if (isStereoLinked12 && (id === 1 || id === 2)) {
        const target = prev.find(c => c.id === id);
        const nextMute = target ? !target.muted : false;
        return prev.map(c => (c.id === 1 || c.id === 2 ? { ...c, muted: nextMute } : c));
      }
      return prev.map(c => (c.id === id ? { ...c, muted: !c.muted } : c));
    });
  };

  const handleToggleSolo = (id: number) => {
    setChannels(prev => {
      if (isStereoLinked12 && (id === 1 || id === 2)) {
        const target = prev.find(c => c.id === id);
        const nextSolo = target ? !target.solo : false;
        return prev.map(c => (c.id === 1 || c.id === 2 ? { ...c, solo: nextSolo } : c));
      }
      return prev.map(c => (c.id === id ? { ...c, solo: !c.solo } : c));
    });
  };

  const handleClearAllSolo = () => {
    setChannels(prev => prev.map(c => ({ ...c, solo: false })));
    setBuses(prev => prev.map(b => ({ ...b, solo: false })));
    setMatrixes(prev => prev.map(m => ({ ...m, solo: false })));
    setMasterSolo(false);
  };

  const handleToggleMuteGroup = (groupId: number) => {
    setMuteGroups(prev =>
      prev.map(mg => (mg.id === groupId ? { ...mg, active: !mg.active } : mg))
    );
  };

  const handleAssignChannelMuteGroup = (channelId: number, muteGroupId: number) => {
    setChannels(prev =>
      prev.map(c => {
        if (c.id !== channelId) return c;
        const exists = c.muteGroups.includes(muteGroupId);
        const newGroups = exists
          ? c.muteGroups.filter(g => g !== muteGroupId)
          : [...c.muteGroups, muteGroupId];
        return { ...c, muteGroups: newGroups };
      })
    );
  };

  const handleSendFaderChange = (channelId: number, busId: number, levelDb: number) => {
    setChannels(prev =>
      prev.map(c => {
        if (c.id !== channelId) return c;
        const updatedSends = c.sends.map(s => (s.busId === busId ? { ...s, level: levelDb } : s));
        return { ...c, sends: updatedSends };
      })
    );
  };

  // User Audio Files Import (Windows File Explorer)
  const handleImportAudioFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await audioEngine.initialize();

    const newNames: string[] = [];
    const newMeta: { name: string; path: string; duration: number }[] = [];

    // Decode and register each file into PCM AudioBuffer
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const decoded = await audioEngine.decodeAndRegisterAudioFile(file);
        newNames.push(decoded.name);
        newMeta.push({
          name: decoded.name,
          path: (file as any).path || file.name,
          duration: decoded.duration
        });
      } catch (err) {
        console.error(`Failed to decode audio file ${file.name}:`, err);
      }
    }

    if (newNames.length === 0) return;

    setUserAudioFiles(prev => Array.from(new Set([...prev, ...newNames])));
    setUserFileMetadata(prev => [...prev.filter(m => !newNames.includes(m.name)), ...newMeta]);
    setMissingFiles(prev => prev.filter(m => !newNames.includes(m.name)));

    // Smart assignment: assign newly imported files to successive channels
    // Start at selectedChannelId or first available channel
    setChannels(prev => {
      let fileIdx = 0;
      const startId = (prev.find(c => c.id === selectedChannelId)?.source.startsWith('IN ') ? selectedChannelId : 1);

      return prev.map(c => {
        if (fileIdx < newNames.length && (c.id >= startId || prev.every(ch => !ch.source.startsWith('File: ') && ch.source.startsWith('IN ')))) {
          const fileName = newNames[fileIdx];
          fileIdx++;

          const cleanStem = fileName.replace(/\.[^/.]+$/, '').toUpperCase().slice(0, 10);
          audioEngine.setChannelSource(c.id, fileName);

          return {
            ...c,
            source: fileName,
            name: cleanStem,
            fader: c.fader <= -80 ? 0 : c.fader,
            muted: false,
            mainLRAssign: true
          };
        }
        return c;
      });
    });

    if (masterFader <= -80) {
      setMasterFader(0);
    }

    e.target.value = '';
  };

  const handleLocateFile = (fileName: string) => {
    targetLocateFileNameRef.current = fileName;
    locateFileInputRef.current?.click();
  };

  const handleLocateFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const decoded = await audioEngine.decodeAndRegisterAudioFile(file);
      const targetName = targetLocateFileNameRef.current || file.name;

      setUserAudioFiles(prev => Array.from(new Set([...prev, decoded.name, targetName])));
      setMissingFiles(prev => prev.filter(m => m.name !== targetName && m.name !== file.name));

      // Reconnect any channel using this source
      channels.forEach(ch => {
        if (ch.source === targetName || ch.source === file.name) {
          audioEngine.setChannelSource(ch.id, decoded.name);
        }
      });
    } catch (err) {
      console.error('Failed to locate audio file:', err);
    }

    e.target.value = '';
    targetLocateFileNameRef.current = null;
  };

  // Toggle YouTube / Windows System Loopback Capture
  const handleToggleLoopback = async () => {
    if (isLoopbackActive) {
      audioEngine.stopLiveInput();
      setIsLoopbackActive(false);
      setDeviceConfig(prev => ({
        ...prev,
        status: NativeBridge.getInstance().isNativeTauri() ? 'NO INPUT SIGNAL' : 'BROWSER PREVIEW • NATIVE AUDIO UNAVAILABLE'
      }));
    } else {
      if (NativeBridge.getInstance().isNativeTauri()) {
        const ok = await NativeBridge.getInstance().startWasapiLoopback();
        if (ok) {
          setIsLoopbackActive(true);
          handleUpdateChannel(1, { source: 'LOOPBACK L', name: 'YOUTUBE L', pan: -100, fader: 0, muted: false, mainLRAssign: true });
          handleUpdateChannel(2, { source: 'LOOPBACK R', name: 'YOUTUBE R', pan: 100, fader: 0, muted: false, mainLRAssign: true });
          setIsStereoLinked12(true);
          if (masterFader <= -80) setMasterFader(0);
          setDeviceConfig(prev => ({ ...prev, status: 'INPUT CONNECTED' }));
        }
      } else {
        const res = await audioEngine.startSystemLoopback(1, 2);
        if (res.success) {
          setIsLoopbackActive(true);
          handleUpdateChannel(1, { source: 'LOOPBACK L', name: 'YOUTUBE L', pan: -100, fader: 0, muted: false, mainLRAssign: true });
          handleUpdateChannel(2, { source: 'LOOPBACK R', name: 'YOUTUBE R', pan: 100, fader: 0, muted: false, mainLRAssign: true });
          setIsStereoLinked12(true);
          if (masterFader <= -80) setMasterFader(0);
          setDeviceConfig(prev => ({ ...prev, status: 'INPUT CONNECTED' }));
        }
      }
    }
  };

  // Toggle Live Microphone / Windows Line In
  const handleToggleLiveMic = async () => {
    if (isLiveMicActive) {
      audioEngine.stopLiveInput();
      setIsLiveMicActive(false);
      setDeviceConfig(prev => ({
        ...prev,
        status: NativeBridge.getInstance().isNativeTauri() ? 'NO INPUT SIGNAL' : 'BROWSER PREVIEW • NATIVE AUDIO UNAVAILABLE'
      }));
    } else {
      const res = await audioEngine.startLiveInput();
      if (res.success) {
        setIsLiveMicActive(true);
        // Unmute channel 1 & channel 2 and set to nominal unity fader
        handleUpdateChannel(1, { fader: 0, preampGain: 12, muted: false });
        handleUpdateChannel(2, { fader: 0, preampGain: 12, muted: false });
        if (masterFader <= -80) setMasterFader(0);
        setDeviceConfig(prev => ({
          ...prev,
          status: 'INPUT CONNECTED'
        }));
      }
    }
  };

  // Toggle Multitrack stems
  const handleToggleMultitrack = () => {
    if (isMultitrackPlaying) {
      audioEngine.pauseMultitrack();
      setIsMultitrackPlaying(false);
    } else {
      audioEngine.playMultitrack(channels);
      setIsMultitrackPlaying(true);
      if (masterFader <= -80) setMasterFader(0);
    }
  };

  // Real-time WAV recording
  const handleStartRecord = () => {
    const ok = audioEngine.startRecording();
    if (ok) setIsRecording(true);
  };

  const handleStopRecord = async () => {
    const blob = await audioEngine.stopRecording();
    setIsRecording(false);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RDWN_M32_Mix_Capture_${Date.now()}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Project Save / Load (.rdwnmix)
  const handleSaveProject = () => {
    const projectData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      channels,
      buses,
      matrixes,
      dcas,
      muteGroups,
      fxSlots,
      routing,
      masterFader,
      monoCenterFader,
      userAudioFiles: userFileMetadata
    };
    NativeBridge.getInstance().saveNativeProjectFile(
      'Session_RDWN_M32',
      JSON.stringify(projectData, null, 2)
    );
  };

  const handleLoadProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.rdwnmix,application/json';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = ev => {
          try {
            const data = JSON.parse(ev.target?.result as string);
            if (data.channels) {
              setChannels(data.channels);
              data.channels.forEach((c: ChannelState) => {
                if (c.source && audioEngine.hasAudioFile(c.source)) {
                  audioEngine.setChannelSource(c.id, c.source);
                }
              });
            }
            if (data.buses) setBuses(data.buses);
            if (data.dcas) setDcas(data.dcas);
            if (data.routing) setRouting(data.routing);
            if (typeof data.masterFader === 'number') setMasterFader(data.masterFader);

            if (data.userAudioFiles && Array.isArray(data.userAudioFiles)) {
              const registered = audioEngine.getRegisteredAudioFiles();
              const missing: { name: string; path?: string }[] = [];
              const available: string[] = [];

              data.userAudioFiles.forEach((f: any) => {
                if (registered.includes(f.name)) {
                  available.push(f.name);
                } else {
                  missing.push({ name: f.name, path: f.path });
                }
              });

              setUserAudioFiles(prev => Array.from(new Set([...prev, ...available])));
              setMissingFiles(missing);
            }
          } catch (err) {
            console.error('Invalid .rdwnmix project file:', err);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleRecallScene = (scene: Scene) => {
    if (scene.masterFader !== undefined) setMasterFader(scene.masterFader);
  };

  const handleToggleTestSignal = (type: 'sine' | 'pink' | 'white', levelDb: number) => {
    const active = audioEngine.toggleTestSignal(type, levelDb, 1);
    setIsTestSignalActive(active);
    if (active) {
      handleUpdateChannel(1, { fader: 0, muted: false });
      if (masterFader <= -80) setMasterFader(0);
    }
    return active;
  };

  // Determine which 16 faders to display according to activeBank
  const getVisibleChannels = () => {
    if (activeBank === '1-16') return channels.slice(0, 16);
    if (activeBank === '17-32') return channels.slice(16, 32);
    if (activeBank === 'AUX') return channels.slice(32, 40);
    // User layers
    if (activeBank === 'USER 1') return channels.slice(0, 16);
    if (activeBank === 'USER 2') return channels.slice(16, 32);
    return channels.slice(0, 16);
  };

  const visibleChannels = getVisibleChannels();
  const hasActiveSolo = channels.some(c => c.solo) || masterSolo;

  return (
    <div className="w-screen h-screen bg-[#080a0d] text-white flex flex-col overflow-hidden font-sans select-none">
      {/* 1. Header Toolbar */}
      <ConsoleHeader
        deviceConfig={deviceConfig}
        onOpenAudioSetup={() => setIsAudioModalOpen(true)}
        onOpenReleaseModal={() => setIsReleaseModalOpen(true)}
        onOpenManualModal={() => setIsManualModalOpen(true)}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onImportAudioFiles={handleImportAudioFiles}
        onToggleMultitrack={handleToggleMultitrack}
        isMultitrackPlaying={isMultitrackPlaying}
        onToggleLiveMic={handleToggleLiveMic}
        isLiveMicActive={isLiveMicActive}
        onToggleLoopback={handleToggleLoopback}
        isLoopbackActive={isLoopbackActive}
        onOpenTraining={() => setActiveTab('TRAINING')}
      />

      {/* Hidden File Pickers for Windows Audio Files (MP3, WAV, FLAC, OGG, M4A, AAC) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".mp3,.wav,.flac,.ogg,.m4a,.aac,audio/mpeg,audio/wav,audio/flac,audio/ogg,audio/x-m4a,audio/aac,audio/*"
        className="hidden"
        onChange={handleFilesSelected}
      />
      <input
        ref={locateFileInputRef}
        type="file"
        accept=".mp3,.wav,.flac,.ogg,.m4a,.aac,audio/*"
        className="hidden"
        onChange={handleLocateFileSelected}
      />

      {/* 2. Top Navigation Tabs */}
      <TopNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* 3. Main Console Workspace (Bank Selector + Central Area + Master Section) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Bank / Layer Selection */}
        <BankSelector
          activeBank={activeBank}
          onSelectBank={setActiveBank}
          sendsOnFaderActive={sendsOnFaderActive}
          onToggleSendsOnFader={() => setSendsOnFaderActive(!sendsOnFaderActive)}
          selectedBusForSends={selectedBusForSends}
          onSelectBusForSends={setSelectedBusForSends}
        />

        {/* Central Console Surface: TFT Central Display + 16 Channel Fader Strips */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0c0f14]">
          {/* Central 7-inch TFT Main Display */}
          <CentralDisplay
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            selectedChannel={selectedChannel}
            onUpdateChannel={patch => handleUpdateChannel(selectedChannel.id, patch)}
            onUpdateChannelById={handleUpdateChannel}
            channels={channels}
            buses={buses}
            matrixes={matrixes}
            dcas={dcas}
            muteGroups={muteGroups}
            fxSlots={fxSlots}
            routing={routing}
            deviceConfig={deviceConfig}
            onUpdateRouting={patch => setRouting(prev => ({ ...prev, ...patch }))}
            onUpdateDeviceConfig={patch => setDeviceConfig(prev => ({ ...prev, ...patch }))}
            onUpdateFXSlot={(slotId, patch) =>
              setFxSlots(prev => prev.map(s => (s.id === slotId ? { ...s, ...patch } : s)))
            }
            onToggleMuteGroup={handleToggleMuteGroup}
            onAssignChannelMuteGroup={handleAssignChannelMuteGroup}
            onRecallScene={handleRecallScene}
            onOpenAudioSetup={() => setIsAudioModalOpen(true)}
            onToggleTestSignal={handleToggleTestSignal}
            isTestSignalActive={isTestSignalActive}
            rtaData={rtaData}
            mainLeftMeter={mainLeftMeter}
            mainRightMeter={mainRightMeter}
            monoMeter={monoMeter}
            masterFader={masterFader}
            sendsOnFaderActive={sendsOnFaderActive}
            onSelectChannelById={setSelectedChannelId}
            userAudioFiles={userAudioFiles}
            onImportAudioFiles={handleImportAudioFiles}
            missingFiles={missingFiles}
            onLocateFile={handleLocateFile}
          />

          {/* Lower 16-Channel Hardware Fader Deck */}
          <section className="h-80 bg-[#0e1218] border-t border-[#232b37] flex overflow-x-auto select-none no-scrollbar">
            {visibleChannels.map(ch => (
              <ChannelStrip
                key={ch.id}
                channel={ch}
                isSelected={ch.id === selectedChannelId}
                onSelect={() => setSelectedChannelId(ch.id)}
                onFaderChange={valDb => handleUpdateChannel(ch.id, { fader: valDb })}
                onPanChange={panVal => handleUpdateChannel(ch.id, { pan: panVal })}
                onToggleMute={() => handleToggleMute(ch.id)}
                onToggleSolo={() => handleToggleSolo(ch.id)}
                onToggleStereoLink={ch.id === 1 || ch.id === 2 ? handleToggleStereoLink12 : undefined}
                isStereoLinked={(ch.id === 1 || ch.id === 2) && isStereoLinked12}
                stereoRole={ch.id === 1 ? 'L' : ch.id === 2 ? 'R' : undefined}
                sendsOnFaderActive={sendsOnFaderActive}
                selectedBusId={selectedBusForSends}
                onSendFaderChange={(busId, levelDb) => handleSendFaderChange(ch.id, busId, levelDb)}
              />
            ))}
          </section>
        </main>

        {/* Right Master / Output Bay */}
        <MasterSection
          masterFader={masterFader}
          onMasterFaderChange={setMasterFader}
          masterMuted={masterMuted}
          onToggleMasterMute={() => setMasterMuted(!masterMuted)}
          masterSolo={masterSolo}
          onToggleMasterSolo={() => setMasterSolo(!masterSolo)}
          monoCenterFader={monoCenterFader}
          onMonoCenterFaderChange={setMonoCenterFader}
          monoCenterMuted={monoCenterMuted}
          onToggleMonoCenterMute={() => setMonoCenterMuted(!monoCenterMuted)}
          leftMeterDb={mainLeftMeter}
          rightMeterDb={mainRightMeter}
          monoMeterDb={monoMeter}
          onClearSolo={handleClearAllSolo}
          hasActiveSolo={hasActiveSolo}
          onStartRecord={handleStartRecord}
          onStopRecord={handleStopRecord}
          isRecording={isRecording}
          onSelectUtilityTab={setActiveTab}
        />
      </div>

      {/* Modals */}
      <WindowsAudioModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        config={deviceConfig}
        onSaveConfig={patch => setDeviceConfig(prev => ({ ...prev, ...patch }))}
      />

      <ReleasePackageModal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
      />

      <ManualModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
      />
    </div>
  );
}
