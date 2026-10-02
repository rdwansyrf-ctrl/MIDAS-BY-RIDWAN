export interface TrainingStep {
  id: number;
  title: string;
  description: string;
  instruction: string;
  targetCategory: 'gain' | 'hpf' | 'gate' | 'eq' | 'comp' | 'sends' | 'dca' | 'geq' | 'master';
  targetChannelId?: number;
  expectedCondition: string;
  checkCompleted: (state: {
    channels: { id: number; preampGain: number; hpfEnabled: boolean; hpfFreq: number; gate: { enabled: boolean; threshold: number }; eq: { enabled?: boolean; bands: { gain: number; freq: number }[] }; comp: { enabled: boolean; threshold: number; ratio: number }; fader: number; sends: { level: number }[]; dcaGroup: number }[];
    masterFader: number;
    sendsOnFaderActive: boolean;
  }) => boolean;
  hint: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  summary: string;
  steps: TrainingStep[];
}

export const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'gain-staging',
    title: '1. Professional Preamp Gain Staging',
    category: 'Preamps & Inputs',
    difficulty: 'Beginner',
    summary: 'Properly calibrate analogue preamp gain on Channel 1 (Kick Drum) to achieve healthy nominal operating levels without digital clipping.',
    steps: [
      {
        id: 1,
        title: 'Select Channel 1 & Engage Preamp Gain',
        description: 'Digital audio converters clip harshly when signal exceeds 0 dBFS. Aim for an average level around -18 dBFS with peaks under -6 dBFS.',
        instruction: 'Adjust Channel 1 (Kick In) Preamp Gain to between +18 dB and +30 dB.',
        targetCategory: 'gain',
        targetChannelId: 1,
        expectedCondition: 'Ch 1 Gain in +18dB to +30dB range',
        hint: 'Click CH 01 on the fader bank, open the CONFIG or CHANNEL screen, and turn the PREAMP GAIN knob.',
        checkCompleted: ({ channels }) => {
          const ch1 = channels.find(c => c.id === 1);
          return Boolean(ch1 && ch1.preampGain >= 18 && ch1.preampGain <= 30);
        }
      }
    ]
  },
  {
    id: 'hpf-cleanup',
    title: '2. High-Pass Filter (HPF) Mud Removal',
    category: 'Filtering & EQ',
    difficulty: 'Beginner',
    summary: 'Eliminate sub-bass stage rumble, handling noise, and mic thumps from vocal and guitar channels using the channel High-Pass Filter.',
    steps: [
      {
        id: 1,
        title: 'Engage HPF on Lead Vocal',
        description: 'Vocal microphones often pick up stage bleed and air conditioning rumble below 80 Hz. Engaging HPF preserves headroom.',
        instruction: 'Select Channel 21 (Lead Vocal), enable LOW CUT / HPF, and set frequency between 100 Hz and 160 Hz.',
        targetCategory: 'hpf',
        targetChannelId: 21,
        expectedCondition: 'Ch 21 HPF Active >= 100Hz',
        hint: 'Switch to BANK 17-32, select CH 21 (LEAD VOCAL), turn ON Low Cut and adjust frequency to around 120 Hz.',
        checkCompleted: ({ channels }) => {
          const ch21 = channels.find(c => c.id === 21);
          return Boolean(ch21 && ch21.hpfEnabled && ch21.hpfFreq >= 95 && ch21.hpfFreq <= 180);
        }
      }
    ]
  },
  {
    id: 'noise-gate',
    title: '3. Snare & Tom Noise Gate Dial-In',
    category: 'Dynamics',
    difficulty: 'Intermediate',
    summary: 'Prevent cymbal spill and hi-hat bleed into tom and snare microphones using the channel noise gate.',
    steps: [
      {
        id: 1,
        title: 'Set Gate Threshold on Snare',
        description: 'The gate keeps the microphone attenuated until the drummer hits the snare drum firmly.',
        instruction: 'Select Channel 3 (Snare Top), enable the GATE, and adjust threshold between -35 dB and -25 dB.',
        targetCategory: 'gate',
        targetChannelId: 3,
        expectedCondition: 'Ch 3 Gate Enabled, Threshold -35 to -25 dB',
        hint: 'Go to GATE tab on the central screen and toggle Gate Active, then adjust Threshold.',
        checkCompleted: ({ channels }) => {
          const ch3 = channels.find(c => c.id === 3);
          return Boolean(ch3 && ch3.gate.enabled && ch3.gate.threshold >= -35 && ch3.gate.threshold <= -25);
        }
      }
    ]
  },
  {
    id: 'parametric-eq',
    title: '4. 4-Band Parametric EQ Surgical Notch',
    category: 'Equalisation',
    difficulty: 'Intermediate',
    summary: 'Notch out annoying resonant boxiness in the acoustic guitar and clean up vocal harshness.',
    steps: [
      {
        id: 1,
        title: 'Cut Boxy Low-Mids on Acoustic Guitar',
        description: 'Acoustic guitars often exhibit excessive boominess around 250 Hz - 400 Hz.',
        instruction: 'Select Channel 15 (Acoustic), go to EQ tab, and reduce Band 2 gain by at least -4 dB.',
        targetCategory: 'eq',
        targetChannelId: 15,
        expectedCondition: 'Ch 15 EQ Band 2 Gain <= -4 dB',
        hint: 'Open EQ screen, select band 2 (Low Mid), drag down the gain slider.',
        checkCompleted: ({ channels }) => {
          const ch15 = channels.find(c => c.id === 15);
          if (!ch15 || !ch15.eq.enabled) return false;
          const band2 = ch15.eq.bands[1];
          return Boolean(band2 && band2.gain <= -4);
        }
      }
    ]
  },
  {
    id: 'compressor-control',
    title: '5. Bass Guitar Dynamics Control',
    category: 'Dynamics',
    difficulty: 'Intermediate',
    summary: 'Tame erratic bass guitar volume peaks to achieve a solid, consistent anchor in the live mix.',
    steps: [
      {
        id: 1,
        title: 'Dial-in Bass Compression',
        description: 'A 4:1 compression ratio with 15ms attack preserves pick transient while holding sustain uniform.',
        instruction: 'Select Channel 11 (Bass DI), enable COMP, set Ratio to 4:1 or higher, and threshold between -25 dB and -15 dB.',
        targetCategory: 'comp',
        targetChannelId: 11,
        expectedCondition: 'Ch 11 Comp ON, Ratio >= 4:1, Thresh -25 to -15 dB',
        hint: 'Navigate to DYN tab, enable Dynamics compressor, adjust Ratio and Threshold.',
        checkCompleted: ({ channels }) => {
          const ch11 = channels.find(c => c.id === 11);
          return Boolean(ch11 && ch11.comp.enabled && ch11.comp.ratio >= 3.8 && ch11.comp.threshold >= -26 && ch11.comp.threshold <= -14);
        }
      }
    ]
  },
  {
    id: 'sends-on-faders',
    title: '6. Monitor Mix using Sends on Faders',
    category: 'Bus Sends & Monitors',
    difficulty: 'Advanced',
    summary: 'Craft a quick stage monitor mix for the lead singer using the console FADER FLIP / SENDS ON FADER feature.',
    steps: [
      {
        id: 1,
        title: 'Engage Sends on Fader for Bus 1',
        description: 'Sends on Fader flips the channel faders into individual send volume controls for the selected monitor mix bus.',
        instruction: 'Click the SENDS ON FADER button on the left bank section to enter flipped monitor mix mode.',
        targetCategory: 'sends',
        expectedCondition: 'Sends on Fader Mode Active',
        hint: 'Click the yellow "SENDS ON FADER" flip button on the left layer panel.',
        checkCompleted: ({ sendsOnFaderActive }) => sendsOnFaderActive
      }
    ]
  },
  {
    id: 'dca-grouping',
    title: '7. DCA Group Master Level Control',
    category: 'Console Workflow',
    difficulty: 'Intermediate',
    summary: 'Master the power of DCAs (Digitally Controlled Amplifiers) to adjust full drum kits with a single fader.',
    steps: [
      {
        id: 1,
        title: 'Assign Channel to Drum DCA 1',
        description: 'DCA groups do not sum audio into a bus; they remotely control channel fader gains proportionally.',
        instruction: 'Ensure Channel 1 (Kick In) is assigned to DCA 1.',
        targetCategory: 'dca',
        targetChannelId: 1,
        expectedCondition: 'Ch 1 assigned to DCA 1',
        hint: 'Check the DCA field in Channel View or select DCA 1.',
        checkCompleted: ({ channels }) => {
          const ch1 = channels.find(c => c.id === 1);
          return Boolean(ch1 && ch1.dcaGroup === 1);
        }
      }
    ]
  },
  {
    id: 'master-balance',
    title: '8. Main Stereo Bus Unity Gain',
    category: 'Main & Matrix',
    difficulty: 'Beginner',
    summary: 'Establish proper FOH master headroom at 0 dB unity gain without overdriving the house PA amplifiers.',
    steps: [
      {
        id: 1,
        title: 'Set Main L/R Fader to Unity (0 dB)',
        description: 'The golden rule of digital gain staging is mixing around unity on the master bus.',
        instruction: 'Move the Master L/R Fader on the far right to 0 dB.',
        targetCategory: 'master',
        expectedCondition: 'Main LR Fader at 0 dB (±1 dB)',
        hint: 'Drag the tall Master Fader on the right to the bold 0 mark.',
        checkCompleted: ({ masterFader }) => Math.abs(masterFader - 0) <= 1.0
      }
    ]
  }
];
