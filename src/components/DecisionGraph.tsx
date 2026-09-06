import React from 'react';
import { 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  Cpu, 
  ShieldAlert, 
  ArrowRight, 
  Database, 
  FileCheck, 
  Send, 
  Hash, 
  ChevronRight, 
  ExternalLink, 
  Code, 
  Sparkles, 
  Zap 
} from './Icons';
import { StateBlock, ScenarioDefinition, NodeStatus } from '../types';
import { formatHash } from '../crypto/keccak256';
import { sound } from '../utils/audio';

interface DecisionGraphProps {
  stateBlocks: StateBlock[];
  activeNodeIndex: number;
  scenario: ScenarioDefinition;
  onSelectNode: (node: StateBlock) => void;
  selectedNode: StateBlock | null;
}

export const DecisionGraph: React.FC<DecisionGraphProps> = ({
  stateBlocks,
  activeNodeIndex,
  scenario,
  onSelectNode,
  selectedNode
}) => {
  const getStatusBadge = (status: NodeStatus) => {
    switch (status) {
      case 'verified':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-emerald/15 text-cyber-emerald border border-cyber-emerald/30">VERIFIED LEAF</span>;
      case 'executed':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30">EXECUTED ON-CHAIN</span>;
      case 'drifted':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-crimson/20 text-cyber-crimson border border-cyber-crimson/50 font-bold animate-pulse">LOGIC DRIFT / REVERT</span>;
      case 'active':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 animate-pulse">PROCESSING</span>;
      default:
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-750 text-slate-400">PENDING</span>;
    }
  };

  const blocksList = stateBlocks || [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Left 8 Cols: Interactive Visual Node Graph */}
      <div className="xl:col-span-8 flex flex-col gap-4">
        <div className="bg-dark-900 border border-dark-750 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md shadow-glass">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30">
                <Cpu className="w-5 h-5 text-cyber-cyan" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  LangGraph State Machine Pipeline
                  <span className="text-xs font-mono font-normal text-slate-400">
                    ({blocksList.length} Discrete State Blocks)
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Chronological block chaining: Leaf<sub>i</sub> = Keccak256(Block<sub>i</sub> ∥ PrevHash<sub>i-1</sub>)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${scenario?.badgeColor || 'text-slate-300'}`}>
                {(scenario?.category || 'STATE_GRAPH').replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Connected Node Graph Visualizer */}
          <div className="relative py-4 flex flex-col gap-4">
            {blocksList.map((block, idx) => {
              if (!block) return null;
              const isSelected = selectedNode?.nodeId === block.nodeId;
              const isCulprit = block.status === 'drifted' || block.status === 'reverted';
              const isCurrent = idx === activeNodeIndex;

              return (
                <div key={block.nodeId || idx} className="relative">
                  {/* Vertical Connection Line */}
                  {idx < blocksList.length - 1 && (
                    <div className="absolute left-7 top-14 bottom-[-16px] w-0.5 bg-dark-700 z-0">
                      {isCurrent && (
                        <div className="w-full h-1/2 bg-gradient-to-b from-cyber-cyan to-transparent animate-pulse" />
                      )}
                    </div>
                  )}

                  {/* Node Card */}
                  <div
                    onClick={() => {
                      sound.playClick();
                      onSelectNode(block);
                    }}
                    className={`relative z-10 cursor-pointer rounded-xl p-4 transition-all duration-200 border ${
                      isSelected
                        ? 'border-cyber-cyan bg-dark-800 shadow-neon-cyan/20 shadow-lg scale-[1.01]'
                        : isCulprit
                          ? 'border-cyber-crimson/80 bg-cyber-crimson/5 hover:bg-cyber-crimson/10 shadow-neon-crimson/20'
                          : 'border-dark-750 bg-dark-850 hover:bg-dark-800 hover:border-dark-600'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Step Number Circle */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 border ${
                          isCulprit
                            ? 'bg-cyber-crimson/20 text-cyber-crimson border-cyber-crimson/60 shadow-neon-crimson/30'
                            : block.status === 'verified' || block.status === 'executed'
                              ? 'bg-cyber-emerald/20 text-cyber-emerald border-cyber-emerald/50'
                              : 'bg-dark-750 text-slate-300 border-dark-600'
                        }`}>
                          #{idx + 1}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-sm text-slate-100 font-sans">
                              {block.nodeName}
                            </span>
                            {block.isMandatoryCheckpoint && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyber-purple/15 text-cyber-purple border border-cyber-purple/30">
                                MANDATORY INVARIANT
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {block.reasoningTrace}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1.5 shrink-0">
                        {getStatusBadge(block.status)}
                        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                          <Hash className="w-3 h-3 text-cyber-cyan" />
                          <span>{formatHash(block.leafHash, 4, 4)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Forensic Alert Banner for Culprit Nodes */}
                    {block.violationDetails && (
                      <div className="mt-3 p-2.5 rounded-lg bg-cyber-crimson/15 border border-cyber-crimson/40 text-xs text-cyber-crimson flex items-start gap-2">
                        <AlertOctagon className="w-4 h-4 text-cyber-crimson shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold font-mono text-[11px]">
                            {block.violationDetails.type}: {block.violationDetails.message}
                          </p>
                          {block.violationDetails.expectedValue && (
                            <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-mono">
                              <span className="text-slate-400">EXPECTED: <span className="text-cyber-emerald">{block.violationDetails.expectedValue}</span></span>
                              {block.violationDetails.actualValue && (
                                <span className="text-slate-400">ACTUAL: <span className="text-cyber-crimson">{block.violationDetails.actualValue}</span></span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right 4 Cols: Selected Node Deep Inspector */}
      <div className="xl:col-span-4 flex flex-col gap-4">
        <div className="bg-dark-900 border border-dark-750 rounded-2xl p-5 backdrop-blur-md sticky top-24 shadow-glass">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-dark-750">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-cyber-cyan" />
                  <h3 className="text-sm font-bold text-white font-sans">
                    State Block Inspector
                  </h3>
                </div>
                {getStatusBadge(selectedNode.status)}
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Node Identifier</span>
                <p className="text-xs font-mono font-semibold text-cyber-cyan">{selectedNode.nodeId}</p>
                <p className="text-xs font-medium text-slate-200 mt-0.5">{selectedNode.nodeName}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Agent Role</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-dark-800 text-cyber-purple border border-cyber-purple/30">
                    {selectedNode.agentRole}
                  </span>
                  <span className="text-xs font-mono text-slate-400">Nonce: #{selectedNode.nonce}</span>
                </div>
              </div>

              {/* Hashes */}
              <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 space-y-2 font-mono text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Cryptographic Leaf Hash (Keccak-256)</div>
                  <div className="text-cyber-emerald break-all text-[11px] select-all">
                    {selectedNode.leafHash}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Parent PrevBlockHash (Inner Chain)</div>
                  <div className="text-slate-400 break-all text-[11px] select-all">
                    {selectedNode.prevBlockHash}
                  </div>
                </div>
                {selectedNode.daIpfsCid && (
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Data Availability (IPFS CID)</div>
                    <div className="text-cyber-cyan break-all text-[11px] select-all">
                      {selectedNode.daIpfsCid}
                    </div>
                  </div>
                )}
              </div>

              {/* Reasoning Trace */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Full LLM Thought Stream</span>
                <p className="text-xs text-slate-300 mt-1 bg-dark-850 p-3 rounded-lg border border-dark-800 leading-relaxed">
                  {selectedNode.reasoningTrace}
                </p>
              </div>

              {/* Tool Invocations */}
              {(selectedNode?.toolCalls?.length ?? 0) > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Tool Calls ({selectedNode.toolCalls.length})
                  </span>
                  <div className="mt-1 space-y-2">
                    {selectedNode.toolCalls.map((tool, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-dark-850 border border-dark-800 text-xs">
                        <div className="flex items-center justify-between font-mono text-cyber-cyan text-[11px]">
                          <span>🔧 {tool?.name}</span>
                          <span className="text-slate-500">{tool?.durationMs}ms</span>
                        </div>
                        {tool?.sourceOracle && (
                          <div className="text-[10px] text-cyber-emerald mt-1 font-mono">
                            Signed by: {tool.sourceOracle}
                          </div>
                        )}
                        <div className="mt-1.5 p-1.5 rounded bg-dark-950 font-mono text-[10px] text-slate-300 overflow-x-auto">
                          {JSON.stringify(tool?.output || {}, null, 2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <Cpu className="w-8 h-8 mx-auto mb-2 opacity-40 text-cyber-cyan" />
              <p className="text-xs">Click on any node in the graph to inspect its cryptographic state block.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
