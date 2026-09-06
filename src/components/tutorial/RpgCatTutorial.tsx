import React, { useState, useEffect, useRef } from 'react';
import { PixelCatSprite } from './PixelCatSprite';
import { TUTORIAL_STEPS, TutorialStep } from './tutorialSteps';
import { sound } from '../../utils/audio';
import { Sparkles, X, ChevronRight, ChevronLeft, Volume2, VolumeX, Lightbulb } from '../Icons';

interface RpgCatTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onTabChange?: (tab: any) => void;
}

export const RpgCatTutorial: React.FC<RpgCatTutorialProps> = ({
  isOpen,
  onClose,
  onTabChange
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [displayedTextIndex, setDisplayedTextIndex] = useState<number>(0);
  const [typedChars, setTypedChars] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const step: TutorialStep = TUTORIAL_STEPS[currentStepIndex] || TUTORIAL_STEPS[0];
  const fullText = step.dialogue[displayedTextIndex] || step.dialogue[0];

  // Switch tabs if step requires it
  useEffect(() => {
    if (isOpen && step.targetTab && onTabChange) {
      onTabChange(step.targetTab);
    }
  }, [currentStepIndex, isOpen]);

  // Play cat meow on step transition
  useEffect(() => {
    if (isOpen) {
      sound.playCatMeow();
    }
  }, [currentStepIndex, isOpen]);

  // Target element bounding rectangle & scroll into view
  useEffect(() => {
    if (!isOpen) return;

    const updateRect = () => {
      if (step.targetSelector) {
        const el = document.querySelector(step.targetSelector);
        if (el) {
          const rect = el.getBoundingClientRect();
          setHighlightRect(rect);
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      setHighlightRect(null);
    };

    // Initial check + slight delay for tab animation / layout
    updateRect();
    const timer = setTimeout(updateRect, 300);

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [currentStepIndex, isOpen, step.targetSelector]);

  // Typewriter effect for RPG dialogue
  useEffect(() => {
    if (!isOpen) return;

    setTypedChars('');
    setIsTyping(true);

    let charIdx = 0;
    const interval = setInterval(() => {
      if (charIdx < fullText.length) {
        charIdx++;
        setTypedChars(fullText.slice(0, charIdx));

        // Gentle text blip every 2 characters
        if (charIdx % 2 === 0) {
          sound.playDialogueBlip();
        }
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [currentStepIndex, displayedTextIndex, fullText, isOpen]);

  // Keyboard navigation (Arrow keys, Enter, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, displayedTextIndex, isTyping]);

  if (!isOpen) return null;

  const handleNext = () => {
    sound.playClick();

    // If still typing, fast-forward to full text
    if (isTyping) {
      setTypedChars(fullText);
      setIsTyping(false);
      return;
    }

    // If there are more dialogue lines in the current step
    if (displayedTextIndex < step.dialogue.length - 1) {
      setDisplayedTextIndex(prev => prev + 1);
      return;
    }

    // If there are more steps
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setDisplayedTextIndex(0);
    } else {
      // Completed tutorial!
      sound.playQuestComplete();
      handleClose();
    }
  };

  const handlePrev = () => {
    sound.playClick();
    if (displayedTextIndex > 0) {
      setDisplayedTextIndex(prev => prev - 1);
    } else if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      const prevStep = TUTORIAL_STEPS[currentStepIndex - 1];
      setDisplayedTextIndex(prevStep ? prevStep.dialogue.length - 1 : 0);
    }
  };

  const handleClose = () => {
    sound.playClick();
    onClose();
  };

  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1 && displayedTextIndex === step.dialogue.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden font-sans select-none">
      {/* 1. Backdrop SVG Overlay with Cutout Spotlight */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300">
        <defs>
          <mask id="tutorial-spotlight-mask">
            {/* White covers everything (opaque mask) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cutout reveals the element underneath */}
            {highlightRect && (
              <rect
                x={highlightRect.left - 8}
                y={highlightRect.top - 8}
                width={highlightRect.width + 16}
                height={highlightRect.height + 16}
                rx="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Dark translucent backdrop */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(4, 6, 10, 0.85)"
          mask="url(#tutorial-spotlight-mask)"
        />
      </svg>

      {/* 2. Glowing Target Spotlight Frame */}
      {highlightRect && (
        <div
          className="absolute pointer-events-none border-2 border-cyber-cyan rounded-2xl shadow-neon-cyan/40 shadow-2xl transition-all duration-300 animate-pulse-glow"
          style={{
            left: `${highlightRect.left - 8}px`,
            top: `${highlightRect.top - 8}px`,
            width: `${highlightRect.width + 16}px`,
            height: `${highlightRect.height + 16}px`
          }}
        >
          {/* Pixel Corner Accents */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-cyber-cyan"></div>
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-cyber-cyan"></div>
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-cyber-cyan"></div>
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-cyber-cyan"></div>
        </div>
      )}

      {/* 3. Top Floating Banner (Quest Step Tracker & Close Button) */}
      <div className="relative z-10 w-full max-w-4xl mx-auto pt-4 px-4 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-900/90 border border-cyber-cyan/40 backdrop-blur-md text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-ping"></span>
          <span className="text-cyber-cyan font-bold">QUEST TUTORIAL:</span>
          <span className="text-white font-semibold">
            {step.title}
          </span>
          <span className="text-slate-400">({currentStepIndex + 1}/{TUTORIAL_STEPS.length})</span>
        </div>

        <button
          onClick={handleClose}
          className="p-2 rounded-xl bg-dark-900/90 hover:bg-dark-800 border border-dark-700 hover:border-cyber-crimson/50 text-slate-400 hover:text-cyber-crimson transition-all"
          title="Skip Tutorial (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1"></div>

      {/* 4. The 16-Bit RPG Dialogue Box (Bottom Anchored) */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 pb-6 pointer-events-auto">
        <div className="relative rounded-2xl bg-gradient-to-b from-dark-900 via-dark-950 to-dark-950 border-2 border-cyber-cyan/60 p-5 shadow-2xl shadow-cyber-cyan/10 backdrop-blur-xl">
          
          {/* Pixelated Gold Border Corners (RPG Style) */}
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-amber-400 border border-amber-200"></div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 border border-amber-200"></div>
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-amber-400 border border-amber-200"></div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-400 border border-amber-200"></div>

          {/* Dialogue Header with Cat Name Tag */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-dark-750">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan font-mono font-bold text-xs uppercase tracking-wider">
                🐾 Inspector Whiskers
              </span>
              <span className="text-xs text-slate-400 font-sans italic">
                {step.subtitle}
              </span>
            </div>

            {/* Step Indicator Dots */}
            <div className="flex items-center gap-1.5">
              {TUTORIAL_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? 'w-5 bg-cyber-cyan'
                      : idx < currentStepIndex
                        ? 'w-2 bg-cyber-cyan/40'
                        : 'w-1.5 bg-dark-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Main Body: Pixel Cat Avatar + Animated Dialogue Text */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            
            {/* Left: Pixel Art Cat Sprite in an RPG Portrait Box */}
            <div className="shrink-0 p-2 rounded-xl bg-dark-850 border-2 border-dark-700 shadow-inner flex flex-col items-center">
              <PixelCatSprite expression={step.expression} size={88} />
              <span className="mt-1 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                [{step.expression}]
              </span>
            </div>

            {/* Right: Dialogue Text & Pro-Tip */}
            <div className="flex-1 space-y-3 min-h-[90px] flex flex-col justify-between">
              <div>
                <p className="text-slate-100 text-sm sm:text-base leading-relaxed font-sans font-medium">
                  {typedChars}
                  {isTyping && (
                    <span className="inline-block w-2 h-4 bg-cyber-cyan ml-1 animate-pulse" />
                  )}
                </p>
              </div>

              {/* Pro-Tip Box */}
              {!isTyping && (
                <div className="p-2.5 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center gap-2 text-xs text-cyber-cyan animate-fadeIn">
                  <Lightbulb className="w-4 h-4 shrink-0 text-amber-400" />
                  <span className="font-sans">
                    <strong className="font-semibold text-white">Cat Tip: </strong>
                    {step.proTip}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Dialogue Footer Controls */}
          <div className="mt-4 pt-3 border-t border-dark-750 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="text-slate-400 flex items-center gap-2">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-dark-800 border border-dark-700 text-slate-200">Enter ↵</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-dark-800 border border-dark-700 text-slate-200">→</kbd></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentStepIndex === 0 && displayedTextIndex === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 disabled:opacity-30 disabled:hover:bg-dark-800 border border-dark-700 text-slate-300 hover:text-white transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyber-cyan to-cyber-emerald hover:brightness-110 text-dark-950 font-bold transition-all shadow-neon-cyan/20 shadow-md"
              >
                <span>{isLastStep ? '🎉 Start Exploring!' : isTyping ? 'Fast-Forward ⏩' : 'Next ▶'}</span>
                {!isLastStep && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
