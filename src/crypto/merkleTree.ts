import { keccak256, hashPair, canonicalizeJson, formatHash } from './keccak256';
import { StateBlock, MerkleProof, MerkleProofStep, MerkleTreeNode } from '../types';

/**
 * Computes canonical leaf hash for a StateBlock
 * Binds index, nodeId, action, inputs, reasoning, tools, and previous block hash (Inner Blockchain chain)
 */
export function computeStateBlockHash(block: Omit<StateBlock, 'leafHash'>): string {
  const canonicalPayload = canonicalizeJson({
    index: block.index,
    nodeId: block.nodeId,
    nodeName: block.nodeName,
    agentRole: block.agentRole,
    actionType: block.actionType,
    sessionId: block.sessionId,
    nonce: block.nonce,
    prevBlockHash: block.prevBlockHash,
    inputPayload: block.inputPayload || {},
    reasoningTrace: block.reasoningTrace || '',
    toolCalls: (block.toolCalls || []).map(tc => ({
      name: tc?.name || '',
      input: tc?.input || {},
      output: tc?.output || {},
      witness: tc?.signedWitness || ''
    })),
    outputPayload: block.outputPayload || {},
    isMandatoryCheckpoint: Boolean(block.isMandatoryCheckpoint)
  });

  return keccak256(canonicalPayload);
}

export interface BuiltMerkleTree {
  root: string;
  leaves: string[];
  treeLevels: string[][];
  treeNodes: MerkleTreeNode[];
}

/**
 * Constructs a binary Merkle tree from state block leaf hashes
 */
export function buildMerkleTree(stateBlocks: StateBlock[]): BuiltMerkleTree {
  if (!stateBlocks || stateBlocks.length === 0) {
    const emptyRoot = keccak256('0x0000000000000000000000000000000000000000000000000000000000000000');
    return {
      root: emptyRoot,
      leaves: [],
      treeLevels: [[]],
      treeNodes: []
    };
  }

  // Ensure all state blocks have valid leaf hashes
  const leaves = stateBlocks.map(b => b.leafHash || computeStateBlockHash(b));
  
  const treeLevels: string[][] = [ [...leaves] ];
  let currentLevel = [...leaves];

  // Build tree levels from bottom up
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        nextLevel.push(hashPair(currentLevel[i], currentLevel[i + 1]));
      } else {
        // Odd number of elements: duplicate or promote last element
        nextLevel.push(currentLevel[i]);
      }
    }
    treeLevels.push(nextLevel);
    currentLevel = nextLevel;
  }

  const root = treeLevels[treeLevels.length - 1][0] || keccak256('0x0');

  // Create UI-friendly tree nodes with hierarchical links
  const treeNodes: MerkleTreeNode[] = [];
  
  // Assign IDs and structure
  treeLevels.forEach((level, levelIdx) => {
    level.forEach((hashVal, indexInLevel) => {
      const isLeaf = levelIdx === 0;
      const id = `node-L${levelIdx}-I${indexInLevel}`;
      const stateBlock = isLeaf && stateBlocks ? stateBlocks[indexInLevel] : undefined;
      
      const node: MerkleTreeNode = {
        id,
        hash: hashVal,
        shortHash: formatHash(hashVal),
        level: levelIdx,
        indexInLevel,
        isLeaf,
        stateBlock,
        isCulprit: stateBlock?.status === 'drifted' || stateBlock?.status === 'reverted',
        isVerified: stateBlock?.status === 'verified' || stateBlock?.status === 'executed'
      };

      if (levelIdx > 0 && treeLevels[levelIdx - 1]) {
        // Find children in level below
        const leftChildIdx = indexInLevel * 2;
        const rightChildIdx = indexInLevel * 2 + 1;
        node.leftChildId = `node-L${levelIdx - 1}-I${leftChildIdx}`;
        if (rightChildIdx < treeLevels[levelIdx - 1].length) {
          node.rightChildId = `node-L${levelIdx - 1}-I${rightChildIdx}`;
        }
      }

      treeNodes.push(node);
    });
  });

  return {
    root,
    leaves,
    treeLevels,
    treeNodes
  };
}

/**
 * Generates an OpenZeppelin-compatible Merkle proof for a given leaf index
 */
export function generateMerkleProof(
  leafIndex: number,
  treeLevels: string[][],
  root: string
): MerkleProof {
  if (!treeLevels || !treeLevels[0] || treeLevels[0].length === 0) {
    return {
      leaf: '0x0000000000000000000000000000000000000000000000000000000000000000',
      leafIndex: 0,
      root: root || '0x0000000000000000000000000000000000000000000000000000000000000000',
      siblings: []
    };
  }

  const leaves = treeLevels[0];
  const safeIndex = Math.max(0, Math.min(leafIndex, leaves.length - 1));
  const leaf = leaves[safeIndex];
  const siblings: MerkleProofStep[] = [];
  let currentIndex = safeIndex;
  let currentComputed = leaf;

  for (let level = 0; level < treeLevels.length - 1; level++) {
    const levelNodes = treeLevels[level];
    if (!levelNodes) continue;

    const isEven = currentIndex % 2 === 0;
    const siblingIndex = isEven ? currentIndex + 1 : currentIndex - 1;

    if (siblingIndex >= 0 && siblingIndex < levelNodes.length) {
      const siblingHash = levelNodes[siblingIndex];
      const position = isEven ? 'right' : 'left';
      const combinedResult = hashPair(currentComputed, siblingHash);
      
      siblings.push({
        hash: siblingHash,
        position,
        combinedResult
      });
      currentComputed = combinedResult;
    }

    currentIndex = Math.floor(currentIndex / 2);
  }

  return {
    leaf,
    leafIndex: safeIndex,
    root: root || currentComputed,
    siblings
  };
}

/**
 * Verifies a Merkle Proof step-by-step
 * Exactly mirrors OpenZeppelin MerkleProof.verify(proof, root, leaf)
 */
export function verifyMerkleProof(proof: MerkleProof): {
  isValid: boolean;
  computedRoot: string;
  expectedRoot: string;
  steps: Array<{
    stepNumber: number;
    currentHash: string;
    siblingHash: string;
    position: 'left' | 'right';
    resultingHash: string;
  }>;
} {
  if (!proof || !proof.leaf) {
    return {
      isValid: false,
      computedRoot: '0x0',
      expectedRoot: proof?.root || '0x0',
      steps: []
    };
  }

  let computedHash = proof.leaf;
  const steps: Array<{
    stepNumber: number;
    currentHash: string;
    siblingHash: string;
    position: 'left' | 'right';
    resultingHash: string;
  }> = [];

  const siblings = proof.siblings || [];
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (!sibling || !sibling.hash) continue;

    const prev = computedHash;
    computedHash = hashPair(computedHash, sibling.hash);

    steps.push({
      stepNumber: i + 1,
      currentHash: prev,
      siblingHash: sibling.hash,
      position: sibling.position,
      resultingHash: computedHash
    });
  }

  const isValid = Boolean(proof.root && computedHash.toLowerCase() === proof.root.toLowerCase());

  return {
    isValid,
    computedRoot: computedHash,
    expectedRoot: proof.root || computedHash,
    steps
  };
}
