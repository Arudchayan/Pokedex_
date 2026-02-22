import React, { useState, useRef, memo } from 'react';
import { usePokemonUI } from '../../context/PokemonContext';
import { usePokemonStore } from '../../store/usePokemonStore';
import { ACCENT_COLORS, AccentColor } from '../../constants';
import { playUISound } from '../../services/soundService';
import { useClickOutside } from '../../hooks/useClickOutside';

// Pokemon-themed digital color categories
const DIGITAL_COLORS: AccentColor[] = ['neonPink', 'neonCyan', 'neonYellow', 'neonGreen', 'neonOrange', 'neonPurple'];
const CLASSIC_COLORS: AccentColor[] = ['cyan', 'emerald', 'violet', 'amber', 'rose', 'blue'];

const ThemeSelector: React.FC = () => {
  const { theme, accent, isCyberpunk } = usePokemonUI();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'digital' | 'classic'>('classic');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    playUISound('click');
  };

  const setAccent = (color: AccentColor, e: React.MouseEvent) => {
    e.stopPropagation();
    usePokemonStore.getState().setAccent(color);
    playUISound('success');
  };

  const setTheme = (mode: 'light' | 'dark', e: React.MouseEvent) => {
    e.stopPropagation();
    usePokemonStore.getState().setTheme(mode);
    playUISound('click');
  };

  const getColorStyle = (colorKey: AccentColor) => {
    const colorData = ACCENT_COLORS[colorKey];
    return `rgb(${colorData[500]})`;
  };

  const getColorLabel = (colorKey: AccentColor): string => {
    const labels: Record<AccentColor, string> = {
      cyan: 'Cyan',
      emerald: 'Emerald',
      violet: 'Violet',
      amber: 'Amber',
      rose: 'Rose',
      blue: 'Blue',
      neonPink: 'Porygon-Z',
      neonCyan: 'Rotom',
      neonYellow: 'Electivire',
      neonGreen: 'Genesect',
      neonOrange: 'Magmortar',
      neonPurple: 'Mewtwo'
    };
    return labels[colorKey];
  };

  // Normal/Default Theme Selector (non-cyberpunk)
  if (!isCyberpunk) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={toggleOpen}
          className={`p-2 rounded-lg border transition-all hover:scale-105 flex items-center gap-2 ${
            theme === 'dark'
              ? 'bg-slate-800 border-slate-700 text-primary-300 hover:bg-slate-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          title="Customize Theme"
          aria-label="Customize theme settings"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <div className="w-5 h-5 rounded-full border border-white/20 shadow-sm bg-primary-500" />
          <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Theme</span>
        </button>

        {isOpen && (
          <div className={`absolute top-full mt-2 right-0 w-64 rounded-xl shadow-2xl border p-4 z-50 flex flex-col gap-4 origin-top-right transition-all duration-200 ease-out transform scale-100 opacity-100 ${
            theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
          }`}>
            {/* Theme Mode */}
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Display Mode</h3>
              <div className="flex gap-2 bg-black/5 p-1 rounded-lg">
                <button
                  onClick={(e) => setTheme('light', e)}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${theme === 'light' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:bg-white/50'}`}
                >
                  Light
                </button>
                <button
                  onClick={(e) => setTheme('dark', e)}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${theme === 'dark' ? 'bg-slate-700 shadow text-white' : 'text-slate-500 hover:bg-slate-700/50'}`}
                >
                  Dark
                </button>
              </div>
            </div>

            {/* Accent Colors */}
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Accent Color</h3>
              
              {/* Tab switcher */}
              <div className={`flex rounded-lg overflow-hidden border mb-3 ${theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-slate-50'}`}>
                <button
                  onClick={() => setActiveTab('classic')}
                  className={`flex-1 py-1.5 px-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    activeTab === 'classic'
                      ? theme === 'dark' ? 'bg-white/10 text-white' : 'bg-white text-slate-900 shadow'
                      : theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Classic
                </button>
                <button
                  onClick={() => setActiveTab('digital')}
                  className={`flex-1 py-1.5 px-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    activeTab === 'digital'
                      ? theme === 'dark' ? 'bg-white/10 text-white' : 'bg-white text-slate-900 shadow'
                      : theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Digital Pokemon
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(activeTab === 'digital' ? DIGITAL_COLORS : CLASSIC_COLORS).map((colorKey) => {
                  const colorData = ACCENT_COLORS[colorKey];
                  const bgStyle = `rgb(${colorData[500]})`;

                  return (
                    <button
                      key={colorKey}
                      onClick={(e) => setAccent(colorKey, e)}
                      className={`group relative h-10 rounded-lg border transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        theme === 'dark' ? 'focus:ring-offset-slate-900 border-white/10' : 'focus:ring-offset-white border-black/5'
                      } ${accent === colorKey ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
                      style={{ backgroundColor: bgStyle }}
                      title={getColorLabel(colorKey)}
                      aria-label={`Select ${getColorLabel(colorKey)} accent color`}
                      aria-pressed={accent === colorKey}
                    >
                      {accent === colorKey && (
                        <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {activeTab === 'digital' && (
                <p className={`text-[10px] mt-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Digital Pokemon mode activates a futuristic Porygon-inspired theme!
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Cyberpunk/Digital Pokemon Theme Selector (when neon color is active)
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button - Digital Pokemon Style */}
      <button
        onClick={toggleOpen}
        className="group relative p-2.5 rounded-lg border-2 transition-all duration-300 flex items-center gap-2.5 overflow-hidden bg-black/80 hover:bg-black/90 border-primary-500/60 hover:border-primary-400 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        style={{
          boxShadow: `0 0 8px rgba(var(--color-primary-500), 0.6), 0 0 16px rgba(var(--color-primary-500), 0.4)`
        }}
        title="Customize Theme"
        aria-label="Customize theme settings"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {/* Porygon-style geometric pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: 'linear-gradient(45deg, transparent 45%, currentColor 45%, currentColor 55%, transparent 55%)',
            backgroundSize: '8px 8px'
          }} />
        </div>
        
        {/* Animated Pokeball-style orb */}
        <div 
          className="relative w-5 h-5 rounded-full transition-all duration-300 border-2 border-white/30"
          style={{ 
            backgroundColor: getColorStyle(accent),
            boxShadow: `0 0 10px ${getColorStyle(accent)}, 0 0 20px ${getColorStyle(accent)}`
          }}
        >
          {/* Pokeball line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/40 -translate-y-1/2" />
        </div>
        
        <span className="hidden sm:inline text-xs font-black uppercase tracking-[0.15em] text-primary-400"
          style={{ textShadow: `0 0 10px ${getColorStyle(accent)}` }}
        >
          Config
        </span>

        {/* Corner pixels (Porygon-style) */}
        <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-primary-400" />
        <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-primary-400" />
        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-primary-400" />
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-primary-400" />
      </button>

      {/* Dropdown Panel - Digital Pokemon Aesthetic */}
      {isOpen && (
        <div 
          className="absolute top-full mt-3 right-0 w-80 rounded-xl overflow-hidden z-50 flex flex-col origin-top-right"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 5, 40, 0.95) 50%, rgba(0, 0, 0, 0.95) 100%)',
            boxShadow: `0 0 30px rgba(var(--color-primary-500), 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
            border: `2px solid rgba(var(--color-primary-500), 0.5)`
          }}
        >
          {/* Header - Pokedex style */}
          <div className="relative px-4 py-3 border-b border-primary-500/30 bg-black/50">
            <div className="flex items-center gap-3">
              {/* Pokedex-style indicator lights */}
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse shadow-lg shadow-blue-400/50" />
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary-400"
                style={{ textShadow: `0 0 10px rgba(var(--color-primary-500), 0.8)` }}
              >
                PC System
              </h2>
              {/* Porygon icon */}
              <div className="ml-auto text-primary-300 opacity-60">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
          </div>

          <div className="p-4 space-y-5">
            {/* Mode Toggle */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-primary-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary-400" />
                Display Mode
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={(e) => setTheme('light', e)}
                  className={`relative py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 border ${
                    theme === 'light' 
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/60' 
                      : 'bg-black/30 text-slate-400 border-slate-700/50 hover:border-yellow-400/30'
                  }`}
                  style={theme === 'light' ? { boxShadow: '0 0 15px rgba(250, 204, 21, 0.3)' } : {}}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Day
                  </span>
                </button>
                
                <button
                  onClick={(e) => setTheme('dark', e)}
                  className={`relative py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 border ${
                    theme === 'dark' 
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/60' 
                      : 'bg-black/30 text-slate-400 border-slate-700/50 hover:border-indigo-400/30'
                  }`}
                  style={theme === 'dark' ? { boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)' } : {}}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    Night
                  </span>
                </button>
              </div>
            </div>

            {/* Color Palette Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-primary-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary-400" />
                Digital Pokemon Theme
              </h3>

              {/* Tab switcher */}
              <div className="flex rounded-lg overflow-hidden border border-slate-700/50 bg-black/30">
                <button
                  onClick={() => setActiveTab('digital')}
                  className={`flex-1 py-2 px-3 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    activeTab === 'digital'
                      ? 'bg-primary-500/20 text-primary-300 border-b-2 border-primary-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Digital
                </button>
                <button
                  onClick={() => setActiveTab('classic')}
                  className={`flex-1 py-2 px-3 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    activeTab === 'classic'
                      ? 'bg-emerald-500/20 text-emerald-300 border-b-2 border-emerald-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Classic
                </button>
              </div>

              {/* Color Grid */}
              <div className="grid grid-cols-3 gap-3">
                {(activeTab === 'digital' ? DIGITAL_COLORS : CLASSIC_COLORS).map((colorKey) => {
                  const isSelected = accent === colorKey;
                  const bgStyle = getColorStyle(colorKey);
                  const isDigital = DIGITAL_COLORS.includes(colorKey);
                  
                  return (
                    <button
                      key={colorKey}
                      onClick={(e) => setAccent(colorKey, e)}
                      className={`group relative h-14 rounded-lg transition-all duration-300 flex flex-col items-center justify-center gap-1 hover:scale-110 focus:outline-none ${
                        isSelected ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-black/80 scale-105' : ''
                      }`}
                      style={{ 
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        border: `2px solid ${bgStyle}`,
                        boxShadow: isSelected 
                          ? `0 0 20px ${bgStyle}, 0 0 40px ${bgStyle}` 
                          : isDigital 
                            ? `0 0 10px ${bgStyle}40` 
                            : 'none'
                      }}
                      title={getColorLabel(colorKey)}
                      aria-label={`Select ${getColorLabel(colorKey)} theme`}
                      aria-pressed={isSelected}
                    >
                      {/* Pokeball-style orb */}
                      <div 
                        className="w-5 h-5 rounded-full transition-transform duration-300 group-hover:scale-125 border border-white/30"
                        style={{ 
                          backgroundColor: bgStyle,
                          boxShadow: isDigital ? `0 0 10px ${bgStyle}` : 'none'
                        }}
                      />
                      
                      <span 
                        className="text-[9px] font-bold uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity truncate max-w-full px-1"
                        style={{ color: bgStyle }}
                      >
                        {getColorLabel(colorKey).split('-')[0]}
                      </span>

                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black flex items-center justify-center border border-white/30">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Theme Indicator */}
            <div className="pt-3 border-t border-slate-700/30">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 uppercase tracking-wider">Active:</span>
                <span 
                  className="font-bold uppercase tracking-wider"
                  style={{ 
                    color: getColorStyle(accent),
                    textShadow: `0 0 10px ${getColorStyle(accent)}`
                  }}
                >
                  {getColorLabel(accent)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer - Porygon-style pixels */}
          <div className="h-2 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500 opacity-60" />
        </div>
      )}
    </div>
  );
};

export default memo(ThemeSelector);
