import React from 'react';
import { useAchievements } from '../../context/AchievementContext';
import { usePokemon } from '../../context/PokemonContext';
import Modal from '../base/Modal';

interface AchievementModalProps {
  onClose: () => void;
}

const AchievementModal: React.FC<AchievementModalProps> = ({ onClose }) => {
  const { achievements, progress, totalUnlocked } = useAchievements();
  const { theme } = usePokemon();

  return (
    <Modal isOpen={true} onClose={onClose} title="Achievements" size="md">
        {/* Progress Section */}
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold uppercase tracking-wider opacity-70">Completion Progress</span>
            <span className="text-xl font-black">{progress}% ({totalUnlocked}/{achievements.length})</span>
          </div>
          <div className={`h-4 w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const isUnlocked = !!achievement.unlockedAt;
              return (
                <div
                  key={achievement.id}
                  className={`relative p-4 rounded-xl border transition-all ${
                    isUnlocked
                      ? theme === 'dark'
                        ? 'bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-500/30'
                        : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                      : theme === 'dark'
                      ? 'bg-white/5 border-white/5 opacity-60'
                      : 'bg-slate-50 border-slate-100 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-16 h-16 flex items-center justify-center text-3xl rounded-full border-2 shadow-lg ${
                        isUnlocked
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
                          : 'bg-gray-500/10 border-gray-400/30 text-gray-400 grayscale'
                      }`}
                    >
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg leading-tight mb-1 ${isUnlocked ? (theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700') : ''}`}>
                        {achievement.title}
                      </h3>
                      <p className={`text-sm leading-snug ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {achievement.description}
                      </p>
                      {isUnlocked && (
                         <div className="mt-2 text-[10px] font-mono opacity-60 flex items-center gap-1 text-green-500">
                             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                             </svg>
                             UNLOCKED
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
    </Modal>
  );
};

export default AchievementModal;
