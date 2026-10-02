import { ChannelState, MixBusState, MatrixState, DCAState, MuteGroupState, FXSlot, RoutingState, AudioDeviceConfig } from '../types/mixer';

const defaultChannelNames = [
  'KICK IN', 'KICK OUT', 'SNARE TOP', 'SNARE BTM',
  'HI-HAT', 'RACK TOM 1', 'RACK TOM 2', 'FLOOR TOM',
  'OH LEFT', 'OH RIGHT', 'BASS DI', 'BASS MIC',
  'E.GTR L', 'E.GTR R', 'ACOUSTIC', 'KEYBOARD L',
  'KEYBOARD R', 'PIANO L', 'PIANO R', 'SYNTH',
  'LEAD VOCAL', 'BACK VOC 1', 'BACK VOC 2', 'BACK VOC 3',
  'HORNS 1', 'HORNS 2', 'TALKBACK', 'GUEST MIC',
  'CLICK TRK', 'GUIDE TRK', 'SPARE 1', 'SPARE 2',
  'AUX IN 1', 'AUX IN 2', 'AUX IN 3', 'AUX IN 4',
  'USB PLAY L', 'USB PLAY R', 'FX 1 RET', 'FX 2 RET'
];

export function createInitialChannels(): ChannelState[] {
  return Array.from({ length: 40 }, (_, i) => {
    const isAux = i >= 32 && i < 36;
    const isUsb = i >= 36 && i < 38;
    const isFxRet = i >= 38;

    return {
      id: i + 1,
      type: isAux ? 'aux' : isUsb ? 'aux' : isFxRet ? 'fx-return' : 'input',
      number: i + 1,
      name: defaultChannelNames[i] || `CH ${i + 1 < 10 ? '0' : ''}${i + 1}`,
      source: isAux ? `AUX ${i - 31}` : isUsb ? `USB ${i - 35}` : isFxRet ? `FX ${i - 37}R` : `IN ${i + 1 < 10 ? '0' : ''}${i + 1}`,
      scribbleColor: i < 8 ? 'blue' : i < 12 ? 'yellow' : i < 20 ? 'green' : i < 24 ? 'magenta' : 'white',
      scribbleIcon: i < 8 ? 'drum' : i < 12 ? 'bass' : i < 15 ? 'guitar' : i < 20 ? 'keys' : i < 24 ? 'mic' : 'fader',
      preampGain: 0,
      trim: 0,
      phantom48V: i < 4 || (i >= 20 && i < 24),
      phaseInvert: i === 3, // e.g. snare bottom
      delayMs: 0,
      hpfEnabled: i >= 20 && i < 24, // vocals often have HPF
      hpfFreq: 100,
      gate: {
        enabled: i < 8, // drums gated by default
        threshold: -45,
        range: -40,
        attack: 1,
        hold: 20,
        release: 150,
        mode: 'gate',
        keyFilter: {
          enabled: false,
          freq: 1000,
          slope: 2,
          source: 'Self'
        }
      },
      eq: {
        enabled: true,
        bands: [
          { type: 'LCut', freq: 80, gain: 0, q: 0.7, active: true },
          { type: 'PEQ', freq: 250, gain: 0, q: 1.0, active: true },
          { type: 'PEQ', freq: 2500, gain: 0, q: 1.0, active: true },
          { type: 'HShelf', freq: 10000, gain: 0, q: 0.7, active: true }
        ]
      },
      comp: {
        enabled: i < 4 || (i >= 20 && i < 24),
        threshold: -20,
        ratio: 4,
        attack: 10,
        hold: 0,
        release: 200,
        knee: 3,
        makeupGain: 0,
        mode: 'rms',
        curve: 'log',
        preEQ: false,
        keyFilter: {
          enabled: false,
          freq: 2000,
          source: 'Self'
        }
      },
      insert: {
        enabled: false,
        slot: 1,
        postEQ: false
      },
      pan: 0,
      fader: -90, // default silent / -inf on startup as required!
      muted: false,
      solo: false,
      mainLRAssign: true,
      monoCenterAssign: false,
      monoCenterLevel: -90,
      dcaGroup: (i < 8) ? 1 : (i < 12) ? 2 : (i < 15) ? 3 : (i < 20) ? 4 : (i < 24) ? 5 : 0,
      muteGroups: [],
      sends: Array.from({ length: 16 }, (_, b) => ({
        busId: b + 1,
        level: -90, // silent by default
        pan: 0,
        muted: false,
        tap: b < 8 ? 'Pre-Fader' : 'Post-Fader'
      })),
      meterLevel: -90, // STRICTLY REAL AUDIO: Starts at -90 (silence)
      gainReduction: 0,
      gateOpen: false
    };
  });
}

