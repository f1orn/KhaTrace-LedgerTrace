import React from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  Lock, 
  Coins, 
  Clock, 
  Wallet, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle 
} from './Icons';
import { SessionPolicy, ScenarioDefinition } from '../types';
import { formatHash } from '../crypto/keccak256';

interface AccountAbstractionPanelProps {
  policy: SessionPolicy;
  scenario: ScenarioDefinition;
}

export const AccountAbstractionPanel: React.FC<AccountAbstractionPanelProps> = ({
  policy,
  scenario
}) => {
  const budget = policy?.sessionBudgetUSD ?? 50000;
  const maxTx = policy?.maxTxAmountUSD ?? 30000;
  const allowedSelectors = policy?.allowedSelectors || ['0x42966c68', '0xa9059cbb'];
  const mandatoryNodes = policy?.mandatoryNodeTypes || ['MARKET_DATA_FEED', 'RISK_EVALUATION', 'POLICY_COMPLIANCE'];

  return (
    <div className="space-y-6">
      <div className="bg-dark-900 border border-dark-750 rounded-2xl p-6 backdrop-blur-md shadow-glass">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-cyber-amber/10 border border-cyber-amber/30 text-cyber-amber">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white font-sans flex items-center gap-2">
              ERC-4337 Session Key Guardian Architecture
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-emerald/15 text-cyber-emerald border border-cyber-emerald/30">
                ACTIVE
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Ephemeral, scoped signing session enabling autonomous agent execution under strict on-chain invariants.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-dark-950 border border-dark-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-sans">Session Identifier</span>
            <p className="font-mono text-xs font-bold text-cyber-cyan">{policy?.sessionId || 'sess_default'}</p>
          </div>

          <div className="p-4 rounded-xl bg-dark-950 border border-dark-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-sans">Authorized Agent Wallet</span>
            <p className="font-mono text-xs text-slate-300 select-all">{formatHash(policy?.agentWallet, 6, 4)}</p>
          </div>

          <div className="p-4 rounded-xl bg-dark-950 border border-dark-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-sans">Target Treasury Vault</span>
            <p className="font-mono text-xs text-cyber-emerald select-all">{formatHash(policy?.targetVault, 6, 4)}</p>
          </div>

          <div className="p-4 rounded-xl bg-dark-950 border border-dark-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-sans">Total Session Budget Cap</span>
            <p className="font-mono text-sm font-bold text-cyber-emerald">
              ${budget.toLocaleString()} USD
            </p>
          </div>

          <div className="p-4 rounded-xl bg-dark-950 border border-dark-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-sans">Max Single Tx Allowance</span>
            <p className="font-mono text-sm font-bold text-slate-200">
              ${maxTx.toLocaleString()} USD
            </p>
          </div>

          <div className="p-4 rounded-xl bg-dark-950 border border-dark-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-sans">Session Key Validity</span>
            <p className="font-mono text-xs text-slate-200">24 Hours (Expires in 23h 48m)</p>
          </div>
        </div>

        {/* Allowed Selectors & Invariants */}
        <div className="mt-6 pt-6 border-t border-dark-800 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <h4 className="font-bold text-slate-200 mb-2 font-sans">Whitelisted Function Selectors:</h4>
            <div className="space-y-1.5 font-mono text-[11px]">
              {allowedSelectors.map((sel) => (
                <div key={sel} className="p-2 rounded bg-dark-950 border border-dark-800 flex items-center justify-between">
                  <span className="text-cyber-cyan">{sel}</span>
                  <span className="text-slate-500 font-sans text-[10px]">
                    {sel === '0x42966c68' ? 'rebalanceVault(address,address,uint256,uint256)' : 'transfer(address,uint256)'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-200 mb-2 font-sans">Mandatory Node Invariants:</h4>
            <div className="space-y-1.5 font-mono text-[11px]">
              {mandatoryNodes.map((mNode) => (
                <div key={mNode} className="p-2 rounded bg-dark-950 border border-dark-800 flex items-center justify-between text-cyber-purple">
                  <span>{mNode}</span>
                  <span className="text-cyber-emerald text-[10px] font-sans">REQUIRED IN ROOT</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
