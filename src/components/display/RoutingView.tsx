import React, { useState } from 'react';
import { RoutingState, ChannelState } from '../../types/mixer';
import { FolderPlus } from 'lucide-react';

interface RoutingViewProps {
  routing: RoutingState;
  onUpdateRouting: (patch: Partial<RoutingState>) => void;
  channels?: ChannelState[];
  onUpdateChannel?: (id: number, patch: Partial<ChannelState>) => void;
  userAudioFiles?: string[];
  onImportAudioFiles?: () => void;
  missingFiles?: { name: string; path?: string }[];
  onLocateFile?: (fileName: string) => void;
}

export const RoutingView: React.FC<RoutingViewProps> = ({
  routing,
  onUpdateRouting,
  channels = [],
  onUpdateChannel,
  userAudioFiles = [],
  onImportAudioFiles,
  missingFiles = [],
  onLocateFile
}) => {
  const [activeRoutingTab, setActiveRoutingTab] = useState<'HOME' | 'USER_TRACKS' | 'XLR_OUT' | 'CARD_OUT' | 'AES50'>('HOME');

  const eightChannelSourceOptions = [
    'Local 1-8', 'Local 9-16', 'Local 17-24', 'Local 25-32',
    'User Files (Stems)', 'AES50-A 1-8', 'AES50-A 9-16', 'AES50-A 17-24', 'AES50-A 25-32',
    'AES50-B 1-8', 'AES50-B 9-16', 'Card 1-8', 'Card 9-16', 'Card 17-24', 'Card 25-32'
  ];

  return (
    <div className="h-full flex flex-col p-3 gap-2 text-xs font-mono text-zinc-300">
      <div className="flex justify-between items-center bg-[#151921] px-3 py-1.5 rounded border border-zinc-800">
        <div className="flex gap-2">
          {(['HOME', 'USER_TRACKS', 'XLR_OUT', 'CARD_OUT', 'AES50'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveRoutingTab(tab)}
              className={`px-3 py-1 rounded text-[10px] font-bold transition ${
                activeRoutingTab === tab ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {tab === 'USER_TRACKS' ? 'USER TRACKS & PCM ROUTING' : tab.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {onImportAudioFiles && (
            <button
              onClick={onImportAudioFiles}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-600/60 text-amber-300 text-[10px] font-bold"
            >
              <FolderPlus className="w-3 h-3 text-amber-400" />
              <span>IMPORT FILES (.MP3 / .WAV)</span>
            </button>
          )}
          <span className="text-zinc-400 text-[10px]">168 x 168 SIGNAL ROUTING MATRIX</span>
        </div>
      </div>

      {activeRoutingTab === 'HOME' && (
        <div className="flex-1 bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-amber-400 font-bold block text-xs">
                CHANNEL INPUT PATCHING (BANKS OF 8)
              </span>
              <span className="text-[10px] text-zinc-400">
                Patch hardware preamps, stageboxes, or user stems
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
                <span className="text-cyan-400 font-bold block mb-1">CH 01-08:</span>
                <select
                  value={routing.inputs1to8}
                  onChange={e => onUpdateRouting({ inputs1to8: e.target.value })}
                  className="w-full bg-black border border-zinc-700 text-zinc-200 rounded p-1 text-xs"
                >
                  {eightChannelSourceOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
                <span className="text-cyan-400 font-bold block mb-1">CH 09-16:</span>
                <select
                  value={routing.inputs9to16}
                  onChange={e => onUpdateRouting({ inputs9to16: e.target.value })}
                  className="w-full bg-black border border-zinc-700 text-zinc-200 rounded p-1 text-xs"
                >
                  {eightChannelSourceOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
                <span className="text-cyan-400 font-bold block mb-1">CH 17-24:</span>
                <select
                  value={routing.inputs17to24}
                  onChange={e => onUpdateRouting({ inputs17to24: e.target.value })}
                  className="w-full bg-black border border-zinc-700 text-zinc-200 rounded p-1 text-xs"
                >
                  {eightChannelSourceOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
                <span className="text-cyan-400 font-bold block mb-1">CH 25-32:</span>
                <select
                  value={routing.inputs25to32}
                  onChange={e => onUpdateRouting({ inputs25to32: e.target.value })}
                  className="w-full bg-black border border-zinc-700 text-zinc-200 rounded p-1 text-xs"
                >
                  {eightChannelSourceOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Individual Channel Direct Patch (CH 01 - 16) */}
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <span className="text-amber-400 font-bold block mb-1.5 text-xs">
              INDIVIDUAL CHANNEL INPUT ROUTING (CH 01 - 16)
            </span>
            <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
              {channels.slice(0, 16).map(ch => (
                <div key={ch.id} className="bg-[#080a0e] p-1.5 rounded border border-zinc-800 flex items-center justify-between gap-1 text-[11px]">
                  <span className="font-bold text-amber-300 shrink-0 w-12">
                    CH{ch.number < 10 ? '0' : ''}{ch.number}:
                  </span>
                  <select
                    value={ch.source}
                    onChange={e => onUpdateChannel && onUpdateChannel(ch.id, { source: e.target.value })}
                    className="w-full bg-black border border-zinc-700 text-zinc-200 rounded px-1 py-0.5 text-[10px]"
                  >
                    {userAudioFiles.length > 0 && (
                      <optgroup label="USER FILES (REAL PCM)">
                        {userAudioFiles.map(f => (
                          <option key={f} value={f}>File: {f}</option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="HARDWARE / SYSTEM">
                      <option value={`IN ${ch.number < 10 ? '0' : ''}{ch.number}`}>
                        Local In {ch.number < 10 ? '0' : ''}{ch.number}
                      </option>
                      <option value="LOOPBACK L">Loopback L</option>
                      <option value="LOOPBACK R">Loopback R</option>
                      <option value="VB-CABLE In">VB-CABLE In</option>
                      <option value="MIC">Microphone</option>
                    </optgroup>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/50 p-2 rounded border border-zinc-800 text-[10px] text-zinc-400 mt-2">
            Blocks of 8 inputs can be patched from Local XLRs, KLARK TEKNIK SuperMAC AES50, DN32-USB audio interface, or User PCM Multitrack Files.
          </div>
        </div>
      )}

      {activeRoutingTab === 'USER_TRACKS' && (
        <div className="flex-1 bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col overflow-y-auto">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-zinc-800">
            <div>
              <span className="text-amber-400 font-bold block text-xs">
                USER IMPORTED AUDIO FILES & DIRECT CHANNEL ASSIGNMENT
              </span>
              <span className="text-[10px] text-zinc-400">
                Import WAV, MP3, FLAC, OGG stems from your Windows PC and assign each to independent mixer channels.
              </span>
            </div>
            {onImportAudioFiles && (
              <button
                onClick={onImportAudioFiles}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ IMPORT AUDIO FROM PC</span>
              </button>
            )}
          </div>

          {missingFiles && missingFiles.length > 0 && (
            <div className="mb-3 p-2 bg-rose-950/70 border border-rose-600 rounded flex flex-col gap-1.5">
              <span className="text-rose-300 font-bold text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                AUDIO FILE NOT FOUND (SAVED SESSION REFERENCES)
              </span>
              <div className="grid grid-cols-2 gap-2">
                {missingFiles.map(mf => (
                  <div key={mf.name} className="flex items-center justify-between bg-black/60 px-2 py-1 rounded border border-rose-900/60 text-[11px]">
                    <span className="text-zinc-300 truncate mr-2" title={mf.path || mf.name}>
                      {mf.name}
                    </span>
                    <button
                      onClick={() => onLocateFile && onLocateFile(mf.name)}
                      className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] shrink-0"
                    >
                      LOCATE FILE
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {userAudioFiles.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400">
              <FolderPlus className="w-10 h-10 text-zinc-600 mb-2" />
              <span className="text-sm font-bold text-zinc-300">No User Audio Files Imported Yet</span>
              <p className="text-xs text-zinc-500 mt-1 max-w-md">
                Click the "+ IMPORT AUDIO FROM PC" button above or in the top toolbar to choose your Kick, Snare, Bass, Vocals, or backing tracks from your computer.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto">
              <div className="bg-[#0b0e13] p-3 rounded border border-zinc-800">
                <span className="text-cyan-400 font-bold block mb-2 text-xs">
                  LOADED AUDIO STEMS ({userAudioFiles.length})
                </span>
                <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {userAudioFiles.map((file, idx) => (
                    <li key={file} className="flex justify-between items-center bg-black/60 px-2 py-1 rounded border border-zinc-800 text-[11px]">
                      <span className="text-amber-300 font-mono truncate mr-2">
                        {idx + 1}. {file}
                      </span>
                      <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-700/60 px-1.5 py-0.5 rounded shrink-0">
                        DECODED PCM
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#0b0e13] p-3 rounded border border-zinc-800">
                <span className="text-cyan-400 font-bold block mb-2 text-xs">
                  CHANNEL ASSIGNMENTS (INDEPENDENT AUDIO STREAMS)
                </span>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {channels.slice(0, 16).map(ch => (
                    <div key={ch.id} className="flex items-center justify-between bg-black/60 px-2 py-1 rounded border border-zinc-800 text-[11px] gap-2">
                      <span className="font-bold text-white shrink-0 w-16">
                        CH {ch.number < 10 ? '0' : ''}{ch.number}:
                      </span>
                      <select
                        value={ch.source}
                        onChange={e => onUpdateChannel && onUpdateChannel(ch.id, { source: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 text-amber-300 rounded px-1.5 py-0.5 text-[10px]"
                      >
                        <optgroup label="USER FILES">
                          {userAudioFiles.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </optgroup>
                        <optgroup label="INPUTS">
                          <option value={`IN ${ch.number < 10 ? '0' : ''}{ch.number}`}>Local IN {ch.number < 10 ? '0' : ''}{ch.number}</option>
                          <option value="LOOPBACK L">LOOPBACK L</option>
                          <option value="LOOPBACK R">LOOPBACK R</option>
                        </optgroup>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeRoutingTab === 'XLR_OUT' && (
        <div className="flex-1 bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-around">
          <span className="text-amber-400 font-bold block mb-2 text-xs">
            PHYSICAL XLR OUTPUT ROUTING (BLOCKS OF 4)
          </span>

          <div className="grid grid-cols-4 gap-3">
            <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
              <span className="text-cyan-400 font-bold block mb-1">XLR OUT 1-4:</span>
              <span className="text-zinc-300 font-bold block text-xs">{routing.xlrOut1to4}</span>
              <span className="text-[9px] text-zinc-500">MixBus 01-04 (Pre-Fdr Mon)</span>
            </div>

            <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
              <span className="text-cyan-400 font-bold block mb-1">XLR OUT 5-8:</span>
              <span className="text-zinc-300 font-bold block text-xs">{routing.xlrOut5to8}</span>
              <span className="text-[9px] text-zinc-500">MixBus 05-08 (Pre-Fdr Mon)</span>
            </div>

            <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
              <span className="text-cyan-400 font-bold block mb-1">XLR OUT 9-12:</span>
              <span className="text-zinc-300 font-bold block text-xs">{routing.xlrOut9to12}</span>
              <span className="text-[9px] text-zinc-500">MixBus 09-12 (FX Sends / Sub)</span>
            </div>

            <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
              <span className="text-cyan-400 font-bold block mb-1">XLR OUT 13-16:</span>
              <span className="text-amber-400 font-bold block text-xs">{routing.xlrOut13to16}</span>
              <span className="text-[9px] text-zinc-500">Main L / Main R Post-Fader</span>
            </div>
          </div>

          <div className="bg-black/50 p-2.5 rounded border border-zinc-800 text-[10px] text-zinc-400 mt-2">
            By default, outputs 15 & 16 feed Main Left & Right to the FOH PA system.
          </div>
        </div>
      )}

      {activeRoutingTab === 'CARD_OUT' && (
        <div className="flex-1 bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-around">
          <span className="text-amber-400 font-bold block mb-2 text-xs">
            DN32-USB EXPANSION CARD OUTPUT (32 MULTITRACK USB CHANNELS)
          </span>

          <div className="grid grid-cols-4 gap-3">
            <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
              <span className="text-cyan-400 font-bold block mb-1">CARD OUT 1-8:</span>
              <span className="text-zinc-200 font-bold text-xs">{routing.cardOut1to8}</span>
            </div>
            <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
              <span className="text-cyan-400 font-bold block mb-1">CARD OUT 9-16:</span>
              <span className="text-zinc-200 font-bold text-xs">{routing.cardOut9to16}</span>
            </div>
            <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
              <span className="text-cyan-400 font-bold block mb-1">CARD OUT 17-24:</span>
              <span className="text-zinc-200 font-bold text-xs">{routing.cardOut17to24}</span>
            </div>
            <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
              <span className="text-cyan-400 font-bold block mb-1">CARD OUT 25-32:</span>
              <span className="text-zinc-200 font-bold text-xs">{routing.cardOut25to32}</span>
            </div>
          </div>

          <div className="bg-black/50 p-2.5 rounded border border-zinc-800 text-[10px] text-zinc-400 mt-2">
            Direct multitrack recording to DAW (Pro Tools, Reaper, Ableton Live, Studio One, Cubase) via USB 2.0 interface.
          </div>
        </div>
      )}

      {activeRoutingTab === 'AES50' && (
        <div className="flex-1 bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-around">
          <span className="text-amber-400 font-bold block mb-2 text-xs">
            AES50 PORTS A & B (96 BI-DIRECTIONAL SUPERMAC AUDIO CHANNELS)
          </span>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0b0e13] p-3 rounded border border-zinc-800">
              <span className="text-emerald-400 font-bold block mb-1">AES50-A PORT (PORT 1):</span>
              <span className="text-[11px] text-zinc-300">CONNECTED: DL16 16-in / 8-out Stagebox</span>
              <span className="text-[9px] text-zinc-500 block mt-1">Clock Sync: OK • 48 kHz Locked</span>
            </div>
            <div className="bg-[#0b0e13] p-3 rounded border border-zinc-800">
              <span className="text-emerald-400 font-bold block mb-1">AES50-B PORT (PORT 2):</span>
              <span className="text-[11px] text-zinc-300">CONNECTED: P-16 Ultranet Hub</span>
              <span className="text-[9px] text-zinc-500 block mt-1">Clock Sync: OK • Low Latency 1.1ms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
