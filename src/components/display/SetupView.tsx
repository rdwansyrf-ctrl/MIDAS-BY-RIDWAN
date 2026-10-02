import React, { useState } from 'react';
import { AudioDeviceConfig, ChannelState, ScribbleColor } from '../../types/mixer';

interface SetupViewProps {
  deviceConfig: AudioDeviceConfig;
  onUpdateDeviceConfig: (patch: Partial<AudioDeviceConfig>) => void;
  channels: ChannelState[];
  onUpdateChannel: (id: number, patch: Partial<ChannelState>) => void;
  onOpenAudioSetup: () => void;
  mainLeftMeter?: number;
  mainRightMeter?: number;
}

export const SetupView: React.FC<SetupViewProps> = ({
  deviceConfig,
  onUpdateDeviceConfig,
  channels,
  onUpdateChannel,
  onOpenAudioSetup,
  mainLeftMeter = -90,
  mainRightMeter = -90
}) => {
  const [activeSetupTab, setActiveSetupTab] = useState<'GLOBAL' | 'CONFIG' | 'SCRIBBLE' | 'NETWORK' | 'NATIVE_AUDIO'>('GLOBAL');
  const [selectedChForScribble, setSelectedChForScribble] = useState<number>(1);

  const colors: ScribbleColor[] = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
  const curCh = channels.find(c => c.id === selectedChForScribble) || channels[0];
  const ch1 = channels[0];
  const ch2 = channels[1];
  const hasSignal = ch1.meterLevel > -80 || ch2.meterLevel > -80 || mainLeftMeter > -80;

  return (
    <div className="h-full flex flex-col p-3 gap-2 text-xs font-mono text-zinc-300">
      <div className="flex justify-between items-center bg-[#151921] px-3 py-1.5 rounded border border-zinc-800">
        <div className="flex gap-2">
          {(['GLOBAL', 'CONFIG', 'SCRIBBLE', 'NETWORK', 'NATIVE_AUDIO'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSetupTab(tab)}
              className={`px-3 py-1 rounded text-[10px] font-bold transition ${
                activeSetupTab === tab ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
        <span className="text-zinc-400 text-[10px]">CONSOLE SYSTEM CONFIGURATION</span>
      </div>

      {activeSetupTab === 'GLOBAL' && (
        <div className="flex-1 bg-[#12161e] p-3 rounded border border-zinc-800 grid grid-cols-3 gap-4">
          <div className="bg-[#0b0e13] p-3 rounded border border-zinc-800 flex flex-col justify-between">
            <span className="text-amber-400 font-bold block mb-2">GENERAL PREFERENCES</span>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-amber-400" />
                <span>Confirm Pop-Ups / Scene Load</span>
              </label>
              <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-amber-400" />
                <span>Auto-Select Channel with Fader Touch</span>
              </label>
              <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-amber-400" />
                <span>Sends on Faders Return to Normal</span>
              </label>
            </div>
            <div className="text-[9px] text-zinc-500">Firmware v4.06-RDWN</div>
          </div>

          <div className="bg-[#0b0e13] p-3 rounded border border-zinc-800 flex flex-col justify-between">
            <span className="text-amber-400 font-bold block mb-2">PANNING MODE</span>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                <input type="radio" name="panMode" defaultChecked className="accent-amber-400" />
                <span>LR + M (Stereo LR + Independent Mono)</span>
              </label>
              <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                <input type="radio" name="panMode" className="accent-amber-400" />
                <span>LCR (Left-Center-Right Cinema Pan)</span>
              </label>
            </div>
            <div className="text-[9px] text-zinc-500">Default: LR+M</div>
          </div>

          <div className="bg-[#0b0e13] p-3 rounded border border-zinc-800 flex flex-col justify-between">
            <span className="text-amber-400 font-bold block mb-2">SURFACE BRIGHTNESS</span>
            <div className="flex flex-col gap-3 my-2">
              <div>
                <span className="text-[10px] text-zinc-400 block mb-0.5">MAIN SCREEN: 95%</span>
                <input type="range" min="10" max="100" defaultValue="95" className="w-full accent-amber-400" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block mb-0.5">LED ILLUMINATION: 85%</span>
                <input type="range" min="10" max="100" defaultValue="85" className="w-full accent-amber-400" />
              </div>
            </div>
            <div className="text-[9px] text-zinc-500">Daylight-Viewable TFT Display</div>
          </div>
        </div>
      )}

      {activeSetupTab === 'CONFIG' && (
        <div className="flex-1 bg-[#12161e] p-3 rounded border border-zinc-800 grid grid-cols-3 gap-4">
          <div className="bg-[#0b0e13] p-3 rounded border border-zinc-800 flex flex-col justify-between">
            <span className="text-amber-400 font-bold block mb-2">SAMPLE RATE</span>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onUpdateDeviceConfig({ sampleRate: 48000 })}
                className={`py-2 px-3 rounded font-bold border text-left flex justify-between ${
                  deviceConfig.sampleRate === 48000
                    ? 'bg-amber-500 text-black border-amber-300'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                }`}
              >
                <span>48.0 kHz (Live / Broadcast Standard)</span>
                {deviceConfig.sampleRate === 48000 && <span>ACTIVE</span>}
              </button>
              <button
                onClick={() => onUpdateDeviceConfig({ sampleRate: 44100 })}
                className={`py-2 px-3 rounded font-bold border text-left flex justify-between ${
                  deviceConfig.sampleRate === 44100
                    ? 'bg-amber-500 text-black border-amber-300'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                }`}
              >
                <span>44.1 kHz (CD Audio Standard)</span>
                {deviceConfig.sampleRate === 44100 && <span>ACTIVE</span>}
              </button>
            </div>
            <div className="text-[9px] text-zinc-500">Default: 48 kHz</div>
          </div>

          <div className="bg-[#0b0e13] p-3 rounded border border-zinc-800 flex flex-col justify-between">
            <span className="text-amber-400 font-bold block mb-2">WORD CLOCK SYNCHRONISATION</span>
            <div className="flex flex-col gap-1.5 text-[11px]">
              <span className="text-emerald-400 font-bold">LOCKED: INTERNAL CLOCK (LOCAL)</span>
              <span className="text-zinc-500 text-[10px]">Alternative Sync Sources:</span>
              <div className="text-[10px] text-zinc-400 pl-2">
                <div>• AES50 Port A</div>
                <div>• AES50 Port B</div>
                <div>• Expansion Card (DN32-USB)</div>
              </div>
            </div>
            <div className="text-[9px] text-emerald-400 font-bold">DIGITAL LOCK OK (Jitter &lt; 5ps)</div>
          </div>

          <div className="bg-[#0b0e13] p-3 rounded border border-zinc-800 flex flex-col justify-between">
            <span className="text-amber-400 font-bold block mb-2">BUS PRE-CONFIGURATION</span>
            <div className="text-[10px] text-zinc-300 flex flex-col gap-1">
              <span className="text-cyan-300 font-bold">8 Pre-fader Aux Sends</span>
              <span className="text-cyan-300 font-bold">4 Post-fader Aux Sends</span>
              <span className="text-cyan-300 font-bold">4 Subgroups</span>
            </div>
            <div className="text-[9px] text-zinc-500">16 Total Mix Buses</div>
          </div>
        </div>
      )}

      {activeSetupTab === 'SCRIBBLE' && (
        <div className="flex-1 bg-[#12161e] p-3 rounded border border-zinc-800 grid grid-cols-12 gap-3">
          <div className="col-span-4 bg-[#0b0e13] p-2 rounded border border-zinc-800 overflow-y-auto">
            <span className="text-[10px] font-bold text-amber-400 block mb-1">SELECT CHANNEL</span>
            <div className="flex flex-col gap-1">
              {channels.slice(0, 32).map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChForScribble(c.id)}
                  className={`py-1 px-2 rounded text-[10px] font-bold text-left flex justify-between ${
                    selectedChForScribble === c.id ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-300'
                  }`}
                >
                  <span>CH{c.number < 10 ? '0' : ''}{c.number}: {c.name}</span>
                  <span className={`w-2 h-2 rounded-full bg-${c.scribbleColor === 'white' ? 'zinc-300' : c.scribbleColor}-500`} />
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-8 bg-[#0b0e13] p-3 rounded border border-zinc-800 flex flex-col justify-around">
            <span className="text-amber-400 font-bold text-xs">
              EDIT SCRIBBLE STRIP : CH {curCh.number}
            </span>

            <div>
              <span className="text-[10px] text-zinc-400 block mb-1">CHANNEL NAME (CUSTOM TEXT):</span>
              <input
                type="text"
                value={curCh.name}
                onChange={e => onUpdateChannel(curCh.id, { name: e.target.value.toUpperCase() })}
                className="w-full bg-black border border-zinc-700 text-amber-300 font-bold px-3 py-1.5 rounded text-sm uppercase"
              />
            </div>

            <div>
              <span className="text-[10px] text-zinc-400 block mb-1">LCD BACKLIGHT COLOR:</span>
              <div className="grid grid-cols-4 gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => onUpdateChannel(curCh.id, { scribbleColor: color })}
                    className={`py-1.5 rounded text-[10px] font-bold uppercase border transition ${
                      curCh.scribbleColor === color
                        ? 'border-white ring-2 ring-amber-400 text-white'
                        : 'border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSetupTab === 'NETWORK' && (
        <div className="flex-1 bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-around">
          <span className="text-amber-400 font-bold text-xs">ETHERNET & REMOTE CONTROL NETWORK</span>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#0b0e13] p-3 rounded border border-zinc-800">
              <span className="text-zinc-400 text-[10px] block mb-1">IP ADDRESS:</span>
              <span className="text-amber-300 font-bold text-sm">192.168.1.150</span>
            </div>
            <div className="bg-[#0b0e13] p-3 rounded border border-zinc-800">
              <span className="text-zinc-400 text-[10px] block mb-1">SUBNET MASK:</span>
              <span className="text-amber-300 font-bold text-sm">255.255.255.0</span>
            </div>
            <div className="bg-[#0b0e13] p-3 rounded border border-zinc-800">
              <span className="text-zinc-400 text-[10px] block mb-1">GATEWAY:</span>
              <span className="text-amber-300 font-bold text-sm">192.168.1.1</span>
            </div>
          </div>
          <div className="bg-black/50 p-2 rounded border border-zinc-800 text-[10px] text-zinc-400">
            Supports OSC (Open Sound Control) protocol for iPad M32-Mix and PC remote control.
          </div>
        </div>
      )}

      {activeSetupTab === 'NATIVE_AUDIO' && (
        <div className="flex-1 bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-between overflow-y-auto gap-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-amber-400 font-bold text-xs block">REAL AUDIO SIGNAL FLOW & DIAGNOSTICS</span>
              <span className="text-[10px] text-zinc-500">Live PCM Signal Tracing from Windows to Master Output</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                hasSignal ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {hasSignal ? 'AUDIO SIGNAL DETECTED' : 'NO SIGNAL (SILENCE)'}
              </span>
              <button
                onClick={onOpenAudioSetup}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-[10px]"
              >
                DEVICE ROUTER
              </button>
            </div>
          </div>

          {/* Signal Flow Diagram */}
          <div className="bg-[#0b0e13] p-2.5 rounded border border-zinc-800 flex items-center justify-between text-center text-[10px]">
            <div className="bg-[#151a24] p-1.5 rounded border border-zinc-700 w-24">
              <span className="text-zinc-500 block text-[8px]">1. SOURCE</span>
              <span className="font-bold text-zinc-200 truncate block">{deviceConfig.backend}</span>
            </div>
            <span className="text-zinc-600 font-bold">→</span>
            <div className="bg-[#151a24] p-1.5 rounded border border-zinc-700 w-28">
              <span className="text-zinc-500 block text-[8px]">2. INPUT ROUTER</span>
              <span className="font-bold text-cyan-300 block">CH01 / CH02 ST</span>
            </div>
            <span className="text-zinc-600 font-bold">→</span>
            <div className="bg-[#151a24] p-1.5 rounded border border-zinc-700 w-32">
              <span className="text-zinc-500 block text-[8px]">3. 40-BIT DSP</span>
              <span className="font-bold text-amber-300 block">HPF/EQ/COMP</span>
            </div>
            <span className="text-zinc-600 font-bold">→</span>
            <div className="bg-[#151a24] p-1.5 rounded border border-zinc-700 w-28">
              <span className="text-zinc-500 block text-[8px]">4. MASTER LR</span>
              <span className="font-bold text-emerald-300 block">Fader & Limiter</span>
            </div>
            <span className="text-zinc-600 font-bold">→</span>
            <div className="bg-[#151a24] p-1.5 rounded border border-zinc-700 w-28">
              <span className="text-zinc-500 block text-[8px]">5. PLAYBACK</span>
              <span className="font-bold text-white block">WASAPI Out</span>
            </div>
          </div>

          {/* Diagnostic Metrics Table */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
              <span className="text-zinc-500 text-[9px] block">CH 01 PEAK:</span>
              <span className={`text-xs font-bold font-mono ${ch1.meterLevel > -80 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                {ch1.meterLevel <= -80 ? '-oo dBFS' : `${ch1.meterLevel.toFixed(1)} dBFS`}
              </span>
            </div>
            <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
              <span className="text-zinc-500 text-[9px] block">CH 02 PEAK:</span>
              <span className={`text-xs font-bold font-mono ${ch2.meterLevel > -80 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                {ch2.meterLevel <= -80 ? '-oo dBFS' : `${ch2.meterLevel.toFixed(1)} dBFS`}
              </span>
            </div>
            <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
              <span className="text-zinc-500 text-[9px] block">MAIN L/R PEAK:</span>
              <span className={`text-xs font-bold font-mono ${mainLeftMeter > -80 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                {mainLeftMeter <= -80 ? '-oo' : `${mainLeftMeter.toFixed(1)}`} / {mainRightMeter <= -80 ? '-oo' : `${mainRightMeter.toFixed(1)}`} dBFS
              </span>
            </div>
            <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
              <span className="text-zinc-500 text-[9px] block">MEASURED LATENCY:</span>
              <span className="text-xs font-bold text-amber-300 font-mono">
                {deviceConfig.latencyMs} ms ({deviceConfig.bufferSize} spl)
              </span>
            </div>
          </div>

          <div className="bg-black/60 p-2 rounded border border-zinc-800 text-[10px] text-zinc-400">
            <div className="flex justify-between">
              <span>Input Device: <strong>{deviceConfig.inputDevice}</strong></span>
              <span>Output Device: <strong>{deviceConfig.outputDevice}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
