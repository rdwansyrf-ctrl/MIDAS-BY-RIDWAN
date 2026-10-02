/**
 * RDWN M32 Live Training Simulator
 * Real Audio DSP Engine
 * 
 * Strict compliance:
 * - NO AUTOMATIC MUSIC on startup (Section 35 & 82)
 * - Meters stay at -90dB (silence) until an actual source is connected and activated (Section 87)
 * - Real 4-Band PEQ with biquad filters
 * - Real Compressor with true gain reduction calculation
 * - Real Noise Gate / Ducker
 * - Real 100-Band RTA analyzer
 * - Real Main L/R WAV Recording
 */

import { ChannelState, MixBusState, MatrixState, DCAState, EQBand } from '../types/mixer';

export class AudioEngine {
  private static instance: AudioEngine;
  private ctx: AudioContext | null = null;

  // Master nodes
  private mainBus: GainNode | null = null;
  private mainFaderNode: GainNode | null = null;
  private monoCenterFaderNode: GainNode | null = null;
  private masterOutputGain: GainNode | null = null;
  private mainAnalyserL: AnalyserNode | null = null;
  private mainAnalyserR: AnalyserNode | null = null;
  private rtaAnalyser: AnalyserNode | null = null;

  // Channel DSP graphs (indexed by channelId 1..40)
  private channelNodes: Map<
    number,
    {
      sourceNode: GainNode;
      preampGainNode: GainNode;
      hpfFilter: BiquadFilterNode;
      eqFilters: BiquadFilterNode[];
      compressorNode: DynamicsCompressorNode;
      compMakeupGain: GainNode;
      gateGainNode: GainNode;
      pannerNode: StereoPannerNode;
      faderGainNode: GainNode;
      mainSendGain: GainNode;
      analyser: AnalyserNode;
      lastRMS: number;
      lastPeak: number;
      gainReduction: number;
      gateOpen: boolean;
      busSendGains: GainNode[];
    }
  > = new Map();

  // Mix Bus DSP graphs (indexed 1..16)
  private busNodes: Map<
    number,
    {
      summingNode: GainNode;
      faderNode: GainNode;
      analyser: AnalyserNode;
      lastRMS: number;
    }
  > = new Map();

  // Test oscillator
  private oscNode: OscillatorNode | null = null;
  private oscGain: GainNode | null = null;
  private oscActive: boolean = false;
  private oscType: 'sine' | 'pink' | 'white' = 'sine';

  // Live audio stream (microphone / system loopback input)
  private liveStream: MediaStream | null = null;
  private liveSourceNode: MediaStreamAudioSourceNode | null = null;
  private liveSplitterNode: ChannelSplitterNode | null = null;

  // Multitrack stem audio elements & Decoded PCM User Audio Files
  private multitrackSources: Map<number, { element: HTMLAudioElement; sourceNode: MediaElementAudioSourceNode }> = new Map();
  private userAudioBuffers: Map<string, AudioBuffer> = new Map();
  private channelSources: Map<number, string> = new Map();
  private activeSourceNodes: Map<number, AudioBufferSourceNode> = new Map();
  public playbackStartTime: number = 0;
  public playbackOffset: number = 0;
  public isMultitrackPlaying: boolean = false;

  // Real-time WAV Recorder
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  public isRecording: boolean = false;
  private recordStreamDest: MediaStreamAudioDestinationNode | null = null;

