import React from 'react';

export interface LogoProps {
  /**
   * Optional variant:
   * - 'combined': Graphic emblem + crisp HTML typography "Doña Berenjena" + "Asociación Gastronómica" (best for navbars & responsive headers)
   * - 'default': The official full image logo
   * - 'boxed': The official logo placed inside a clean white card for high-contrast on dark backgrounds
   * - 'icon': The square 4-tile emblem only
   * - 'buttons': The 4 iconic buttons in horizontal alignment
   * - 'horizontal': Equivalent to combined
   */
  variant?: 'default' | 'combined' | 'boxed' | 'horizontal' | 'stacked' | 'icon' | 'buttons';
  /**
   * Whether to explicitly show the Doña Berenjena brand typography alongside the emblem
   */
  withText?: boolean;
  /**
   * Optional custom CSS classes for sizing or positioning
   */
  className?: string;
  /**
   * Optional explicit height (e.g. 48, 56 or '3rem')
   */
  height?: number | string;
  /**
   * Optional theme parameter: 'light' (dark text on light bg) or 'dark' (white text on dark bg)
   */
  theme?: 'light' | 'dark';
  /**
   * Optional custom subtitle override (default: 'Asociación Gastronómica')
   */
  subtitle?: string;
}

/**
 * Official Logo & Brand Lockup of Asociación Cultural Gastronómica Doña Berenjena - Bolaños
 * Provides crisp responsive display on both mobile and desktop screens.
 */
export const Logo: React.FC<LogoProps> = ({
  variant = 'combined',
  withText = true,
  className = '',
  height,
  theme = 'light',
  subtitle = 'Asociación Gastronómica'
}) => {
  const isDark = theme === 'dark';

  // 1. Boxed card wrapper (e.g. footer on dark backgrounds)
  if (variant === 'boxed') {
    return (
      <div className={`inline-flex items-center gap-3 bg-white px-3.5 py-2 rounded-2xl border border-[#EDE4D7] shadow-2xs select-none ${className}`}>
        <img
          src="/favicon.svg"
          alt="Emblema Doña Berenjena"
          className="h-10 w-10 sm:h-11 sm:w-11 object-contain shrink-0 rounded-xl"
          style={height ? { height, width: height } : undefined}
          referrerPolicy="no-referrer"
        />
        {withText && (
          <div className="flex flex-col justify-center text-left">
            <span className="text-base sm:text-lg font-bold font-serif text-[#290824] leading-tight tracking-tight">
              Doña Berenjena
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-[#842A76] tracking-wider uppercase font-sans">
              {subtitle}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 2. Icon only variant (2x2 grid buttons)
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <img
          src="/favicon.svg"
          alt="Doña Berenjena"
          className="h-10 w-10 sm:h-12 sm:w-12 object-contain shrink-0 rounded-xl transition-transform duration-200 hover:scale-105"
          style={height ? { height, width: height } : undefined}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // 3. 4 buttons horizontal variant
  if (variant === 'buttons') {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <img
          src="/emblem-buttons.svg"
          alt="Botones Gastronómicos Doña Berenjena"
          className="w-full max-w-full h-auto object-contain shrink-0 transition-transform duration-200 hover:scale-[1.02]"
          style={height ? { height } : undefined}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // 3. Combined / Horizontal: Emblem + crisp responsive Doña Berenjena typography
  if (variant === 'combined' || variant === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-2.5 sm:gap-3.5 select-none ${className}`}>
        {/* Emblem with 4 signature tiles */}
        <img
          src="/favicon.svg"
          alt="Emblema Doña Berenjena"
          className="h-9 w-9 sm:h-11 sm:w-11 md:h-12 md:w-12 object-contain shrink-0 rounded-xl drop-shadow-2xs transition-transform duration-200 group-hover:scale-105"
          style={height ? { height, width: height } : undefined}
          referrerPolicy="no-referrer"
        />

        {/* Crisp Brand Name & Subtitle */}
        {withText && (
          <div className="flex flex-col justify-center text-left">
            <span
              className={`text-base sm:text-lg md:text-xl font-bold font-serif leading-none tracking-tight transition-colors ${
                isDark ? 'text-white group-hover:text-[#EDE4D7]' : 'text-[#290824] group-hover:text-[#521849]'
              }`}
            >
              Doña Berenjena
            </span>
            <span
              className={`text-[9px] sm:text-[10px] md:text-[10.5px] font-bold tracking-wider uppercase font-sans mt-0.5 sm:mt-1 ${
                isDark ? 'text-[#DFD3C2]' : 'text-[#842A76]'
              }`}
            >
              {subtitle}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 4. Default official image logo
  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src="/logo.jpg"
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src.endsWith('/logo.jpg')) {
            target.src = '/logo.png';
          } else if (target.src.endsWith('/logo.png')) {
            target.src = '/logo.svg';
          }
        }}
        alt="Asociación Cultural Gastronómica Doña Berenjena - Bolaños"
        className="w-full max-w-full h-auto object-contain shrink-0 transition-transform duration-200 hover:scale-[1.01]"
        style={height ? { height } : undefined}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

