import React, { useState } from 'react';
import { 
  Layers, 
  Binary, 
  CheckCircle2, 
  XCircle, 
  Hash, 
  ArrowRight, 
  Copy, 
  ShieldCheck, 
  Eye, 
  Sliders, 
  Code, 
  Sparkles, 
  Zap, 
  Info 
} from './Icons';
import { StateBlock, MerkleTreeNode, MerkleProof } from '../types';
import { formatHash, keccak256 } from '../crypto/keccak256';
import { generateMerkleProof, verifyMerkleProof } from '../crypto/merkleTree';
import { sound } from '../utils/audio';

interface MerkleInspectorProps {
  stateBlocks: StateBlock[];
  merkleRoot: string | null;
  treeNodes: MerkleTreeNode[];
  treeLevels: string[][];
}

export const MerkleInspector: React.FC<MerkleInspectorProps> = ({
  stateBlocks,
  merkleRoot,
  treeNodes,
  treeLevels
}) => {
  const [selectedLeafIndex, setSelectedLeafIndex] = useState<number>(0);
  const [isTamperMode, setIsTamperMode] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  if (!merkleRoot || !treeLevels || treeLevels.length === 0 || !treeLevels[0] || treeLevels[0].length === 0) {
    return (
      <div className="bg-dark-900 border border-dark-750 rounded-2xl p-12 text-center text-slate-400">
        <Layers className="w-10 h-10 mx-auto mb-3 text-cyber-purple/60 animate-pulse" />
        <h3 className="text-base font-bold text-white mb-1">Merkle Tree Not Yet Constructed</h3>
        <p className="text-xs text-slate-400">Run the simulation to generate state blocks and calculate the cryptographic Merkle Root.</p>
      </div>
    );
  }

  // Generate proof for selected leaf safely
  let rawProof: MerkleProof = {
    leaf: treeLevels[0][0] || '0x0',
    leafIndex: 0,
    root: merkleRoot || '0x0',
    siblings: []
  };

  try {
    const safeLeafIndex = Math.min(selectedLeafIndex, treeLevels[0].length - 1);
    rawProof = generateMerkleProof(safeLeafIndex, treeLevels, merkleRoot);
  } catch (e) {
    // fallback safe proof
  }

  // If tamper mode is active, corrupt the leaf hash
  const activeProof: MerkleProof = isTamperMode
    ? {
        ...rawProof,
        leaf: keccak256((rawProof?.leaf || '0x0') + 'TAMPERED_BYTE_EXPLOIT')
      }
    : rawProof;

  const verification = verifyMerkleProof(activeProof);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    sound.playClick();
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Merkle Root & Summary */}
      <div className="bg-dark-900 border border-dark-750 rounded-2xl p-6 backdrop-blur-md shadow-glass">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-cyber-purple/10 border border-cyber-purple/30 shrink-0">
              <Binary className="w-6 h-6 text-cyber-purple" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-sans">
                  Cryptographic Merkle Tree & Proof Engine
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30">
                  OpenZeppelin MerkleProof.sol Spec
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Logarithmic verification: An on-chain contract can verify any agent thought step with only <span className="text-cyber-cyan font-mono font-semibold">O(log N)</span> sibling hashes.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="p-3 rounded-xl bg-dark-950 border border-dark-750 font-mono text-xs">
              <div className="text-[10px] uppercase text-slate-500 font-sans flex items-center justify-between">
                <span>Anchored Merkle Root</span>
                <button
                  onClick={() => handleCopy(merkleRoot)}
                  className="text-slate-400 hover:text-cyber-cyan flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedHash === merkleRoot ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-cyber-cyan font-bold text-xs sm:text-sm mt-0.5 break-all select-all">
                {merkleRoot}
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setIsTamperMode(!isTamperMode);
              }}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs border transition-all ${
                isTamperMode
                  ? 'bg-cyber-crimson/20 text-cyber-crimson border-cyber-crimson/60 shadow-neon-crimson/30'
                  : 'bg-dark-800 text-slate-300 border-dark-700 hover:border-cyber-purple/50'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>{isTamperMode ? 'Simulating Tampered Proof ⚠' : 'Test Proof Tampering'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Binary Merkle Tree Hierarchy */}
      <div className="bg-dark-900 border border-dark-750 rounded-2xl p-6 backdrop-blur-md shadow-glass">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyber-purple" />
          <span>Hierarchical Tree Topology</span>
          <span className="text-xs font-mono font-normal text-slate-400">
            ({treeLevels?.length || 0} Levels | {treeLevels[0]?.length || 0} Leaves)
          </span>
        </h3>

        <div className="flex flex-col-reverse gap-6 items-center overflow-x-auto py-4 px-2 no-scrollbar">
          {(treeLevels || []).map((level, levelIdx) => (
            <div key={levelIdx} className="w-full flex flex-col items-center">
              <div className="text-[10px] font-mono text-slate-500 mb-2 uppercase">
                {levelIdx === 0 ? 'Level 0: Discrete State Block Leaves' : levelIdx === treeLevels.length - 1 ? 'Root Level (Anchored on EVM)' : `Level ${levelIdx}: Intermediate Hash Node Pair`}
              </div>
              
              <div className="flex flex-wrap justify-center gap-3 max-w-full">
                {(level || []).map((hashVal, nodeIdx) => {
                  const isLeaf = levelIdx === 0;
                  const isSelected = isLeaf && nodeIdx === selectedLeafIndex;
                  const isSibling = isLeaf && (activeProof?.siblings || []).some(s => s?.hash && hashVal && s.hash.toLowerCase() === hashVal.toLowerCase());
                  const stateBlock = isLeaf && stateBlocks ? stateBlocks[nodeIdx] : undefined;
                  const isCulprit = stateBlock?.status === 'drifted' || stateBlock?.status === 'reverted';

                  return (
                    <div
                      key={nodeIdx}
                      onClick={() => {
                        if (isLeaf) {
                          sound.playClick();
                          setSelectedLeafIndex(nodeIdx);
                        }
                      }}
                      className={`p-3 rounded-xl border font-mono text-xs transition-all duration-200 ${
                        isLeaf ? 'cursor-pointer' : 'cursor-default'
                      } ${
                        isSelected
                          ? 'bg-cyber-cyan/15 border-cyber-cyan shadow-neon-cyan/30 ring-2 ring-cyber-cyan/40 scale-105'
                          : isSibling
                            ? 'bg-cyber-purple/15 border-cyber-purple text-cyber-purple shadow-neon-purple/20'
                            : isCulprit
                              ? 'bg-cyber-crimson/15 border-cyber-crimson/60 text-cyber-crimson'
                              : 'bg-dark-950 border-dark-750 text-slate-300 hover:border-dark-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] text-slate-500 font-sans">
                          {isLeaf ? `Leaf #${nodeIdx + 1}` : levelIdx === treeLevels.length - 1 ? 'MERKLE ROOT' : `Node [L${levelIdx}, I${nodeIdx}]`}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyber-cyan text-dark-950 font-bold">
                            SELECTED
                          </span>
                        )}
                        {isSibling && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyber-purple text-white font-bold">
                            SIBLING
                          </span>
                        )}
                      </div>

                      <div className="font-bold text-xs">{formatHash(hashVal, 6, 4)}</div>

                      {stateBlock && (
                        <div className="mt-1 text-[10px] font-sans text-slate-400 line-clamp-1">
                          {stateBlock.nodeName}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proof Math & Step-by-Step Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Verification Stepper */}
        <div className="lg:col-span-7 bg-dark-900 border border-dark-750 rounded-2xl p-5 backdrop-blur-md shadow-glass">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyber-cyan" />
              <h3 className="text-sm font-bold text-white font-sans">
                Proof Path for Leaf #{selectedLeafIndex + 1}
              </h3>
            </div>
            
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-xs font-bold border ${
              verification?.isValid
                ? 'bg-cyber-emerald/15 text-cyber-emerald border-cyber-emerald/40'
                : 'bg-cyber-crimson/15 text-cyber-crimson border-cyber-crimson/40 animate-pulse'
            }`}>
              {verification?.isValid ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>MATHEMATICALLY VALID</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>INVALID / TAMPERED PROOF</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {/* Step 0: Initial Leaf */}
            <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 text-xs">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Input Leaf Hash (H₀)</div>
              <div className="font-mono text-cyber-cyan font-bold break-all mt-0.5">
                {activeProof?.leaf}
              </div>
              {isTamperMode && (
                <div className="text-[10px] text-cyber-crimson font-mono mt-1 font-semibold">
                  ⚠ 1 byte modified maliciously in simulated payload
                </div>
              )}
            </div>

            {/* Stepper Steps */}
            {(verification?.steps || []).map((step) => (
              <div key={step.stepNumber} className="p-3 rounded-xl bg-dark-850 border border-dark-750 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-cyber-purple font-bold">Step #{step.stepNumber}: Combine with Sibling</span>
                  <span className="text-slate-400">Position: {step.position.toUpperCase()}</span>
                </div>

                <div className="font-mono text-[11px] text-slate-300 space-y-1 bg-dark-950 p-2.5 rounded-lg border border-dark-800">
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>Sibling Hash:</span>
                    <span className="text-cyber-purple">{formatHash(step.siblingHash, 8, 8)}</span>
                  </div>
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>Resulting Parent:</span>
                    <span className="text-slate-100 font-bold">{formatHash(step.resultingHash, 8, 8)}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Final Match Check */}
            <div className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
              verification?.isValid
                ? 'bg-cyber-emerald/10 border-cyber-emerald/30 text-slate-200'
                : 'bg-cyber-crimson/10 border-cyber-crimson/40 text-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Calculated Root from Proof:</span>
                <span className={verification?.isValid ? 'text-cyber-emerald font-bold' : 'text-cyber-crimson font-bold'}>
                  {formatHash(verification?.computedRoot, 8, 8)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Anchored On-Chain Root:</span>
                <span className="text-cyber-cyan font-bold">{formatHash(verification?.expectedRoot, 8, 8)}</span>
              </div>
              <div className="pt-2 border-t border-dark-750 flex items-center justify-between font-bold">
                <span>Solidity Evaluation:</span>
                <span className={verification?.isValid ? 'text-cyber-emerald' : 'text-cyber-crimson'}>
                  {verification?.isValid ? '✓ MerkleProof.verify() == TRUE' : '✗ MerkleProof.verify() == FALSE (REVERT)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Solidity Calldata & Explanations */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-dark-900 border border-dark-750 rounded-2xl p-5 backdrop-blur-md shadow-glass">
            <div className="flex items-center gap-2 mb-3">
              <Code className="w-4 h-4 text-cyber-cyan" />
              <h3 className="text-sm font-bold text-white font-sans">
                Solidity Execution Calldata
              </h3>
            </div>
            
            <p className="text-xs text-slate-400 mb-3">
              The agent submits this exact tuple to <span className="font-mono text-cyber-emerald">ProofOfReasoningGuardian.sol</span>:
            </p>

            <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 font-mono text-[11px] text-slate-300 space-y-2 overflow-x-auto">
              <div>
                <span className="text-slate-500">// 1. Root</span>
                <div className="text-cyber-cyan">{activeProof?.root}</div>
              </div>
              <div>
                <span className="text-slate-500">// 2. Leaf Hash</span>
                <div className="text-cyber-emerald">{activeProof?.leaf}</div>
              </div>
              <div>
                <span className="text-slate-500">// 3. Proof Array (bytes32[])</span>
                <div className="text-cyber-purple break-all">
                  [{(activeProof?.siblings || []).map(s => `"${s.hash}"`).join(', ')}]
                </div>
              </div>
            </div>
          </div>

          <div className="bg-dark-900 border border-dark-750 rounded-2xl p-5 backdrop-blur-md shadow-glass">
            <div className="flex items-center gap-2 mb-2 text-cyber-cyan">
              <Info className="w-4 h-4" />
              <h4 className="text-xs font-bold font-sans">Why Merkle Verification is Unhackable</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Because Keccak-256 is cryptographically collision-resistant ($2^{256}$ search space), an AI agent cannot retroactively alter even a single token in its prompt, risk score, or tool parameters without completely changing the Merkle root.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
