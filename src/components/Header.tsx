import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  Play, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  PlusCircle, 
  Layers, 
  FileCode2, 
  KeyRound, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink 
} from './Icons';
import { ScenarioDefinition, SessionPolicy, OnChainTxResult } from '../types';
import { SCENARIOS } from '../agent/scenarios';
import { formatHash } from '../crypto/keccak256';
import { sound } from '../utils/audio';

interface HeaderProps {
  currentScenario: ScenarioDefinition;
  onSelectScenario: (scenario: ScenarioDefinition) => void;
  isRunning: boolean;
  onRunSimulation: () => void;
  onOpenCustomModal: () => void;
  activeTab: string;
  onTabChange: (tab: any) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  merkleRoot: string | null;
  onChainTx: OnChainTxResult | null;
  onOpenTutorial?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScenario,
  onSelectScenario,
  isRunning,
  onRunSimulation,
  onOpenCustomModal,
  activeTab,
  onTabChange,
  soundEnabled,
  onToggleSound,
  merkleRoot,
  onChainTx,
  onOpenTutorial
}) => {
  const sessionBudget = currentScenario?.policy?.sessionBudgetUSD ?? 50000;
  const spentAmount = onChainTx?.status === 'SUCCESS' ? (currentScenario?.initialContext?.amountUSD ?? 0) : 0;
  const remainingBudget = Math.max(0, sessionBudget - spentAmount);

  return (
    <header className="border-b border-dark-750 bg-dark-900/80 backdrop-blur-xl sticky top-0 z-40">
      {/* Top Banner Bar */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 border-b border-dark-800/80 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-emerald opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-emerald"></span>
            </span>
            <span className="font-mono text-slate-400">NETWORK:</span>
            <span className="font-mono font-semibold text-cyber-cyan bg-cyber-cyan/10 px-2 py-0.5 rounded border border-cyber-cyan/30">
              EVM Sandbox (Arbitrum / Sepolia #42161)
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 border-l border-dark-750 pl-3">
            <KeyRound className="w-3.5 h-3.5 text-cyber-purple" />
            <span className="font-mono text-slate-400">ERC-4337 SESSION:</span>
            <span className="font-mono text-slate-200">
              {currentScenario?.policy?.sessionId || 'sess_active'}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-cyber-emerald font-mono font-medium">
              ${remainingBudget.toLocaleString()} USD Rem.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {merkleRoot && (
            <div className="hidden lg:flex items-center gap-1.5 font-mono text-slate-400 bg-dark-850 px-2.5 py-0.5 rounded border border-dark-700">
              <span className="text-slate-500">ROOT:</span>
              <span className="text-cyber-cyan font-semibold">{formatHash(merkleRoot, 6, 6)}</span>
            </div>
          )}

          {onChainTx && (
            <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded font-mono font-semibold text-xs ${
              onChainTx.status === 'SUCCESS' 
                ? 'bg-cyber-emerald/15 text-cyber-emerald border border-cyber-emerald/40' 
                : 'bg-cyber-crimson/15 text-cyber-crimson border border-cyber-crimson/40 animate-pulse'
            }`}>
              {onChainTx.status === 'SUCCESS' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ON-CHAIN: EXECUTED</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>ON-CHAIN: REVERTED</span>
                </>
              )}
            </div>
          )}

          <button
            onClick={onToggleSound}
            title={soundEnabled ? "Mute interface audio" : "Enable interface audio"}
            className="p-1.5 text-slate-400 hover:text-cyber-cyan transition-colors bg-dark-800 rounded border border-dark-750"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Navigation & Controls */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-cyan/20 via-cyber-purple/20 to-cyber-emerald/20 border border-cyber-cyan/40 flex items-center justify-center shadow-neon-cyan/20 shadow-lg">
            <ShieldCheck className="w-6 h-6 text-cyber-cyan" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-1.5">
                Ledger<span className="text-cyber-cyan">Trace</span>
              </h1>
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/40">
                PROT-V1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Proof-of-Reasoning Cryptographic Guardian for AI Agents</p>
          </div>
        </div>

        {/* Center: Scenario Selection & Trigger Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div id="tutorial-scenario-selector" className="relative">
            <select
              value={currentScenario?.id || ''}
              onChange={(e) => {
                const s = SCENARIOS.find(sc => sc.id === e.target.value);
                if (s) {
                  sound.playClick();
                  onSelectScenario(s);
                }
              }}
              className="bg-dark-850 border border-dark-700 hover:border-cyber-cyan/50 text-slate-200 text-xs font-medium rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-cyber-cyan transition-all appearance-none cursor-pointer"
            >
              {SCENARIOS.map((sc) => (
                <option key={sc.id} value={sc.id} className="bg-dark-900 text-slate-200">
                  {sc.category === 'GOLDEN_PATH' ? '✓ ' : '⚠ '} {sc.title}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 text-xs">
              ▼
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onOpenCustomModal();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700 transition-all text-xs font-medium"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>Custom Attack / Task</span>
          </button>

          {/* RPG Cat Guide Me Button */}
          {onOpenTutorial && (
            <button
              onClick={() => {
                sound.playCatMeow();
                onOpenTutorial();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyber-purple/15 hover:bg-cyber-purple/25 text-cyber-purple border border-cyber-purple/40 hover:border-cyber-purple/70 transition-all text-xs font-bold shadow-neon-purple/20"
              title="Launch Inspector Whiskers RPG Tutorial"
            >
              <span className="text-sm">🐾</span>
              <span>Guide Me!</span>
            </button>
          )}

          <button
            id="tutorial-run-button"
            onClick={() => {
              sound.playClick();
              onRunSimulation();
            }}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all shadow-lg ${
              isRunning
                ? 'bg-dark-700 text-slate-400 cursor-not-allowed'
                : currentScenario?.expectedOutcome === 'SUCCESS'
                  ? 'bg-gradient-to-r from-cyber-cyan to-cyber-emerald text-dark-950 hover:brightness-110 shadow-neon-cyan/20'
                  : 'bg-gradient-to-r from-cyber-crimson to-cyber-rose text-white hover:brightness-110 shadow-neon-crimson/20'
            }`}
          >
            {isRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                <span>Executing Graph & Proofs...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Verify & Execute Trace</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div id="tutorial-tabs-container" className="max-w-[1700px] mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-dark-800">
        <button
          onClick={() => { sound.playClick(); onTabChange('graph'); }}
          className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'graph'
              ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Decision Graph (LangGraph)</span>
        </button>

        <button
          onClick={() => { sound.playClick(); onTabChange('merkle'); }}
          className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'merkle'
              ? 'border-cyber-purple text-cyber-purple bg-cyber-purple/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Merkle Tree & Proof Math</span>
        </button>

        <button
          onClick={() => { sound.playClick(); onTabChange('context-drift'); }}
          className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap relative ${
            activeTab === 'context-drift'
              ? 'border-cyber-crimson text-cyber-crimson bg-cyber-crimson/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Context Panel & Drift Forensics</span>
          {currentScenario?.expectedOutcome === 'REVERT' && (
            <span className="w-2 h-2 rounded-full bg-cyber-crimson animate-ping ml-1" />
          )}
        </button>

        <button
          onClick={() => { sound.playClick(); onTabChange('contract'); }}
          className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'contract'
              ? 'border-cyber-emerald text-cyber-emerald bg-cyber-emerald/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>Guardian Contract & EVM Explorer</span>
        </button>

        <button
          onClick={() => { sound.playClick(); onTabChange('session-keys'); }}
          className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'session-keys'
              ? 'border-cyber-amber text-cyber-amber bg-cyber-amber/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>ERC-4337 Session Rules</span>
        </button>

        <button
          onClick={() => { sound.playClick(); onTabChange('live-console'); }}
          className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'live-console'
              ? 'border-cyber-blue text-cyber-blue bg-cyber-blue/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Agent Live Stream Console</span>
        </button>
      </div>
    </header>
  );
};
