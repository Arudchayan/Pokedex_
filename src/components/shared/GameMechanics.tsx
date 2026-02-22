import React from 'react';
import { PokemonDetails } from '../../types';

interface GameMechanicsProps {
  pokemon: PokemonDetails;
}

const MechanicCard: React.FC<{ title: string; children: React.ReactNode, className?: string }> = ({ title, children, className='' }) => (
    <div className={`bg-black/10 p-4 rounded-lg ${className}`}>
        <h4 className="font-bold text-slate-200 mb-2 text-lg border-b border-white/10 pb-2">{title}</h4>
        <div className="text-sm text-slate-300 space-y-2">{children}</div>
    </div>
);

const GameMechanics: React.FC<GameMechanicsProps> = ({ pokemon }) => {
    const gmaxForm = pokemon.forms.find(f => f.formName.toLowerCase().includes('gmax'));

    return (
        <div className="space-y-4">
            <MechanicCard title="Dynamax & Gigantamax" className="border border-purple-500/30">
                <p>In the Galar region, Pokémon can <strong className="font-bold text-purple-300">Dynamax</strong> to become incredibly large and powerful for three turns, boosting their stats and move power.</p>
                {gmaxForm ? (
                    <div className="mt-4 bg-black/20 p-3 rounded-md flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                        <img src={gmaxForm.imageUrl} alt="Gigantamax Form" className="h-24 w-24 object-contain flex-shrink-0" />
                        <div>
                            <h5 className="font-bold text-white">Gigantamax Factor</h5>
                            <p>This Pokémon has the Gigantamax Factor. It changes its appearance and can use a unique, powerful G-Max Move that has special secondary effects.</p>
                        </div>
                    </div>
                ) : (
                    <div className="mt-2 text-xs text-slate-400">
                        <p>This Pokémon does not have a special Gigantamax form.</p>
                    </div>
                )}
            </MechanicCard>
            
            <MechanicCard title="Terastallization" className="border border-primary-500/30">
                <p>
                    In the Paldea region, Pokémon can <strong className="font-bold text-primary-300">Terastallize</strong>, causing a Tera Jewel to appear above their head.
                </p>
                <p>
                    This mechanic changes the Pokémon's type to its unique "Tera Type," which can be any of the 18 types. This alters its weaknesses and boosts the power of moves matching the Tera Type, adding a deep strategic layer to battles.
                </p>
            </MechanicCard>

            <MechanicCard title="Z-Moves" className="border border-yellow-500/30">
                 <p>
                    In the Alola region, by holding a Z-Crystal, a Pokémon can unleash an incredibly powerful <strong className="font-bold text-yellow-300">Z-Move</strong> once per battle.
                </p>
                <p>
                    These moves are upgraded versions of standard moves. Certain Pokémon also have access to exclusive, signature Z-Moves that are unique to them, providing a devastating single-use attack.
                </p>
            </MechanicCard>
        </div>
    );
};

export default GameMechanics;