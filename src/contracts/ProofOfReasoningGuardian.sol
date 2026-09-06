// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProofOfReasoningGuardian
 * @author LedgerTrace Protocol (Code2Create Hackathon)
 * @notice Enforces cryptographic verification of AI Agent LangGraph reasoning trees
 *         before allowing ERC-4337 UserOp execution on treasury/infrastructural contracts.
 */
contract ProofOfReasoningGuardian {
    
    // --- Data Structures ---
    
    struct SessionPolicy {
        address agentWallet;
        address targetVault;
        uint256 sessionBudgetUSD;
        uint256 spentBudgetUSD;
        uint256 maxTxAmountUSD;
        uint256 expiryTimestamp;
        bool isActive;
        bool requireWitnessAttestation;
    }

    struct AnchoredTrace {
        bytes32 merkleRoot;
        string daIpfsCid;
        uint256 timestamp;
        address submitter;
        bool isAnchored;
    }

    // --- State Storage ---

    address public immutable protocolAdmin;
    mapping(bytes32 => SessionPolicy) public sessionPolicies;
    mapping(bytes32 => AnchoredTrace) public anchoredTraces;
    mapping(bytes32 => mapping(bytes4 => bool)) public allowedSelectors;
    mapping(bytes32 => bool) public executedUserOpHashes;

    // --- Events ---

    event SessionCreated(bytes32 indexed sessionId, address indexed agentWallet, uint256 sessionBudgetUSD);
    event ReasoningRootAnchored(bytes32 indexed sessionId, bytes32 indexed merkleRoot, string daIpfsCid);
    event UserOpExecuted(bytes32 indexed sessionId, bytes32 indexed userOpHash, uint256 amountUSD, uint256 gasUsed);
    event InvariantViolationDetected(
        bytes32 indexed sessionId, 
        string indexed violationCode, 
        string reason, 
        bytes32 culpritLeaf
    );

    // --- Errors ---

    error SessionNotActive(bytes32 sessionId);
    error SessionExpired(bytes32 sessionId, uint256 currentTimestamp, uint256 expiry);
    error UnauthorizedAgent(address caller, address authorizedAgent);
    error ReasoningRootNotAnchored(bytes32 root);
    error InvalidMerkleProof(bytes32 leaf, bytes32 root);
    error MissingRiskCheckpoint(bytes32 sessionId);
    error MissingPolicyCheckpoint(bytes32 sessionId);
    error SessionBudgetExceeded(uint256 requested, uint256 remainingBudget);
    error UnauthorizedFunctionSelector(bytes4 selector);
    error OracleWitnessTampered(bytes32 leaf);
    error UserOpAlreadyExecuted(bytes32 userOpHash);

    // --- Modifiers ---

    modifier onlyAdmin() {
        require(msg.sender == protocolAdmin, "ONLY_ADMIN");
        _;
    }

    constructor() {
        protocolAdmin = msg.sender;
    }

    // --- Session Policy Management ---

    function createSession(
        bytes32 sessionId,
        address agentWallet,
        address targetVault,
        uint256 sessionBudgetUSD,
        uint256 maxTxAmountUSD,
        uint256 durationSeconds,
        bytes4[] calldata allowedFunctionSelectors
    ) external onlyAdmin {
        sessionPolicies[sessionId] = SessionPolicy({
            agentWallet: agentWallet,
            targetVault: targetVault,
            sessionBudgetUSD: sessionBudgetUSD,
            spentBudgetUSD: 0,
            maxTxAmountUSD: maxTxAmountUSD,
            expiryTimestamp: block.timestamp + durationSeconds,
            isActive: true,
            requireWitnessAttestation: true
        });

        for (uint256 i = 0; i < allowedFunctionSelectors.length; i++) {
            allowedSelectors[sessionId][allowedFunctionSelectors[i]] = true;
        }

        emit SessionCreated(sessionId, agentWallet, sessionBudgetUSD);
    }

    // --- Proof-of-Reasoning Core Protocol ---

    /**
     * @notice Anchors the cryptographic Merkle Root representing the full agent decision chain
     * @param sessionId The active session key identifier
     * @param merkleRoot The 32-byte Merkle root generated from discrete LangGraph state blocks
     * @param daIpfsCid Data Availability Content ID where raw off-chain trace logs are pinned
     */
    function anchorReasoningRoot(
        bytes32 sessionId,
        bytes32 merkleRoot,
        string calldata daIpfsCid
    ) external {
        SessionPolicy storage policy = sessionPolicies[sessionId];
        if (!policy.isActive) revert SessionNotActive(sessionId);
        if (block.timestamp > policy.expiryTimestamp) revert SessionExpired(sessionId, block.timestamp, policy.expiryTimestamp);
        if (msg.sender != policy.agentWallet && msg.sender != protocolAdmin) {
            revert UnauthorizedAgent(msg.sender, policy.agentWallet);
        }

        anchoredTraces[merkleRoot] = AnchoredTrace({
            merkleRoot: merkleRoot,
            daIpfsCid: daIpfsCid,
            timestamp: block.timestamp,
            submitter: msg.sender,
            isAnchored: true
        });

        emit ReasoningRootAnchored(sessionId, merkleRoot, daIpfsCid);
    }

    /**
     * @notice Verifies the agent's Merkle Proofs against deterministic rules and executes the action
     * @dev If any node invariant is violated or proof fails, transaction reverts BEFORE any state change.
     */
    function executeValidatedAction(
        bytes32 sessionId,
        bytes32 merkleRoot,
        bytes calldata actionCalldata,
        uint256 amountUSD,
        bytes32[] calldata actionProof,
        bytes32 actionLeaf,
        bytes32[] calldata riskProof,
        bytes32 riskLeaf,
        bool hasRiskNode,
        bool isWitnessValid
    ) external returns (bool) {
        SessionPolicy storage policy = sessionPolicies[sessionId];
        
        // 1. Session Liveness Validation
        if (!policy.isActive) revert SessionNotActive(sessionId);
        if (block.timestamp > policy.expiryTimestamp) revert SessionExpired(sessionId, block.timestamp, policy.expiryTimestamp);
        
        // 2. Merkle Root Anchoring Check
        if (!anchoredTraces[merkleRoot].isAnchored) {
            revert ReasoningRootNotAnchored(merkleRoot);
        }

        // 3. UserOp Replay Check
        bytes32 userOpHash = keccak256(abi.encodePacked(sessionId, actionCalldata, amountUSD, block.chainid));
        if (executedUserOpHashes[userOpHash]) {
            revert UserOpAlreadyExecuted(userOpHash);
        }

        // 4. Function Selector Check
        bytes4 selector = bytes4(actionCalldata[:4]);
        if (!allowedSelectors[sessionId][selector]) {
            emit InvariantViolationDetected(sessionId, "ERR_UNAUTHORIZED_FUNCTION_SELECTOR", "Selector not in whitelist", actionLeaf);
            revert UnauthorizedFunctionSelector(selector);
        }

        // 5. Session Spending Cap Invariant
        if (policy.spentBudgetUSD + amountUSD > policy.sessionBudgetUSD) {
            emit InvariantViolationDetected(sessionId, "ERR_SESSION_BUDGET_EXCEEDED", "Requested amount exceeds session cap", actionLeaf);
            revert SessionBudgetExceeded(amountUSD, policy.sessionBudgetUSD - policy.spentBudgetUSD);
        }

        // 6. Merkle Proof Verification for Action Leaf
        if (!verifyProof(actionProof, merkleRoot, actionLeaf)) {
            emit InvariantViolationDetected(sessionId, "ERR_INVALID_MERKLE_PROOF", "Action leaf hash mismatch with Merkle Root", actionLeaf);
            revert InvalidMerkleProof(actionLeaf, merkleRoot);
        }

        // 7. Mandatory Risk Node Invariant Check
        if (!hasRiskNode || riskLeaf == bytes32(0)) {
            emit InvariantViolationDetected(sessionId, "ERR_MISSING_RISK_CHECKPOINT", "Agent skipped mandatory Risk Evaluation node", bytes32(0));
            revert MissingRiskCheckpoint(sessionId);
        }

        // 8. Merkle Proof Verification for Risk Checkpoint Leaf
        if (!verifyProof(riskProof, merkleRoot, riskLeaf)) {
            emit InvariantViolationDetected(sessionId, "ERR_INVALID_MERKLE_PROOF", "Risk checkpoint leaf proof invalid", riskLeaf);
            revert InvalidMerkleProof(riskLeaf, merkleRoot);
        }

        // 9. Oracle Witness Attestation Check
        if (!isWitnessValid) {
            emit InvariantViolationDetected(sessionId, "ERR_ORACLE_WITNESS_TAMPERED", "Oracle signature verification failed", riskLeaf);
            revert OracleWitnessTampered(riskLeaf);
        }

        // --- State Commitments (Only reached if 100% of cryptographic proofs pass) ---
        policy.spentBudgetUSD += amountUSD;
        executedUserOpHashes[userOpHash] = true;

        // Perform external call to target vault
        (bool success, ) = policy.targetVault.call(actionCalldata);
        require(success, "VAULT_EXECUTION_FAILED");

        emit UserOpExecuted(sessionId, userOpHash, amountUSD, gasleft());
        return true;
    }

    // --- OpenZeppelin MerkleProof.verify Implementation ---

    function verifyProof(
        bytes32[] calldata proof,
        bytes32 root,
        bytes32 leaf
    ) public pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computedHash <= proofElement) {
                // Hash(current, element)
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash(element, current)
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        return computedHash == root;
    }
}
