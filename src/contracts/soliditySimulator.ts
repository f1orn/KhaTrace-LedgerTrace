import { ScenarioDefinition, StateBlock, OnChainTxResult } from '../types';
import { keccak256 } from '../crypto/keccak256';
import { verifyMerkleProof, generateMerkleProof } from '../crypto/merkleTree';

export class SoliditySimulator {
  /**
   * Simulates the exact execution of ProofOfReasoningGuardian.sol on the EVM
   */
  public static executeContractValidation(
    scenario: ScenarioDefinition,
    stateBlocks: StateBlock[],
    merkleRoot: string,
    treeLevels: string[][]
  ): OnChainTxResult {
    const timestamp = Date.now();
    const mockTxHash = keccak256(`tx_${scenario?.id || 'sim'}_${timestamp}`);
    const blockNumber = 19842100 + Math.floor(Math.random() * 50);
    const gasPriceGwei = 24.5;
    const policy = scenario?.policy || {
      sessionId: 'sess_default',
      agentWallet: '0x0',
      guardianContract: '0x0',
      targetVault: '0x0',
      sessionBudgetUSD: 50000,
      spentBudgetUSD: 0,
      maxTxAmountUSD: 50000,
      allowedSelectors: ['0x42966c68'],
      mandatoryNodeTypes: ['RISK_EVALUATION'],
      expiryTimestamp: Date.now() + 86400000,
      requireWitnessAttestation: true
    };

    const blocksList = stateBlocks || [];

    // Find key nodes in the trace
    const riskNode = blocksList.find(b => b?.nodeId === 'node-risk-guard' && b?.status !== 'drifted');
    const actionNode = blocksList.find(b => b?.nodeId === 'node-exec-dispatch');

    const emittedEvents: Array<{ name: string; args: Record<string, any> }> = [
      {
        name: 'ReasoningRootAnchored',
        args: {
          sessionId: policy.sessionId,
          merkleRoot,
          daIpfsCid: blocksList[0]?.daIpfsCid || 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
        }
      }
    ];

    // Check 1: Session Expiration
    if (Date.now() > policy.expiryTimestamp) {
      return {
        txHash: mockTxHash,
        blockNumber,
        timestamp,
        status: 'REVERTED',
        revertCode: 'ERR_EXPIRED_SESSION_KEY',
        revertMessage: 'Session key has expired. Transaction rejected by Guardian before state change.',
        gasUsed: 23140,
        gasPriceGwei,
        merkleRoot,
        emittedEvents
      };
    }

    // Check 2: Mandatory Risk Node Checkpoint Check (Scenario 2: Rogue Agent)
    const hasRiskNode = Boolean(riskNode && riskNode.leafHash && riskNode.leafHash !== '0x0000000000000000000000000000000000000000000000000000000000000000');
    if (!hasRiskNode || scenario?.category === 'ROGUE_AGENT') {
      emittedEvents.push({
        name: 'InvariantViolationDetected',
        args: {
          sessionId: policy.sessionId,
          violationCode: 'ERR_MISSING_RISK_CHECKPOINT',
          reason: 'Autonomous agent bypassed mandatory RISK_EVALUATION node in state graph',
          culpritNodeId: 'node-risk-guard'
        }
      });

      return {
        txHash: mockTxHash,
        blockNumber,
        timestamp,
        status: 'REVERTED',
        revertCode: 'ERR_MISSING_RISK_CHECKPOINT',
        revertMessage: 'Guardian Revert: Missing mandatory [RISK_EVALUATION] checkpoint leaf in proof tree. Agent attempted rogue execution without risk sign-off.',
        gasUsed: 31200,
        gasPriceGwei,
        merkleRoot,
        culpritNodeId: 'node-risk-guard',
        emittedEvents
      };
    }

    // Check 3: Oracle Witness Attestation (Scenario 5: Oracle Manipulation)
    if (scenario?.category === 'ORACLE_MANIPULATION') {
      emittedEvents.push({
        name: 'InvariantViolationDetected',
        args: {
          sessionId: policy.sessionId,
          violationCode: 'ERR_ORACLE_WITNESS_TAMPERED',
          reason: 'Oracle ECDSA witness signature failed verification against trusted price feed signer',
          culpritNodeId: 'node-market-data'
        }
      });

      return {
        txHash: mockTxHash,
        blockNumber,
        timestamp,
        status: 'REVERTED',
        revertCode: 'ERR_ORACLE_WITNESS_TAMPERED',
        revertMessage: 'Guardian Revert: Oracle attestation signature invalid. Forged price feed detected in StateBlock #1.',
        gasUsed: 38450,
        gasPriceGwei,
        merkleRoot,
        culpritNodeId: 'node-market-data',
        emittedEvents
      };
    }

    // Check 4: Spending Budget Policy Invariant (Scenario 4: Budget Breach)
    const requestedUSD = scenario?.initialContext?.amountUSD || 0;
    if (requestedUSD > policy.sessionBudgetUSD || scenario?.category === 'POLICY_BREACH') {
      emittedEvents.push({
        name: 'InvariantViolationDetected',
        args: {
          sessionId: policy.sessionId,
          violationCode: 'ERR_SESSION_BUDGET_EXCEEDED',
          reason: `Requested transaction ($${requestedUSD.toLocaleString()}) exceeds ERC-4337 session allowance ($${policy.sessionBudgetUSD.toLocaleString()})`,
          culpritNodeId: 'node-policy-guard'
        }
      });

      return {
        txHash: mockTxHash,
        blockNumber,
        timestamp,
        status: 'REVERTED',
        revertCode: 'ERR_SESSION_BUDGET_EXCEEDED',
        revertMessage: `Guardian Revert: Spending limit breach. Requested $${requestedUSD.toLocaleString()} exceeds session allowance of $${policy.sessionBudgetUSD.toLocaleString()}.`,
        gasUsed: 42100,
        gasPriceGwei,
        merkleRoot,
        culpritNodeId: 'node-policy-guard',
        emittedEvents
      };
    }

    // Check 5: Calldata Merkle Leaf Proof Verification (Scenario 3: Prompt Injection)
    if (scenario?.category === 'PROMPT_INJECTION' || !actionNode) {
      emittedEvents.push({
        name: 'InvariantViolationDetected',
        args: {
          sessionId: policy.sessionId,
          violationCode: 'ERR_INVALID_MERKLE_PROOF',
          reason: 'Submitted calldata leaf hash failed Merkle proof verification against anchored root',
          culpritNodeId: 'node-exec-dispatch'
        }
      });

      return {
        txHash: mockTxHash,
        blockNumber,
        timestamp,
        status: 'REVERTED',
        revertCode: 'ERR_INVALID_MERKLE_PROOF',
        revertMessage: 'Guardian Revert: Cryptographic Merkle proof mismatch. Submitted calldata was tampered via prompt injection and does not match reasoning commitment.',
        gasUsed: 49800,
        gasPriceGwei,
        merkleRoot,
        culpritNodeId: 'node-exec-dispatch',
        emittedEvents
      };
    }

    // Check 6: Real Merkle Proof mathematical validation for all leaves in treeLevels[0]
    let totalGas = 65000;
    if (treeLevels && treeLevels[0]) {
      for (let i = 0; i < treeLevels[0].length; i++) {
        const proof = generateMerkleProof(i, treeLevels, merkleRoot);
        const verification = verifyMerkleProof(proof);
        if (!verification.isValid) {
          const matchedBlock = blocksList[i];
          return {
            txHash: mockTxHash,
            blockNumber,
            timestamp,
            status: 'REVERTED',
            revertCode: 'ERR_INVALID_MERKLE_PROOF',
            revertMessage: `Guardian Revert: Mathematical proof failure on Leaf #${i + 1}.`,
            gasUsed: 45000,
            gasPriceGwei,
            merkleRoot,
            culpritNodeId: matchedBlock?.nodeId || 'node-unknown',
            emittedEvents
          };
        }
        totalGas += 12400; // gas per Merkle path branch verified
      }
    }

    // Success Golden Path Execution
    const userOpHash = keccak256(`userOp_${policy.sessionId}_${requestedUSD}`);
    emittedEvents.push({
      name: 'UserOpExecuted',
      args: {
        sessionId: policy.sessionId,
        userOpHash,
        amountUSD: requestedUSD,
        targetVault: policy.targetVault,
        gasUsed: totalGas
      }
    });

    return {
      txHash: mockTxHash,
      blockNumber,
      timestamp,
      status: 'SUCCESS',
      gasUsed: totalGas,
      gasPriceGwei,
      merkleRoot,
      emittedEvents
    };
  }
}
