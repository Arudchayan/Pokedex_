import React, { useState } from 'react';
import { usePokemon } from '../../../context/PokemonContext';
import { generateRandomTeam, generatePremadeTeam } from '../../../utils/battle/teamGenerator';
import { Battle } from '../../../utils/battle/battleEngine';
import { BattleAI } from '../../../utils/battle/battleAI';
import { BattleState, BattlePokemon } from '../../../utils/battle/types';
import { TIMEOUT_DELAYS } from '../../../constants';
import BattleArena from './BattleArena';
import BattleControls from './BattleControls';
import BattleLog from './BattleLog';

interface Props {
  onClose: () => void;
}

const BattleGame: React.FC<Props> = ({ onClose }) => {
  const { theme } = usePokemon();
  const [loading, setLoading] = useState(true); // "Not Started"
  const [error, setError] = useState<string | null>(null);
  const [battle, setBattle] = useState<Battle | null>(null);
  const [gameState, setGameState] = useState<BattleState | null>(null);
  const [ai, setAi] = useState<BattleAI | null>(null);
  const [turnProcessing, setTurnProcessing] = useState(false);

  // Manual Start
  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try random first
      let pTeam, eTeam;
      try {
        // Timeout promise to force fallback if API hangs
        const timeout = new Promise((_, rej) =>
          setTimeout(() => rej(new Error('Timeout')), TIMEOUT_DELAYS.BATTLE_TEAM_GENERATION)
        );

        // Parallel fetch
        [pTeam, eTeam] = (await Promise.race([
          Promise.all([generateRandomTeam(6), generateRandomTeam(6)]),
          timeout,
        ])) as [BattlePokemon[], BattlePokemon[]];
      } catch (err) {
        // Fallback to premade teams if API fails or times out
        pTeam = generatePremadeTeam('A');
        eTeam = generatePremadeTeam('B');
      }

      if (!pTeam || !pTeam.length) throw new Error('Team Generation Failed');

      const b = new Battle(pTeam, eTeam, (msg) => {
        // Log callback - handled via state update
      });
      const a = new BattleAI(b);

      setBattle(b);
      setAi(a);
      setGameState({ ...b.state });
      setLoading(false);
    } catch (e: any) {
      // Error logging handled by error boundary
      setError(e.message || 'Failed to load battle');
      setLoading(false);
    }
  };

  const refreshState = () => {
    if (battle) setGameState({ ...battle.state });
  };

  const handleMove = async (moveIndex: number) => {
    if (!battle || !ai || turnProcessing) return;

    setTurnProcessing(true);

    // 1. AI Decision
    await new Promise((r) => setTimeout(r, 10)); // Yield
    const aiAction = ai.getBestAction(1);
    const playerAction = {
      type: 'move' as const,
      actorId: battle.state.playerSide.active!.id,
      moveIndex,
    };

    // 2. Execute Turn
    battle.executeTurn(playerAction, aiAction);

    // 3. Update UI
    refreshState();
    setTurnProcessing(false);
  };

  const handleSwitch = async (switchTargetIndex: number) => {
    if (!battle || !ai || turnProcessing) return;

    setTurnProcessing(true);

    await new Promise((r) => setTimeout(r, 10)); // Yield
    const aiAction = ai.getBestAction(1);
    const playerAction = {
      type: 'switch' as const,
      actorId: battle.state.playerSide.active!.id,
      switchTargetIndex,
    };

    battle.executeTurn(playerAction, aiAction);

    refreshState();
    setTurnProcessing(false);
  };

  const handleRun = () => {
    if (confirm('Forfeit the match?')) {
      onClose();
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <div className="text-red-500 font-bold mb-2">Error Loading Battle</div>
        <div>{error}</div>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-500 text-white rounded">
          Close
        </button>
      </div>
    );
  }

  if (loading && !gameState) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center animate-fade-in-up">
        <div className="text-6xl mb-6">⚔️</div>
        <h2 className="text-3xl font-black mb-2">Battle Simulator</h2>
        <p className="opacity-70 mb-8 max-w-md">Initialize the 6v6 SOTA Engine.</p>
        <div className="text-xs text-yellow-500 mb-4 bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded">
          Warning: May cause crash if PokeAPI is rate limited.
        </div>

        <button
          onClick={handleStart}
          className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xl shadow-lg hover:scale-105 transition-all flex items-center gap-3"
        >
          <span>Start Simulation</span>
        </button>
      </div>
    );
  }

  // Winner Check
  const pAlive = gameState!.playerSide.team.some((p) => p.currentHp > 0);
  const eAlive = gameState!.enemySide.team.some((p) => p.currentHp > 0);

  if (!pAlive || !eAlive) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in-up">
        <h2 className="text-4xl font-black mb-4">
          {pAlive ? (
            <span className="text-green-500">You Won!</span>
          ) : (
            <span className="text-red-500">You Lost!</span>
          )}
        </h2>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-slate-500 text-white rounded-xl font-bold"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full max-w-4xl mx-auto p-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
    >
      <div className="flex justify-between items-center mb-2">
        <button onClick={onClose} className="text-xs font-bold opacity-50 hover:opacity-100">
          ← Exit Battle
        </button>
        <div className="font-mono text-xs opacity-50">Turn {gameState!.turn}</div>
      </div>

      {/* Arena */}
      <div className="flex-shrink-0">
        <BattleArena
          playerActive={gameState!.playerSide.active!}
          enemyActive={gameState!.enemySide.active!}
        />
      </div>

      {/* HUD / Log */}
      <div className="flex-1 flex flex-col mt-4 min-h-0">
        <BattleLog logs={gameState!.log} />

        <BattleControls
          activePokemon={gameState!.playerSide.active!}
          playerTeam={gameState!.playerSide.team}
          onMove={handleMove}
          onRun={handleRun}
          onSwitch={handleSwitch}
          disabled={turnProcessing}
        />
      </div>
    </div>
  );
};

export default BattleGame;