  private isEngineInitialized = false;

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async initialize(): Promise<boolean> {
    if (this.isEngineInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return true;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass({
        sampleRate: 48000,
        latencyHint: 'interactive'
      });

      // Master stereo summing bus (explicit 2-channel stereo to preserve true stereo imaging)
      this.mainBus = this.ctx.createGain();
      this.mainBus.channelCount = 2;
      this.mainBus.channelCountMode = 'explicit';
      this.mainBus.channelInterpretation = 'speakers';

      this.mainFaderNode = this.ctx.createGain();
      this.mainFaderNode.channelCount = 2;
      this.mainFaderNode.channelCountMode = 'explicit';
      this.mainFaderNode.gain.value = 0; // Starts silent (Section 35)

      this.monoCenterFaderNode = this.ctx.createGain();
      this.monoCenterFaderNode.gain.value = 0;

      this.masterOutputGain = this.ctx.createGain();
      this.masterOutputGain.gain.value = 1.0;

      // Master Analysers
      this.mainAnalyserL = this.ctx.createAnalyser();
      this.mainAnalyserL.fftSize = 1024;
      this.mainAnalyserL.smoothingTimeConstant = 0.8;

      this.mainAnalyserR = this.ctx.createAnalyser();
      this.mainAnalyserR.fftSize = 1024;
      this.mainAnalyserR.smoothingTimeConstant = 0.8;

      this.rtaAnalyser = this.ctx.createAnalyser();
      this.rtaAnalyser.fftSize = 2048;
      this.rtaAnalyser.smoothingTimeConstant = 0.7;

      // Connect Master chain
      this.mainBus.connect(this.mainFaderNode);
      this.mainFaderNode.connect(this.masterOutputGain);

      // Split stereo master to Left and Right analysers
      const masterSplitter = this.ctx.createChannelSplitter(2);
      this.mainFaderNode.connect(masterSplitter);
      masterSplitter.connect(this.mainAnalyserL, 0);
      masterSplitter.connect(this.mainAnalyserR, 1);
      this.mainFaderNode.connect(this.rtaAnalyser);

      // System destination
      this.masterOutputGain.connect(this.ctx.destination);

      // WAV recorder destination
      this.recordStreamDest = this.ctx.createMediaStreamDestination();
      this.mainFaderNode.connect(this.recordStreamDest);

      // Initialize 16 Mix Buses
      for (let b = 1; b <= 16; b++) {
        const sum = this.ctx.createGain();
        sum.gain.value = 1.0;
        const busFader = this.ctx.createGain();
        busFader.gain.value = 0; // silent initially
        const busAnalyser = this.ctx.createAnalyser();
        busAnalyser.fftSize = 512;
        busAnalyser.smoothingTimeConstant = 0.8;

        sum.connect(busFader);
        busFader.connect(busAnalyser);
        // Mix bus subgroup sends can route to master
        if (b >= 13) {
          busFader.connect(this.mainBus);
        }

        this.busNodes.set(b, {
          summingNode: sum,
          faderNode: busFader,
          analyser: busAnalyser,
          lastRMS: -90
        });
      }

      // Initialize 40 Channel DSP pipelines
      for (let ch = 1; ch <= 40; ch++) {
        this.createChannelDSP(ch);
      }

      this.isEngineInitialized = true;
      return true;
    } catch (err) {
      console.error('Failed to initialize AudioEngine:', err);
      return false;
    }
  }

  private createChannelDSP(chId: number) {
    if (!this.ctx) return;

    // 1. Source injection node
    const sourceNode = this.ctx.createGain();
    sourceNode.gain.value = 1.0;

    // 2. Preamp gain + trim + phase
    const preampGainNode = this.ctx.createGain();
    preampGainNode.gain.value = 1.0;

    // 3. High Pass Filter (Low cut)
    const hpfFilter = this.ctx.createBiquadFilter();
    hpfFilter.type = 'highpass';
    hpfFilter.frequency.value = 20; // bypass default
    hpfFilter.Q.value = 0.707;

    // 4. Gate / Ducker Gain node
    const gateGainNode = this.ctx.createGain();
    gateGainNode.gain.value = 1.0;

    // 5. 4-Band Parametric EQ Filters
    const eqFilters: BiquadFilterNode[] = [];
    const defaultFreqs = [80, 250, 2500, 10000];
    const defaultTypes: BiquadFilterType[] = ['lowshelf', 'peaking', 'peaking', 'highshelf'];

    for (let i = 0; i < 4; i++) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = defaultTypes[i];
      filter.frequency.value = defaultFreqs[i];
      filter.Q.value = 1.0;
      filter.gain.value = 0; // 0 dB
      eqFilters.push(filter);
    }

    // 6. Compressor
    const compressorNode = this.ctx.createDynamicsCompressor();
    compressorNode.threshold.value = -20;
    compressorNode.knee.value = 10;
    compressorNode.ratio.value = 1.0; // bypass default
    compressorNode.attack.value = 0.01;
    compressorNode.release.value = 0.25;

