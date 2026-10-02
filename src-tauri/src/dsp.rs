// Real-time safe 40-bit/32-bit floating point DSP engine for native Windows audio
// Processing pipeline: Gain -> Phase -> HPF -> Gate -> 4-Band PEQ -> Compressor -> Fader -> Pan -> Bus Summing -> Master LR

use std::f32::consts::PI;

#[derive(Clone, Copy, Debug)]
pub enum FilterType {
    LowPass,
    HighPass,
    Peaking,
    LowShelf,
    HighShelf,
}

#[derive(Clone, Debug)]
pub struct BiquadFilter {
    pub b0: f32,
    pub b1: f32,
    pub b2: f32,
    pub a1: f32,
    pub a2: f32,
    x1: f32,
    x2: f32,
    y1: f32,
    y2: f32,
}

impl BiquadFilter {
    pub fn new() -> Self {
        Self {
            b0: 1.0,
            b1: 0.0,
            b2: 0.0,
            a1: 0.0,
            a2: 0.0,
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
        }
    }

    pub fn set_coefficients(&mut self, filter_type: FilterType, sample_rate: f32, freq: f32, q: f32, gain_db: f32) {
        let f0 = freq.clamp(20.0, sample_rate * 0.49);
        let q_val = q.clamp(0.1, 20.0);
        let w0 = 2.0 * PI * f0 / sample_rate;
        let alpha = w0.sin() / (2.0 * q_val);
        let a = 10.0_f32.powf(gain_db / 40.0);
        let cos_w0 = w0.cos();

        let (b0, b1, b2, a0, a1, a2) = match filter_type {
            FilterType::HighPass => {
                let b0 = (1.0 + cos_w0) / 2.0;
                let b1 = -(1.0 + cos_w0);
                let b2 = (1.0 + cos_w0) / 2.0;
                let a0 = 1.0 + alpha;
                let a1 = -2.0 * cos_w0;
                let a2 = 1.0 - alpha;
                (b0, b1, b2, a0, a1, a2)
            }
            FilterType::LowPass => {
                let b0 = (1.0 - cos_w0) / 2.0;
                let b1 = 1.0 - cos_w0;
                let b2 = (1.0 - cos_w0) / 2.0;
                let a0 = 1.0 + alpha;
                let a1 = -2.0 * cos_w0;
                let a2 = 1.0 - alpha;
                (b0, b1, b2, a0, a1, a2)
            }
            FilterType::Peaking => {
                let b0 = 1.0 + alpha * a;
                let b1 = -2.0 * cos_w0;
                let b2 = 1.0 - alpha * a;
                let a0 = 1.0 + alpha / a;
                let a1 = -2.0 * cos_w0;
                let a2 = 1.0 - alpha / a;
                (b0, b1, b2, a0, a1, a2)
            }
            FilterType::LowShelf => {
                let sqrt_a = a.sqrt();
                let b0 = a * ((a + 1.0) - (a - 1.0) * cos_w0 + 2.0 * sqrt_a * alpha);
                let b1 = 2.0 * a * ((a - 1.0) - (a + 1.0) * cos_w0);
                let b2 = a * ((a + 1.0) - (a - 1.0) * cos_w0 - 2.0 * sqrt_a * alpha);
                let a0 = (a + 1.0) + (a - 1.0) * cos_w0 + 2.0 * sqrt_a * alpha;
                let a1 = -2.0 * ((a - 1.0) + (a + 1.0) * cos_w0);
                let a2 = (a + 1.0) + (a - 1.0) * cos_w0 - 2.0 * sqrt_a * alpha;
                (b0, b1, b2, a0, a1, a2)
            }
            FilterType::HighShelf => {
                let sqrt_a = a.sqrt();
                let b0 = a * ((a + 1.0) + (a - 1.0) * cos_w0 + 2.0 * sqrt_a * alpha);
                let b1 = -2.0 * a * ((a - 1.0) + (a + 1.0) * cos_w0);
                let b2 = a * ((a + 1.0) + (a - 1.0) * cos_w0 - 2.0 * sqrt_a * alpha);
                let a0 = (a + 1.0) - (a - 1.0) * cos_w0 + 2.0 * sqrt_a * alpha;
                let a1 = 2.0 * ((a - 1.0) - (a + 1.0) * cos_w0);
                let a2 = (a + 1.0) - (a - 1.0) * cos_w0 - 2.0 * sqrt_a * alpha;
                (b0, b1, b2, a0, a1, a2)
            }
        };

        self.b0 = b0 / a0;
        self.b1 = b1 / a0;
        self.b2 = b2 / a0;
        self.a1 = a1 / a0;
        self.a2 = a2 / a0;
    }

