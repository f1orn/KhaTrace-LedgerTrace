import React from 'react';

export type CatExpression = 'happy' | 'detective' | 'shocked' | 'proud' | 'sleeping';

interface PixelCatSpriteProps {
  expression: CatExpression;
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * PixelCatSprite: Vector-crisp 16-bit RPG pixel-art cat detective ("Inspector Whiskers")
 * Rendered using SVG pixel-grid with shapeRendering="crispEdges" for authentic SNES/GBA look.
 */
export const PixelCatSprite: React.FC<PixelCatSpriteProps> = ({
  expression = 'happy',
  size = 96,
  className = '',
  animate = true
}) => {
  return (
    <div 
      className={`inline-block select-none relative ${animate ? 'animate-float' : ''} ${className}`}
      style={{ width: size, height: size }}
      title={`Inspector Whiskers (${expression})`}
    >
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        shapeRendering="crispEdges"
        className="w-full h-full drop-shadow-md"
      >
        {/* Palette:
            Fur Primary: #F59E0B (Amber Gold)
            Fur Shade:   #D97706 (Deep Amber)
            Fur Highlight: #FDE68A (Light Cream)
            Chest/Muzzle: #FFFBEB (Cream White)
            Ears Inside: #F43F5E (Pink)
            Eyes:        #00F0FF (Cyan glow) / #04060A (Pupil)
            Hat Main:    #3B82F6 (Cyber Blue Detective Cap)
            Hat Shade:   #1D4ED8
            Badge/Gold:  #FACC15
            Outlines:    #0F172A (Dark Slate)
        */}

        {/* --- BASE BODY & TAIL --- */}
        {/* Tail (Wagging curve) */}
        <rect x="25" y="20" width="3" height="2" fill="#D97706" />
        <rect x="27" y="17" width="2" height="3" fill="#F59E0B" />
        <rect x="26" y="15" width="2" height="2" fill="#FDE68A" />

        {/* Body Base */}
        <rect x="8" y="19" width="16" height="10" fill="#F59E0B" />
        <rect x="6" y="21" width="20" height="7" fill="#F59E0B" />
        {/* Body Outline Bottom & Sides */}
        <rect x="7" y="28" width="18" height="2" fill="#0F172A" />
        <rect x="5" y="22" width="2" height="6" fill="#0F172A" />
        <rect x="25" y="22" width="2" height="6" fill="#0F172A" />

        {/* White Chest & Paws */}
        <rect x="11" y="22" width="10" height="6" fill="#FFFBEB" />
        {/* Left Paw */}
        <rect x="9" y="27" width="4" height="2" fill="#FFFBEB" />
        {/* Right Paw */}
        {expression === 'happy' ? (
          // Waving Paw up!
          <>
            <rect x="23" y="18" width="3" height="3" fill="#FFFBEB" />
            <rect x="24" y="17" width="2" height="1" fill="#FFFBEB" />
            <rect x="23" y="17" width="1" height="1" fill="#0F172A" />
            <rect x="26" y="18" width="1" height="3" fill="#0F172A" />
          </>
        ) : expression === 'detective' ? (
          // Holding Magnifying Glass
          <>
            <rect x="20" y="22" width="3" height="3" fill="#FFFBEB" />
            {/* Magnifying Glass handle & rim */}
            <rect x="22" y="20" width="2" height="4" fill="#94A3B8" />
            <rect x="21" y="14" width="6" height="6" fill="#00F0FF" fillOpacity="0.4" />
            <rect x="22" y="13" width="4" height="1" fill="#FACC15" />
            <rect x="22" y="20" width="4" height="1" fill="#FACC15" />
            <rect x="21" y="14" width="1" height="6" fill="#FACC15" />
            <rect x="26" y="14" width="1" height="6" fill="#FACC15" />
            <rect x="23" y="15" width="2" height="2" fill="#FFFFFF" />
          </>
        ) : (
          <rect x="19" y="27" width="4" height="2" fill="#FFFBEB" />
        )}

        {/* --- HEAD BASE --- */}
        <rect x="6" y="9" width="20" height="11" fill="#F59E0B" />
        <rect x="5" y="11" width="22" height="8" fill="#F59E0B" />
        <rect x="4" y="13" width="24" height="4" fill="#F59E0B" />

        {/* Head Outline */}
        <rect x="4" y="12" width="1" height="6" fill="#0F172A" />
        <rect x="27" y="12" width="1" height="6" fill="#0F172A" />
        <rect x="5" y="10" width="1" height="2" fill="#0F172A" />
        <rect x="26" y="10" width="1" height="2" fill="#0F172A" />

        {/* Muzzle (White) */}
        <rect x="11" y="15" width="10" height="4" fill="#FFFBEB" />
        {/* Cute Pink Nose */}
        <rect x="15" y="15" width="2" height="1" fill="#F43F5E" />

        {/* Whiskers */}
        <rect x="3" y="15" width="3" height="1" fill="#0F172A" />
        <rect x="2" y="17" width="4" height="1" fill="#0F172A" />
        <rect x="26" y="15" width="3" height="1" fill="#0F172A" />
        <rect x="26" y="17" width="4" height="1" fill="#0F172A" />

        {/* --- EARS --- */}
        {expression === 'shocked' ? (
          // Flattened back ears (Alert/Hiss)
          <>
            <rect x="2" y="10" width="5" height="3" fill="#D97706" />
            <rect x="3" y="11" width="3" height="1" fill="#F43F5E" />
            <rect x="25" y="10" width="5" height="3" fill="#D97706" />
            <rect x="26" y="11" width="3" height="1" fill="#F43F5E" />
          </>
        ) : (
          // Upright pointy ears
          <>
            {/* Left Ear */}
            <rect x="6" y="6" width="4" height="4" fill="#F59E0B" />
            <rect x="7" y="4" width="2" height="3" fill="#F59E0B" />
            <rect x="7" y="6" width="2" height="3" fill="#F43F5E" />
            <rect x="5" y="6" width="1" height="4" fill="#0F172A" />
            <rect x="7" y="3" width="2" height="1" fill="#0F172A" />

            {/* Right Ear */}
            <rect x="22" y="6" width="4" height="4" fill="#F59E0B" />
            <rect x="23" y="4" width="2" height="3" fill="#F59E0B" />
            <rect x="23" y="6" width="2" height="3" fill="#F43F5E" />
            <rect x="26" y="6" width="1" height="4" fill="#0F172A" />
            <rect x="23" y="3" width="2" height="1" fill="#0F172A" />
          </>
        )}

        {/* --- DETECTIVE HAT (Sherlock / Cyber Cap) --- */}
        <rect x="10" y="5" width="12" height="4" fill="#1E3A8A" />
        <rect x="8" y="7" width="16" height="2" fill="#2563EB" />
        <rect x="7" y="8" width="18" height="1" fill="#3B82F6" />
        {/* Hat Badge (Glowing gold star) */}
        <rect x="15" y="6" width="2" height="2" fill="#FACC15" />
        <rect x="14" y="7" width="4" height="1" fill="#FACC15" />

        {/* --- EXPRESSIONS (Eyes & Mouth) --- */}
        {expression === 'happy' && (
          <>
            {/* Happy anime arch eyes ^ ^ */}
            <rect x="8" y="13" width="4" height="1" fill="#0F172A" />
            <rect x="7" y="14" width="2" height="1" fill="#0F172A" />
            <rect x="11" y="14" width="2" height="1" fill="#0F172A" />

            <rect x="19" y="13" width="4" height="1" fill="#0F172A" />
            <rect x="18" y="14" width="2" height="1" fill="#0F172A" />
            <rect x="22" y="14" width="2" height="1" fill="#0F172A" />

            {/* Cute :3 mouth */}
            <rect x="14" y="17" width="1" height="1" fill="#0F172A" />
            <rect x="17" y="17" width="1" height="1" fill="#0F172A" />
            <rect x="15" y="16" width="2" height="1" fill="#0F172A" />
          </>
        )}

        {expression === 'detective' && (
          <>
            {/* Left Eye: Focused Squint */}
            <rect x="8" y="13" width="4" height="2" fill="#0F172A" />
            <rect x="9" y="13" width="2" height="1" fill="#00F0FF" />

            {/* Right Eye: Big curious eye behind magnifying glass */}
            <rect x="19" y="12" width="4" height="4" fill="#00F0FF" />
            <rect x="20" y="13" width="2" height="2" fill="#0F172A" />
            <rect x="20" y="13" width="1" height="1" fill="#FFFFFF" />

            {/* Thoughtful mouth */}
            <rect x="15" y="17" width="2" height="1" fill="#0F172A" />
          </>
        )}

        {expression === 'shocked' && (
          <>
            {/* Floating Exclamation Mark */}
            <rect x="27" y="2" width="2" height="4" fill="#FF2E63" />
            <rect x="27" y="7" width="2" height="1" fill="#FF2E63" />

            {/* Huge shocked pupils */}
            <rect x="8" y="12" width="5" height="4" fill="#FFFFFF" />
            <rect x="10" y="13" width="2" height="2" fill="#0F172A" />
            <rect x="8" y="11" width="5" height="1" fill="#0F172A" />

            <rect x="18" y="12" width="5" height="4" fill="#FFFFFF" />
            <rect x="19" y="13" width="2" height="2" fill="#0F172A" />
            <rect x="18" y="11" width="5" height="1" fill="#0F172A" />

            {/* Open Gasped Mouth 'O' */}
            <rect x="14" y="16" width="4" height="3" fill="#0F172A" />
            <rect x="15" y="17" width="2" height="1" fill="#F43F5E" />
          </>
        )}

        {expression === 'proud' && (
          <>
            {/* Purring closed happy eyes */}
            <rect x="8" y="13" width="4" height="1" fill="#0F172A" />
            <rect x="9" y="14" width="2" height="1" fill="#0F172A" />
            <rect x="19" y="13" width="4" height="1" fill="#0F172A" />
            <rect x="20" y="14" width="2" height="1" fill="#0F172A" />

            {/* Rosy Cheeks */}
            <rect x="6" y="15" width="2" height="1" fill="#F43F5E" fillOpacity="0.8" />
            <rect x="24" y="15" width="2" height="1" fill="#F43F5E" fillOpacity="0.8" />

            {/* Heroic Medal pinned to chest */}
            <rect x="14" y="23" width="4" height="4" fill="#FACC15" />
            <rect x="15" y="24" width="2" height="2" fill="#3B82F6" />

            {/* Floating Sparkles */}
            <rect x="2" y="6" width="1" height="3" fill="#FACC15" />
            <rect x="1" y="7" width="3" height="1" fill="#FACC15" />
            <rect x="28" y="19" width="1" height="3" fill="#00F0FF" />
            <rect x="27" y="20" width="3" height="1" fill="#00F0FF" />
          </>
        )}

        {expression === 'sleeping' && (
          <>
            {/* Sleeping lines - - */}
            <rect x="8" y="14" width="4" height="1" fill="#0F172A" />
            <rect x="19" y="14" width="4" height="1" fill="#0F172A" />

            {/* Floating Zzz */}
            <text x="24" y="6" fill="#A855F7" fontSize="4" fontFamily="monospace" fontWeight="bold">Z</text>
            <text x="27" y="4" fill="#A855F7" fontSize="3" fontFamily="monospace">z</text>
          </>
        )}
      </svg>
    </div>
  );
};
