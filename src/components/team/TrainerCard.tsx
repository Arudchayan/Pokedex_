import React, { useRef, useState } from 'react';
import { usePokemon } from '../../context/PokemonContext';
import { useToast } from '../../context/ToastContext';
import { sanitizeString } from '../../utils/securityUtils';
import { TYPE_COLORS_HEX, UI_CONSTANTS } from '../../constants';
import TypeBadge from '../charts/TypeBadge';
import Modal from '../base/Modal';

interface TrainerCardProps {
  onClose: () => void;
}

const TrainerCard: React.FC<TrainerCardProps> = ({ onClose }) => {
  const { teamPokemon: team, theme, favorites } = usePokemon();
  const { addToast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [trainerName, setTrainerName] = useState('Pokemon Trainer');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (cardRef.current) {
      setDownloading(true);
      addToast('Generating trainer card...', 'info');
      try {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: null,
          scale: UI_CONSTANTS.CANVAS_SCALE,
          logging: false,
          useCORS: true, // Important for external images (PokeAPI)
        });

        const link = document.createElement('a');
        link.download = `${trainerName.replace(/\s+/g, '_')}_TrainerCard.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        addToast('Trainer Card downloaded!', 'success');
      } catch (err) {
        console.error('Failed to generate trainer card', err);
        addToast('Failed to generate trainer card.', 'error');
      } finally {
        setDownloading(false);
      }
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Trainer Card" size="lg">
      <div className="mb-6 space-y-2">
        <label
          className={`block text-sm font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
        >
          Trainer Name
        </label>
        <input
          type="text"
          value={trainerName}
          onChange={(e) => setTrainerName(sanitizeString(e.target.value))}
          maxLength={UI_CONSTANTS.MAX_TRAINER_NAME_LENGTH}
          className={`w-full p-3 rounded-lg text-lg font-bold border ${theme === 'dark' ? 'bg-black/30 border-white/20 text-white focus:border-primary-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-primary-500'}`}
          placeholder="Enter your name..."
        />
      </div>

      {/* The Card to be Captured */}
      <div
        ref={cardRef}
        className="w-full aspect-[1.58] rounded-xl overflow-hidden relative shadow-2xl flex flex-col"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          minHeight: '400px',
        }}
      >
        {/* Background Texture */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        ></div>

        {/* Header */}
        <div className="relative z-10 p-6 flex justify-between items-end border-b border-white/10 bg-black/20">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-primary-400 uppercase drop-shadow-lg">
              {trainerName}
            </h1>
            <div className="flex gap-4 mt-2 text-sm font-semibold opacity-70">
              <span>
                ID No.{' '}
                {Math.floor(Math.random() * (UI_CONSTANTS.TRAINER_ID_MAX + 1))
                  .toString()
                  .padStart(UI_CONSTANTS.TRAINER_ID_PADDING, '0')}
              </span>
              <span>Money ${UI_CONSTANTS.DEFAULT_MONEY.toLocaleString()}</span>
              <span>Pokedex: {favorites.size} Favs</span>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-xs uppercase tracking-widest opacity-50">Region</span>
            <span className="text-xl font-bold">Kanto</span>
          </div>
        </div>

        {/* Team Display */}
        <div className="relative z-10 flex-1 p-3 sm:p-6 grid grid-cols-3 grid-rows-2 gap-2 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => {
            const pokemon = team[i];
            return (
              <div
                key={i}
                className={`rounded-lg relative overflow-hidden border border-white/10 flex items-center justify-center group ${pokemon ? 'bg-white/5' : 'bg-black/20'}`}
              >
                {pokemon ? (
                  <>
                    <div
                      className="absolute inset-0 opacity-20 transition-all duration-500 group-hover:opacity-30"
                      style={{
                        background: `radial-gradient(circle at center, ${TYPE_COLORS_HEX[pokemon.types[0]]} 0%, transparent 70%)`,
                      }}
                    ></div>
                    <img
                      src={pokemon.imageUrl}
                      alt={pokemon.name}
                      className="w-16 h-16 sm:w-24 sm:h-24 object-contain z-10 drop-shadow-xl"
                      crossOrigin="anonymous"
                    />
                    <div className="absolute bottom-2 left-2 z-20">
                      <p className="text-xs font-bold capitalize shadow-black drop-shadow-md">
                        {pokemon.name}
                      </p>
                    </div>
                    <div className="absolute top-2 right-2 z-20 flex gap-1">
                      {pokemon.types.map((t) => (
                        <div
                          key={t}
                          className="w-3 h-3 rounded-full shadow-lg"
                          style={{ backgroundColor: TYPE_COLORS_HEX[t] }}
                        ></div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <div className="w-full h-[1px] bg-white/20 rotate-45 transform"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="relative z-10 p-4 bg-black/40 flex justify-between items-center text-xs opacity-60">
          <span>GENERATED BY GRAPHQL POKEDEX</span>
          <span>pokedex.app</span>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 ${downloading ? 'bg-gray-500 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-400 hover:shadow-primary-500/30 hover:-translate-y-1'}`}
        >
          {downloading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Image
            </>
          )}
        </button>
      </div>
    </Modal>
  );
};

export default TrainerCard;