    #[inline(always)]
    pub fn process(&mut self, in_val: f32) -> f32 {
        let out_val = self.b0 * in_val + self.b1 * self.x1 + self.b2 * self.x2
            - self.a1 * self.y1
            - self.a2 * self.y2;
        self.x2 = self.x1;
        self.x1 = in_val;
        self.y2 = self.y1;
        self.y1 = out_val;
        out_val
    }
}

#[derive(Clone, Debug)]
pub struct NoiseGate {
    pub enabled: boolean_alias,
    pub threshold_db: f32,
    pub range_db: f32,
    pub attack_coeff: f32,
    pub release_coeff: f32,
    envelope: f32,
    pub is_open: bool,
}

type boolean_alias = bool;

impl NoiseGate {
    pub fn new() -> Self {
        Self {
            enabled: false,
            threshold_db: -45.0,
            range_db: -40.0,
            attack_coeff: 0.05,
            release_coeff: 0.005,
            envelope: 0.0,
            is_open: false,
        }
    }

    #[inline]
    pub fn process(&mut self, sample: f32) -> f32 {
        if !self.enabled {
            return sample;
        }

        let abs_val = sample.abs();
        if abs_val > self.envelope {
            self.envelope += self.attack_coeff * (abs_val - self.envelope);
        } else {
            self.envelope += self.release_coeff * (abs_val - self.envelope);
        }

        let env_db = 20.0 * (self.envelope.max(1e-5)).log10();
        if env_db >= self.threshold_db {
            self.is_open = true;
            sample
        } else {
            self.is_open = false;
            let att_lin = 10.0_f32.powf(self.range_db / 20.0);
            sample * att_lin
        }
    }
}

#[derive(Clone, Debug)]
pub struct Compressor {
    pub enabled: bool,
    pub threshold_db: f32,
    pub ratio: f32,
    pub attack_coeff: f32,
    pub release_coeff: f32,
    pub makeup_gain_db: f32,
    envelope_db: f32,
    pub gain_reduction_db: f32,
}

impl Compressor {
    pub fn new() -> Self {
        Self {
            enabled: false,
            threshold_db: -20.0,
            ratio: 4.0,
            attack_coeff: 0.02,
            release_coeff: 0.001,
            makeup_gain_db: 0.0,
            envelope_db: -90.0,
            gain_reduction_db: 0.0,
        }
    }

    #[inline]
    pub fn process(&mut self, sample: f32) -> f32 {
        if !self.enabled {
            self.gain_reduction_db = 0.0;
            return sample;
        }

        let abs_val = sample.abs().max(1e-5);
        let input_db = 20.0 * abs_val.log10();

        if input_db > self.envelope_db {
            self.envelope_db += self.attack_coeff * (input_db - self.envelope_db);
        } else {
            self.envelope_db += self.release_coeff * (input_db - self.envelope_db);
        }

        let mut gr_db = 0.0;
        if self.envelope_db > self.threshold_db {
            let over_db = self.envelope_db - self.threshold_db;
            let compressed_over_db = over_db / self.ratio.max(1.0);
            gr_db = over_db - compressed_over_db;
        }

        self.gain_reduction_db = gr_db;
        let gain_lin = 10.0_f32.powf((self.makeup_gain_db - gr_db) / 20.0);
        sample * gain_lin
    }
}

