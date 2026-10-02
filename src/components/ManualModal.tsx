import React, { useState } from 'react';
import { X, BookOpen, Search } from 'lucide-react';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualModal: React.FC<ManualModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const sections = [
    { id: 'intro', title: 'Introduction & Features' },
    { id: 'control_surface', title: '1. Control Surface & Faders' },
    { id: 'sends_on_faders', title: '1.2 Sends on Faders (Flip)' },
    { id: 'preamp', title: '1.3 Config / Preamp & 48V' },
    { id: 'gate', title: '1.4 Noise Gate & Ducker' },
    { id: 'dyn', title: '1.5 Dynamics / Compressor' },
    { id: 'eq', title: '1.6 4-Band Parametric EQ' },
    { id: 'bus_sends', title: '1.7 Bus Sends & Taps' },
    { id: 'main_bus', title: '1.8 Main Stereo & Center Bus' },
    { id: 'routing', title: '2.3 Routing & Patching (168x168)' },
    { id: 'internal_fx', title: '2.9 Internal FX Rack (60+ Effects)' },
    { id: 'specs', title: '4.1 Technical Specifications' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="w-[850px] max-w-full bg-[#12161f] border border-[#2b3546] rounded-lg shadow-2xl flex flex-col font-mono text-zinc-300 text-xs overflow-hidden">
        {/* Header */}
        <div className="bg-[#181e2b] px-4 py-3 border-b border-[#2b3546] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm text-white">
              M32 DIGITAL CONSOLE REFERENCE MANUAL
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden h-[75vh]">
          {/* Sidebar */}
          <div className="w-64 bg-[#0a0c10] border-r border-[#222a36] p-2 flex flex-col gap-1 overflow-y-auto">
            <span className="text-[10px] text-zinc-500 font-bold px-2 py-1">TABLE OF CONTENTS</span>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`text-left px-2 py-1.5 rounded text-[11px] font-bold transition ${
                  activeSection === s.id
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#141820]'
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>

          {/* Main Manual Body */}
          <div className="flex-1 p-5 overflow-y-auto leading-relaxed text-zinc-300">
            {activeSection === 'intro' && (
              <div>
                <h3 className="text-base font-bold text-amber-400 mb-2">Introduction & Overview</h3>
                <p className="mb-2">
                  The M32 combines a control surface with streamlined workflow, extensive I/O and signal processing into a compact desktop form factor. Employing award-winning MIDAS PRO Series microphone preamplifiers and custom-designed MIDAS PRO motorised faders rated for one million cycles.
                </p>
                <p className="mb-2">
                  Abundant analogue connectivity is provided by 32 MIDAS PRO Series digitally-controllable microphone preamps, six line-level auxiliary inputs and outputs, 16 XLR outputs, stereo monitoring outs, and 32 x 32 channels of recording over USB.
                </p>
                <div className="bg-[#0b0e14] p-3 rounded border border-zinc-800 mt-4">
                  <span className="text-cyan-400 font-bold block mb-1">KEY SPECIFICATIONS:</span>
                  <ul className="list-disc pl-5 text-[11px] text-zinc-400 space-y-1">
                    <li>40 Input Processing Channels (32 Mics, 8 Aux, 8 FX Returns)</li>
                    <li>25 Mix Buses (16 Aux Buses, 6 Matrices, Main LRC)</li>
                    <li>40-Bit Floating Point DSP Architecture</li>
                    <li>Ultra-low I/O Latency: 0.8 ms</li>
                    <li>8 True-Stereo Multi-Effects Processors</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === 'sends_on_faders' && (
              <div>
                <h3 className="text-base font-bold text-amber-400 mb-2">1.2 Sends on Faders (Fader Flip)</h3>
                <p className="mb-2">
                  Press to activate the console’s Sends on Fader function. This aids with level setting of channels sent to any of the 16 Mix Buses. The Sends on Fader function works in two convenient ways in a live environment:
                </p>
                <div className="bg-[#0b0e14] p-3 rounded border border-zinc-800 my-3">
                  <span className="text-amber-300 font-bold block mb-1">When preparing a monitor mix for a musician:</span>
                  <ol className="list-decimal pl-5 text-[11px] text-zinc-400 space-y-1">
                    <li>Select the monitor bus (BUS 1-8 or BUS 9-16) feeding the musician’s stage wedge or IEM.</li>
                    <li>Press the Sends on Fader button (will flash).</li>
                    <li>Select one of the input channel layers (INPUTS 1-16, 17-32, AUX).</li>
                    <li>All faders in the input channels section now represent send levels to that musician’s mix bus!</li>
                  </ol>
                </div>
              </div>
            )}

            {activeSection === 'eq' && (
              <div>
                <h3 className="text-base font-bold text-amber-400 mb-2">1.6 4-Band Parametric Equaliser</h3>
                <p className="mb-2">
                  Input channels feature 4 discrete parametric filter bands (LOW, LO MID, HI MID, HIGH), each adjustable from 20 Hz to 20 kHz with up to ±15 dB boost or cut and variable Q bandwidth.
                </p>
                <p className="mb-2">
                  Available filter types include:
                </p>
                <ul className="list-disc pl-5 text-[11px] text-zinc-400 space-y-1">
                  <li><strong>PEQ:</strong> Classic Parametric bell curve with variable Q</li>
                  <li><strong>VEQ:</strong> Vintage EQ bell modeled after British analogue console inductors</li>
                  <li><strong>LCUT / HCUT:</strong> 12 dB/Oct low-cut or high-cut filtering</li>
                  <li><strong>LSHV / HSHV:</strong> Low or high shelving filter</li>
                </ul>
              </div>
            )}

            {activeSection === 'internal_fx' && (
              <div>
                <h3 className="text-base font-bold text-amber-400 mb-2">2.9 Internal Virtual FX Rack</h3>
                <p className="mb-2">
                  The M32 features 8 true-stereo (16 mono) multi-effects processors with over 60 physical modeled algorithms:
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
                  <div className="bg-[#0b0e14] p-2 rounded border border-zinc-800">
                    <span className="text-amber-400 font-bold block">Reverbs & Delays</span>
                    <span>Hall Reverb, Vintage Room, Rich Plate, Stereo Delay, Triple 3-Tap Delay, Rhythm Delay</span>
                  </div>
                  <div className="bg-[#0b0e14] p-2 rounded border border-zinc-800">
                    <span className="text-amber-400 font-bold block">Modulation & Pitch</span>
                    <span>Stereo Chorus, Flanger, Dimension-C, Mood Filter, Dual Pitch Shifter</span>
                  </div>
                  <div className="bg-[#0b0e14] p-2 rounded border border-zinc-800">
                    <span className="text-amber-400 font-bold block">Dynamics & Tube</span>
                    <span>Fair Comp (Fairchild 670), Leisure Comp (LA-2A), Ultimo Comp (1176LN), Combinator 5-Band, Stereo Tube Stage</span>
                  </div>
                  <div className="bg-[#0b0e14] p-2 rounded border border-zinc-800">
                    <span className="text-amber-400 font-bold block">Equalisation & Psychoacoustics</span>
                    <span>31-Band Dual Graphic EQ, TruEQ, Pultec Xtec EQ1 & EQ5, Sound Maxer, Edison EX1</span>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'specs' && (
              <div>
                <h3 className="text-base font-bold text-amber-400 mb-2">4.1 Technical Specifications</h3>
                <div className="bg-[#0b0e14] p-3 rounded border border-zinc-800 text-[11px] space-y-1.5 text-zinc-300">
                  <div className="flex justify-between"><span>Input Channels:</span><span className="text-amber-300 font-bold">32 Mic Inputs, 8 Aux, 8 FX Returns</span></div>
                  <div className="flex justify-between"><span>Output Channels:</span><span className="text-amber-300 font-bold">16 XLR Outs, 6 Aux Outs, Stereo Monitor</span></div>
                  <div className="flex justify-between"><span>DSP Engine:</span><span className="text-amber-300 font-bold">40-Bit Floating Point</span></div>
                  <div className="flex justify-between"><span>Dynamic Range:</span><span className="text-amber-300 font-bold">106 dB Analogue In to Out</span></div>
                  <div className="flex justify-between"><span>A/D & D/A Converters:</span><span className="text-amber-300 font-bold">24-Bit @ 48 kHz Cirrus Logic</span></div>
                  <div className="flex justify-between"><span>System Latency:</span><span className="text-amber-300 font-bold">0.8 ms (Local In to Out)</span></div>
                  <div className="flex justify-between"><span>Main Display:</span><span className="text-amber-300 font-bold">7” TFT LCD, 800 x 480 Resolution</span></div>
                  <div className="flex justify-between"><span>Dimensions:</span><span className="text-amber-300 font-bold">891 x 612 x 256 mm (35.1 x 23.9 x 10.1”)</span></div>
                  <div className="flex justify-between"><span>Weight:</span><span className="text-amber-300 font-bold">24.5 kg (53.9 lbs)</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#181e2b] px-4 py-2 border-t border-[#2b3546] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-black"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
