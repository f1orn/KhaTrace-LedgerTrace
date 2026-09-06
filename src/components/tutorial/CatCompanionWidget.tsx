import React, { useState, useEffect } from 'react';
import { PixelCatSprite, CatExpression } from './PixelCatSprite';
import { sound } from '../../utils/audio';
import { OnChainTxResult, ScenarioDefinition } from '../../types';
import { Sparkles, MessageSquare, X } from '../Icons';

interface CatCompanionWidgetProps {
  onOpenTutorial: () => void;
  isRunning: boolean;
  onChainTx: OnChainTxResult | null;
  scenario: ScenarioDefinition;
}

export const CatCompanionWidget: React.FC<CatCompanionWidgetProps> = ({
  onOpenTutorial,
  isRunning,
  onChainTx,
  scenario
}) => {
  const [expression, setExpression] = useState<CatExpression>('happy');
  const [speechBubble, setSpeechBubble] = useState<string | null>(
    "Psst! Click me if you want me to explain what's going on! 🐾"
  );
  const [isBubbleDismissed, setIsBubbleDismissed] = useState<boolean>(false);

  // React to execution states
  useEffect(() => {
    if (isRunning) {
      setExpression('detective');
      setSpeechBubble('Sniffing the agent’s digital diary... checking every node! 🕵️');
      setIsBubbleDismissed(false);
      sound.playCatMeow();
    } else if (onChainTx) {
      if (onChainTx.status === 'REVERTED') {
        setExpression('shocked');
        setSpeechBubble(
          `HISS! The smart contract caught an anomaly: "${onChainTx.revertMessage || 'Security halt'}". $0 lost! 🛑`
        );
        setIsBubbleDismissed(false);
        sound.playAlert();
      } else {
        setExpression('proud');
        setSpeechBubble('PURRR! Flawless reasoning! Merkle proof verified on-chain! 🌟');
        setIsBubbleDismissed(false);
        sound.playSuccess();
      }
    }
  }, [isRunning, onChainTx]);

  const handleCatClick = () => {
    sound.playCatMeow();
    onOpenTutorial();
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-end gap-3 select-none pointer-events-none">
      {/* Speech Bubble */}
      {speechBubble && !isBubbleDismissed && (
        <div className="pointer-events-auto max-w-xs p-3.5 rounded-2xl bg-dark-900/95 border-2 border-cyber-cyan/50 text-slate-200 text-xs shadow-xl shadow-cyber-cyan/10 backdrop-blur-md relative animate-fadeIn">
          {/* Comic Pointer Triangle */}
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-dark-900 border-r-2 border-b-2 border-cyber-cyan/50 transform rotate-45"></div>

          <div className="flex items-start justify-between gap-2">
            <p className="font-sans leading-relaxed text-slate-100">
              {speechBubble}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsBubbleDismissed(true);
              }}
              className="text-slate-500 hover:text-slate-300 p-0.5"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2 pt-1.5 border-t border-dark-800 flex items-center justify-between text-[10px] font-mono text-cyber-cyan">
            <span>Inspector Whiskers</span>
            <button
              onClick={handleCatClick}
              className="underline hover:text-white font-bold"
            >
              Start Tour ▶
            </button>
          </div>
        </div>
      )}

      {/* Floating Cat Character Avatar */}
      <button
        onClick={handleCatClick}
        className="pointer-events-auto group relative flex flex-col items-center p-2 rounded-2xl bg-dark-900/90 hover:bg-dark-850 border-2 border-cyber-cyan/40 hover:border-cyber-cyan hover:shadow-neon-cyan/40 shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
        title="Click Inspector Whiskers for Guided Tour!"
      >
        <PixelCatSprite expression={expression} size={54} animate={true} />
        
        {/* Cute Nameplate Badge */}
        <span className="mt-1 px-2 py-0.5 rounded-md bg-dark-950 border border-cyber-cyan/40 text-[9px] font-mono text-cyber-cyan font-bold tracking-wider group-hover:bg-cyber-cyan group-hover:text-dark-950 transition-colors">
          🐾 GUIDE ME
        </span>
      </button>
    </div>
  );
};