// Complete Channel DSP Chain
#[derive(Clone, Debug)]
pub struct ChannelDsp {
    pub gain_linear: f32,
    pub phase_invert: bool,
    pub hpf: BiquadFilter,
    pub hpf_enabled: bool,
    pub gate: NoiseGate,
    pub eq_bands: [BiquadFilter; 4],
    pub eq_enabled: bool,
    pub compressor: Compressor,
    pub fader_linear: f32,
    pub pan: f32, // -1.0 (L) to +1.0 (R)
    pub muted: bool,
    pub main_lr_assign: bool,
    // Real-time meter storage
    pub peak_level_db: f32,
    pub rms_sum: f32,
    pub sample_count: usize,
}

impl ChannelDsp {
    pub fn new() -> Self {
        let mut dsp = Self {
            gain_linear: 1.0,
            phase_invert: false,
            hpf: BiquadFilter::new(),
            hpf_enabled: false,
            gate: NoiseGate::new(),
            eq_bands: [
                BiquadFilter::new(),
                BiquadFilter::new(),
                BiquadFilter::new(),
                BiquadFilter::new(),
            ],
            eq_enabled: true,
            compressor: Compressor::new(),
            fader_linear: 0.0, // starts silent
            pan: 0.0,
            muted: false,
            main_lr_assign: true,
            peak_level_db: -90.0,
            rms_sum: 0.0,
            sample_count: 0,
        };

        // Initialize default filter curves at 48kHz
        dsp.hpf.set_coefficients(FilterType::HighPass, 48000.0, 80.0, 0.707, 0.0);
        dsp.eq_bands[0].set_coefficients(FilterType::LowShelf, 48000.0, 80.0, 0.707, 0.0);
        dsp.eq_bands[1].set_coefficients(FilterType::Peaking, 48000.0, 250.0, 1.0, 0.0);
        dsp.eq_bands[2].set_coefficients(FilterType::Peaking, 48000.0, 2500.0, 1.0, 0.0);
        dsp.eq_bands[3].set_coefficients(FilterType::HighShelf, 48000.0, 10000.0, 0.707, 0.0);

        dsp
    }

    #[inline]
    pub fn process_sample(&mut self, mut sample: f32) -> (f32, f32) {
        // 1. Preamp Gain
        sample *= self.gain_linear;

        // 2. Phase inversion
        if self.phase_invert {
            sample = -sample;
        }

        // 3. High Pass Filter (Low Cut)
        if self.hpf_enabled {
            sample = self.hpf.process(sample);
        }

        // 4. Noise Gate
        sample = self.gate.process(sample);

        // 5. 4-Band Parametric EQ
        if self.eq_enabled {
            for b in self.eq_bands.iter_mut() {
                sample = b.process(sample);
            }
        }

        // 6. Compressor
        sample = self.compressor.process(sample);

        // Calculate Real Meter before fader (PFL level)
        let abs_val = sample.abs();
        self.rms_sum += abs_val * abs_val;
        self.sample_count += 1;
        if abs_val > 1e-5 {
            let db = 20.0 * abs_val.log10();
            if db > self.peak_level_db {
                self.peak_level_db = db;
            }
        }

        // 7. Channel Fader & Mute
        if self.muted || self.fader_linear < 1e-4 {
            return (0.0, 0.0);
        }
        let fader_out = sample * self.fader_linear;

        // 8. Stereo Panning to Main L/R
        let pan_l = ((1.0 - self.pan) * 0.5).clamp(0.0, 1.0);
        let pan_r = ((1.0 + self.pan) * 0.5).clamp(0.0, 1.0);

        if self.main_lr_assign {
            (fader_out * pan_l, fader_out * pan_r)
        } else {
            (0.0, 0.0)
        }
    }

    pub fn snapshot_meter_db(&mut self) -> f32 {
        if self.sample_count == 0 {
            return -90.0;
        }
        let rms = (self.rms_sum / (self.sample_count as f32)).sqrt();
        self.rms_sum = 0.0;
        self.sample_count = 0;

        let res = if self.peak_level_db < -85.0 || rms < 1e-5 {
            -90.0
        } else {
            self.peak_level_db.clamp(-90.0, 10.0)
        };
        self.peak_level_db = -90.0;
        res
    }
}
