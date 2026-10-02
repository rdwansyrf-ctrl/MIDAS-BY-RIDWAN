import React, { useState } from 'react';
import { TRAINING_MODULES, TrainingModule } from '../../data/trainingModules';
import { ChannelState } from '../../types/mixer';
import { CheckCircle2, Circle, AlertCircle, ArrowRight } from 'lucide-react';

interface TrainingViewProps {
  channels: ChannelState[];
  masterFader: number;
  sendsOnFaderActive: boolean;
  onSelectChannel: (id: number) => void;
  onNavigateTab: (tab: any) => void;
}

export const TrainingView: React.FC<TrainingViewProps> = ({
  channels,
  masterFader,
  sendsOnFaderActive,
  onSelectChannel,
  onNavigateTab
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(TRAINING_MODULES[0].id);

  const activeModule = TRAINING_MODULES.find(m => m.id === selectedModuleId) || TRAINING_MODULES[0];

  return (
    <div className="h-full flex flex-col p-3 gap-2 text-xs font-mono text-zinc-300">
      <div className="flex justify-between items-center bg-[#151921] px-3 py-1.5 rounded border border-zinc-800">
        <span className="text-amber-400 font-bold">LIVE CONSOLE TRAINING WORKSTATION</span>
        <span className="text-zinc-400 text-[10px]">PRACTICAL REAL-TIME MISSIONS</span>
      </div>

      <div className="grid grid-cols-12 gap-3 flex-1">
        {/* Module List */}
        <div className="col-span-4 bg-[#0a0c10] p-2 rounded border border-zinc-800 flex flex-col gap-1 overflow-y-auto">
          <span className="text-[10px] text-zinc-400 font-bold px-1 mb-1">TRAINING MISSIONS</span>
          {TRAINING_MODULES.map(mod => {
            const isDone = mod.steps.every(s =>
              s.checkCompleted({ channels, masterFader, sendsOnFaderActive })
            );

            return (
              <button
                key={mod.id}
                onClick={() => setSelectedModuleId(mod.id)}
                className={`p-2 rounded border text-left flex justify-between items-center transition ${
                  selectedModuleId === mod.id
                    ? 'bg-blue-950/60 border-blue-400 text-blue-200'
                    : 'bg-[#111419] border-zinc-800 text-zinc-400 hover:bg-[#181d24]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-zinc-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-[11px] block">{mod.title}</span>
                    <span className="text-[8px] text-zinc-500">{mod.category} • {mod.difficulty}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Module Detail & Steps */}
        <div className="col-span-8 bg-[#12161e] p-3 rounded border border-zinc-800 flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-amber-400 font-bold text-sm block">{activeModule.title}</span>
                <span className="text-zinc-400 text-[10px]">{activeModule.summary}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-300">
                {activeModule.difficulty}
              </span>
            </div>

            {/* Steps list */}
            <div className="flex flex-col gap-2 my-2">
              {activeModule.steps.map(step => {
                const completed = step.checkCompleted({ channels, masterFader, sendsOnFaderActive });

                return (
                  <div
                    key={step.id}
                    className={`p-2.5 rounded border flex flex-col gap-1 transition ${
                      completed
                        ? 'bg-emerald-950/40 border-emerald-500/60'
                        : 'bg-[#0b0e13] border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                        )}
                        <span className="font-bold text-zinc-200">{step.title}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${completed ? 'bg-emerald-900 text-emerald-200' : 'bg-amber-900/60 text-amber-300'}`}>
                        {completed ? 'MISSION COMPLETE' : 'INCOMPLETE'}
                      </span>
                    </div>

                    <p className="text-[10px] text-zinc-400 pl-6">{step.description}</p>

                    <div className="bg-black/50 p-2 rounded border border-zinc-800 text-[10px] text-amber-300 flex justify-between items-center ml-6 mt-1">
                      <span>GOAL: {step.instruction}</span>
                      {step.targetChannelId && (
                        <button
                          onClick={() => {
                            if (step.targetChannelId) {
                              onSelectChannel(step.targetChannelId);
                              if (step.targetCategory === 'gain') onNavigateTab('CHANNEL');
                              else if (step.targetCategory === 'gate') onNavigateTab('GATE');
                              else if (step.targetCategory === 'eq') onNavigateTab('EQ');
                              else if (step.targetCategory === 'comp') onNavigateTab('DYN');
                              else if (step.targetCategory === 'sends') onNavigateTab('SENDS');
                            }
                          }}
                          className="flex items-center gap-1 text-[9px] text-cyan-400 hover:text-cyan-300 font-bold"
                        >
                          <span>NAVIGATE TO TARGET</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="text-[9px] text-zinc-500 pl-6 italic">
                      HINT: {step.hint}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[9px] text-zinc-500 border-t border-zinc-800 pt-1">
            Training tasks monitor live mixer faders, gain staging, filters, and dynamics in real time.
          </div>
        </div>
      </div>
    </div>
  );
};
