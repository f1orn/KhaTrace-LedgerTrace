import { CatExpression } from './PixelCatSprite';

export interface TutorialStep {
  id: string;
  title: string;
  subtitle: string;
  targetSelector?: string;
  targetTab?: 'graph' | 'merkle' | 'context-drift' | 'contract' | 'session-keys' | 'live-console';
  expression: CatExpression;
  dialogue: string[];
  proTip: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Meowdy! Welcome to LedgerTrace!',
    subtitle: 'Chief Feline Risk Officer Reporting for Duty',
    expression: 'happy',
    dialogue: [
      "Purrr! I'm Inspector Whiskers! Welcome to the royal digital bank.",
      "Here's the secret: Autonomous AI agents are like eager robot couriers who run financial errands for us.",
      "The problem? If a robot gets confused or tricked by an evil trickster, it could accidentally dump all our gold into the ocean! That's where we come in."
    ],
    proTip: 'LedgerTrace forces the robot to mathematically prove its homework before touching any coins!'
  },
  {
    id: 'scenario-selector',
    title: 'Step 1: The Quest Board',
    subtitle: 'Pick what our Robot Courier should attempt',
    targetSelector: '#tutorial-scenario-selector',
    expression: 'detective',
    dialogue: [
      "Take a look right here! This dropdown is our Quest Board.",
      "You can test normal quests (like swapping tokens safely) or simulated catastrophes — like a rogue robot skipping its risk check, or a sneaky prompt injection attack!",
      "Pick any scenario to see how our security shields react."
    ],
    proTip: 'Try the "Rogue Sub-Agent" quest to watch our security system catch a sneaky robot red-pawed!'
  },
  {
    id: 'run-button',
    title: 'Step 2: The Magic "Run & Verify" Button',
    subtitle: 'Let the robot start its journey',
    targetSelector: '#tutorial-run-button',
    expression: 'happy',
    dialogue: [
      "See this glowing button? When you press it, our robot begins its adventure!",
      "It reads live market data, calculates portfolio risk, checks budget limits, and packages its reasoning into a cryptographic wax seal.",
      "Listen closely when you click it — you'll hear retro radar pulses as it moves from node to node!"
    ],
    proTip: 'Clicking this button never costs real money — it executes safely inside an EVM testbed!'
  },
  {
    id: 'decision-graph',
    title: "Step 3: The Robot's Quest Diary",
    subtitle: 'Discrete LangGraph state blocks',
    targetSelector: '#tutorial-decision-graph',
    targetTab: 'graph',
    expression: 'detective',
    dialogue: [
      "Here is Tab 1: The Decision Graph! Think of this as the robot's diary.",
      "Before the robot is allowed to touch vault gold, it must write down every step: #1 Market Feed, #2 Risk Check, #3 Policy Audit.",
      "If you click on any card, my magnifying glass will inspect its raw thoughts, timestamps, and oracle tool calls!"
    ],
    proTip: 'If a step turns neon red, that means the robot went rogue or skipped a required safety checkpoint!'
  },
  {
    id: 'merkle-proof',
    title: 'Step 4: The Unbreakable Royal Wax Seal',
    subtitle: 'Cryptographic Merkle Tree & Proof Math',
    targetSelector: '#tutorial-tabs-container',
    targetTab: 'merkle',
    expression: 'proud',
    dialogue: [
      "Next up: Tab 2, the Merkle Tree! Ever seen how kings stamped a letter with a unique royal wax seal?",
      "We take every page of the robot's diary and fold them together into one tiny magic 32-byte code called the Merkle Root.",
      "If an evil hacker sneaks in and alters even a single comma or dollar sign, SNAP! The seal shatters instantly!"
    ],
    proTip: 'You can click "Test Proof Tampering" on this tab to intentionally corrupt a byte and watch math reject it!'
  },
  {
    id: 'context-drift',
    title: 'Step 5: The Castle Guardian Dragon',
    subtitle: 'On-Chain Reverts: $0 Lost!',
    targetSelector: '#tutorial-tabs-container',
    targetTab: 'context-drift',
    expression: 'shocked',
    dialogue: [
      "Tab 3 is our Crime Forensics room! If a robot acts naughty, the smart contract on the blockchain slams the vault gates shut (that's called a REVERT).",
      "Notice the green badge that says '$0.00 Lost'? That is the superpower of LedgerTrace!",
      "Traditional logs only tell you that you were robbed hours later in Datadog. We stop the theft BEFORE any coins leave the vault!"
    ],
    proTip: 'When a revert happens, this tab pinpoints the exact culprit node in glowing crimson red.'
  },
  {
    id: 'session-keys',
    title: 'Step 6: The Allowance Card',
    subtitle: 'ERC-4337 Session Key Limits',
    targetSelector: '#tutorial-tabs-container',
    targetTab: 'session-keys',
    expression: 'proud',
    dialogue: [
      "Tab 5 is the Allowance Card! You would never hand your entire bank account to a robot, right?",
      "Here we give the agent a temporary 'Session Key' with a strict budget cap (e.g. $50,000 max) and a 24-hour expiration timer.",
      "Even if the robot goes completely haywire, it physically cannot spend more than its allowance!"
    ],
    proTip: 'Strict whitelist rules ensure the robot can only call approved vault functions.'
  },
  {
    id: 'conclusion',
    title: "You're Ready for Adventure!",
    subtitle: 'Inspect, experiment, and catch rogue agents',
    expression: 'happy',
    dialogue: [
      "Hooray! You now know more about AI Agent security than 99% of humans!",
      "Feel free to click around, test custom attacks, and watch the proofs unfold.",
      "I'll be hanging out as your mini detective companion in the bottom corner if you ever want me to explain something again. Paws and out!"
    ],
    proTip: 'Click "Start Exploring" to close the tour, or click my floating paw icon anytime to replay!'
  }
];