export function createInitialMixBuses(): MixBusState[] {
  const busNames = [
    'MON 1 (VOC)', 'MON 2 (GTR)', 'MON 3 (BASS)', 'MON 4 (DRUM)',
    'MON 5 (KEYS)', 'MON 6 (HRN)', 'IEM L (LEAD)', 'IEM R (LEAD)',
    'FX 1 VERB', 'FX 2 DELAY', 'FX 3 CHORUS', 'FX 4 DBL',
    'DRUM SUB', 'MUSIC SUB', 'VOC SUB', 'FX SUB'
  ];

  return Array.from({ length: 16 }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    name: busNames[i],
    color: i < 8 ? 'cyan' : 'magenta',
    fader: -90, // silent
    pan: 0,
    muted: false,
    solo: false,
    eq: {
      enabled: true,
      bands: [
        { type: 'LCut', freq: 40, gain: 0, q: 0.7, active: true },
        { type: 'PEQ', freq: 160, gain: 0, q: 1.0, active: true },
        { type: 'PEQ', freq: 800, gain: 0, q: 1.0, active: true },
        { type: 'PEQ', freq: 2500, gain: 0, q: 1.0, active: true },
        { type: 'PEQ', freq: 6300, gain: 0, q: 1.0, active: true },
        { type: 'HCut', freq: 16000, gain: 0, q: 0.7, active: true }
      ]
    },
    comp: {
      enabled: i >= 12, // subgroups compressed
      threshold: -18,
      ratio: 3,
      attack: 15,
      hold: 0,
      release: 300,
      knee: 3,
      makeupGain: 0,
      mode: 'rms',
      curve: 'log',
      preEQ: false,
      keyFilter: { enabled: false, freq: 1000, source: 'Self' }
    },
    meterLevel: -90,
    matrixSends: Array.from({ length: 6 }, (_, m) => ({ matrixId: m + 1, level: -90 }))
  }));
}

export function createInitialMatrixes(): MatrixState[] {
  const mtxNames = ['FOYER', 'BALCONY L', 'BALCONY R', 'FRONT FILL', 'RECORDER L', 'RECORDER R'];
  return Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    name: mtxNames[i],
    fader: -90,
    muted: false,
    solo: false,
    meterLevel: -90,
    delayMs: i === 0 ? 35 : i < 3 ? 15 : 0
  }));
}

export function createInitialDCAs(): DCAState[] {
  const dcaNames = [
    'DCA 1: DRUMS',
    'DCA 2: BASS',
    'DCA 3: GUITARS',
    'DCA 4: KEYBOARDS',
    'DCA 5: VOCALS',
    'DCA 6: HORNS/STR',
    'DCA 7: PLAYBACK',
    'DCA 8: FX MAST'
  ];
  return Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    name: dcaNames[i],
    color: 'yellow',
    fader: 0, // 0 dB unity
    muted: false,
    solo: false
  }));
}

export function createInitialMuteGroups(): MuteGroupState[] {
  return [
    { id: 1, name: 'MUTE ALL INPUTS', active: false },
    { id: 2, name: 'MUTE ALL VOCALS', active: false },
    { id: 3, name: 'MUTE ALL DRUMS', active: false },
    { id: 4, name: 'MUTE FX RETURNS', active: false },
    { id: 5, name: 'MUTE STAGE MONITORS', active: false },
    { id: 6, name: 'MUTE HOUSE PA', active: false }
  ];
}

