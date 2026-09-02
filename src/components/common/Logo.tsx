import React from 'react';

export interface LogoProps {
  /**
   * Optional variant:
   * - 'default': The unmodified official image logo
   * - 'boxed': The official logo placed inside a clean white card for high-contrast on dark backgrounds
   */
  variant?: 'default' | 'boxed' | 'horizontal' | 'stacked' | 'icon';
  /**
   * Optional custom CSS classes for sizing or positioning
   */
  className?: string;
  /**
   * Optional explicit height (e.g. 56 or '3.5rem')
   */
  height?: number | string;
  /**
   * Optional theme parameter
   */
  theme?: 'light' | 'dark';
}

/**
 * Official Logo of Asociación Cultural Gastronómica Doña Berenjena - Bolaños
 * Uses the exact, official graphic asset without text or design alterations.
 */
export const Logo: React.FC<LogoProps> = ({
  variant = 'default',
  className = '',
  height,
}) => {
  // If boxed on dark backgrounds (e.g., Footer), wrap the exact image in a clean white rounded card
  if (variant === 'boxed') {
    return (
      <div className={`inline-flex items-center justify-center bg-white px-3 py-2 rounded-2xl border border-[#EDE4D7] shadow-sm select-none ${className}`}>
        <img
          src="/logo.svg"
          alt="Asociación Cultural Gastronómica Doña Berenjena - Bolaños"
          className="h-12 sm:h-14 w-auto object-contain shrink-0"
          style={height ? { height } : undefined}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Direct, unmodified official image logo
  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/logo.svg"
        alt="Asociación Cultural Gastronómica Doña Berenjena - Bolaños"
        className="h-12 sm:h-14 md:h-15 w-auto object-contain shrink-0 transition-transform duration-200 hover:scale-[1.02]"
        style={height ? { height } : undefined}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
