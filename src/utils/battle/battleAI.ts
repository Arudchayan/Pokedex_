import { Battle } from './battleEngine';
import { BattleState, BattleAction, BattlePokemon } from './types';

// Evaluation Weights
const W_HP = 100;
const W_KO = 10000;
const W_SPEED = 20;
const W_TYPE_ADV = 50;
const W_STATUS = -30;

// SOTA-Lite AI
export class BattleAI {
  battle: Battle;
  aiSideId: 'ai';
  playerSideId: 'player';

  constructor(battle: Battle) {
    this.battle = battle;
    this.aiSideId = 'ai';
    this.playerSideId = 'player';
  }

  // Main entry point
  getBestAction(depth: number = 1): BattleAction {
    const state = this.battle.state;
    const aiMon = state.enemySide.active!;

    // 1. Mandatory Switch Check
    if (aiMon.currentHp <= 0) {
      return this.getBestSwitch();
    }

    // 2. Minimax Root
    // For MVP/Performance, we do a 1-ply search with strong heuristics (effectively depth 2 logic in eval)
    // We simulate AI Move vs Player's Best probable Move

    let bestScore = -Infinity;
    let bestAction: BattleAction = { type: 'move', actorId: aiMon.id, moveIndex: 0 };

    // Generate AI Actions
    const actions = this.generateActions(this.aiSideId);

    for (const action of actions) {
      // Simulation
      // We assume Player does their best move (e.g. max damage)
      // Ideally we'd loop player moves too, but 4x4 = 16 branches. Affordable.

      const playerBestResponse = this.predictPlayerMove();
      const simBattle = this.battle.clone();

      simBattle.executeTurn(playerBestResponse, action);
      const score = this.evaluateState(simBattle.state);

      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }

    return bestAction;
  }

  getBestSwitch(): BattleAction {
    const team = this.battle.state.enemySide.team;
    // Simple: Pick highest HP + Type Adv
    let bestIndex = -1;
    let bestScore = -Infinity;

    team.forEach((p, idx) => {
      if (p.currentHp <= 0 || p === this.battle.state.enemySide.active) return;

      // Score based on HP %
      let score = (p.currentHp / p.maxHp) * 100;

      // Score based on Type match vs current Player Active
      const playerActive = this.battle.state.playerSide.active;
      if (playerActive) {
        // Defensive check (Does player move hurt me?)
        // Heuristic: Check type match of player types vs my types
        let maxIncomingEffectiveness = 0;
        playerActive.types.forEach((pType) => {
          if (!pType) return;
          const effectiveness = this.battle.getTypeEffectiveness(pType, p.types);
          if (effectiveness > maxIncomingEffectiveness) {
            maxIncomingEffectiveness = effectiveness;
          }
        });
        score -= (maxIncomingEffectiveness - 1) * W_TYPE_ADV;

        // Offensive check (Can I hurt the player?)
        let maxOutgoingEffectiveness = 0;
        p.types.forEach((myType) => {
          if (!myType) return;
          const effectiveness = this.battle.getTypeEffectiveness(myType, playerActive.types);
          if (effectiveness > maxOutgoingEffectiveness) {
            maxOutgoingEffectiveness = effectiveness;
          }
        });
        score += (maxOutgoingEffectiveness - 1) * W_TYPE_ADV;
      }

      if (score > bestScore) {
        bestScore = score;
        bestIndex = idx;
      }
    });

    if (bestIndex === -1) {
      // Struggle or loss
      return { type: 'move', actorId: 'struggle', moveIndex: 0 };
    }

    return {
      type: 'switch',
      actorId: this.battle.state.enemySide.active?.id || 'switch',
      switchTargetIndex: bestIndex,
    };
  }

  generateActions(sideId: 'player' | 'ai'): BattleAction[] {
    const side = sideId === 'player' ? this.battle.state.playerSide : this.battle.state.enemySide;
    const active = side.active!;
    const actions: BattleAction[] = [];

    // Moves
    active.moves.forEach((m, idx) => {
      if (m.pp > 0) {
        actions.push({ type: 'move', actorId: active.id, moveIndex: idx });
      }
    });

    // Smart Switch (only if bad matchup)
    // Calculating matchup score...
    // For MVP 1-ply, we usually stick to moves unless we check for "Swap required"

    return actions;
  }

  predictPlayerMove(): BattleAction {
    // Player likely picks max damage move
    const pSide = this.battle.state.playerSide;
    const eSide = this.battle.state.enemySide;
    const pActive = pSide.active!;
    const eActive = eSide.active!;

    let bestDmg = -1;
    let bestIdx = 0;

    pActive.moves.forEach((m, idx) => {
      const dmg = this.battle.calculateDamage(pActive, eActive, m);
      if (dmg > bestDmg) {
        bestDmg = dmg;
        bestIdx = idx;
      }
    });

    return { type: 'move', actorId: pActive.id, moveIndex: bestIdx };
  }

  evaluateState(state: BattleState): number {
    const aiActive = state.enemySide.active!;
    const playerActive = state.playerSide.active!;

    if (aiActive.currentHp <= 0) return -W_KO * 2; // Losing is bad
    if (playerActive.currentHp <= 0) return W_KO * 5; // Winning is paramount

    let score = 0;

    // HP Fraction difference
    score += (aiActive.currentHp / aiActive.maxHp) * W_HP;
    score -= (playerActive.currentHp / playerActive.maxHp) * W_HP;

    // Speed Bonus
    if (aiActive.stats.spe > playerActive.stats.spe) score += W_SPEED;

    // Status Penalty
    if (aiActive.status !== 'none') score += W_STATUS;

    return score;
  }
}
