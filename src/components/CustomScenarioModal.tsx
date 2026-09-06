import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldAlert, 
  Terminal, 
  Cpu, 
  Zap, 
  AlertTriangle, 
  Play 
} from './Icons';
import { ScenarioDefinition } from '../types';
import { sound } from '../utils/audio';

interface CustomScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScenario: (customScenario: ScenarioDefinition) => void;
}

export const CustomScenarioModal: React.FC<CustomScenarioModalProps> = ({
  isOpen,
  onClose,
  onApplyScenario
}) => {
  const [prompt, setPrompt] = useState<string>(
    'Swap 30,000 USDC into WETH on Uniswap V3 when 24h volatility index is below 22.0.'
  );
  const [amountUSD, setAmountUSD] = useState<number>(30000);
  const [sessionBudgetUSD, setSessionBudgetUSD] = useState<number>(50000);
  
  // Attack injection flags
  const [skipRiskCheck, setSkipRiskCheck] = useState<boolean>(false);
  const [injectPromptAttack, setInjectPromptAttack] = useState<boolean>(false);
  const [tamperOracle, setTamperOracle] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCreateAndRun = () => {
    sound.playClick();

    let category: ScenarioDefinition['category'] = 'GOLDEN_PATH';
    let expectedOutcome: 'SUCCESS' | 'REVERT' = 'SUCCESS';
    let badgeColor = 'text-cyber-emerald border-cyber-emerald/40 bg-cyber-emerald/10';

    if (skipRiskCheck) {
      category = 'ROGUE_AGENT';
      expectedOutcome = 'REVERT';
      badgeColor = 'text-cyber-crimson border-cyber-crimson/40 bg-cyber-crimson/10';
    } else if (injectPromptAttack) {
      category = 'PROMPT_INJECTION';
      expectedOutcome = 'REVERT';
      badgeColor = 'text-cyber-purple border-cyber-purple/40 bg-cyber-purple/10';
    } else if (tamperOracle) {
      category = 'ORACLE_MANIPULATION';
      expectedOutcome = 'REVERT';
      badgeColor = 'text-cyber-rose border-cyber-rose/40 bg-cyber-rose/10';
    } else if (amountUSD > sessionBudgetUSD) {
      category = 'POLICY_BREACH';
      expectedOutcome = 'REVERT';
      badgeColor = 'text-cyber-amber border-cyber-amber/40 bg-cyber-amber/10';
    }

    const customScenario: ScenarioDefinition = {
      id: `custom_${Date.now()}`,
      title: `Custom Run: ${category.replace('_', ' ')}`,
      category,
      badgeColor,
      description: `User-defined agent task: ${prompt}`,
      prompt,
      initialContext: {
        targetVault: '0x71C8F79D320875eA2f7a9F92f0fF61e4A70cEc7B',
        assetIn: 'USDC',
        assetOut: 'WETH',
        amountUSD,
        skipRiskAnalysis: skipRiskCheck,
        injectedPayload: injectPromptAttack ? '0x6e2b6d80000000000000000000000000deadbeefdeadbeefdeadbeefdeadbeefdeadbeef' : undefined,
        attackerAddress: injectPromptAttack ? '0xDeadBeefDeadBeefDeadBeefDeadBeefDeadBeef' : undefined,
        forgedPrice: tamperOracle ? 4950 : undefined,
        actualPrice: 3120.50
      },
      expectedOutcome,
      policy: {
        sessionId: `sess_custom_${Math.floor(Math.random() * 9000 + 1000)}`,
        agentWallet: '0x8b32A4B4e8Ec4aF35b91b933dFc995B72620A05A',
        guardianContract: '0x9E71cA71B04e9C83A201A5E9559c5dAb9Db1E267',
        targetVault: '0x71C8F79D320875eA2f7a9F92f0fF61e4A70cEc7B',
        sessionBudgetUSD,
        spentBudgetUSD: 0,
        maxTxAmountUSD: sessionBudgetUSD,
        allowedSelectors: ['0x42966c68', '0xa9059cbb'],
        mandatoryNodeTypes: ['MARKET_DATA_FEED', 'RISK_EVALUATION', 'POLICY_COMPLIANCE'],
        expiryTimestamp: Date.now() + 86400000,
        requireWitnessAttestation: true
      }
    };

    onApplyScenario(customScenario);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
      <div className="bg-dark-900 border border-dark-750 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-dark-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Custom Agent Simulation & Attack Sandbox
              </h3>
              <p className="text-xs text-slate-400">
                Define agent goals, configure session boundaries, and inject rogue failure modes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-dark-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prompt Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Agent Directive / System Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full bg-dark-950 border border-dark-750 focus:border-cyber-cyan rounded-xl p-3 text-xs font-sans text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyber-cyan"
            placeholder="Enter the autonomous agent objective..."
          />
        </div>

        {/* Financial Limits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">Execution Trade Amount (USD)</label>
            <input
              type="number"
              value={amountUSD}
              onChange={(e) => setAmountUSD(Number(e.target.value))}
              className="w-full bg-dark-950 border border-dark-750 focus:border-cyber-cyan rounded-xl p-2.5 text-xs font-mono text-slate-200 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">ERC-4337 Session Budget (USD)</label>
            <input
              type="number"
              value={sessionBudgetUSD}
              onChange={(e) => setSessionBudgetUSD(Number(e.target.value))}
              className="w-full bg-dark-950 border border-dark-750 focus:border-cyber-cyan rounded-xl p-2.5 text-xs font-mono text-slate-200 focus:outline-none"
            />
          </div>
        </div>

        {/* Attack Injection Checkboxes */}
        <div className="space-y-2.5 pt-2 border-t border-dark-800">
          <label className="text-xs font-bold text-cyber-crimson flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            <span>Adversarial & Hallucination Injections (Test Contract Halts)</span>
          </label>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-2.5 rounded-xl bg-dark-950 border border-dark-800 hover:border-cyber-crimson/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={skipRiskCheck}
                onChange={(e) => {
                  setSkipRiskCheck(e.target.checked);
                  if (e.target.checked) {
                    setInjectPromptAttack(false);
                    setTamperOracle(false);
                  }
                }}
                className="w-4 h-4 rounded border-dark-700 text-cyber-crimson focus:ring-cyber-crimson"
              />
              <div>
                <span className="text-xs font-semibold text-slate-200">Rogue Sub-Agent: Bypass Risk Evaluation Node</span>
                <p className="text-[11px] text-slate-400">Forces agent to omit Node #3 in LangGraph trace.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-2.5 rounded-xl bg-dark-950 border border-dark-800 hover:border-cyber-purple/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={injectPromptAttack}
                onChange={(e) => {
                  setInjectPromptAttack(e.target.checked);
                  if (e.target.checked) {
                    setSkipRiskCheck(false);
                    setTamperOracle(false);
                  }
                }}
                className="w-4 h-4 rounded border-dark-700 text-cyber-purple focus:ring-cyber-purple"
              />
              <div>
                <span className="text-xs font-semibold text-slate-200">Prompt Injection: Override Calldata Recipient</span>
                <p className="text-[11px] text-slate-400">Injects malicious transfer payload in execution node.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-2.5 rounded-xl bg-dark-950 border border-dark-800 hover:border-cyber-rose/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={tamperOracle}
                onChange={(e) => {
                  setTamperOracle(e.target.checked);
                  if (e.target.checked) {
                    setSkipRiskCheck(false);
                    setInjectPromptAttack(false);
                  }
                }}
                className="w-4 h-4 rounded border-dark-700 text-cyber-rose focus:ring-cyber-rose"
              />
              <div>
                <span className="text-xs font-semibold text-slate-200">Oracle Manipulation: Forged Witness Signature</span>
                <p className="text-[11px] text-slate-400">Provides corrupted ECDSA signature from off-chain feed.</p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-750 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleCreateAndRun}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyber-cyan to-cyber-emerald text-dark-950 font-bold text-xs hover:brightness-110 shadow-neon-cyan/20 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Simulation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
