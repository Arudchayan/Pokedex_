import { BattleState, BattleAction, BattlePokemon, SideState, FieldState, BattleMove, TypeName } from './types';
import { MOVE_LOGIC, MoveEffect } from './moveLogic';

export class Battle {
    state: BattleState;
    logCallback: (msg: string) => void;

    constructor(playerTeam: BattlePokemon[], aiTeam: BattlePokemon[], logCallback: (msg: string) => void) {
        this.logCallback = logCallback;
        this.state = {
            turn: 1,
            playerSide: {
                id: 'player',
                name: 'You',
                active: playerTeam[0],
                team: playerTeam,
                sideConditions: []
            },
            enemySide: {
                id: 'ai',
                name: 'Opponent',
                active: aiTeam[0],
                team: aiTeam,
                sideConditions: []
            },
            field: {
                weather: 'none',
                terrain: 'none',
                weatherTurns: 0,
                terrainTurns: 0
            },
            lastMove: null,
            log: []
        };
    }

    // Clone state for AI simulation
    clone(): Battle {
        const newBattle = new Battle([], [], () => { });
        newBattle.state = JSON.parse(JSON.stringify(this.state));
        return newBattle;
    }

    log(msg: string) {
        this.state.log.push(msg);
        this.logCallback(msg);
    }

    getSide(id: string): SideState {
        return id === 'player' ? this.state.playerSide : this.state.enemySide;
    }

    getOppositeSide(id: string): SideState {
        return id === 'player' ? this.state.enemySide : this.state.playerSide;
    }

    // Turn Execution
    executeTurn(playerAction: BattleAction, aiAction: BattleAction) {
        this.log(`--- Turn ${this.state.turn} ---`);

        const pSide = this.state.playerSide;
        const eSide = this.state.enemySide;

        // 1. Switch Phase
        const actions = [playerAction, aiAction];
        const switches = actions.filter(a => a.type === 'switch');

        // Speed tie for switches doesn't matter much in MVP, player first
        switches.forEach(a => {
            const side = this.getSide(a.actorId.startsWith('p') ? 'player' : 'ai');
            if (a.switchTargetIndex !== undefined && side.team[a.switchTargetIndex]) {
                const newMon = side.team[a.switchTargetIndex];
                if (newMon.currentHp > 0) {
                    side.active = newMon;
                    this.log(`${side.name} sent out ${newMon.name}!`);
                }
            }
        });

        // 2. Move Phase
        const moves = actions.filter(a => a.type === 'move');

        // Determine Order
        const sortedMoves = moves.sort((a, b) => {
            const sideA = this.getSide(a.actorId.startsWith('p') ? 'player' : 'ai');
            const sideB = this.getSide(b.actorId.startsWith('p') ? 'player' : 'ai');
            const monA = sideA.active!;
            const monB = sideB.active!;

            const moveA = monA.moves[a.moveIndex!] || { priority: 0, speed: 0 };
            const moveB = monB.moves[b.moveIndex!] || { priority: 0, speed: 0 };

            // Safety check for debugging
            if (!monA.moves[a.moveIndex!]) console.warn("Invalid Move A", a, monA.name);
            if (!monB.moves[b.moveIndex!]) console.warn("Invalid Move B", b, monB.name);

            if ((moveA as any).priority !== (moveB as any).priority) return ((moveB as any).priority || 0) - ((moveA as any).priority || 0);
            return monB.stats.spe - monA.stats.spe; // Speed tie ignored for now
        });

        for (const action of sortedMoves) {
            const side = this.getSide(action.actorId.startsWith('p') ? 'player' : 'ai');
            const targetSide = this.getOppositeSide(side.id);
            const attacker = side.active!;
            const defender = targetSide.active!;

            if (attacker.currentHp <= 0) continue; // Fainted turn check

            // Execute Move
            const move = attacker.moves[action.moveIndex!];
            this.log(`${attacker.name} used ${move.name}!`);

            // Accuracy Check
            if (move.accuracy < 100 && Math.random() * 100 > move.accuracy) {
                this.log("It missed!");
                continue;
            }

            // Damage Code
            if (move.category !== 'status') {
                const damage = this.calculateDamage(attacker, defender, move);
                defender.currentHp = Math.max(0, defender.currentHp - damage);

                // Effectiveness Log
                const eff = this.getTypeEffectiveness(move.type, defender.types);
                if (eff > 1) this.log("It's super effective!");
                if (eff < 1 && eff > 0) this.log("It's not very effective...");
                if (eff === 0) this.log("It had no effect...");

                if (defender.currentHp === 0) {
                    this.log(`${defender.name} fainted!`);
                }
            }

            // Effects
            const logic = MOVE_LOGIC[move.logicId || 'basic_damage'];
            if (logic) {
                this.applyEffect(logic, attacker, defender);
            }
        }

        this.state.turn++;
    }

    applyEffect(effect: MoveEffect, attacker: BattlePokemon, defender: BattlePokemon) {
        if (effect.status && defender.currentHp > 0 && defender.status === 'none') {
            // Status chance
            if (!effect.chance || Math.random() * 100 < effect.chance) {
                defender.status = effect.status;
                this.log(`${defender.name} was ${effect.status === 'brn' ? 'burned' : effect.status === 'psn' ? 'poisoned' : 'paralyzed'}!`);
            }
        }
        if (effect.statChanges) {
            // Apply stats
            if (effect.type === 'stat') {
                // Self or Target?
                // Naive: Self for boost, Target for drop
                const target = Object.values(effect.statChanges).some(v => v < 0) ? defender : attacker;
                const statName = Object.keys(effect.statChanges)[0];
                const val = Object.values(effect.statChanges)[0];
                this.log(`${target.name}'s ${statName} ${val > 0 ? 'rose' : 'fell'}!`);
            }
        }
        if (effect.healPercent && attacker.currentHp > 0) {
            const heal = Math.floor(attacker.maxHp * (effect.healPercent / 100));
            attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + heal);
            this.log(`${attacker.name} regained health!`);
        }
    }

    calculateDamage(attacker: BattlePokemon, defender: BattlePokemon, move: BattleMove): number {
        // 1. Type Effectiveness
        const effectiveness = this.getTypeEffectiveness(move.type, defender.types);
        if (effectiveness === 0) return 0;

        // 2. Stats
        const aStat = move.category === 'physical' ? attacker.stats.atk : attacker.stats.spa;
        const dStat = move.category === 'physical' ? defender.stats.def : defender.stats.spd;

        // 3. Modifiers
        const stab = attacker.types.includes(move.type) ? 1.5 : 1;
        const random = 0.85 + Math.random() * 0.15;

        // Formula
        const level = attacker.level;
        const base = ((2 * level / 5 + 2) * move.power * (aStat / dStat)) / 50 + 2;

        // Critical Hit (1/16)
        const isCrit = Math.random() < 0.0625;
        const crit = isCrit ? 1.5 : 1;
        if (isCrit) this.log("A critical hit!");

        return Math.floor(base * stab * effectiveness * random * crit);
    }

    getTypeEffectiveness(moveType: TypeName, defenderTypes: [TypeName, TypeName?]): number {
        let multiplier = 1;
        defenderTypes.forEach(t => {
            if (!t) return;
            multiplier *= TYPE_CHART[moveType][t] || 1;
        });
        return multiplier;
    }
}

// Simple Type Chart (Partial for MVP)
const TYPE_CHART: Record<string, Record<string, number>> = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};
