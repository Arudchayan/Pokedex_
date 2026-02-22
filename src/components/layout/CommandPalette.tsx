import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useModalStore } from '../../store/useModalStore';
import { usePokemonStore } from '../../store/usePokemonStore';
import { AppController } from '../../app/useAppController';
import { twMerge } from 'tailwind-merge';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  controller: AppController;
}

type CommandItem = {
  id: string;
  label: string;
  category: 'Navigation' | 'Action' | 'Calculator' | 'Data' | 'Pokemon';
  shortcut?: string;
  icon?: React.ReactNode;
  action: () => void;
  keywords?: string[];
};

export default function CommandPalette({ isOpen, onClose, controller }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { theme, isCyberpunk, handleRandomPokemon, handleFocusSearch, handleToggleShiny, handleSelectPokemon } = controller;
  const modalStore = useModalStore();
  const masterPokemonList = usePokemonStore((state) => state.masterPokemonList);

  const commands: CommandItem[] = useMemo(() => [
    // Actions
    {
      id: 'search',
      label: 'Search Pokemon',
      category: 'Action',
      shortcut: '/',
      action: () => { handleFocusSearch(); onClose(); },
      icon: <SearchIcon />,
      keywords: ['find', 'lookup']
    },
    {
        id: 'random',
        label: 'Random Pokemon',
        category: 'Action',
        shortcut: 'Shift+R',
        action: () => { handleRandomPokemon(); onClose(); },
        icon: <RandomIcon />,
        keywords: ['roulette', 'surprise']
    },
    {
        id: 'shiny',
        label: 'Toggle Shiny Mode',
        category: 'Action',
        shortcut: 'Shift+S',
        action: () => { handleToggleShiny(); onClose(); },
        icon: <SparklesIcon />,
        keywords: ['color', 'variant']
    },
    {
        id: 'theme',
        label: 'Toggle Theme',
        category: 'Action',
        shortcut: 'Shift+T',
        action: () => { usePokemonStore.getState().toggleTheme(); onClose(); },
        icon: <ThemeIcon />,
        keywords: ['dark', 'light', 'mode']
    },

    // Navigation
    { id: 'move-dex', label: 'Move Dex', category: 'Navigation', action: () => { modalStore.openMoveDex(); onClose(); }, icon: <BookIcon /> },
    { id: 'ability-dex', label: 'Ability Dex', category: 'Navigation', action: () => { modalStore.openAbilityDex(); onClose(); }, icon: <BookIcon /> },
    { id: 'item-dex', label: 'Item Dex', category: 'Navigation', action: () => { modalStore.openItemDex(); onClose(); }, icon: <BackpackIcon /> },

    // Calculators
    { id: 'battle-calc', label: 'Damage Calculator', category: 'Calculator', action: () => { modalStore.openBattleCalc(); onClose(); }, icon: <CalculatorIcon /> },
    { id: 'catch-calc', label: 'Catch Calculator', category: 'Calculator', action: () => { modalStore.openCatchCalc(); onClose(); }, icon: <CalculatorIcon /> },
    { id: 'breeding-calc', label: 'Breeding Calculator', category: 'Calculator', action: () => { modalStore.openBreedingCalc(); onClose(); }, icon: <HeartIcon /> },
    { id: 'stat-calc', label: 'Stat Calculator', category: 'Calculator', action: () => { modalStore.openStatCalc(); onClose(); }, icon: <ChartIcon /> },
    { id: 'shiny-calc', label: 'Shiny Odds Calculator', category: 'Calculator', action: () => { modalStore.openShinyCalc(); onClose(); }, icon: <SparklesIcon /> },

    // Charts & Data
    { id: 'type-chart', label: 'Type Chart', category: 'Data', action: () => { modalStore.openTypeChart(); onClose(); }, icon: <GridIcon /> },
    { id: 'nature-chart', label: 'Nature Chart', category: 'Data', action: () => { modalStore.openNatureChart(); onClose(); }, icon: <ListIcon /> },
    { id: 'game-hub', label: 'Game Hub', category: 'Data', action: () => { modalStore.openGameHub(); onClose(); }, icon: <GameIcon /> },
    { id: 'achievements', label: 'Achievements', category: 'Data', action: () => { modalStore.openAchievements(); onClose(); }, icon: <TrophyIcon /> },
    { id: 'walkers', label: 'Pokemon Walkers', category: 'Data', action: () => { modalStore.openWalkersSettings(); onClose(); }, icon: <UserIcon /> },
    { id: 'data', label: 'Data Management', category: 'Data', action: () => { modalStore.openDataManagement(); onClose(); }, icon: <DatabaseIcon /> },

  ], [modalStore, handleFocusSearch, handleRandomPokemon, handleToggleShiny]);

  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    const lowerQuery = query.toLowerCase();

    // 1. Filter existing commands
    const matchingCommands = commands.filter(cmd =>
      cmd.label.toLowerCase().includes(lowerQuery) ||
      cmd.category.toLowerCase().includes(lowerQuery) ||
      cmd.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
    );

    // 2. Search Pokemon if query is at least 2 chars
    let matchingPokemon: CommandItem[] = [];
    if (lowerQuery.length >= 2) {
        matchingPokemon = masterPokemonList
            .filter(p => (p.nameLower || p.name.toLowerCase()).includes(lowerQuery))
            .slice(0, 5) // Limit to top 5
            .map(p => ({
                id: `pokemon-${p.id}`,
                label: p.name,
                category: 'Pokemon',
                icon: <img src={p.imageUrl} alt={p.name} className="w-6 h-6 object-contain" />,
                action: () => {
                    handleSelectPokemon(p.id);
                    onClose();
                }
            }));
    }

    return [...matchingCommands, ...matchingPokemon];
  }, [query, commands, masterPokemonList, handleSelectPokemon, onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Wait for mount
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      scrollIntoView((selectedIndex + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      scrollIntoView((selectedIndex - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const scrollIntoView = (index: number) => {
    const element = listRef.current?.children[index] as HTMLElement;
    element?.scrollIntoView({ block: 'nearest' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center pt-[15vh] px-4" onClick={onClose}>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />

        <div
            className={twMerge(
                "relative w-full max-w-xl overflow-hidden rounded-xl shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200",
                theme === 'dark' ? "bg-slate-900 border border-slate-700" : "bg-white border border-slate-200",
                isCyberpunk && "cyber-panel border-primary-500/50 shadow-primary-500/20"
            )}
            onClick={e => e.stopPropagation()}
        >
            <div className={twMerge(
                "flex items-center px-4 py-3 border-b",
                theme === 'dark' ? "border-slate-800" : "border-slate-100"
            )}>
                <SearchIcon className={twMerge("w-5 h-5 mr-3", theme === 'dark' ? "text-slate-500" : "text-slate-400")} />
                <input
                    ref={inputRef}
                    type="text"
                    className={twMerge(
                        "flex-1 bg-transparent border-none outline-none text-lg placeholder-slate-500",
                        theme === 'dark' ? "text-white" : "text-slate-900",
                        isCyberpunk && "cyber-text"
                    )}
                    placeholder="Type a command or search..."
                    value={query}
                    onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                    onKeyDown={handleKeyDown}
                />
                <div className={twMerge("text-xs px-2 py-1 rounded border font-mono hidden sm:block", theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500")}>
                    ESC
                </div>
            </div>

            <ul ref={listRef} className="max-h-[50vh] overflow-y-auto py-2 scroll-py-2">
                {filteredCommands.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-500">
                        No commands found.
                    </div>
                ) : (
                    filteredCommands.map((command, index) => (
                        <li
                            key={command.id}
                            className={twMerge(
                                "mx-2 px-4 py-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors scroll-my-2",
                                index === selectedIndex
                                    ? (theme === 'dark' ? "bg-primary-600/20 text-primary-200" : "bg-primary-50 text-primary-700")
                                    : (theme === 'dark' ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50")
                            )}
                            onClick={() => command.action()}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div className="flex items-center gap-3">
                                <span className={twMerge(
                                    "p-1.5 rounded-md",
                                    index === selectedIndex
                                        ? (theme === 'dark' ? "bg-primary-500/20 text-primary-300" : "bg-primary-100 text-primary-600")
                                        : (theme === 'dark' ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400")
                                )}>
                                    {command.icon}
                                </span>
                                <div>
                                    <div className="font-medium">{command.label}</div>
                                    <div className={twMerge("text-xs opacity-60", index === selectedIndex ? "text-primary-400" : "text-slate-500")}>
                                        {command.category}
                                    </div>
                                </div>
                            </div>
                            {command.shortcut && (
                                <span className={twMerge(
                                    "text-xs font-mono px-1.5 py-0.5 rounded border opacity-60",
                                    theme === 'dark' ? "border-slate-600 bg-slate-800" : "border-slate-300 bg-slate-100"
                                )}>
                                    {command.shortcut}
                                </span>
                            )}
                        </li>
                    ))
                )}
            </ul>

            <div className={twMerge(
                "px-4 py-2 border-t text-xs flex justify-between",
                theme === 'dark' ? "border-slate-800 text-slate-500" : "border-slate-100 text-slate-400"
            )}>
                <div className="flex gap-4">
                    <span>
                        <strong className="font-medium">↑↓</strong> to navigate
                    </span>
                    <span>
                        <strong className="font-medium">↵</strong> to select
                    </span>
                </div>
                {isCyberpunk && <span className="cyber-text-pink text-[10px] tracking-widest uppercase">System Ready</span>}
            </div>
        </div>
    </div>
  );
}

// Icon Components
function SearchIcon(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> }
function ThemeIcon(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> }
function SparklesIcon(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> }
function RandomIcon(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> }
function BookIcon(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> }
function BackpackIcon(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> }
function CalculatorIcon(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> }
function HeartIcon(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> }
function ChartIcon(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> }
function GridIcon(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> }
function ListIcon(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> }
function GameIcon(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function TrophyIcon(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> }
function UserIcon(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> }
function DatabaseIcon(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg> }
