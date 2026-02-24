import type { TourDefinition } from '../context/WalkthroughContext';

// Helper to open a modal programmatically
const openModal = (modalId: string) => {
  const event = new CustomEvent('open-modal', { detail: { modalId } });
  window.dispatchEvent(event);
};

export const ALL_TOURS: TourDefinition[] = [
  // =============================================================================
  // TOUR 1: Welcome & Navigation
  // =============================================================================
  {
    id: 'welcome',
    name: 'Welcome & Navigation',
    description: 'Learn the basics: menu, search, themes, and quick access.',
    estimatedTimeMinutes: 3,
    icon: '👋',
    steps: [
      {
        id: 'welcome-intro',
        target: 'body',
        title: 'Welcome to Advanced Pokédex!',
        position: 'center',
        content: (
          <div className="space-y-3">
            <p>
              Your ultimate companion for exploring Pokémon, building competitive teams, and testing your knowledge.
            </p>
            <p>
              This tour will guide you through all the features. Let&apos;s start with the basics!
            </p>
            <div className="flex items-center gap-2 text-sm text-primary-500">
              <span>💡</span>
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">?</kbd> anytime for keyboard shortcuts</span>
            </div>
          </div>
        ),
        showPrevButton: false,
      },
      {
        id: 'header-menu',
        target: '[data-tour="header-menu"]',
        title: 'Main Menu',
        position: 'bottom',
        content: (
          <div className="space-y-2">
            <p>Click the hamburger menu to access all features:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Pokédex tools and calculators</li>
              <li>Games and challenges</li>
              <li>Reference data</li>
              <li>Settings and data management</li>
            </ul>
          </div>
        ),
        onBeforeStep: () => {
          // Ensure menu is visible
          const menu = document.querySelector('[data-tour="header-menu"]');
          menu?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        },
      },
      {
        id: 'search-bar',
        target: '[data-tour="search-bar"]',
        title: 'Quick Search',
        position: 'bottom',
        content: (
          <div className="space-y-2">
            <p>Search for Pokémon by name or ID instantly.</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <strong>Pro tip:</strong> Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">/</kbd> from anywhere to focus search instantly!
            </p>
          </div>
        ),
      },
      {
        id: 'command-palette',
        target: '[data-tour="command-palette-trigger"]',
        title: 'Command Palette',
        position: 'bottom',
        content: (
          <div className="space-y-3">
            <p>The fastest way to navigate! Access any feature in seconds.</p>
            <div
              className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-sm cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              onClick={() => {
                const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' });
                window.dispatchEvent(event);
              }}
            >
              <span className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-700 border">Ctrl K</kbd>
                <span>Try it now! (Click here)</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Search for features, Pokémon, or actions directly.
            </p>
          </div>
        ),
        allowInteraction: true,
      },
      {
        id: 'theme-toggle',
        target: '[data-tour="theme-toggle"]',
        title: 'Personalization',
        position: 'bottom',
        content: (
          <div className="space-y-2">
            <p>Switch between light, dark, and cyberpunk themes.</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <strong>Shortcut:</strong> Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">Shift T</kbd> to toggle anytime.
            </p>
          </div>
        ),
      },
    ],
  },

  // =============================================================================
  // TOUR 2: Browsing Pokémon
  // =============================================================================
  {
    id: 'browsing',
    name: 'Browsing Pokémon',
    description: 'Search, filter, and explore detailed Pokémon information.',
    estimatedTimeMinutes: 7,
    icon: '🔍',
    requiredTours: ['welcome'],
    steps: [
      {
        id: 'pokemon-grid',
        target: '[data-tour="pokemon-grid"]',
        title: 'Pokémon Grid',
        position: 'top',
        content: (
          <div className="space-y-2">
            <p>Browse all Pokémon in a beautiful grid layout.</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Hover cards for 3D tilt effects</li>
              <li>Click any Pokémon for detailed information</li>
              <li>Use grid/list view toggle for different layouts</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'filters',
        target: '[data-tour="filter-panel"]',
        title: 'Powerful Filters',
        position: 'right',
        content: (
          <div className="space-y-2">
            <p>Find exactly what you&apos;re looking for:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li><strong>Generation:</strong> Filter by Gen 1-9</li>
              <li><strong>Type:</strong> Single or dual-type filtering</li>
              <li><strong>Base Stat Total:</strong> Find powerful Pokémon</li>
              <li><strong>Flavor Text:</strong> Search Pokédex entries</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'view-toggle',
        target: '[data-tour="view-toggle"]',
        title: 'Grid vs List',
        position: 'bottom',
        content: (
          <p>Switch between immersive grid view with 3D cards, or compact list view for quick browsing.</p>
        ),
      },
      {
        id: 'pokemon-card',
        target: '[data-tour="pokemon-card"]',
        title: 'Click a Pokémon',
        position: 'top',
        content: (
          <div className="space-y-2">
            <p>Click any Pokémon card to open the detailed view.</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Go ahead and click one now to continue the tour!
            </p>
          </div>
        ),
        allowInteraction: true,
      },
      {
        id: 'detail-overview',
        target: '[data-tour="detail-overview"]',
        title: 'Overview Tab',
        position: 'left',
        content: (
          <div className="space-y-2">
            <p>See comprehensive information at a glance:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Base stats with visual bars</li>
              <li>Abilities with descriptions</li>
              <li>Type effectiveness summary</li>
              <li>Sprites (regular and shiny)</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'detail-moves',
        target: '[data-tour="detail-moves"]',
        title: 'Moves Tab',
        position: 'left',
        content: (
          <div className="space-y-2">
            <p>Explore complete move sets:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Moves by generation</li>
              <li>Level-up, TM, Egg, and tutor moves</li>
              <li>Filter and search moves</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'detail-evolution',
        target: '[data-tour="detail-evolution"]',
        title: 'Evolution Chain',
        position: 'left',
        content: (
          <div className="space-y-2">
            <p>View interactive evolution chains with conditions:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Level, item, and trade evolutions</li>
              <li>Branching evolutions</li>
              <li>Regional variants</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'detail-type-defense',
        target: '[data-tour="detail-type-defense"]',
        title: 'Type Defense',
        position: 'left',
        content: (
          <div className="space-y-2">
            <p>See how this Pokémon fares against all types:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li><span className="text-red-500">Red</span> - 2x+ weaknesses</li>
              <li><span className="text-green-500">Green</span> - 0.5x resistances</li>
              <li><span className="text-gray-500">Gray</span> - Immunities (0x)</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'detail-flavor-text',
        target: '[data-tour="detail-flavor-text"]',
        title: 'Pokédex Entry',
        position: 'left',
        content: (
          <div className="space-y-2">
            <p>Read the official Pokédex description for this Pokémon.</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              You can search Pokédex entries from the main filters too!
            </p>
          </div>
        ),
      },
      {
        id: 'detail-forms',
        target: '[data-tour="detail-forms"]',
        title: 'Forms & Variants',
        position: 'right',
        content: (
          <div className="space-y-2">
            <p>Switch between different forms:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Regional variants (Alolan, Galarian, etc.)</li>
              <li>Mega Evolutions</li>
              <li>Form changes (like Rotom, Deoxys)</li>
              <li>Each form has different stats and typing!</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'detail-shiny-toggle',
        target: '[data-tour="detail-shiny-toggle"]',
        title: 'Shiny Sprites',
        position: 'bottom',
        content: (
          <div className="space-y-2">
            <p>Toggle between regular and shiny color palettes.</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <strong>Shortcut:</strong> Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">Shift S</kbd> from anywhere!
            </p>
          </div>
        ),
      },
      {
        id: 'detail-sprite-gen',
        target: '[data-tour="detail-sprite-gen"]',
        title: 'Generation Sprites',
        position: 'top',
        content: (
          <div className="space-y-2">
            <p>View sprites from different generations:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Gen 1-8 sprites available</li>
              <li>See how sprite art evolved over time</li>
              <li>Includes shiny variants per generation</li>
            </ul>
          </div>
        ),
      },
    ],
  },

  // =============================================================================
  // TOUR 3: Team Builder
  // =============================================================================
  {
    id: 'team-builder',
    name: 'Team Builder',
    description: 'Build and analyze competitive teams with coverage tools.',
    estimatedTimeMinutes: 8,
    icon: '🛠️',
    requiredTours: ['browsing'],
    steps: [
      {
        id: 'team-sidebar',
        target: '[data-tour="team-sidebar"]',
        title: 'Your Team Sidebar',
        position: 'left',
        content: (
          <div className="space-y-2">
            <p>The Team Builder is always visible on the main view.</p>
            <p>Build a team of up to 6 Pokémon for competitive analysis.</p>
          </div>
        ),
      },
      {
        id: 'add-pokemon',
        target: '[data-tour="add-pokemon"]',
        title: 'Adding Pokémon',
        position: 'top',
        content: (
          <div className="space-y-2">
            <p>Add Pokémon to your team in two ways:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Click the + button on any Pokémon card</li>
              <li>Drag and drop from the grid</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'team-member',
        target: '[data-tour="team-member"]',
        title: 'Customize Team Member',
        position: 'left',
        content: (
          <div className="space-y-2">
            <p>Click any team member to customize:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li><strong>EVs/IVs:</strong> Set 0-252 EVs, 0-31 IVs</li>
              <li><strong>Nature:</strong> Select stat-modifying nature</li>
              <li><strong>Ability:</strong> Choose from available abilities</li>
              <li><strong>Held Item:</strong> Equip competitive items</li>
              <li><strong>Moves:</strong> Select 4 moves for your set</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'type-coverage',
        target: '[data-tour="coverage-grid"]',
        title: 'Type Coverage Analysis',
        position: 'left',
        content: (
          <div className="space-y-2">
            <p>See your team&apos;s offensive and defensive coverage:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li><span className="text-green-500">Green</span> - Strong coverage</li>
              <li><span className="text-red-500">Red</span> - Weaknesses/gaps</li>
              <li>Identify missing type coverage</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'stats-radar',
        target: '[data-tour="stats-radar"]',
        title: 'Team Stats Radar',
        position: 'left',
        content: (
          <p>
            Visualize your team&apos;s stat distribution. See if you have balanced stats or focus areas.
          </p>
        ),
      },
      {
        id: 'speed-tiers',
        target: '[data-tour="speed-tiers"]',
        title: 'Speed Tier Analysis',
        position: 'left',
        content: (
          <p>
            Compare your team&apos;s speed against common threats. See which Pokémon you outspeed at different levels.
          </p>
        ),
      },
      {
        id: 'entry-hazards',
        target: '[data-tour="entry-hazards"]',
        title: 'Entry Hazard Analysis',
        position: 'left',
        content: (
          <div className="space-y-2">
            <p>Check your team&apos;s vulnerability to entry hazards:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Stealth Rock damage per Pokémon</li>
              <li>Spikes and Toxic Spikes weakness</li>
              <li>Defog/Rapid Spin move recommendations</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'saved-teams',
        target: '[data-tour="saved-teams"]',
        title: 'Saved Teams',
        position: 'left',
        content: (
          <div className="space-y-2">
            <p>Save multiple teams for quick access:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Name your teams for organization</li>
              <li>Load saved teams instantly</li>
              <li>Store up to 20 different team compositions</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'trainer-card',
        target: '[data-tour="trainer-card"]',
        title: 'Trainer Card',
        position: 'left',
        content: (
          <div className="space-y-2">
            <p>Generate a shareable Trainer Card image:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Customize your trainer name</li>
              <li>Beautiful visual card with your team</li>
              <li>Download as PNG image to share</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'import-export',
        target: '[data-tour="import-export"]',
        title: 'Import & Export',
        position: 'top',
        content: (
          <div className="space-y-2">
            <p>Flexible team management options:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li><strong>Export:</strong> Showdown format, JSON, or image</li>
              <li><strong>Import:</strong> Paste Showdown teams directly</li>
              <li><strong>Share:</strong> Compressed URL for sharing teams</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'undo-redo',
        target: '[data-tour="undo-redo"]',
        title: 'Undo & Redo',
        position: 'left',
        content: (
          <div className="space-y-2">
            <p>Made a mistake? No problem!</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Undo accidental changes</li>
              <li>Redo if you change your mind</li>
              <li>Full history tracking for your session</li>
            </ul>
          </div>
        ),
      },
    ],
  },

  // =============================================================================
  // TOUR 4: Calculators
  // =============================================================================
  {
    id: 'calculators',
    name: 'Calculators',
    description: 'Master damage, stats, catch rates, and breeding odds.',
    estimatedTimeMinutes: 4,
    icon: '🧮',
    requiredTours: ['team-builder'],
    steps: [
      {
        id: 'calculator-hub',
        target: '[data-tour="calculator-menu"]',
        title: 'Calculator Hub',
        position: 'right',
        content: (
          <div className="space-y-2">
            <p>Access all calculators from the main menu. Each serves a specific purpose:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Damage Calculator</li>
              <li>Stat Calculator</li>
              <li>Catch Rate Calculator</li>
              <li>Breeding Calculator</li>
              <li>Shiny Odds Calculator</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'damage-calc',
        target: '[data-tour="damage-calculator"]',
        title: 'Damage Calculator',
        position: 'center',
        content: (
          <div className="space-y-2">
            <p>The most powerful tool for competitive battling:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Select attacker and defender</li>
              <li>Choose moves and see damage ranges</li>
              <li>Configure EVs, IVs, nature, items</li>
              <li>Apply weather, terrain, and field effects</li>
              <li>See roll probabilities</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'stat-calc',
        target: '[data-tour="stat-calculator"]',
        title: 'Stat Calculator',
        position: 'center',
        content: (
          <p>
            Calculate final stats given base stats, EVs, IVs, nature, and level. Perfect for planning competitive spreads.
          </p>
        ),
      },
      {
        id: 'catch-calc',
        target: '[data-tour="catch-calculator"]',
        title: 'Catch Rate Calculator',
        position: 'center',
        content: (
          <div className="space-y-2">
            <p>Know your odds before throwing:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Select Pokémon and ball type</li>
              <li>Set HP percentage and status conditions</li>
              <li>See exact catch probability</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'breeding-shiny',
        target: '[data-tour="breeding-calculator"]',
        title: 'Breeding & Shiny',
        position: 'center',
        content: (
          <div className="space-y-2">
            <p>Plan your breeding strategy:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>IV inheritance probability</li>
              <li>Nature inheritance with Everstone</li>
              <li>Egg group compatibility</li>
              <li>Shiny odds with various methods</li>
            </ul>
          </div>
        ),
      },
    ],
  },

  // =============================================================================
  // TOUR 5: Games Hub
  // =============================================================================
  {
    id: 'games',
    name: 'Games Hub',
    description: 'Play daily challenges and test your Pokémon knowledge.',
    estimatedTimeMinutes: 3,
    icon: '🎮',
    requiredTours: ['browsing'],
    steps: [
      {
        id: 'game-hub',
        target: '[data-tour="game-hub"]',
        title: 'Games Hub',
        position: 'right',
        content: (
          <div className="space-y-2">
            <p>Test your Pokémon knowledge with 8 daily games:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Each game resets daily with new challenges</li>
              <li>Everyone gets the same puzzle each day</li>
              <li>Track your stats and streaks</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'pokedle',
        target: '[data-tour="pokedle"]',
        title: 'Pokédle',
        position: 'center',
        content: (
          <div className="space-y-2">
            <p>Wordle-style guessing game:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Guess the mystery Pokémon</li>
              <li>Get hints on type, generation, stats</li>
              <li>Color-coded feedback (green/yellow/red)</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'whos-that',
        target: '[data-tour="whos-that"]',
        title: 'Who\'s That Pokémon?',
        position: 'center',
        content: (
          <p>
            The classic silhouette game! Identify Pokémon from their shadow. Perfect for testing your visual memory.
          </p>
        ),
      },
      {
        id: 'more-games',
        target: '[data-tour="more-games"]',
        title: 'More Games',
        position: 'center',
        content: (
          <div className="space-y-2">
            <p>Explore all 8 daily challenges:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li><strong>FlavorDle:</strong> Guess from Pokédex entry</li>
              <li><strong>CryDle:</strong> Identify by cry</li>
              <li><strong>StatDle:</strong> Guess from base stats</li>
              <li><strong>MoveDle:</strong> Guess move attributes</li>
              <li><strong>ItemDle:</strong> Guess the item</li>
              <li><strong>TrainerDle:</strong> Guess trainer team</li>
            </ul>
          </div>
        ),
      },
    ],
  },

  // =============================================================================
  // TOUR 6: Advanced Features
  // =============================================================================
  {
    id: 'advanced',
    name: 'Advanced Features',
    description: 'Comparison, reference data, favorites, walkers, and keyboard shortcuts.',
    estimatedTimeMinutes: 5,
    icon: '⚡',
    requiredTours: ['calculators', 'games'],
    steps: [
      {
        id: 'comparison',
        target: '[data-tour="comparison-bar"]',
        title: 'Pokémon Comparison',
        position: 'top',
        content: (
          <div className="space-y-2">
            <p>Compare up to 4 Pokémon side-by-side:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Add Pokémon via the + button on cards</li>
              <li>Click comparison bar to view</li>
              <li>Share comparisons via URL</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'reference-data',
        target: '[data-tour="reference-menu"]',
        title: 'Reference Data',
        position: 'right',
        content: (
          <div className="space-y-2">
            <p>Complete databases for competitive play:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li><strong>Move Dex:</strong> All moves with power, accuracy, PP</li>
              <li><strong>Ability Dex:</strong> Complete ability descriptions</li>
              <li><strong>Item Dex:</strong> All items and effects</li>
              <li><strong>Type Chart:</strong> Full effectiveness matrix</li>
              <li><strong>Nature Chart:</strong> Stat modifiers</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'favorites',
        target: '[data-tour="favorite-button"]',
        title: 'Favorites System',
        position: 'top',
        content: (
          <div className="space-y-2">
            <p>Star your favorite Pokémon for quick access:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Click the star on any Pokémon card</li>
              <li>Filter by favorites in the main view</li>
              <li>Persisted locally across sessions</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'data-management',
        target: '[data-tour="data-management"]',
        title: 'Data Management',
        position: 'right',
        content: (
          <div className="space-y-2">
            <p>Backup and restore your data:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Export teams, favorites, and settings</li>
              <li>Import from JSON backup</li>
              <li>Import from Pokémon Showdown</li>
              <li>Your data stays local - you own it</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'pokemon-walkers',
        target: '[data-tour="pokemon-walkers"]',
        title: 'Pokémon Walkers',
        position: 'right',
        content: (
          <div className="space-y-2">
            <p>Decorate your screen with walking Pokémon:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Cute sprites walking across your screen</li>
              <li>Customize which Pokémon appear</li>
              <li>Set walking speed and behavior</li>
              <li>Toggle on/off in settings</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'keyboard-shortcuts',
        target: '[data-tour="keyboard-shortcuts"]',
        title: 'Keyboard Shortcuts',
        position: 'center',
        content: (
          <div className="space-y-3">
            <p>Master the keyboard for lightning-fast navigation:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between p-2 rounded bg-slate-100 dark:bg-slate-800">
                <kbd className="font-mono">Ctrl K</kbd>
                <span>Command Palette</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-100 dark:bg-slate-800">
                <kbd className="font-mono">Shift T</kbd>
                <span>Toggle Theme</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-100 dark:bg-slate-800">
                <kbd className="font-mono">Shift S</kbd>
                <span>Toggle Shiny</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-100 dark:bg-slate-800">
                <kbd className="font-mono">Shift R</kbd>
                <span>Random Pokémon</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-100 dark:bg-slate-800">
                <kbd className="font-mono">/</kbd>
                <span>Focus Search</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-100 dark:bg-slate-800">
                <kbd className="font-mono">?</kbd>
                <span>Show Help</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">?</kbd> anytime to see all shortcuts!
            </p>
          </div>
        ),
      },
      {
        id: 'completion',
        target: 'body',
        title: 'Tour Complete!',
        position: 'center',
        content: (
          <div className="space-y-3">
            <p className="text-lg">You&apos;ve mastered the Advanced Pokédex!</p>
            <p>
              You now know how to browse Pokémon, build teams, use calculators, play games, and manage your data.
            </p>
            <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
              <p className="text-sm">
                <strong>Remember:</strong> Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">?</kbd> anytime for keyboard shortcuts, or{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">Ctrl K</kbd> for the command palette.
              </p>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              You can replay any tour from the menu anytime. Happy exploring!
            </p>
          </div>
        ),
        showNextButton: false,
      },
    ],
  },
];

export function getTourById(id: string): TourDefinition | undefined {
  return ALL_TOURS.find((t) => t.id === id);
}

export function getAllTours(): TourDefinition[] {
  return ALL_TOURS;
}
