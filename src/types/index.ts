export type AgentRole = 
  | 'ORCHESTRATOR'
  | 'MARKET_ANALYZER'
  | 'RISK_GUARDIAN'
  | 'POLICY_ENFORCER'
  | 'EXECUTION_DISPATCHER';

export type NodeStatus = 'pending' | 'active' | 'verified' | 'drifted' | 'reverted' | 'executed';

export interface ToolCall {
  name: string;
  input: Record<string, any>;
  output: Record<string, any>;
  durationMs: number;
  signedWitness?: string;
  sourceOracle?: string;
}

export interface StateBlock {
  index: number;
  nodeId: string;
  nodeName: string;
  agentRole: AgentRole;
  actionType: string;
  reasoningTrace: string;
  toolCalls: ToolCall[];
  inputPayload: Record<string, any>;
  outputPayload: Record<string, any>;
  timestamp: number;
  sessionId: string;
  nonce: number;
  prevBlockHash: string;
  leafHash: string;
  status: NodeStatus;
  isMandatoryCheckpoint: boolean;
  daIpfsCid?: string;
  violationDetails?: {
    type: 'MISSING_NODE' | 'TAMPERED_HASH' | 'POLICY_BREACH' | 'HALLUCINATED_DATA' | 'UNAUTHORIZED_TARGET';
    message: string;
    expectedValue?: string;
    actualValue?: string;
  };
}

export interface MerkleProofStep {
  hash: string;
  position: 'left' | 'right';
  combinedResult: string;
}

export interface MerkleProof {
  leaf: string;
  leafIndex: number;
  root: string;
  siblings: MerkleProofStep[];
}

export interface MerkleTreeNode {
  id: string;
  hash: string;
  shortHash: string;
  level: number;
  indexInLevel: number;
  isLeaf: boolean;
  stateBlock?: StateBlock;
  leftChildId?: string;
  rightChildId?: string;
  isCulprit?: boolean;
  isVerified?: boolean;
}

export interface SessionPolicy {
  sessionId: string;
  agentWallet: string;
  guardianContract: string;
  targetVault: string;
  sessionBudgetUSD: number;
  spentBudgetUSD: number;
  maxTxAmountUSD: number;
  allowedSelectors: string[];
  mandatoryNodeTypes: string[];
  expiryTimestamp: number;
  requireWitnessAttestation: boolean;
}

export interface OnChainTxResult {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  status: 'SUCCESS' | 'REVERTED';
  revertCode?: 
    | 'ERR_INVALID_MERKLE_PROOF'
    | 'ERR_MISSING_RISK_CHECKPOINT'
    | 'ERR_MISSING_POLICY_CHECKPOINT'
    | 'ERR_SESSION_BUDGET_EXCEEDED'
    | 'ERR_UNAUTHORIZED_FUNCTION_SELECTOR'
    | 'ERR_EXPIRED_SESSION_KEY'
    | 'ERR_ORACLE_WITNESS_TAMPERED';
  revertMessage?: string;
  gasUsed: number;
  gasPriceGwei: number;
  merkleRoot: string;
  culpritNodeId?: string;
  emittedEvents: Array<{
    name: string;
    args: Record<string, any>;
  }>;
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  category: 'GOLDEN_PATH' | 'ROGUE_AGENT' | 'PROMPT_INJECTION' | 'POLICY_BREACH' | 'ORACLE_MANIPULATION';
  badgeColor: string;
  description: string;
  prompt: string;
  initialContext: Record<string, any>;
  expectedOutcome: 'SUCCESS' | 'REVERT';
  expectedRevertReason?: string;
  anomalyDescription?: string;
  policy: SessionPolicy;
}

export interface SimulationState {
  currentScenario: ScenarioDefinition;
  isRunning: boolean;
  activeNodeIndex: number;
  stateBlocks: StateBlock[];
  merkleRoot: string | null;
  merkleTreeNodes: MerkleTreeNode[];
  merkleProofs: Record<number, MerkleProof>;
  onChainTx: OnChainTxResult | null;
  logs: Array<{
    timestamp: number;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'CRYPTO';
    message: string;
    nodeId?: string;
    data?: any;
  }>;
  activeTab: 'graph' | 'merkle' | 'context-drift' | 'contract' | 'session-keys' | 'live-console';
  soundEnabled: boolean;
}
