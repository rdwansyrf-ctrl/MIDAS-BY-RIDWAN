/**
 * Native Windows Audio Bridge
 * Connects frontend mixer UI to Rust / Tauri native WASAPI & ASIO backend
 * If running in desktop app: calls Tauri invoke()
 * If running in web preview: provides live device enumeration and Web Audio loopback
 */

import { AudioDeviceConfig } from '../types/mixer';

declare global {
  interface Window {
    __TAURI__?: {
      invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
    };
  }
}

export interface NativeAudioDeviceInfo {
  id: string;
  name: string;
  type: 'input' | 'output' | 'loopback';
  channels: number;
  sampleRate: number;
  isDefault: boolean;
  isVbCable: boolean;
  isAsio: boolean;
}

export interface NativeAudioDiagnostics {
  backend: string;
  input_device: string;
  output_device: string;
  sample_rate: number;
  buffer_size: number;
  input_channels: number;
  output_channels: number;
  latency_ms: number;
  cpu_load: number;
  status: string;
  input_peak_db: number;
  input_rms_db: number;
  master_l_peak_db: number;
  master_r_peak_db: number;
  has_signal: boolean;
}

export interface NativeMeters {
  channel_meters: number[];
  master_l: number;
  master_r: number;
  mono_c: number;
}

export class NativeBridge {
  private static instance: NativeBridge;

  public static getInstance(): NativeBridge {
    if (!NativeBridge.instance) {
      NativeBridge.instance = new NativeBridge();
    }
    return NativeBridge.instance;
  }

  public isNativeTauri(): boolean {
    return typeof window !== 'undefined' && Boolean(window.__TAURI__);
  }

  public async getAvailableAudioDevices(): Promise<NativeAudioDeviceInfo[]> {
    if (this.isNativeTauri() && window.__TAURI__) {
      try {
        const devices = (await window.__TAURI__.invoke('enumerate_audio_devices')) as NativeAudioDeviceInfo[];
        if (devices && devices.length > 0) {
          return devices;
        }
      } catch (e) {
        console.warn('Native Tauri audio device query failed:', e);
      }
    }

    // Browser environment: Query actual hardware devices from user's system via MediaDevices
    const result: NativeAudioDeviceInfo[] = [];

    // Add WASAPI Loopback spec placeholder for Windows
    result.push({
      id: 'wasapi-loopback-default',
      name: 'WASAPI: System Audio Loopback (Windows App Only)',
      type: 'loopback',
      channels: 2,
      sampleRate: 48000,
      isDefault: true,
      isVbCable: false,
      isAsio: false
    });

    if (navigator.mediaDevices?.enumerateDevices) {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        devs.forEach((d, idx) => {
          const label = d.label || (d.kind === 'audioinput' ? `Microphone ${idx + 1}` : `Speaker ${idx + 1}`);
          const isVb = label.toLowerCase().includes('cable');
          if (d.kind === 'audioinput') {
            result.push({
              id: d.deviceId || `input-${idx}`,
              name: label,
              type: 'input',
              channels: 2,
              sampleRate: 48000,
              isDefault: idx === 0,
              isVbCable: isVb,
              isAsio: false
            });
          } else if (d.kind === 'audiooutput') {
            result.push({
              id: d.deviceId || `output-${idx}`,
              name: label,
              type: 'output',
              channels: 2,
              sampleRate: 48000,
              isDefault: idx === 0,
              isVbCable: isVb,
              isAsio: false
            });
          }
        });
      } catch (err) {
        console.warn('MediaDevices enumerate error:', err);
      }
    }

    if (result.length === 1) {
      // Fallback display if permissions not yet requested
      result.push({
        id: 'default-input',
        name: 'Default System Microphone / Input',
        type: 'input',
        channels: 2,
        sampleRate: 48000,
        isDefault: true,
        isVbCable: false,
        isAsio: false
      });
      result.push({
        id: 'default-output',
        name: 'Default Speakers / Headphones',
        type: 'output',
        channels: 2,
        sampleRate: 48000,
        isDefault: true,
        isVbCable: false,
        isAsio: false
      });
    }

    return result;
  }

  public async setAudioDeviceConfig(config: AudioDeviceConfig): Promise<boolean> {
    if (this.isNativeTauri() && window.__TAURI__) {
      try {
        await window.__TAURI__.invoke('configure_audio_device', {
          config: {
            backend: config.backend,
            input_device: config.inputDevice,
            output_device: config.outputDevice,
            sample_rate: config.sampleRate,
            buffer_size: config.bufferSize
          }
        });
        return true;
      } catch (e) {
        console.error('Failed to configure native audio device:', e);
        return false;
      }
    }
    return true;
  }

  public async startWasapiLoopback(): Promise<boolean> {
    if (this.isNativeTauri() && window.__TAURI__) {
      try {
        await window.__TAURI__.invoke('start_wasapi_loopback');
        return true;
      } catch (e) {
        console.error('Failed to start native wasapi loopback:', e);
        return false;
      }
    }
    return false;
  }

  public async getNativeMeters(): Promise<NativeMeters | null> {
    if (this.isNativeTauri() && window.__TAURI__) {
      try {
        const meters = (await window.__TAURI__.invoke('get_audio_meters')) as NativeMeters;
        return meters;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  public async getNativeDiagnostics(): Promise<NativeAudioDiagnostics | null> {
    if (this.isNativeTauri() && window.__TAURI__) {
      try {
        const diag = (await window.__TAURI__.invoke('get_native_diagnostics')) as NativeAudioDiagnostics;
        return diag;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  public async setChannelFader(channelIdx: number, faderDb: number) {
    if (this.isNativeTauri() && window.__TAURI__) {
      try {
        await window.__TAURI__.invoke('set_channel_fader', { channelIdx, faderDb });
      } catch (e) {
        // ignore
      }
    }
  }

  public async setChannelGain(channelIdx: number, gainDb: number) {
    if (this.isNativeTauri() && window.__TAURI__) {
      try {
        await window.__TAURI__.invoke('set_channel_gain', { channelIdx, gainDb });
      } catch (e) {
        // ignore
      }
    }
  }

  public async setMasterFader(faderDb: number, muted: boolean) {
    if (this.isNativeTauri() && window.__TAURI__) {
      try {
        await window.__TAURI__.invoke('set_master_fader', { faderDb, muted });
      } catch (e) {
        // ignore
      }
    }
  }

  public async setStereoLink(enabled: boolean) {
    if (this.isNativeTauri() && window.__TAURI__) {
      try {
        await window.__TAURI__.invoke('set_stereo_link', { enabled });
      } catch (e) {
        // ignore
      }
    }
  }

  public async saveNativeProjectFile(filename: string, content: string): Promise<boolean> {
    if (this.isNativeTauri() && window.__TAURI__) {
      try {
        await window.__TAURI__.invoke('save_project_file', { filename, content });
        return true;
      } catch (e) {
        console.error('Failed native save:', e);
      }
    }

    // Web browser fallback
    try {
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.rdwnmix') ? filename : `${filename}.rdwnmix`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  }
}
