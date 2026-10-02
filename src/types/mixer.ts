export type ChannelType = 'input' | 'aux' | 'fx-return' | 'bus' | 'matrix' | 'dca' | 'main';

export type ScribbleColor = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white';

export interface EQBand {
  type: 'LCut' | 'LShelf' | 'PEQ' | 'VEQ' | 'HShelf' | 'HCut';
  freq: number; // Hz (20 - 20000)
  gain: number; // dB (-15 to +15)
  q: number; // 0.3 - 10
  active: boolean;
}

export interface GateSettings {
  enabled: boolean;
  threshold: number; // -80 to 0 dB
  range: number; // -60 to 0 dB
  attack: number; // ms (0.1 to 200)
  hold: number; // ms (0 to 2000)
  release: number; // ms (5 to 4000)
  mode: 'gate' | 'duck';
  keyFilter: {
    enabled: boolean;
    freq: number; // Hz
    slope: number;
    source: string;
  };
}

export interface CompressorSettings {
  enabled: boolean;
  threshold: number; // -60 to 0 dB
  ratio: number; // 1 to 50
  attack: number; // ms (0.1 to 200)
  hold: number; // ms (0 to 1000)
  release: number; // ms (5 to 4000)
  knee: number; // 1 to 5
  makeupGain: number; // 0 to 24 dB
  mode: 'peak' | 'rms';
  curve: 'linear' | 'log';
  preEQ: boolean; // true = pre-EQ, false = post-EQ
  keyFilter: {
    enabled: boolean;
    freq: number;
    source: string;
  };
}

export interface BusSend {
  busId: number; // 1 to 16
  level: number; // -inf to +10 dB (-90 to +10)
  pan: number; // -100 to +100
  muted: boolean;
  tap: 'Pre-EQ' | 'Post-EQ' | 'Pre-Fader' | 'Post-Fader' | 'Sub-Group';
}

export interface UserAudioFile {
  id: string;
  name: string;
  size: number;
  type: string;
  duration: number;
  filePath?: string;
  buffer?: AudioBuffer;
}

export interface ChannelState {
  id: number;
  type: ChannelType;
  number: number;
  name: string;
  source: string;
  scribbleColor: ScribbleColor;
  scribbleIcon: string;
  stereoLinked?: boolean;
  preampGain: number; // -12 to +60 dB
  trim: number; // -18 to +18 dB
  phantom48V: boolean;
  phaseInvert: boolean;
  delayMs: number;
  hpfEnabled: boolean;
  hpfFreq: number; // 20 - 400 Hz
  gate: GateSettings;
  eq: {
    enabled: boolean;
    bands: EQBand[];
  };
  comp: CompressorSettings;
  insert: {
    enabled: boolean;
    slot: number;
    postEQ: boolean;
  };
  pan: number; // -100 (L) to +100 (R)
  fader: number; // -90 to +10 dB (-90 = -inf)
  muted: boolean;
  solo: boolean;
  mainLRAssign: boolean;
  monoCenterAssign: boolean;
  monoCenterLevel: number;
  dcaGroup: number; // 0 = none, 1-8
  muteGroups: number[]; // e.g. [1, 3]
  sends: BusSend[];
  // Metering & runtime DSP state
  meterLevel: number; // -90 to +10 dB (strictly real audio)
  gainReduction: number; // dB of compression
  gateOpen: boolean;
}

export interface MixBusState {
  id: number;
  number: number;
  name: string;
  color: ScribbleColor;
  fader: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  eq: {
    enabled: boolean;
    bands: EQBand[]; // 6 bands for buses
  };
  comp: CompressorSettings;
  meterLevel: number;
  matrixSends: { matrixId: number; level: number }[];
}

export interface MatrixState {
  id: number;
  number: number;
  name: string;
  fader: number;
  muted: boolean;
  solo: boolean;
  meterLevel: number;
  delayMs: number;
}

export interface DCAState {
  id: number;
  number: number;
  name: string;
  color: ScribbleColor;
  fader: number; // dB
  muted: boolean;
  solo: boolean;
}

export interface MuteGroupState {
  id: number;
  name: string;
  active: boolean;
}

export type FXType =
  | 'Hall Reverb'
  | 'Vintage Room'
  | 'Plate Reverb'
  | 'Stereo Delay'
  | 'Triple Delay'
  | 'Stereo Chorus'
  | 'Stereo Flanger'
  | 'Dimension-C'
  | 'Wave Designer'
  | 'Precision Limiter'
  | 'Combinator'
  | 'Fair Comp'
  | 'Stereo Leisure Comp'
  | 'Stereo Ultimo Comp'
  | 'Dual Graphic EQ'
  | 'Dual TruEQ'
  | 'Dual DeEsser'
  | 'Sound Maxer'
  | 'Stereo Tube Stage';

export interface FXSlot {
  id: number;
  name: string;
  type: FXType;
  inputSourceL: string;
  inputSourceR: string;
  parameters: Record<string, number | string | boolean | number[]>;
  muted: boolean;
  meterInL: number;
  meterInR: number;
  meterOutL: number;
  meterOutR: number;
}

export interface Scene {
  id: number;
  name: string;
  note: string;
  timestamp: string;
  channels: Partial<ChannelState>[];
  buses: Partial<MixBusState>[];
  dcas: Partial<DCAState>[];
  masterFader: number;
}

export interface RoutingState {
  inputs1to8: string;
  inputs9to16: string;
  inputs17to24: string;
  inputs25to32: string;
  auxIns: string;
  xlrOut1to4: string;
  xlrOut5to8: string;
  xlrOut9to12: string;
  xlrOut13to16: string;
  cardOut1to8: string;
  cardOut9to16: string;
  cardOut17to24: string;
  cardOut25to32: string;
}

export interface AudioDeviceConfig {
  backend: 'WASAPI' | 'WASAPI Loopback' | 'ASIO' | 'WebAudio Native Bridge';
  inputDevice: string;
  outputDevice: string;
  sampleRate: 44100 | 48000 | 96000;
  bufferSize: 64 | 128 | 256 | 512 | 1024;
  inputChannels: number;
  outputChannels: number;
  latencyMs: number;
  cpuLoad: number;
  status:
    | 'AUDIO ENGINE OFFLINE'
    | 'INITIALIZING'
    | 'AUDIO ENGINE ONLINE'
    | 'INPUT CONNECTED'
    | 'OUTPUT CONNECTED'
    | 'NO INPUT SIGNAL'
    | 'DEVICE LOST'
    | 'AUDIO ERROR'
    | 'BROWSER PREVIEW • NATIVE AUDIO UNAVAILABLE';
  isVbCableDetected: boolean;
  isAsioDetected: boolean;
  asioDrivers: string[];
}

export type ActiveTab =
  | 'MIXER'
  | 'HOME'
  | 'CHANNEL'
  | 'CONFIG'
  | 'GATE'
  | 'DYN'
  | 'EQ'
  | 'SENDS'
  | 'MAIN'
  | 'METERS'
  | 'ROUTING'
  | 'SETUP'
  | 'FX'
  | 'SCENES'
  | 'MUTE GRP'
  | 'UTILITY'
  | 'MONITOR'
  | 'LIBRARY'
  | 'TRAINING';

export type BankLayer =
  | '1-16'
  | '17-32'
  | 'AUX'
  | 'BUS 1-8'
  | 'BUS 9-16'
  | 'MTX'
  | 'DCA'
  | 'USER 1'
  | 'USER 2';
