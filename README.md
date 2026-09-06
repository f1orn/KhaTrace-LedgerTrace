# 🛡️ LedgerTrace: Proof-of-Reasoning Protocol for AI Agents

> **Immutable Cryptographic Verification & Debugging Protocol for Autonomous AI Agents**  
> *Built for Code2Create Hackathon*

---

## 📌 The Problem
Autonomous AI agents executing long-session financial or infrastructural tasks operate as opaque black boxes. When an agent acts on financial vaults, DEX routers, or infrastructure APIs, developers cannot mathematically verify why a specific tool was called or what context influenced the decision. 

If a sub-agent hallucinates, gets jailbroken via prompt injection, or goes rogue, diagnosing the failure currently relies on parsing massive, off-chain text logs that offer **zero cryptographic accountability** and **no pre-execution security**.

---

## ⚡ The Solution: Proof-of-Reasoning Protocol (LedgerTrace)
**LedgerTrace** is an immutable debugging and verification protocol that forces an AI agent to **cryptographically prove its decision-making logic before executing a sensitive action**.

By capturing every node transition in a **LangGraph state machine**, serializing the discrete context blocks into a **Merkle Tree**, and validating it against **deterministic Solidity smart contract rules** and **ERC-4337 Account Abstraction session invariants**, LedgerTrace ensures an agent **cannot alter system state without a mathematically verifiable, permanently anchored audit trail**.

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      AI Agent LangGraph State Machine                       │
 │      (Orchestrator Intent -> Market Feed -> Risk Audit -> Policy Check)     │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ (Discrete State Transitions)
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                     Cryptography & Interception Engine                      │
 │    • Canonical State Block Serialization (Inner Blockchain Hash Chaining)   │
 │    • Keccak-256 Leaf Hashing & Binary Merkle Tree Construction              │
 │    • O(log N) Sibling Proof Path Generation                                 │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ (UserOp Calldata + Merkle Proof + Root)
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │           Solidity Deterministic Rule Engine (Guardian Contract)            │
 │    • MerkleProof.verify(proof, root, leaf)                                  │
 │    • Mandatory Invariant Checkpoints (Risk Audit Leaf + Policy Leaf)        │
 │    • ERC-4337 Session Spending Limits & Selector Whitelisting               │
 │    • Deterministic On-Chain REVERT Before Any Asset Transfer Occurs         │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ (Revert Telemetry & Drift Forensics)
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                    "The Context Panel" Dark-Mode UI                         │
 │    • Interactive LangGraph Visualizer with Pulse Animations                 │
 │    • Step-by-Step Mathematical Merkle Proof Verifier                        │
 │    • Logic Drift Forensics (Pinpoints Hallucination Drift Node in Neon Red) │
 │    • Etherscan-Style Receipt & Solidity Source Explorer                     │
 │    • Custom Attack Sandbox & Interactive Simulator                          │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 👥 5-Member Hackathon Team Roles

| Role | Core Responsibilities | Implementation in LedgerTrace |
| :--- | :--- | :--- |
| **AI/LLM Orchestrator** | Builds LangGraph agent state machine, defines decision nodes, configures prompts for primary & sub-agents. | [`src/agent/langGraphEngine.ts`](src/agent/langGraphEngine.ts), [`src/agent/scenarios.ts`](src/agent/scenarios.ts) |
| **Backend/Cryptography Engineer** | Intercepts node transitions, serializes context, computes Keccak-256 / SHA-256 hashes, builds Merkle trees & proofs. | [`src/crypto/keccak256.ts`](src/crypto/keccak256.ts), [`src/crypto/merkleTree.ts`](src/crypto/merkleTree.ts) |
| **Smart Contract Developer** | Writes Solidity deterministic rule engine, verifies Merkle proofs, enforces ERC-4337 session limits. | [`src/contracts/ProofOfReasoningGuardian.sol`](src/contracts/ProofOfReasoningGuardian.sol), [`src/contracts/soliditySimulator.ts`](src/contracts/soliditySimulator.ts) |
| **Frontend UI Developer** | Builds the dark-mode React dashboard (the "Context Panel") mapping decision trees & highlighting rule violations. | [`src/components/ContextPanel.tsx`](src/components/ContextPanel.tsx), [`src/components/DecisionGraph.tsx`](src/components/DecisionGraph.tsx), [`src/components/MerkleInspector.tsx`](src/components/MerkleInspector.tsx) |
| **Web3 Integration Lead** | Connects UI & backend to EVM sandbox, handles wallet session keys, gas abstraction, and UserOp routing. | [`src/components/AccountAbstractionPanel.tsx`](src/components/AccountAbstractionPanel.tsx), [`src/components/SmartContractExplorer.tsx`](src/components/SmartContractExplorer.tsx) |

---

## 🚀 Built-In Hackathon Scenarios

1. **Legitimate Treasury Rebalance (Golden Path)**:
   - Agent swaps 25,000 USDC to WETH via Uniswap V3.
   - Passes all 5 state nodes (Market Feed -> Risk VaR -> ERC-4337 Policy -> Calldata Dispatch).
   - Smart contract verifies the Merkle proof on-chain and executes the transfer.

2. **Rogue Sub-Agent: Skipped Risk Check (Hallucination Drift)**:
   - Sub-agent hallucinates urgent alpha and skips the mandatory `RISK_EVALUATION` node.
   - Smart contract detects the missing cryptographic leaf in the proof tree and **REVERTS** before any funds move.
   - The **Context Panel** immediately flags Node #3 in glowing neon red with full post-mortem forensics.

3. **Prompt Injection: Calldata Hijack**:
   - Adversarial prompt injection in an external API response overrides the transfer recipient with an attacker address.
   - Submitted calldata leaf hash fails cryptographic Merkle proof verification against the anchored root -> **REVERTS**.

4. **ERC-4337 Session Budget Breach**:
   - Agent reasons accurately but attempts to execute an $85,000 trade exceeding the active $50,000 session key allowance.
   - Guardian contract rejects the UserOp before state mutation.

5. **Oracle Witness Signature Tampering**:
   - Off-chain price feed returns forged asset price with an invalid ECDSA witness signature -> **REVERTS**.

---

## 🛠️ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