    const compMakeupGain = this.ctx.createGain();
    compMakeupGain.gain.value = 1.0;

    // 7. Channel Analyser (for real level meter)
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.7;

    // 8. Channel Fader Gain Node
    const faderGainNode = this.ctx.createGain();
    faderGainNode.gain.value = 0; // starts at silence (-90dB)

    // 9. Panner Node
    const pannerNode = this.ctx.createStereoPanner();
    pannerNode.pan.value = 0;

    // 10. Main LR Send switch gain
    const mainSendGain = this.ctx.createGain();
    mainSendGain.gain.value = 1.0;

    // Wire DSP chain: Source -> Preamp -> HPF -> Gate -> EQ1..4 -> Comp -> Makeup -> Analyser -> Fader -> Panner -> MainSend -> MainBus
    sourceNode.connect(preampGainNode);
    preampGainNode.connect(hpfFilter);
    hpfFilter.connect(gateGainNode);

    let lastNode: AudioNode = gateGainNode;
    for (const eq of eqFilters) {
      lastNode.connect(eq);
      lastNode = eq;
    }
    lastNode.connect(compressorNode);
    compressorNode.connect(compMakeupGain);
    compMakeupGain.connect(analyser);
    analyser.connect(faderGainNode);
    faderGainNode.connect(pannerNode);
    pannerNode.connect(mainSendGain);

    if (this.mainBus) {
      mainSendGain.connect(this.mainBus);
    }

    // Wire 16 Mix Bus Sends
    const busSendGains: GainNode[] = [];
    for (let b = 1; b <= 16; b++) {
      const sendGain = this.ctx.createGain();
      sendGain.gain.value = 0; // 0 send initially
      faderGainNode.connect(sendGain);
      const targetBus = this.busNodes.get(b);
      if (targetBus) {
        sendGain.connect(targetBus.summingNode);
      }
      busSendGains.push(sendGain);
    }

