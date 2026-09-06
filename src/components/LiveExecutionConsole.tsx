import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Play, 
  Trash2, 
  Download, 
  Cpu, 
  Hash, 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  Database, 
  ArrowRight, 
  ShieldCheck 
} from './Icons';
import { StateBlock, ScenarioDefinition, OnChainTxResult } from '../types';
import { formatHash } from '../crypto/keccak256';
import { sound } from '../utils/audio';

interface LiveExecutionConsoleProps {
  logs: Array<{
    timestamp: number;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'CRYPTO';
    message: string;
    nodeId?: string;
    data?: any;
  }>;
  stateBlocks: StateBlock[];
  scenario: ScenarioDefinition;
  merkleRoot: string | null;
  onChainTx: OnChainTxResult | null;
  isRunning: boolean;
  onRunSimulation: () => void;
}

export const LiveExecutionConsole: React.FC<LiveExecutionConsoleProps> = ({
  logs,
  stateBlocks,
  scenario,
  merkleRoot,
  onChainTx,
  isRunning,
  onRunSimulation
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return 'text-cyber-emerald bg-cyber-emerald/10 border-cyber-emerald/30';
      case 'ERROR':
        return 'text-cyber-crimson bg-cyber-crimson/10 border-cyber-crimson/30';
      case 'WARN':
        return 'text-cyber-amber bg-cyber-amber/10 border-cyber-amber/30';
      case 'CRYPTO':
        return 'text-cyber-purple bg-cyber-purple/10 border-cyber-purple/30';
      default:
        return 'text-cyber-cyan bg-cyber-cyan/10 border-cyber-cyan/30';
    }
  };

  const handleExportLogs = () => {
    const jsonStr = JSON.stringify({
      scenario: scenario?.title || 'Scenario',
      timestamp: new Date().toISOString(),
      merkleRoot,
      stateBlocks,
      onChainTx,
      logs
    }, null, 2);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledgertrace_audit_${Date.now()}.json`;
    a.click();
    sound.playClick();
  };

  const logsList = logs || [];

  return (
    <div className="space-y-6">
      <div className="bg-dark-900 border border-dark-750 rounded-2xl p-5 backdrop-blur-md shadow-glass">
        {/* Terminal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-dark-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-sans">
                  Agentic Execution & Cryptographic Interceptor
                </h3>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-cyan"></span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Intercepting LangGraph state transitions, hashing canonical JSON blocks, and formatting ERC-4337 UserOps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-750 text-xs font-medium transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyber-cyan" />
              <span>Export Audit JSON</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onRunSimulation();
              }}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyber-cyan text-dark-950 font-semibold text-xs hover:brightness-110 shadow-neon-cyan/20 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Replay Stream</span>
            </button>
          </div>
        </div>

        {/* Streaming Logs Container */}
        <div 
          ref={terminalRef}
          className="mt-4 bg-dark-950 rounded-xl p-4 border border-dark-800 font-mono text-xs max-h-[500px] overflow-y-auto space-y-2.5 selection:bg-cyber-cyan/30"
        >
          {logsList.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p>Terminal ready. Click "Verify & Execute Trace" to start agent stream.</p>
            </div>
          ) : (
            logsList.map((log, i) => (
              <div key={i} className="flex items-start gap-3 leading-relaxed hover:bg-dark-900/50 p-1.5 rounded transition-colors">
                <span className="text-[10px] text-slate-500 shrink-0 select-none">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${getLevelColor(log.level)}`}>
                  {log.level}
                </span>

                <div className="flex-1 text-slate-200">
                  <span className="font-sans text-xs">{log.message}</span>
                  {log.data && (
                    <div className="mt-1 p-2 rounded bg-dark-900 border border-dark-800 text-[11px] text-cyber-cyan overflow-x-auto">
                      {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
