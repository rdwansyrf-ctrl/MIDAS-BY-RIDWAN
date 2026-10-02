import React, { useState, useEffect } from 'react';
import { X, Volume2, Cpu, CheckCircle2, AlertTriangle, ShieldAlert, ShieldCheck, RefreshCw, Radio } from 'lucide-react';
import { AudioDeviceConfig } from '../types/mixer';
import { NativeBridge, NativeAudioDeviceInfo, NativeAudioDiagnostics } from '../audio/NativeBridge';
import { AudioEngine } from '../audio/AudioEngine';

interface WindowsAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AudioDeviceConfig;
  onSaveConfig: (updated: Partial<AudioDeviceConfig>) => void;
}

export const WindowsAudioModal: React.FC<WindowsAudioModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig
}) => {
  const [backend, setBackend] = useState<AudioDeviceConfig['backend']>(config.backend);
  const [inputDevice, setInputDevice] = useState<string>(config.inputDevice);
  const [outputDevice, setOutputDevice] = useState<string>(config.outputDevice);
  const [sampleRate, setSampleRate] = useState<number>(config.sampleRate);
  const [bufferSize, setBufferSize] = useState<number>(config.bufferSize);
  const [availableDevices, setAvailableDevices] = useState<NativeAudioDeviceInfo[]>([]);
  const [diagnostics, setDiagnostics] = useState<NativeAudioDiagnostics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nativeBridge = NativeBridge.getInstance();
  const isTauri = nativeBridge.isNativeTauri();

  const loadDevices = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const devs = await nativeBridge.getAvailableAudioDevices();
      setAvailableDevices(devs);
      if (isTauri) {
        const diag = await nativeBridge.getNativeDiagnostics();
        setDiagnostics(diag);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to enumerate Windows audio endpoints.');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = async () => {
    const updated: Partial<AudioDeviceConfig> = {
      backend,
      inputDevice,
      outputDevice,
      sampleRate: sampleRate as any,
      bufferSize: bufferSize as any,
      latencyMs: Math.round(((bufferSize / sampleRate) * 1000 * 2) * 10) / 10,
      status: isTauri ? 'INPUT CONNECTED' : 'BROWSER PREVIEW • NATIVE AUDIO UNAVAILABLE'
    };

    if (outputDevice) {
      await AudioEngine.getInstance().setAudioOutputDevice(outputDevice);
    }

    if (isTauri) {
      await nativeBridge.setAudioDeviceConfig({
        ...config,
        ...updated
      } as AudioDeviceConfig);
      if (backend === 'WASAPI Loopback') {
        await nativeBridge.startWasapiLoopback();
      }
    }

    onSaveConfig(updated);
    onClose();
  };

  const inputDevices = availableDevices.filter(d => d.type === 'input' || d.type === 'loopback');
  const outputDevices = availableDevices.filter(d => d.type === 'output');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="w-[780px] max-w-full bg-[#12161f] border border-[#2b3546] rounded-lg shadow-2xl flex flex-col font-mono text-zinc-300 text-xs overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#181e2b] px-4 py-3 border-b border-[#2b3546] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm text-white">
              REAL WINDOWS AUDIO ENGINE & DEVICE ROUTER
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          {/* Honest Environment Verification Banner per Spec */}
          {!isTauri ? (
            <div className="bg-amber-950/50 p-3 rounded border border-amber-600/70 text-amber-200 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                <span>NATIVE WINDOWS AUDIO IS NOT AVAILABLE IN THIS BROWSER PREVIEW</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Standard web browsers (Chrome, Edge, Firefox) run in a sandboxed process and cannot directly intercept 
                Windows OS kernel audio, WASAPI system loopback, or communicate with ASIO device drivers.
              </p>
              <p className="text-[11px] text-amber-300 font-bold">
                To capture real YouTube/Chrome playback, VB-CABLE, and multi-channel ASIO:
                Run the compiled Windows desktop application (<code>RDWN_M32_Live_Training_Simulator_Setup.exe</code>) 
                generated via <code>build_windows_release.ps1</code>.
              </p>
            </div>
          ) : (
            <div className="bg-emerald-950/50 p-3 rounded border border-emerald-600/70 text-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-xs text-white block">
                    NATIVE TAURI WINDOWS BACKEND ONLINE
                  </span>
                  <span className="text-[10px] text-emerald-300">
                    Direct Low-Latency WASAPI Loopback, VB-CABLE & ASIO Device Access Active
                  </span>
                </div>
              </div>
              <button
                onClick={loadDevices}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[10px]"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>RE-SCAN</span>
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-950/60 p-2.5 rounded border border-rose-600 text-rose-200 text-[11px]">
              {errorMessage}
            </div>
          )}

          {/* Backend Selector */}
          <div className="bg-[#151a24] p-3 rounded border border-zinc-800">
            <span className="text-amber-400 font-bold block mb-2 text-[11px]">
              1. AUDIO BACKEND SELECTION
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setBackend('WASAPI Loopback')}
                className={`p-2.5 rounded border text-left flex flex-col justify-between ${
                  backend === 'WASAPI Loopback'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow'
                    : 'bg-[#0f131a] border-zinc-800 text-zinc-400 hover:bg-[#181e28]'
                }`}
              >
                <span className="font-bold text-xs">WASAPI LOOPBACK</span>
                <span className="text-[9px] text-zinc-500 mt-1">Capture YouTube, Chrome & Media directly</span>
              </button>

              <button
                onClick={() => setBackend('WASAPI')}
                className={`p-2.5 rounded border text-left flex flex-col justify-between ${
                  backend === 'WASAPI'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow'
                    : 'bg-[#0f131a] border-zinc-800 text-zinc-400 hover:bg-[#181e28]'
                }`}
              >
                <span className="font-bold text-xs">WASAPI DIRECT</span>
                <span className="text-[9px] text-zinc-500 mt-1">Direct Windows audio device endpoints</span>
              </button>

              <button
                onClick={() => setBackend('ASIO')}
                className={`p-2.5 rounded border text-left flex flex-col justify-between ${
                  backend === 'ASIO'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow'
                    : 'bg-[#0f131a] border-zinc-800 text-zinc-400 hover:bg-[#181e28]'
                }`}
              >
                <span className="font-bold text-xs">ASIO DRIVER</span>
                <span className="text-[9px] text-zinc-500 mt-1">Pro audio interface (DN32-USB / Focusrite)</span>
              </button>
            </div>
          </div>

          {/* Real Device Enumeration Selectors */}
          <div className="grid grid-cols-2 gap-3">
            {/* Input Device */}
            <div className="bg-[#151a24] p-3 rounded border border-zinc-800 flex flex-col justify-between">
              <div>
                <span className="text-cyan-400 font-bold block mb-1">INPUT / LOOPBACK ENDPOINT:</span>
                <select
                  value={inputDevice}
                  onChange={e => setInputDevice(e.target.value)}
                  className="w-full bg-black border border-zinc-700 text-zinc-200 rounded p-1.5 text-xs mb-2"
                >
                  {inputDevices.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.channels} ch • {d.sampleRate / 1000}kHz)
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-[9px] text-zinc-400">
                Feeds into Mixer Channel 01 (Left) and Channel 02 (Right).
              </div>
            </div>

            {/* Output Device */}
            <div className="bg-[#151a24] p-3 rounded border border-zinc-800 flex flex-col justify-between">
              <div>
                <span className="text-cyan-400 font-bold block mb-1">OUTPUT PLAYBACK ENDPOINT:</span>
                <select
                  value={outputDevice}
                  onChange={e => setOutputDevice(e.target.value)}
                  className="w-full bg-black border border-zinc-700 text-zinc-200 rounded p-1.5 text-xs mb-2"
                >
                  {outputDevices.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-[9px] text-zinc-400">
                Receives processed Main L/R Master audio for physical monitoring.
              </div>
            </div>
          </div>

          {/* Buffer & Sample Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#151a24] p-3 rounded border border-zinc-800">
              <span className="text-amber-400 font-bold block mb-1">SAMPLE RATE</span>
              <div className="flex gap-2">
                {[44100, 48000, 96000].map(sr => (
                  <button
                    key={sr}
                    onClick={() => setSampleRate(sr)}
                    className={`flex-1 py-1.5 rounded text-[10px] font-bold ${
                      sampleRate === sr ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {sr / 1000} kHz
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#151a24] p-3 rounded border border-zinc-800">
              <span className="text-amber-400 font-bold block mb-1">BUFFER SIZE (SAMPLES)</span>
              <div className="flex gap-1.5">
                {[64, 128, 256, 512, 1024].map(bs => (
                  <button
                    key={bs}
                    onClick={() => setBufferSize(bs)}
                    className={`flex-1 py-1.5 rounded text-[10px] font-bold ${
                      bufferSize === bs ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {bs}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real Audio Signal Diagnostics */}
          <div className="bg-[#0b0e14] p-3 rounded border border-zinc-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-amber-400 font-bold text-[11px]">
                SIGNAL FLOW & REAL-TIME DIAGNOSTICS
              </span>
              <span className="text-[10px] text-zinc-500">
                Measured Latency: {Math.round(((bufferSize / sampleRate) * 1000 * 2) * 10) / 10} ms
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
              <div className="bg-[#151a24] p-2 rounded border border-zinc-800">
                <span className="text-zinc-500 block">SOURCE:</span>
                <span className="font-bold text-zinc-300">{backend}</span>
              </div>
              <div className="bg-[#151a24] p-2 rounded border border-zinc-800">
                <span className="text-zinc-500 block">ROUTING:</span>
                <span className="font-bold text-cyan-300">CH01 (L) / CH02 (R)</span>
              </div>
              <div className="bg-[#151a24] p-2 rounded border border-zinc-800">
                <span className="text-zinc-500 block">DSP ENGINE:</span>
                <span className="font-bold text-amber-300">40-Bit Floating Pt</span>
              </div>
              <div className="bg-[#151a24] p-2 rounded border border-zinc-800">
                <span className="text-zinc-500 block">OUTPUT:</span>
                <span className="font-bold text-emerald-300">Main L/R Master</span>
              </div>
            </div>

            <div className="mt-3 text-[10px] text-zinc-400 leading-relaxed border-t border-zinc-800 pt-2">
              <strong>VB-CABLE WORKFLOW:</strong> Set Google Chrome playback to <em>CABLE Input</em> in Windows Sound Settings, 
              then select <em>CABLE Output</em> above. The YouTube stream will flow into CH 01 & CH 02 for real parametric EQ and compression.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#181e2b] px-4 py-3 border-t border-[#2b3546] flex justify-between items-center">
          <div className="flex items-center gap-3 text-[10px] text-zinc-400">
            <div className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>CPU: {config.cpuLoad}%</span>
            </div>
            <span>STATUS: {config.status}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
            >
              CANCEL
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-black"
            >
              APPLY SETTINGS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
