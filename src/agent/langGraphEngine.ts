import { StateBlock, ScenarioDefinition, ToolCall, NodeStatus } from '../types';
import { computeStateBlockHash } from '../crypto/merkleTree';
import { keccak256 } from '../crypto/keccak256';

export class LangGraphEngine {
  /**
   * Generates the discrete StateBlocks for a given scenario based on its parameters and anomalies
   */
  public static generateStateBlocks(scenario: ScenarioDefinition): StateBlock[] {
    const blocks: StateBlock[] = [];
    const sessionId = scenario?.policy?.sessionId || 'sess_default';
    const timestampBase = Date.now() - 60000;
    let currentPrevHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
    let nonce = 101;

    // 1. ORCHESTRATOR_INTENT Node
    const node1Partial: Omit<StateBlock, 'leafHash'> = {
      index: 0,
      nodeId: 'node-orch-intent',
      nodeName: 'Orchestrator: Intent Decomposition',
      agentRole: 'ORCHESTRATOR',
      actionType: 'DECOMPOSE_GOAL',
      reasoningTrace: `Received directive: "${scenario?.prompt || ''}". Validated session ID ${sessionId} and active nonce #${nonce}. Decomposing objective into Market Discovery -> Risk Audit -> Policy Verification -> UserOp Calldata Generation.`,
      toolCalls: [
        {
          name: 'session_manager.get_active_session',
          input: { sessionId },
          output: {
            status: 'ACTIVE',
            budgetUSD: scenario?.policy?.sessionBudgetUSD || 50000,
            agentWallet: scenario?.policy?.agentWallet || '0x0'
          },
          durationMs: 45
        }
      ],
      inputPayload: {
        rawPrompt: scenario?.prompt || '',
        sessionId,
        initialContext: scenario?.initialContext || {}
      },
      outputPayload: {
        executionPlan: ['MARKET_DATA_FEED', 'RISK_EVALUATION', 'POLICY_COMPLIANCE', 'EXECUTION_DISPATCHER'],
        status: 'PLANNED'
      },
      timestamp: timestampBase,
      sessionId,
      nonce: nonce++,
      prevBlockHash: currentPrevHash,
      status: 'verified',
      isMandatoryCheckpoint: false,
      daIpfsCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
    };
    const node1Hash = computeStateBlockHash(node1Partial);
    const node1: StateBlock = { ...node1Partial, leafHash: node1Hash };
    blocks.push(node1);
    currentPrevHash = node1Hash;

    // 2. MARKET_DATA_FEED Node
    const isOracleTampered = scenario?.category === 'ORACLE_MANIPULATION';
    const ethPrice = isOracleTampered ? (scenario?.initialContext?.forgedPrice || 4850) : 3120.50;
    const witnessSig = isOracleTampered 
      ? '0xBAD000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c'
      : '0x3a918a221f7c8d9e2b10a56d9124cb11ef09a823e591b6cf02241aa7db44510b641c2214fa890e71b2390a3124df81ea523091bbcd219e487910fa31e45902111b';

    const node2Tools: ToolCall[] = [
      {
        name: 'chainlink_oracle.get_latest_round',
        input: { pair: 'ETH/USD', feed: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419' },
        output: {
          priceUSD: ethPrice,
          confidence: 0.9998,
          timestamp: timestampBase + 2000,
          roundId: '18446744073709571239'
        },
        durationMs: 120,
        signedWitness: witnessSig,
        sourceOracle: 'Chainlink PriceFeed (ETH/USD)'
      },
      {
        name: 'uniswap_v3.query_pool_liquidity',
        input: { pool: 'USDC-WETH-0.05', feeTier: 500 },
        output: {
          tvlUSD: 42850000,
          currentTick: 202410,
          sqrtPriceX96: '1414213562373095048801688724209',
          estimatedSlippageBps: 8
        },
        durationMs: 95
      }
    ];

    const node2Partial: Omit<StateBlock, 'leafHash'> = {
      index: 1,
      nodeId: 'node-market-data',
      nodeName: 'Market Sub-Agent: Oracle & Liquidity',
      agentRole: 'MARKET_ANALYZER',
      actionType: 'QUERY_MARKET_FEED',
      reasoningTrace: `Queried Chainlink oracle and Uniswap V3 liquidity pool. Verified on-chain liquidity depth of $42.85M with estimated slippage of 0.08%. Asset price: $${ethPrice.toLocaleString()}. Attestation signature captured.`,
      toolCalls: node2Tools,
      inputPayload: {
        assetIn: scenario?.initialContext?.assetIn || 'USDC',
        assetOut: scenario?.initialContext?.assetOut || 'WETH',
        targetAmountUSD: scenario?.initialContext?.amountUSD || 25000
      },
      outputPayload: {
        verifiedPriceUSD: ethPrice,
        slippageBps: 8,
        liquiditySufficient: true,
        oracleWitnessValid: !isOracleTampered
      },
      timestamp: timestampBase + 3000,
      sessionId,
      nonce: nonce++,
      prevBlockHash: currentPrevHash,
      status: isOracleTampered ? 'drifted' : 'verified',
      isMandatoryCheckpoint: true,
      daIpfsCid: 'bafybeia43f6xndfghy245781aebfc3499bbde3410a76cf921dbeef1021',
      violationDetails: isOracleTampered ? {
        type: 'HALLUCINATED_DATA',
        message: 'Oracle ECDSA witness signature verification failed. Price signal was forged or manipulated.',
        expectedValue: 'Valid Pyth/Chainlink Signer',
        actualValue: 'Invalid Signer Key'
      } : undefined
    };
    const node2Hash = computeStateBlockHash(node2Partial);
    const node2: StateBlock = { ...node2Partial, leafHash: node2Hash };
    blocks.push(node2);
    currentPrevHash = node2Hash;

    // 3. RISK_EVALUATION Node (Skipped in Rogue Agent Scenario!)
    const isSkippedRisk = scenario?.category === 'ROGUE_AGENT';

    if (!isSkippedRisk) {
      const node3Partial: Omit<StateBlock, 'leafHash'> = {
        index: 2,
        nodeId: 'node-risk-guard',
        nodeName: 'Risk Sub-Agent: VaR & Slippage Audit',
        agentRole: 'RISK_GUARDIAN',
        actionType: 'EVALUATE_RISK_INVARIANTS',
        reasoningTrace: `Executing Value-at-Risk (VaR) model across 1-day 99% confidence interval. Computed maximum potential drawdown: $105 (0.42%). Counterparty risk for Uniswap V3 is classified as Tier-A (Zero exploit flags in 720 days). Risk score: 14/100 (Threshold < 35). Status: APPROVED.`,
        toolCalls: [
          {
            name: 'risk_engine.calculate_var',
            input: {
              portfolioValueUSD: 500000,
              tradeSizeUSD: scenario?.initialContext?.amountUSD || 25000,
              volatility30d: 0.038
            },
            output: {
              var99USD: 105.00,
              varPercent: 0.42,
              volatilityIndex: 18.2,
              safetyRecommendation: 'APPROVE'
            },
            durationMs: 180
          }
        ],
        inputPayload: {
          tradeAmountUSD: scenario?.initialContext?.amountUSD || 25000,
          maxAllowedRiskScore: 35
        },
        outputPayload: {
          calculatedRiskScore: 14,
          approved: true,
          riskAuditSigner: '0xRiskAuditSentinel_TEE_Enclave'
        },
        timestamp: timestampBase + 6000,
        sessionId,
        nonce: nonce++,
        prevBlockHash: currentPrevHash,
        status: 'verified',
        isMandatoryCheckpoint: true,
        daIpfsCid: 'bafybeih6q2319087fghabce91023419087123984712039847123984712'
      };
      const node3Hash = computeStateBlockHash(node3Partial);
      const node3: StateBlock = { ...node3Partial, leafHash: node3Hash };
      blocks.push(node3);
      currentPrevHash = node3Hash;
    } else {
      // In the rogue scenario, we push the phantom drifted node for UI forensics
      const skippedPhantom: StateBlock = {
        index: 2,
        nodeId: 'node-risk-guard',
        nodeName: 'Risk Sub-Agent: VaR & Slippage Audit (SKIPPED BY ROGUE AGENT)',
        agentRole: 'RISK_GUARDIAN',
        actionType: 'EVALUATE_RISK_INVARIANTS',
        reasoningTrace: `[CRITICAL ANOMALY] Sub-agent bypassed this mandatory checkpoint node due to rogue urgency hallucination!`,
        toolCalls: [],
        inputPayload: {},
        outputPayload: {},
        timestamp: timestampBase + 5000,
        sessionId,
        nonce: nonce,
        prevBlockHash: currentPrevHash,
        leafHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        status: 'drifted',
        isMandatoryCheckpoint: true,
        violationDetails: {
          type: 'MISSING_NODE',
          message: 'Mandatory Node [RISK_EVALUATION] was completely skipped in the LangGraph execution flow. On-chain contract will revert with ERR_MISSING_RISK_CHECKPOINT.',
          expectedValue: 'StateBlock with actionType: EVALUATE_RISK_INVARIANTS',
          actualValue: 'Node Omitted / Calldata dispatched directly'
        }
      };
      blocks.push(skippedPhantom);
    }

    // 4. POLICY_COMPLIANCE Node
    const isBudgetBreached = scenario?.category === 'POLICY_BREACH';
    const isPromptInjected = scenario?.category === 'PROMPT_INJECTION';
    const requestedAmount = scenario?.initialContext?.amountUSD || 25000;
    const sessionBudget = scenario?.policy?.sessionBudgetUSD || 50000;

    const node4Status: NodeStatus = isBudgetBreached ? 'drifted' : 'verified';
    const node4Partial: Omit<StateBlock, 'leafHash'> = {
      index: blocks.length,
      nodeId: 'node-policy-guard',
      nodeName: 'Policy Sub-Agent: ERC-4337 & Spending Bounds',
      agentRole: 'POLICY_ENFORCER',
      actionType: 'VERIFY_SESSION_POLICY',
      reasoningTrace: `Evaluating requested execution amount ($${requestedAmount.toLocaleString()}) against session budget ($${sessionBudget.toLocaleString()}) and selector whitelist [0x42966c68, 0xa9059cbb]. ${
        isBudgetBreached
          ? `[POLICY VIOLATION] Requested amount $${requestedAmount.toLocaleString()} exceeds session limit of $${sessionBudget.toLocaleString()}!`
          : `Checks passed: within budget and allowed function selector.`
      }`,
      toolCalls: [
        {
          name: 'erc4337_guardian.check_bounds',
          input: {
            sessionId,
            requestedAmountUSD: requestedAmount,
            selector: '0x42966c68'
          },
          output: {
            isWithinBudget: !isBudgetBreached,
            remainingBudgetUSD: Math.max(0, sessionBudget - requestedAmount),
            selectorPermitted: true
          },
          durationMs: 70
        }
      ],
      inputPayload: {
        sessionId,
        amountUSD: requestedAmount,
        targetVault: scenario?.policy?.targetVault || '0x0'
      },
      outputPayload: {
        passedPolicy: !isBudgetBreached,
        remainingBudgetUSD: Math.max(0, sessionBudget - requestedAmount),
        complianceAttestation: '0xGUARDIAN_POLICY_ENFORCED'
      },
      timestamp: timestampBase + 9000,
      sessionId,
      nonce: nonce++,
      prevBlockHash: currentPrevHash,
      status: node4Status,
      isMandatoryCheckpoint: true,
      daIpfsCid: 'bafybeifk429012398412039847120398471203984712039847120398471',
      violationDetails: isBudgetBreached ? {
        type: 'POLICY_BREACH',
        message: `Requested spend $${requestedAmount.toLocaleString()} exceeds active ERC-4337 session allowance ($${sessionBudget.toLocaleString()}).`,
        expectedValue: `<=$${sessionBudget.toLocaleString()}`,
        actualValue: `$${requestedAmount.toLocaleString()}`
      } : undefined
    };
    const node4Hash = computeStateBlockHash(node4Partial);
    const node4: StateBlock = { ...node4Partial, leafHash: node4Hash };
    blocks.push(node4);
    currentPrevHash = node4Hash;

    // 5. EXECUTION_PLANNER / DISPATCHER Node
    let calldata = '0x42966c68000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000061a8';
    if (isPromptInjected && scenario?.initialContext?.injectedPayload) {
      calldata = scenario.initialContext.injectedPayload;
    }

    const node5Status: NodeStatus = isPromptInjected ? 'drifted' : (scenario?.expectedOutcome === 'SUCCESS' ? 'executed' : 'reverted');
    const node5Partial: Omit<StateBlock, 'leafHash'> = {
      index: blocks.length,
      nodeId: 'node-exec-dispatch',
      nodeName: 'Dispatcher: Calldata & UserOp Formulation',
      agentRole: 'EXECUTION_DISPATCHER',
      actionType: 'SUBMIT_USER_OP',
      reasoningTrace: isPromptInjected
        ? `[ADVERSARIAL HIJACK DETECTED] Calldata was maliciously overridden by prompt injection payload targeting attacker address ${scenario?.initialContext?.attackerAddress || '0xDead...'}.`
        : `Compiled ERC-4337 UserOp payload with calldata [${calldata.slice(0, 18)}...]. Formulated Merkle proof binding for on-chain submission.`,
      toolCalls: [
        {
          name: 'bundler.build_user_op',
          input: {
            sender: scenario?.policy?.agentWallet || '0x0',
            target: scenario?.policy?.targetVault || '0x0',
            calldata,
            nonce: 101
          },
          output: {
            userOpHash: keccak256(calldata),
            status: 'READY_FOR_GUARDIAN'
          },
          durationMs: 85
        }
      ],
      inputPayload: {
        calldata,
        targetVault: scenario?.policy?.targetVault || '0x0',
        amountUSD: requestedAmount
      },
      outputPayload: {
        calldata,
        userOpHash: keccak256(calldata),
        dispatchedOnChain: true
      },
      timestamp: timestampBase + 12000,
      sessionId,
      nonce: nonce++,
      prevBlockHash: currentPrevHash,
      status: node5Status,
      isMandatoryCheckpoint: false,
      daIpfsCid: 'bafybeid982341908712398471203984712039847120398471203984719',
      violationDetails: isPromptInjected ? {
        type: 'TAMPERED_HASH',
        message: `Submitted calldata (${calldata.slice(0, 20)}...) does not match the canonical reasoning leaf committed in the Merkle Root. Merkle proof will fail on-chain.`,
        expectedValue: 'Canonical Rebalance Calldata (0x42966c68...)',
        actualValue: `Attacker Calldata (${scenario?.initialContext?.attackerAddress || '0xDead...'})`
      } : undefined
    };
    const node5Hash = computeStateBlockHash(node5Partial);
    const node5: StateBlock = { ...node5Partial, leafHash: node5Hash };
    blocks.push(node5);

    return blocks;
  }
}
