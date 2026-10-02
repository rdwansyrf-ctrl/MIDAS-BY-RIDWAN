import React, { useState } from 'react';
import { Scene, ChannelState, MixBusState, DCAState } from '../../types/mixer';

interface ScenesViewProps {
  channels: ChannelState[];
  buses: MixBusState[];
  dcas: DCAState[];
  masterFader: number;
  onRecallScene: (scene: Scene) => void;
}

export const ScenesView: React.FC<ScenesViewProps> = ({
  channels,
  buses,
  dcas,
  masterFader,
  onRecallScene
}) => {
  const [scenes, setScenes] = useState<Scene[]>([
    {
      id: 1,
      name: '01: SOUNDCHECK NOMINAL',
      note: 'Nominal full band starting configuration with unity master',
      timestamp: '2026-10-02 10:00',
      channels: [],
      buses: [],
      dcas: [],
      masterFader: 0
    },
    {
      id: 2,
      name: '02: ACOUSTIC SET',
      note: 'Drums attenuated, acoustic guitar & lead vocal highlighted',
      timestamp: '2026-10-02 11:30',
      channels: [],
      buses: [],
      dcas: [],
      masterFader: 0
    },
    {
      id: 3,
      name: '03: HIGH-ENERGY ENCORE',
      note: 'Full band compression engaged, subwoofers boosted',
      timestamp: '2026-10-02 13:15',
      channels: [],
      buses: [],
      dcas: [],
      masterFader: 1.5
    }
  ]);

  const [selectedSceneId, setSelectedSceneId] = useState<number>(1);
  const [newSceneName, setNewSceneName] = useState<string>('');

  const handleSaveCurrentToScene = () => {
    const name = newSceneName.trim() || `0${scenes.length + 1}: USER SCENE`;
    const newScene: Scene = {
      id: scenes.length + 1,
      name,
      note: 'User captured snapshot from live console state',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      channels: channels.map(c => ({ id: c.id, fader: c.fader, pan: c.pan, muted: c.muted, preampGain: c.preampGain })),
      buses: buses.map(b => ({ id: b.id, fader: b.fader, muted: b.muted })),
      dcas: dcas.map(d => ({ id: d.id, fader: d.fader, muted: d.muted })),
      masterFader
    };

    setScenes([...scenes, newScene]);
    setSelectedSceneId(newScene.id);
    setNewSceneName('');
  };

  const handleRecall = () => {
    const sc = scenes.find(s => s.id === selectedSceneId);
    if (sc) {
      onRecallScene(sc);
    }
  };

  const currentScene = scenes.find(s => s.id === selectedSceneId) || scenes[0];

  return (
    <div className="h-full flex flex-col p-3 gap-2 text-xs font-mono text-zinc-300">
      <div className="flex justify-between items-center bg-[#151921] px-3 py-1.5 rounded border border-zinc-800">
        <span className="text-amber-400 font-bold">SHOW CONTROL & SCENES MEMORY (UP TO 100 SCENES)</span>
        <span className="text-zinc-400 text-[10px]">TOTAL RECALL AUTOMATION</span>
      </div>

      <div className="grid grid-cols-12 gap-3 flex-1">
        {/* Scenes List */}
        <div className="col-span-5 bg-[#0a0c10] p-2 rounded border border-zinc-800 flex flex-col gap-1 overflow-y-auto">
          <span className="text-[10px] text-zinc-400 font-bold px-1 mb-1">INTERNAL SHOW MEMORY</span>
          {scenes.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSceneId(s.id)}
              className={`p-2 rounded border text-left flex justify-between items-center transition ${
                selectedSceneId === s.id
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-[#111419] border-zinc-800 text-zinc-400 hover:bg-[#181d24]'
              }`}
            >
              <div>
                <span className="font-bold text-xs block">{s.name}</span>
                <span className="text-[9px] text-zinc-500">{s.note}</span>
              </div>
              <span className="text-[8px] text-zinc-500 font-mono">{s.timestamp}</span>
            </button>
          ))}
        </div>

        {/* Selected Scene Details & Action Controls */}
        <div className="col-span-7 bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-amber-400 font-bold text-sm">{currentScene.name}</span>
            <div className="bg-[#0b0e13] p-2.5 rounded border border-zinc-800 text-[11px] text-zinc-300">
              <span className="text-zinc-500 block text-[9px] mb-1">SCENE DESCRIPTION:</span>
              {currentScene.note}
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] my-2">
              <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
                <span className="text-zinc-500 block">CHANNELS:</span>
                <span className="text-cyan-300 font-bold">40 Inputs</span>
              </div>
              <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
                <span className="text-zinc-500 block">BUSES:</span>
                <span className="text-cyan-300 font-bold">16 Mix Buses</span>
              </div>
              <div className="bg-[#0b0e13] p-2 rounded border border-zinc-800">
                <span className="text-zinc-500 block">SAFES:</span>
                <span className="text-emerald-400 font-bold">HA Preamps Safe</span>
              </div>
            </div>

            {/* Save new scene input */}
            <div className="pt-2 border-t border-zinc-800 flex gap-2 items-center">
              <input
                type="text"
                placeholder="New scene title..."
                value={newSceneName}
                onChange={e => setNewSceneName(e.target.value)}
                className="flex-1 bg-black border border-zinc-700 text-amber-300 px-2 py-1 rounded text-xs"
              />
              <button
                onClick={handleSaveCurrentToScene}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs"
              >
                STORE SCENE
              </button>
            </div>
          </div>

          {/* Big Recall GO Button */}
          <div className="pt-3 border-t border-zinc-800 flex justify-end gap-3">
            <button
              onClick={handleRecall}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm rounded shadow-lg tracking-wider"
            >
              GO / RECALL SCENE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