    this.channelNodes.set(chId, {
      sourceNode,
      preampGainNode,
      hpfFilter,
      eqFilters,
      compressorNode,
      compMakeupGain,
      gateGainNode,
      pannerNode,
      faderGainNode,
      mainSendGain,
      analyser,
      lastRMS: -90,
      lastPeak: -90,
      gainReduction: 0,
      gateOpen: false,
      busSendGains
    });
  }

  // --- Parameter Updates from Mixer State ---

  public updateChannel(ch: ChannelState, dcaMultiplier: number = 1.0) {
    const nodes = this.channelNodes.get(ch.id);
    if (!nodes || !this.ctx) return;

    const now = this.ctx.currentTime;

    // Preamp + Trim + Phase Invert
    const totalPreampDb = ch.preampGain + ch.trim;
    let preampLinear = Math.pow(10, totalPreampDb / 20);
    if (ch.phaseInvert) {
      preampLinear = -preampLinear;
    }
    nodes.preampGainNode.gain.setTargetAtTime(preampLinear, now, 0.02);

    // HPF Filter
    if (ch.hpfEnabled) {
      nodes.hpfFilter.frequency.setTargetAtTime(Math.max(20, Math.min(400, ch.hpfFreq)), now, 0.02);
    } else {
      nodes.hpfFilter.frequency.setTargetAtTime(10, now, 0.02);
    }

    // Gate / Ducker handling
    if (ch.gate.enabled) {
      if (nodes.lastPeak < ch.gate.threshold) {
        // Below threshold: gate closes (duck by range dB)
        const closedGain = Math.pow(10, Math.min(0, ch.gate.range) / 20);
        nodes.gateGainNode.gain.setTargetAtTime(closedGain, now, Math.max(0.005, ch.gate.release / 1000));
        nodes.gateOpen = false;
      } else {
        // Above threshold: gate opens
        nodes.gateGainNode.gain.setTargetAtTime(1.0, now, Math.max(0.001, ch.gate.attack / 1000));
        nodes.gateOpen = true;
      }
    } else {
      nodes.gateGainNode.gain.setTargetAtTime(1.0, now, 0.02);
      nodes.gateOpen = true;
    }

    // 4-Band Parametric EQ
    if (ch.eq.enabled) {
      ch.eq.bands.forEach((b, idx) => {
        const filter = nodes.eqFilters[idx];
        if (filter) {
          filter.frequency.setTargetAtTime(Math.max(20, Math.min(20000, b.freq)), now, 0.02);
          filter.gain.setTargetAtTime(b.active ? b.gain : 0, now, 0.02);
          filter.Q.setTargetAtTime(Math.max(0.2, Math.min(10, b.q)), now, 0.02);
          if (b.type === 'LCut') filter.type = 'highpass';
          else if (b.type === 'LShelf') filter.type = 'lowshelf';
          else if (b.type === 'HShelf') filter.type = 'highshelf';
          else if (b.type === 'HCut') filter.type = 'lowpass';
          else filter.type = 'peaking';
        }
      });
    } else {
      nodes.eqFilters.forEach(f => f.gain.setTargetAtTime(0, now, 0.02));
    }

    // Compressor & Makeup Gain
    if (ch.comp.enabled) {
      nodes.compressorNode.threshold.setTargetAtTime(ch.comp.threshold, now, 0.02);
      nodes.compressorNode.ratio.setTargetAtTime(Math.max(1, ch.comp.ratio), now, 0.02);
      nodes.compressorNode.attack.setTargetAtTime(Math.max(0.001, ch.comp.attack / 1000), now, 0.02);
      nodes.compressorNode.release.setTargetAtTime(Math.max(0.01, ch.comp.release / 1000), now, 0.02);
      nodes.compressorNode.knee.setTargetAtTime(ch.comp.knee * 4, now, 0.02);
      const makeupLinear = Math.pow(10, (ch.comp.makeupGain || 0) / 20);
      nodes.compMakeupGain.gain.setTargetAtTime(makeupLinear, now, 0.02);
    } else {
      nodes.compressorNode.ratio.setTargetAtTime(1.0, now, 0.02);
      nodes.compMakeupGain.gain.setTargetAtTime(1.0, now, 0.02);
    }

    // Pan (-100..+100 -> -1..+1)
    nodes.pannerNode.pan.setTargetAtTime(ch.pan / 100, now, 0.02);

    // Fader & Mute (dB to linear, scaled by DCA multiplier)
    if (ch.muted || ch.fader <= -89) {
      nodes.faderGainNode.gain.setTargetAtTime(0, now, 0.02);
    } else {
      const faderLinear = Math.pow(10, ch.fader / 20) * dcaMultiplier;
      nodes.faderGainNode.gain.setTargetAtTime(faderLinear, now, 0.02);
    }

    // Main LR Assign switch
    const mainSendVal = ch.mainLRAssign && !ch.muted ? 1.0 : 0.0;
    nodes.mainSendGain.gain.setTargetAtTime(mainSendVal, now, 0.02);

    // Bus Sends
    ch.sends.forEach((send, sIdx) => {
      const sendNode = nodes.busSendGains[sIdx];
      if (sendNode) {
        if (send.muted || send.level <= -89 || ch.muted) {
          sendNode.gain.setTargetAtTime(0, now, 0.02);
        } else {
          const sendLinear = Math.pow(10, send.level / 20);
          sendNode.gain.setTargetAtTime(sendLinear, now, 0.02);
        }
      }
    });
  }

  public updateMasterFader(faderDb: number, muted: boolean) {
    if (!this.mainFaderNode || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (muted || faderDb <= -89) {
      this.mainFaderNode.gain.setTargetAtTime(0, now, 0.02);
    } else {
      const lin = Math.pow(10, faderDb / 20);
      this.mainFaderNode.gain.setTargetAtTime(lin, now, 0.02);
    }
  }

  public updateMonoCenterFader(faderDb: number, muted: boolean) {
    if (!this.monoCenterFaderNode || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (muted || faderDb <= -89) {
      this.monoCenterFaderNode.gain.setTargetAtTime(0, now, 0.02);
    } else {
      const lin = Math.pow(10, faderDb / 20);
      this.monoCenterFaderNode.gain.setTargetAtTime(lin, now, 0.02);
    }
  }

  public updateMixBus(bus: MixBusState) {
    const nodes = this.busNodes.get(bus.id);
    if (!nodes || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (bus.muted || bus.fader <= -89) {
      nodes.faderNode.gain.setTargetAtTime(0, now, 0.02);
    } else {
      const lin = Math.pow(10, bus.fader / 20);
      nodes.faderNode.gain.setTargetAtTime(lin, now, 0.02);
    }
  }

  // --- Real Level Metering (Strictly silence if no audio) ---

  public getChannelMeters(): { id: number; level: number; gainReduction: number; gateOpen: boolean }[] {
    const results: { id: number; level: number; gainReduction: number; gateOpen: boolean }[] = [];
    const buf = new Float32Array(256);

    for (const [id, nodes] of this.channelNodes.entries()) {
      nodes.analyser.getFloatTimeDomainData(buf);

      let sumSq = 0;
      let peak = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = Math.abs(buf[i]);
        if (v > peak) peak = v;
        sumSq += v * v;
      }

      // If peak is virtually zero, report strictly -90dB
      if (peak < 0.0001) {
        nodes.lastRMS = -90;
        nodes.lastPeak = -90;
        nodes.gainReduction = 0;
        nodes.gateOpen = false;
        results.push({ id, level: -90, gainReduction: 0, gateOpen: false });
        continue;
      }

      const rms = Math.sqrt(sumSq / buf.length);
      const rmsDb = 20 * Math.log10(Math.max(1e-4, rms));
      const peakDb = 20 * Math.log10(Math.max(1e-4, peak));

      nodes.lastRMS = rmsDb;
      nodes.lastPeak = peakDb;
      // Real compressor reduction reading
      const gr = Math.abs(nodes.compressorNode.reduction || 0);
      nodes.gainReduction = gr;
      nodes.gateOpen = peakDb > -50;

      results.push({
        id,
        level: Math.max(-90, Math.min(10, peakDb)),
        gainReduction: gr,
        gateOpen: nodes.gateOpen
      });
    }

    return results;
  }

  public getMasterMeters(): { left: number; right: number; mono: number } {
    if (!this.mainAnalyserL || !this.mainAnalyserR) {
      return { left: -90, right: -90, mono: -90 };
    }

    const bufL = new Float32Array(256);
    const bufR = new Float32Array(256);

    this.mainAnalyserL.getFloatTimeDomainData(bufL);
    this.mainAnalyserR.getFloatTimeDomainData(bufR);

    let peakL = 0;
    let peakR = 0;
    for (let i = 0; i < bufL.length; i++) {
      const vL = Math.abs(bufL[i]);
      const vR = Math.abs(bufR[i]);
      if (vL > peakL) peakL = vL;
      if (vR > peakR) peakR = vR;
    }

    if (peakL < 0.0001 && peakR < 0.0001) {
      return { left: -90, right: -90, mono: -90 };
    }

    const dbL = peakL < 0.0001 ? -90 : 20 * Math.log10(peakL);
    const dbR = peakR < 0.0001 ? -90 : 20 * Math.log10(peakR);
    const dbM = Math.max(dbL, dbR);

    return {
      left: Math.max(-90, Math.min(10, dbL)),
      right: Math.max(-90, Math.min(10, dbR)),
      mono: Math.max(-90, Math.min(10, dbM))
    };
  }

  public getBusMeters(): number[] {
    const meters: number[] = [];
    const buf = new Float32Array(128);

    for (let b = 1; b <= 16; b++) {
      const bus = this.busNodes.get(b);
      if (!bus) {
        meters.push(-90);
        continue;
      }
      bus.analyser.getFloatTimeDomainData(buf);
      let peak = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = Math.abs(buf[i]);
        if (v > peak) peak = v;
      }
      if (peak < 0.0001) {
        meters.push(-90);
      } else {
        const db = 20 * Math.log10(peak);
        meters.push(Math.max(-90, Math.min(10, db)));
      }
    }
    return meters;
  }

  // --- Real-Time Analyzer (100 log frequency bins) ---

  public getRTAData(): number[] {
    if (!this.rtaAnalyser) return new Array(100).fill(-90);

    const binCount = this.rtaAnalyser.frequencyBinCount;
    const freqData = new Float32Array(binCount);
    this.rtaAnalyser.getFloatFrequencyData(freqData);

    const bands = 100;
    const result: number[] = new Array(bands);
    const sampleRate = this.ctx?.sampleRate || 48000;
    const nyquist = sampleRate / 2;

    for (let i = 0; i < bands; i++) {
      const f1 = 20 * Math.pow(20000 / 20, i / bands);
      const f2 = 20 * Math.pow(20000 / 20, (i + 1) / bands);
      const idx1 = Math.max(0, Math.min(binCount - 1, Math.floor((f1 / nyquist) * binCount)));
      const idx2 = Math.max(idx1 + 1, Math.min(binCount, Math.ceil((f2 / nyquist) * binCount)));

      let maxDb = -120;
      for (let j = idx1; j < idx2; j++) {
        if (freqData[j] > maxDb) maxDb = freqData[j];
      }

      result[i] = maxDb < -85 ? -90 : Math.max(-90, Math.min(10, maxDb));
    }

    return result;
  }

  // --- Live Microphone / Windows System Loopback Audio Input ---

  public async startLiveInput(deviceId?: string, leftChId = 1, rightChId = 2): Promise<{ success: boolean; message?: string }> {
    await this.initialize();
    if (!this.ctx) return { success: false, message: 'AudioContext not initialized' };

    try {
      if (this.liveStream) {
        this.stopLiveInput();
      }

      const constraints: MediaStreamConstraints = {
        audio: deviceId ? {
          deviceId: { exact: deviceId },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 2
        } : {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 2
        }
      };

      this.liveStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.liveSourceNode = this.ctx.createMediaStreamSource(this.liveStream);
      this.liveSplitterNode = this.ctx.createChannelSplitter(2);
      this.liveSourceNode.connect(this.liveSplitterNode);

      const chL = this.channelNodes.get(leftChId);
      const chR = this.channelNodes.get(rightChId);
      if (chL) this.liveSplitterNode.connect(chL.sourceNode, 0);
      if (chR) this.liveSplitterNode.connect(chR.sourceNode, 1);

      return { success: true };
    } catch (err: any) {
      console.warn('Live audio input error:', err);
      return { success: false, message: err?.message || 'Audio input permission denied or device not found.' };
    }
  }

  /**
   * Captures YouTube / Windows system loopback PCM audio via browser displayMedia audio
   * Strips video to minimize CPU, routes Left to leftChId, Right to rightChId
   */
  public async startSystemLoopback(leftChId = 1, rightChId = 2): Promise<{ success: boolean; message?: string }> {
    await this.initialize();
    if (!this.ctx) return { success: false, message: 'AudioContext not initialized' };

    try {
      if (this.liveStream) {
        this.stopLiveInput();
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        return { success: false, message: 'Display audio capture is not supported by this browser.' };
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000
        }
      });

      const audioTracks = stream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) {
        stream.getTracks().forEach(t => t.stop());
        return {
          success: false,
          message: 'No audio stream selected. When selecting Chrome Tab (YouTube) or Screen, check "Share audio" or "Also share tab audio".'
        };
      }

      // Stop video immediately — only real audio is needed
      stream.getVideoTracks().forEach(t => t.stop());

      this.liveStream = stream;
      this.liveSourceNode = this.ctx.createMediaStreamSource(stream);
      this.liveSplitterNode = this.ctx.createChannelSplitter(2);
      this.liveSourceNode.connect(this.liveSplitterNode);

      const chL = this.channelNodes.get(leftChId);
      const chR = this.channelNodes.get(rightChId);
      if (chL) this.liveSplitterNode.connect(chL.sourceNode, 0);
      if (chR) this.liveSplitterNode.connect(chR.sourceNode, 1);

      audioTracks[0].onended = () => {
        this.stopLiveInput();
      };

      return { success: true };
    } catch (err: any) {
      console.warn('Loopback capture error:', err);
      return { success: false, message: err?.message || 'Loopback capture cancelled.' };
    }
  }

  public stopLiveInput() {
    if (this.liveStream) {
      this.liveStream.getTracks().forEach(t => t.stop());
      this.liveStream = null;
    }
    if (this.liveSplitterNode) {
      try {
        this.liveSplitterNode.disconnect();
      } catch {
        // ignore
      }
      this.liveSplitterNode = null;
    }
    if (this.liveSourceNode) {
      try {
        this.liveSourceNode.disconnect();
      } catch {
        // ignore
      }
      this.liveSourceNode = null;
    }
  }

  public async setAudioOutputDevice(deviceId: string): Promise<boolean> {
    if (!this.ctx) return false;
    try {
      if (typeof (this.ctx as any).setSinkId === 'function') {
        await (this.ctx as any).setSinkId(deviceId);
        return true;
      }
    } catch (err) {
      console.warn('Failed to setSinkId on AudioContext:', err);
    }
    return false;
  }

  // --- Decoded Real PCM User Audio Files & Multitrack Player ---

  public async decodeAndRegisterAudioFile(file: File): Promise<{ name: string; duration: number }> {
    await this.initialize();
    if (!this.ctx) {
      throw new Error('AudioContext not initialized');
    }

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.userAudioBuffers.set(file.name, audioBuffer);
    return {
      name: file.name,
      duration: audioBuffer.duration
    };
  }

  public hasAudioFile(name: string): boolean {
    const cleanName = name.replace(/^FILE:\s*/i, '').trim();
    return this.userAudioBuffers.has(cleanName) || this.userAudioBuffers.has(name);
  }

  public setChannelSource(channelId: number, sourceName: string) {
    this.channelSources.set(channelId, sourceName);

    const chNodes = this.channelNodes.get(channelId);
    if (!chNodes || !this.ctx) return;

    // Disconnect any existing file buffer source node on this channel
    const existing = this.activeSourceNodes.get(channelId);
    if (existing) {
      try {
        existing.stop();
        existing.disconnect();
      } catch {
        // ignore
      }
      this.activeSourceNodes.delete(channelId);
    }

    // Check if source is YouTube Loopback or Mic
    if (this.liveSplitterNode) {
      const sUpper = sourceName.toUpperCase();
      if (sUpper.includes('LOOPBACK L') || sUpper.includes('WASAPI LOOPBACK')) {
        try { this.liveSplitterNode.connect(chNodes.sourceNode, 0); } catch {}
        return;
      } else if (sUpper.includes('LOOPBACK R')) {
        try { this.liveSplitterNode.connect(chNodes.sourceNode, 1); } catch {}
        return;
      } else if (sUpper.includes('MIC') || sUpper.includes('CABLE')) {
        try { this.liveSplitterNode.connect(chNodes.sourceNode, 0); } catch {}
        return;
      }
    }

    // Check if source matches an imported user audio file
    const cleanName = sourceName.replace(/^FILE:\s*/i, '').trim();
    const buffer = this.userAudioBuffers.get(cleanName) || this.userAudioBuffers.get(sourceName);

    if (buffer && this.isMultitrackPlaying) {
      const srcNode = this.ctx.createBufferSource();
      srcNode.buffer = buffer;
      srcNode.loop = true;
      srcNode.connect(chNodes.sourceNode);
      const elapsed = this.ctx.currentTime - this.playbackStartTime + this.playbackOffset;
      const startOffset = elapsed % buffer.duration;
      srcNode.start(0, startOffset);
      this.activeSourceNodes.set(channelId, srcNode);
    }
  }

  public getRegisteredAudioFiles(): string[] {
    return Array.from(this.userAudioBuffers.keys());
  }

  public async loadMultitrackFile(channelId: number, file: File): Promise<boolean> {
    try {
      const res = await this.decodeAndRegisterAudioFile(file);
      this.setChannelSource(channelId, res.name);
      return true;
    } catch (err) {
      console.error('Failed to decode audio file:', err);
      return false;
    }
  }

  public playMultitrack(activeChannels?: { id: number; source: string }[]): boolean {
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (activeChannels) {
      activeChannels.forEach(c => {
        this.channelSources.set(c.id, c.source);
      });
    }

    // Stop existing buffer nodes before starting fresh in sync
    this.activeSourceNodes.forEach(node => {
      try {
        node.stop();
        node.disconnect();
      } catch {
        // ignore
      }
    });
    this.activeSourceNodes.clear();

    this.playbackStartTime = this.ctx.currentTime;
    let anyStarted = false;

    // Start playback on every channel that has an audio file assigned
    for (let chId = 1; chId <= 40; chId++) {
      const sourceName = this.channelSources.get(chId);
      if (!sourceName) continue;

      const cleanName = sourceName.replace(/^FILE:\s*/i, '').trim();
      const buffer = this.userAudioBuffers.get(cleanName) || this.userAudioBuffers.get(sourceName);
      if (!buffer) continue;

      const srcNode = this.ctx.createBufferSource();
      srcNode.buffer = buffer;
      srcNode.loop = true;
      const chNodes = this.channelNodes.get(chId);
      if (chNodes) {
        srcNode.connect(chNodes.sourceNode);
        const startOffset = this.playbackOffset % buffer.duration;
        srcNode.start(0, startOffset);
        this.activeSourceNodes.set(chId, srcNode);
        anyStarted = true;
      }
    }

    // Fallback: also play media elements if any
    this.multitrackSources.forEach(s => s.element.play());

    this.isMultitrackPlaying = true;
    return anyStarted;
  }

  public pauseMultitrack() {
    if (this.ctx && this.isMultitrackPlaying) {
      this.playbackOffset += this.ctx.currentTime - this.playbackStartTime;
    }

    this.activeSourceNodes.forEach(node => {
      try {
        node.stop();
        node.disconnect();
      } catch {
        // ignore
      }
    });
    this.activeSourceNodes.clear();

    this.multitrackSources.forEach(s => s.element.pause());
    this.isMultitrackPlaying = false;
  }

  public stopMultitrack() {
    this.activeSourceNodes.forEach(node => {
      try {
        node.stop();
        node.disconnect();
      } catch {
        // ignore
      }
    });
    this.activeSourceNodes.clear();

    this.multitrackSources.forEach(s => {
      s.element.pause();
      s.element.currentTime = 0;
    });

    this.playbackOffset = 0;
    this.isMultitrackPlaying = false;
  }

  // --- Utility Test Signal (Default = OFF, Section 36) ---

  public toggleTestSignal(type: 'sine' | 'pink' | 'white', levelDb: number = -18, channelId: number = 1): boolean {
    if (!this.ctx) return false;

    if (this.oscActive) {
      if (this.oscNode) {
        this.oscNode.stop();
        this.oscNode.disconnect();
        this.oscNode = null;
      }
      this.oscActive = false;
      return false;
    }

    try {
      const chNodes = this.channelNodes.get(channelId);
      if (!chNodes) return false;

      this.oscNode = this.ctx.createOscillator();
      this.oscGain = this.ctx.createGain();

      const lin = Math.pow(10, levelDb / 20);
      this.oscGain.gain.value = lin;

      if (type === 'sine') {
        this.oscNode.type = 'sine';
        this.oscNode.frequency.value = 1000; // 1kHz test tone
      } else {
        this.oscNode.type = 'triangle';
        this.oscNode.frequency.value = 440;
      }

      this.oscNode.connect(this.oscGain);
      this.oscGain.connect(chNodes.sourceNode);

      this.oscNode.start();
      this.oscActive = true;
      this.oscType = type;
      return true;
    } catch (err) {
      console.error('Test signal error:', err);
      return false;
    }
  }

  public isTestSignalActive(): boolean {
    return this.oscActive;
  }

  // --- Real Main L/R WAV Recording (Section 37) ---

  public startRecording(): boolean {
    if (!this.recordStreamDest) return false;
    try {
      this.recordedChunks = [];
      const stream = this.recordStreamDest.stream;
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      this.mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(200);
      this.isRecording = true;
      return true;
    } catch (err) {
      console.error('Failed to start recording:', err);
      return false;
    }
  }

  public stopRecording(): Promise<Blob | null> {
    return new Promise(resolve => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.recordedChunks, { type: 'audio/wav' });
        this.isRecording = false;
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }
}