export function createInitialFXSlots(): FXSlot[] {
  return [
    {
      id: 1,
      name: 'FX 1: VINTAGE REVERB',
      type: 'Vintage Room',
      inputSourceL: 'MixBus 09',
      inputSourceR: 'MixBus 10',
      parameters: { decay: 2.2, predelay: 25, size: 85, damp: 45, diff: 70, hiCut: 8000, loCut: 120 },
      muted: false,
      meterInL: -90,
      meterInR: -90,
      meterOutL: -90,
      meterOutR: -90
    },
    {
      id: 2,
      name: 'FX 2: STEREO DELAY',
      type: 'Stereo Delay',
      inputSourceL: 'MixBus 11',
      inputSourceR: 'MixBus 11',
      parameters: { timeL: 375, timeR: 500, feedbackL: 35, feedbackR: 35, mix: 40, hiCut: 6000, loCut: 200 },
      muted: false,
      meterInL: -90,
      meterInR: -90,
      meterOutL: -90,
      meterOutR: -90
    },
    {
      id: 3,
      name: 'FX 3: STEREO CHORUS',
      type: 'Stereo Chorus',
      inputSourceL: 'MixBus 12',
      inputSourceR: 'MixBus 12',
      parameters: { speed: 1.2, depth: 45, delay: 18, mix: 50, phase: 90 },
      muted: false,
      meterInL: -90,
      meterInR: -90,
      meterOutL: -90,
      meterOutR: -90
    },
    {
      id: 4,
      name: 'FX 4: HALL REVERB',
      type: 'Hall Reverb',
      inputSourceL: 'MixBus 13',
      inputSourceR: 'MixBus 13',
      parameters: { decay: 3.4, predelay: 40, size: 100, damp: 50, diff: 80, mod: 25 },
      muted: false,
      meterInL: -90,
      meterInR: -90,
      meterOutL: -90,
      meterOutR: -90
    },
    {
      id: 5,
      name: 'FX 5: DUAL GRAPHIC EQ (MAIN)',
      type: 'Dual Graphic EQ',
      inputSourceL: 'Insert Main L',
      inputSourceR: 'Insert Main R',
      parameters: { gain: 0, bands: new Array(31).fill(0) },
      muted: false,
      meterInL: -90,
      meterInR: -90,
      meterOutL: -90,
      meterOutR: -90
    },
    {
      id: 6,
      name: 'FX 6: PRECISION LIMITER',
      type: 'Precision Limiter',
      inputSourceL: 'Insert Main L',
      inputSourceR: 'Insert Main R',
      parameters: { inputGain: 0, outputGain: -0.2, squeeze: 10, attack: 0.1, release: 100, knee: 2 },
      muted: false,
      meterInL: -90,
      meterInR: -90,
      meterOutL: -90,
      meterOutR: -90
    },
    {
      id: 7,
      name: 'FX 7: COMBINATOR 5-BAND',
      type: 'Combinator',
      inputSourceL: 'Insert Mix 13-14',
      inputSourceR: 'Insert Mix 13-14',
      parameters: { threshold: -12, ratio: 3.5, mix: 100, sbcSpeed: 5 },
      muted: false,
      meterInL: -90,
      meterInR: -90,
      meterOutL: -90,
      meterOutR: -90
    },
    {
      id: 8,
      name: 'FX 8: STEREO TUBE STAGE',
      type: 'Stereo Tube Stage',
      inputSourceL: 'Insert Bass DI',
      inputSourceR: 'Insert Bass DI',
      parameters: { drive: 35, even: 40, odd: 15, gain: 0, loCut: 40, hiCut: 12000 },
      muted: false,
      meterInL: -90,
      meterInR: -90,
      meterOutL: -90,
      meterOutR: -90
    }
  ];
}

export function createInitialRouting(): RoutingState {
  return {
    inputs1to8: 'Local 1-8',
    inputs9to16: 'Local 9-16',
    inputs17to24: 'Local 17-24',
    inputs25to32: 'Local 25-32',
    auxIns: 'Aux Ins 1-6',
    xlrOut1to4: 'Out 1-4',
    xlrOut5to8: 'Out 5-8',
    xlrOut9to12: 'Out 9-12',
    xlrOut13to16: 'Out 13-16 (Main L/R)',
    cardOut1to8: 'Local 1-8',
    cardOut9to16: 'Local 9-16',
    cardOut17to24: 'Local 17-24',
    cardOut25to32: 'Local 25-32'
  };
}

export function createInitialAudioDeviceConfig(): AudioDeviceConfig {
  const isTauri = typeof window !== 'undefined' && Boolean((window as any).__TAURI__);
  return {
    backend: isTauri ? 'WASAPI Loopback' : 'WebAudio Native Bridge',
    inputDevice: isTauri ? 'WASAPI: Loopback (Chrome / YouTube)' : 'Browser Default Audio Input',
    outputDevice: isTauri ? 'WASAPI: Speakers / Headphones' : 'Browser Default Audio Output',
    sampleRate: 48000,
    bufferSize: 256,
    inputChannels: 2,
    outputChannels: 2,
    latencyMs: 10.6,
    cpuLoad: 2.1,
    status: isTauri ? 'AUDIO ENGINE OFFLINE' : 'BROWSER PREVIEW • NATIVE AUDIO UNAVAILABLE',
    isVbCableDetected: false,
    isAsioDetected: false,
    asioDrivers: []
  };
}
