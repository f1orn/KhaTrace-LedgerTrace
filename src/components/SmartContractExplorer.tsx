import React, { useState } from 'react';
import { 
  FileCode2, 
  CheckCircle2, 
  AlertOctagon, 
  ExternalLink, 
  Copy, 
  Layers, 
  Fuel, 
  ShieldCheck, 
  Database, 
  Hash, 
  Terminal, 
  Activity 
} from './Icons';
import { OnChainTxResult, ScenarioDefinition } from '../types';
import { formatHash } from '../crypto/keccak256';
import { sound } from '../utils/audio';

interface SmartContractExplorerProps {
  onChainTx: OnChainTxResult | null;
  scenario: ScenarioDefinition;
  merkleRoot: string | null;
}

export const SmartContractExplorer: React.FC<SmartContractExplorerProps> = ({
  onChainTx,
  scenario,
  merkleRoot
}) => {
  const [activeTab, setActiveTab] = useState<'receipt' | 'solidity' | 'events'>('receipt');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    sound.playClick();
    setTimeout(() => setCopiedText(null), 2000);
  };

  const solidityCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProofOfReasoningGuardian
 * @notice Enforces cryptographic Merkle proof verification for AI Agent state machines
 */
contract ProofOfReasoningGuardian {
    struct SessionPolicy {
        address agentWallet;
        address targetVault;
        uint256 sessionBudgetUSD;
        uint256 spentBudgetUSD;
        uint256 maxTxAmountUSD;
        uint256 expiryTimestamp;
        bool isActive;
    }

    mapping(bytes32 => SessionPolicy) public sessionPolicies;
    mapping(bytes32 => bool) public executedUserOpHashes;

    event ReasoningRootAnchored(bytes32 indexed sessionId, bytes32 indexed root, string ipfsCid);
    event UserOpExecuted(bytes32 indexed sessionId, bytes32 indexed userOpHash, uint256 amountUSD);
    event InvariantViolationDetected(bytes32 indexed sessionId, string violationCode, string reason);

    function executeValidatedAction(
        bytes32 sessionId,
        bytes32 merkleRoot,
        bytes calldata actionCalldata,
        uint256 amountUSD,
        bytes32[] calldata actionProof,
        bytes32 actionLeaf,
        bytes32[] calldata riskProof,
        bytes32 riskLeaf,
        bool hasRiskNode
    ) external returns (bool) {
        SessionPolicy storage policy = sessionPolicies[sessionId];
        require(policy.isActive && block.timestamp <= policy.expiryTimestamp, "SESSION_EXPIRED");

        // 1. Session Budget Invariant Check
        require(policy.spentBudgetUSD + amountUSD <= policy.sessionBudgetUSD, "ERR_SESSION_BUDGET_EXCEEDED");

        // 2. Cryptographic Proof for Action Leaf
        require(verifyProof(actionProof, merkleRoot, actionLeaf), "ERR_INVALID_MERKLE_PROOF");

        // 3. Mandatory Risk Node Invariant Check
        require(hasRiskNode && riskLeaf != bytes32(0), "ERR_MISSING_RISK_CHECKPOINT");
        require(verifyProof(riskProof, merkleRoot, riskLeaf), "ERR_INVALID_RISK_PROOF");

        // Execute state change
        policy.spentBudgetUSD += amountUSD;
        (bool success, ) = policy.targetVault.call(actionCalldata);
        require(success, "VAULT_EXECUTION_FAILED");

        emit UserOpExecuted(sessionId, keccak256(actionCalldata), amountUSD);
        return true;
    }

    function verifyProof(bytes32[] calldata proof, bytes32 root, bytes32 leaf) public pure returns (bool) {
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        return computedHash == root;
    }
}`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-dark-900 border border-dark-750 rounded-2xl p-5 backdrop-blur-md shadow-glass">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyber-emerald/10 border border-cyber-emerald/30 text-cyber-emerald">
              <FileCode2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-sans">
                  ProofOfReasoningGuardian.sol
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-cyber-emerald border border-cyber-emerald/30">
                  EVM Bytecode Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Contract Address: {scenario?.policy?.guardianContract || '0x9E71cA71B04e9C83A201A5E9559c5dAb9Db1E267'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { sound.playClick(); setActiveTab('receipt'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'receipt'
                  ? 'bg-cyber-emerald text-dark-950 shadow-neon-emerald/20'
                  : 'bg-dark-800 text-slate-300 hover:text-white'
              }`}
            >
              Tx Receipt
            </button>
            <button
              onClick={() => { sound.playClick(); setActiveTab('events'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'events'
                  ? 'bg-cyber-emerald text-dark-950 shadow-neon-emerald/20'
                  : 'bg-dark-800 text-slate-300 hover:text-white'
              }`}
            >
              Emitted Events ({onChainTx?.emittedEvents?.length || 0})
            </button>
            <button
              onClick={() => { sound.playClick(); setActiveTab('solidity'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'solidity'
                  ? 'bg-cyber-emerald text-dark-950 shadow-neon-emerald/20'
                  : 'bg-dark-800 text-slate-300 hover:text-white'
              }`}
            >
              Solidity Code
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'receipt' && (
        <div className="bg-dark-900 border border-dark-750 rounded-2xl p-6 backdrop-blur-md shadow-glass">
          {onChainTx ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-dark-800">
                <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
                  <span>Transaction Hash:</span>
                  <span className="text-cyber-cyan">{onChainTx.txHash}</span>
                  <button
                    onClick={() => handleCopy(onChainTx.txHash)}
                    className="p-1 hover:text-cyber-cyan text-slate-400"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className={`px-3 py-1 rounded-full font-mono text-xs font-bold border flex items-center gap-1.5 ${
                  onChainTx.status === 'SUCCESS'
                    ? 'bg-cyber-emerald/15 text-cyber-emerald border-cyber-emerald/40'
                    : 'bg-cyber-crimson/15 text-cyber-crimson border-cyber-crimson/40'
                }`}>
                  {onChainTx.status === 'SUCCESS' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>SUCCESS (EXECUTED)</span>
                    </>
                  ) : (
                    <>
                      <AlertOctagon className="w-4 h-4" />
                      <span>REVERTED (INVARIANT HALT)</span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-dark-950 border border-dark-800">
                  <span className="text-[10px] text-slate-500 uppercase font-sans">Block Number</span>
                  <p className="text-slate-200 font-bold mt-1">#{(onChainTx?.blockNumber || 19842100).toLocaleString()}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-dark-950 border border-dark-800">
                  <span className="text-[10px] text-slate-500 uppercase font-sans">Gas Consumed</span>
                  <p className="text-cyber-purple font-bold mt-1">{(onChainTx?.gasUsed || 0).toLocaleString()} units</p>
                </div>
                <div className="p-3.5 rounded-xl bg-dark-950 border border-dark-800">
                  <span className="text-[10px] text-slate-500 uppercase font-sans">Gas Price</span>
                  <p className="text-slate-200 font-bold mt-1">{onChainTx?.gasPriceGwei || 24.5} Gwei</p>
                </div>
                <div className="p-3.5 rounded-xl bg-dark-950 border border-dark-800">
                  <span className="text-[10px] text-slate-500 uppercase font-sans">Anchored Merkle Root</span>
                  <p className="text-cyber-cyan font-bold mt-1">{formatHash(onChainTx?.merkleRoot, 6, 4)}</p>
                </div>
              </div>

              {onChainTx.revertMessage && (
                <div className="p-4 rounded-xl bg-cyber-crimson/15 border border-cyber-crimson/40 text-xs text-cyber-crimson font-mono space-y-1">
                  <div className="font-bold">EVM Revert Error String:</div>
                  <div className="text-slate-200">{onChainTx.revertMessage}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-40 text-cyber-emerald" />
              <p>No transactions mined yet. Run the verification simulation to execute on EVM sandbox.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Events */}
      {activeTab === 'events' && (
        <div className="bg-dark-900 border border-dark-750 rounded-2xl p-6 backdrop-blur-md shadow-glass space-y-3">
          <h3 className="text-sm font-bold text-white mb-3 font-sans">
            On-Chain Emitted Events ({onChainTx?.emittedEvents?.length || 0})
          </h3>
          {onChainTx && (onChainTx.emittedEvents || []).length > 0 ? (
            (onChainTx.emittedEvents || []).map((evt, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-dark-950 border border-dark-800 font-mono text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-cyber-emerald font-bold">event {evt?.name}</span>
                  <span className="text-[10px] text-slate-500">Log Index #{idx}</span>
                </div>
                <pre className="text-slate-300 text-[11px] p-2 rounded bg-dark-900 border border-dark-800 overflow-x-auto">
                  {JSON.stringify(evt?.args || {}, null, 2)}
                </pre>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">No events emitted.</p>
          )}
        </div>
      )}

      {/* Tab: Solidity Source */}
      {activeTab === 'solidity' && (
        <div className="bg-dark-900 border border-dark-750 rounded-2xl p-6 backdrop-blur-md shadow-glass">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white font-sans">Smart Contract Source (Solidity ^0.8.20)</h3>
            <button
              onClick={() => handleCopy(solidityCode)}
              className="text-xs text-slate-400 hover:text-cyber-cyan flex items-center gap-1 font-mono"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedText === solidityCode ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-dark-950 border border-dark-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed">
            {solidityCode}
          </pre>
        </div>
      )}
    </div>
  );
};
