import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DecisionGraph } from './components/DecisionGraph';
import { MerkleInspector } from './components/MerkleInspector';
import { ContextPanel } from './components/ContextPanel';
import { LiveExecutionConsole } from './components/LiveExecutionConsole';
import { SmartContractExplorer } from './components/SmartContractExplorer';
import { AccountAbstractionPanel } from './components/AccountAbstractionPanel';
import { CustomScenarioModal } from './components/CustomScenarioModal';
import { RpgCatTutorial } from './components/tutorial/RpgCatTutorial';
import { CatCompanionWidget } from './components/tutorial/CatCompanionWidget';
import { SCENARIOS } from './agent/scenarios';
import { ScenarioDefinition, StateBlock, MerkleTreeNode, OnChainTxResult } from './types';
import { LangGraphEngine } from './agent/langGraphEngine';
import { buildMerkleTree } from './crypto/merkleTree';
import { SoliditySimulator } from './contracts/soliditySimulator';
import { sound } from './utils/audio';
import { formatHash } from './crypto/keccak256';
import { 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Terminal, 
  AlertTriangle, 
  CheckCircle2, 
  KeyRound, 
  Zap, 
  Activity, 
  FileCode2, 
  Lock, 
  ArrowUpRight 
} from './components/Icons';

export function App() {
  const [currentScenario, setCurrentScenario] = useState<ScenarioDefinition>(SCENARIOS[0]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>(-1);
  const [stateBlocks, setStateBlocks] = useState<StateBlock[]>([]);
  const [selectedNode, setSelectedNode] = useState<StateBlock | null>(null);
  const [merkleRoot, setMerkleRoot] = useState<string | null>(null);
  const [treeLevels, setTreeLevels] = useState<string[][]>([]);
  const [treeNodes, setTreeNodes] = useState<MerkleTreeNode[]>([]);
  const [onChainTx, setOnChainTx] = useState<OnChainTxResult | null>(null);
  const [logs, setLogs] = useState<Array<{
    timestamp: number;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'CRYPTO';
    message: string;
    nodeId?: string;
    data?: any;
  }>>([]);
  const [activeTab, setActiveTab] = useState<'graph' | 'merkle' | 'context-drift' | 'contract' | 'session-keys' | 'live-console'>('graph');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);

  // Initialize simulation when scenario changes
  useEffect(() => {
    if (currentScenario) {
      runTraceExecution(currentScenario, false);
    }
  }, [currentScenario]);

  const addLog = (level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'CRYPTO', message: string, data?: any, nodeId?: string) => {
    setLogs(prev => [...prev, { timestamp: Date.now(), level, message, data, nodeId }]);
  };

  const runTraceExecution = async (scenario: ScenarioDefinition, animated: boolean = true) => {
    if (!scenario) return;

    setIsRunning(true);
    setLogs([]);
    setOnChainTx(null);
    setSelectedNode(null);
    setActiveNodeIndex(0);

    const sessionId = scenario?.policy?.sessionId || 'sess_default';
    const budget = scenario?.policy?.sessionBudgetUSD || 50000;

    addLog('INFO', `Starting LangGraph execution for objective: "${scenario.prompt || ''}"`);
    addLog('INFO', `Session Key [${sessionId}] initialized. Allowance: $${budget.toLocaleString()} USD`);

    const blocks = LangGraphEngine.generateStateBlocks(scenario);
    
    // In animated mode, step through each node
    if (animated) {
      for (let i = 0; i < blocks.length; i++) {
        setActiveNodeIndex(i);
        setStateBlocks(blocks.slice(0, i + 1));
        sound.playStepPulse();

        const currentBlock = blocks[i];
        if (currentBlock) {
          addLog(
            currentBlock.status === 'drifted' ? 'WARN' : 'INFO',
            `[Node #${i + 1}] ${currentBlock.nodeName} -> ${currentBlock.actionType}`,
            currentBlock.outputPayload,
            currentBlock.nodeId
          );

          if (currentBlock.violationDetails) {
            addLog('ERROR', `[ANOMALY TRIGGERED] ${currentBlock.violationDetails.message}`, null, currentBlock.nodeId);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 350));
      }
    } else {
      setStateBlocks(blocks);
    }

    // Filter valid blocks to build Merkle Tree
    // (In rogue scenario, missing nodes are absent from real tree)
    const validTreeBlocks = blocks.filter(b => b.leafHash && b.leafHash !== '0x0000000000000000000000000000000000000000000000000000000000000000');
    const builtTree = buildMerkleTree(validTreeBlocks);

    setMerkleRoot(builtTree.root);
    setTreeLevels(builtTree.treeLevels);
    setTreeNodes(builtTree.treeNodes);
    setSelectedNode(blocks[0] || null);

    addLog('CRYPTO', `Merkle Tree constructed (${builtTree.leaves.length} leaves, ${builtTree.treeLevels.length} levels).`, {
      merkleRoot: builtTree.root,
      leaves: builtTree.leaves.map(l => formatHash(l))
    });

    // Execute Smart Contract Verification on EVM
    const guardianContract = scenario?.policy?.guardianContract || '0x9E71cA71B04e9C83A201A5E9559c5dAb9Db1E267';
    addLog('INFO', `Submitting UserOp calldata + Merkle proof path to ProofOfReasoningGuardian.sol [${guardianContract}]...`);
    
    const txResult = SoliditySimulator.executeContractValidation(
      scenario,
      blocks,
      builtTree.root,
      builtTree.treeLevels
    );

    setOnChainTx(txResult);
    setIsRunning(false);
    setActiveNodeIndex(-1);

    if (txResult.status === 'SUCCESS') {
      sound.playSuccess();
      addLog('SUCCESS', `On-Chain Execution MINED (Tx: ${formatHash(txResult.txHash)}). Gas: ${txResult.gasUsed.toLocaleString()} units.`);
    } else {
      sound.playAlert();
      addLog('ERROR', `Smart Contract REVERT: ${txResult.revertMessage}`, {
        revertCode: txResult.revertCode,
        culpritNode: txResult.culpritNodeId
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-slate-100 font-sans selection:bg-cyber-cyan/30 selection:text-cyber-cyan">
      {/* Header with Navigation & Global Controls */}
      <Header
        currentScenario={currentScenario}
        onSelectScenario={(s) => setCurrentScenario(s)}
        isRunning={isRunning}
        onRunSimulation={() => runTraceExecution(currentScenario, true)}
        onOpenCustomModal={() => setIsCustomModalOpen(true)}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          sound.enabled = next;
        }}
        merkleRoot={merkleRoot}
        onChainTx={onChainTx}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 py-6">
        {/* Quick Scenario Context Ribbon */}
        <div className="mb-6 p-4 rounded-2xl bg-dark-900 border border-dark-750 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyber-purple/10 border border-cyber-purple/30 text-cyber-purple shrink-0 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Active Task:</span>
                <span className="text-xs text-cyber-cyan font-mono font-semibold">{currentScenario?.title || 'Active Task'}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentScenario?.description || ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
            <div className="bg-dark-950 px-3 py-1.5 rounded-xl border border-dark-800 flex items-center gap-2">
              <span className="text-slate-500">Target Vault:</span>
              <span className="text-cyber-emerald font-semibold">{formatHash(currentScenario?.policy?.targetVault, 6, 4)}</span>
            </div>
            <div className="bg-dark-950 px-3 py-1.5 rounded-xl border border-dark-800 flex items-center gap-2">
              <span className="text-slate-500">Amount:</span>
              <span className="text-slate-200 font-semibold">${(currentScenario?.initialContext?.amountUSD || 0).toLocaleString()} USD</span>
            </div>
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'graph' && (
          <div id="tutorial-decision-graph">
            <DecisionGraph
              stateBlocks={stateBlocks}
              activeNodeIndex={activeNodeIndex}
              scenario={currentScenario}
              onSelectNode={(node) => setSelectedNode(node)}
              selectedNode={selectedNode}
            />
          </div>
        )}

        {activeTab === 'merkle' && (
          <MerkleInspector
            stateBlocks={stateBlocks}
            merkleRoot={merkleRoot}
            treeNodes={treeNodes}
            treeLevels={treeLevels}
          />
        )}

        {activeTab === 'context-drift' && (
          <ContextPanel
            scenario={currentScenario}
            stateBlocks={stateBlocks}
            onChainTx={onChainTx}
            onRunSimulation={() => runTraceExecution(currentScenario, true)}
          />
        )}

        {activeTab === 'contract' && (
          <SmartContractExplorer
            onChainTx={onChainTx}
            scenario={currentScenario}
            merkleRoot={merkleRoot}
          />
        )}

        {activeTab === 'session-keys' && (
          <AccountAbstractionPanel
            policy={currentScenario?.policy}
            scenario={currentScenario}
          />
        )}

        {activeTab === 'live-console' && (
          <LiveExecutionConsole
            logs={logs}
            stateBlocks={stateBlocks}
            scenario={currentScenario}
            merkleRoot={merkleRoot}
            onChainTx={onChainTx}
            isRunning={isRunning}
            onRunSimulation={() => runTraceExecution(currentScenario, true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-4 px-6 bg-dark-950/80 backdrop-blur-md text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1700px] w-full mx-auto">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyber-cyan" />
          <span className="font-mono text-slate-400">LedgerTrace Protocol</span>
          <span>• Code2Create Hackathon</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span>LangGraph + Merkle Trees + ERC-4337 Smart Contract Guardians</span>
        </div>
      </footer>

      {/* Custom Scenario Builder Modal */}
      <CustomScenarioModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onApplyScenario={(customSc) => {
          setCurrentScenario(customSc);
        }}
      />

      {/* Interactive RPG Pixel-Art Cat Guided Tour ("Inspector Whiskers") */}
      <RpgCatTutorial
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* Floating Mini-Pet Cat Companion (Bottom Right) */}
      <CatCompanionWidget
        onOpenTutorial={() => setIsTutorialOpen(true)}
        isRunning={isRunning}
        onChainTx={onChainTx}
        scenario={currentScenario}
      />
    </div>
  );
}

export default App;
