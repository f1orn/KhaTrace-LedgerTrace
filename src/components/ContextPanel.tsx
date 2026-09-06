import React, { useState } from 'react';
import { 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  ShieldAlert, 
  FileSearch, 
  Terminal, 
  ArrowRight, 
  Hash, 
  Zap, 
  Bug, 
  KeyRound, 
  Scale, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  Copy 
} from './Icons';
import { StateBlock, ScenarioDefinition, OnChainTxResult } from '../types';
import { formatHash } from '../crypto/keccak256';
import { sound } from '../utils/audio';

interface ContextPanelProps {
  scenario: ScenarioDefinition;
  stateBlocks: StateBlock[];
  onChainTx: OnChainTxResult | null;
  onRunSimulation: () => void;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  scenario,
  stateBlocks,
  onChainTx,
  onRunSimulation
}) => {
  const [activeTab, setActiveTab] = useState<'drift' | 'diff' | 'remediation'>('drift');

  const blocksList = stateBlocks || [];

  // Find culprit drifted node safely
  const culpritBlock = blocksList.find(
    b => b && (b.status === 'drifted' || b.status === 'reverted' || (onChainTx?.culpritNodeId && b.nodeId === onChainTx.culpritNodeId))
  );

  const isReverted = onChainTx?.status === 'REVERTED' || scenario?.expectedOutcome === 'REVERT';

  return (
    <div className="space-y-6">
      {/* Top Banner: Incident / Health Status */}
      <div className={`rounded-2xl p-6 border backdrop-blur-md shadow-glass transition-all ${
        isReverted 
          ? 'bg-cyber-crimson/10 border-cyber-crimson/40 shadow-neon-crimson/20' 
          : 'bg-cyber-emerald/10 border-cyber-emerald/30 shadow-neon-emerald/20'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl border shrink-0 ${
              isReverted
                ? 'bg-cyber-crimson/20 border-cyber-crimson/50 text-cyber-crimson animate-pulse'
                : 'bg-cyber-emerald/20 border-cyber-emerald/50 text-cyber-emerald'
            }`}>
              {isReverted ? <AlertOctagon className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                  isReverted
                    ? 'bg-cyber-crimson/20 text-cyber-crimson border-cyber-crimson/40'
                    : 'bg-cyber-emerald/20 text-cyber-emerald border-cyber-emerald/40'
                }`}>
                  {isReverted ? 'ON-CHAIN REVERSION DETECTED' : 'CRYPTOGRAPHIC AUDIT CLEAN'}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Code: {onChainTx?.revertCode || (isReverted ? 'INVARIANT_VIOLATION' : 'TX_VERIFIED_SUCCESS')}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white mt-1 font-sans">
                {isReverted 
                  ? `Deterministic Guardian Halt: ${scenario?.title || 'Execution Stopped'}` 
                  : 'Zero Logic Drift: Complete Proof-of-Reasoning Alignment'}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                {isReverted
                  ? (onChainTx?.revertMessage || scenario?.anomalyDescription || 'Smart contract intercepted unverified or hallucinated agent state before any asset transfer.')
                  : 'All discrete state blocks, oracle witness signatures, VaR risk models, and ERC-4337 session limits were mathematically verified on-chain.'}
              </p>
            </div>
          </div>

          {isReverted && (
            <div className="shrink-0 flex sm:flex-col items-start gap-2">
              <span className="text-[10px] font-mono uppercase text-slate-400">Target Protected</span>
              <span className="text-xs font-mono text-cyber-cyan bg-dark-950 px-3 py-1 rounded-lg border border-dark-750">
                Vault: {formatHash(scenario?.policy?.targetVault, 6, 4)}
              </span>
              <span className="text-xs font-mono text-cyber-emerald">
                $0.00 Lost (State Protected)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs for Forensics Breakdown */}
      <div className="flex items-center gap-2 border-b border-dark-800 pb-2">
        <button
          onClick={() => { sound.playClick(); setActiveTab('drift'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'drift'
              ? 'bg-cyber-crimson/20 text-cyber-crimson border border-cyber-crimson/40'
              : 'text-slate-400 hover:text-white bg-dark-850'
          }`}
        >
          <FileSearch className="w-3.5 h-3.5" />
          <span>Drift Analysis & Culprit Node</span>
        </button>

        <button
          onClick={() => { sound.playClick(); setActiveTab('diff'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'diff'
              ? 'bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/40'
              : 'text-slate-400 hover:text-white bg-dark-850'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Off-Chain Logs vs. On-Chain Hashes</span>
        </button>

        <button
          onClick={() => { sound.playClick(); setActiveTab('remediation'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'remediation'
              ? 'bg-cyber-emerald/20 text-cyber-emerald border border-cyber-emerald/40'
              : 'text-slate-400 hover:text-white bg-dark-850'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Security Remediation & Policy Fixes</span>
        </button>
      </div>

      {/* Tab 1: Drift Analysis */}
      {activeTab === 'drift' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Culprit Node Card */}
          <div className="lg:col-span-7 bg-dark-900 border border-dark-750 rounded-2xl p-5 backdrop-blur-md shadow-glass">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-cyber-crimson" />
                <h3 className="text-sm font-bold text-white font-sans">
                  Identified Point of Failure / Hallucination
                </h3>
              </div>
              {culpritBlock && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-crimson/20 text-cyber-crimson border border-cyber-crimson/40 font-bold animate-pulse">
                  NODE #{((culpritBlock?.index ?? 0) + 1)} DRIFT
                </span>
              )}
            </div>

            {culpritBlock ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-cyber-crimson/10 border border-cyber-crimson/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyber-crimson">
                      {culpritBlock.nodeName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Role: {culpritBlock.agentRole}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {culpritBlock.violationDetails?.message || culpritBlock.reasoningTrace}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-dark-950 border border-dark-800">
                    <span className="text-[10px] uppercase text-slate-500 font-sans">Expected by Smart Contract</span>
                    <p className="text-cyber-emerald font-semibold mt-1">
                      {culpritBlock.violationDetails?.expectedValue || 'Full Cryptographic Proof & Mandatory Node'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-dark-950 border border-dark-800">
                    <span className="text-[10px] uppercase text-slate-500 font-sans">Observed in Agent Payload</span>
                    <p className="text-cyber-crimson font-semibold mt-1">
                      {culpritBlock.violationDetails?.actualValue || 'Drifted / Tampered State'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 text-xs font-mono space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase">Culprit Leaf Hash</div>
                  <div className="text-cyber-crimson break-all">{culpritBlock.leafHash}</div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-200 mb-1 font-sans">Raw Reasoning Log Excerpt:</h4>
                  <div className="p-3 rounded-xl bg-dark-850 border border-dark-800 text-xs text-slate-300 font-mono leading-relaxed max-h-40 overflow-y-auto">
                    {culpritBlock.reasoningTrace}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-cyber-emerald" />
                <p className="text-sm font-semibold text-white">No Logic Drift Detected</p>
                <p className="text-xs text-slate-500 mt-1">The agent executed completely within safe boundaries.</p>
              </div>
            )}
          </div>

          {/* Right 5 Cols: Execution Safety Architecture */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-dark-900 border border-dark-750 rounded-2xl p-5 backdrop-blur-md shadow-glass">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-4 h-4 text-cyber-cyan" />
                <h3 className="text-sm font-bold text-white font-sans">
                  The Proof-of-Reasoning Shield
                </h3>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="p-3 rounded-xl bg-dark-950 border border-dark-800">
                  <div className="font-bold text-cyber-cyan mb-1">1. Pre-Execution Halting</div>
                  <p className="text-slate-400">
                    Unlike traditional logging (where you find out about an exploit hours later in Datadog), LedgerTrace evaluates proofs on the smart contract before any transaction executes.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-dark-950 border border-dark-800">
                  <div className="font-bold text-cyber-purple mb-1">2. Zero Trust in Probabilistic LLMs</div>
                  <p className="text-slate-400">
                    Even if the LLM undergoes a jailbreak or hallucination drift, the smart contract's deterministic rule engine guarantees invariant safety.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-dark-950 border border-dark-800">
                  <div className="font-bold text-cyber-emerald mb-1">3. Immutable Post-Mortem</div>
                  <p className="text-slate-400">
                    Every node is anchored into the Merkle Root, creating a tamper-proof audit trail for regulatory compliance and enterprise risk teams.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Diff Inspector */}
      {activeTab === 'diff' && (
        <div className="bg-dark-900 border border-dark-750 rounded-2xl p-5 backdrop-blur-md shadow-glass">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 font-sans">
            <Layers className="w-4 h-4 text-cyber-purple" />
            <span>State Block Hashes vs. Off-Chain JSON Canonical Trace</span>
          </h3>

          <div className="space-y-3">
            {blocksList.map((b, i) => (
              <div key={b?.nodeId || i} className={`p-3 rounded-xl border text-xs font-mono transition-all ${
                b?.status === 'drifted' || b?.status === 'reverted'
                  ? 'bg-cyber-crimson/10 border-cyber-crimson/50 text-slate-200'
                  : 'bg-dark-950 border-dark-800 text-slate-300'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-dark-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyber-cyan">Block #{i + 1}</span>
                    <span className="text-slate-200 font-sans font-semibold">{b?.nodeName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-sans">Leaf Hash:</span>
                    <span className="text-cyber-emerald">{formatHash(b?.leafHash, 6, 6)}</span>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-500 font-sans uppercase">Input Payload:</span>
                    <pre className="mt-1 p-2 rounded bg-dark-900 border border-dark-800 overflow-x-auto text-slate-300">
                      {JSON.stringify(b?.inputPayload || {}, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-sans uppercase">Output Payload:</span>
                    <pre className="mt-1 p-2 rounded bg-dark-900 border border-dark-800 overflow-x-auto text-slate-300">
                      {JSON.stringify(b?.outputPayload || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Security Remediation */}
      {activeTab === 'remediation' && (
        <div className="bg-dark-900 border border-dark-750 rounded-2xl p-5 backdrop-blur-md shadow-glass space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyber-emerald" />
            <h3 className="text-sm font-bold text-white font-sans">
              Automated Policy Hardening Recommendations
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-dark-950 border border-dark-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-cyber-cyan font-sans">
                <KeyRound className="w-4 h-4" />
                <span>1. Session Key Scoping</span>
              </div>
              <p className="text-slate-400">
                Reduce maximum transaction cap from <span className="font-mono text-slate-200">$50,000</span> to <span className="font-mono text-cyber-emerald">$25,000</span> and require 2-step oracle witness signatures.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-dark-950 border border-dark-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-cyber-purple font-sans">
                <Layers className="w-4 h-4" />
                <span>2. Mandatory TEE Enclaves</span>
              </div>
              <p className="text-slate-400">
                Execute the Risk Evaluation node in an AWS Nitro / Intel SGX TEE hardware sandbox to prevent prompt injection corruption.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-dark-950 border border-dark-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-cyber-emerald font-sans">
                <Zap className="w-4 h-4" />
                <span>3. ZK Proof Aggregation</span>
              </div>
              <p className="text-slate-400">
                Compile LangGraph state machine invariants into a Groth16 zk-SNARK proof to lower on-chain verification gas to fixed ~200k.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
