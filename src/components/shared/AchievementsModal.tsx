import React from 'react';
import { useAchievements, Achievement } from '../../context/AchievementContext';
import { usePokemon } from '../../context/PokemonContext';

interface AchievementsModalProps {
  onClose: () => void;
}

const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose }) => {
  const { achievements, progress, totalUnlocked } = useAchievements();
  const { theme } = usePokemon();

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${theme === 'dark' ? 'bg-black/90' : 'bg-slate-800/90'}`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-4xl p-6 rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh] ${theme === 'dark' ? 'bg-slate-900 border border-white/10 text-white' : 'bg-white text-slate-800'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 p-2 rounded-xl text-white shadow-lg">
              <span className="material-symbols-outlined">emoji_events</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Achievements</h2>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Track your journey to becoming a Master!
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div
          className={`p-6 rounded-xl mb-6 border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
        >
          <div className="flex justify-between items-end mb-2">
            <span className="font-bold text-lg">Total Progress</span>
            <span className="font-mono font-bold text-2xl text-primary-500">{progress}%</span>
          </div>
          <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p
            className={`text-right text-xs mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
          >
            {totalUnlocked} / {achievements.length} Unlocked
          </p>
        </div>

        {/* Achievement Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                theme={theme}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AchievementCard: React.FC<{
  achievement: Achievement;
  theme: string;
  formatDate: (ts?: number) => string;
}> = ({ achievement, theme, formatDate }) => {
  const isUnlocked = !!achievement.unlockedAt;

  return (
    <div
      className={`
                relative p-4 rounded-xl border transition-all duration-300
                ${
                  isUnlocked
                    ? theme === 'dark'
                      ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-yellow-500/50 shadow-lg shadow-yellow-900/10'
                      : 'bg-white border-yellow-400 shadow-md'
                    : theme === 'dark'
                      ? 'bg-slate-800/50 border-white/5 opacity-70'
                      : 'bg-slate-50 border-slate-200 opacity-60 grayscale'
                }
            `}
    >
      <div className="flex items-start gap-4">
        <div
          className={`
                        w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-inner
                        ${
                          isUnlocked
                            ? theme === 'dark'
                              ? 'bg-slate-800 border-2 border-yellow-500'
                              : 'bg-yellow-50 border-2 border-yellow-400'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }
                    `}
        >
          {achievement.icon}
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3
              className={`font-bold text-lg ${isUnlocked ? (theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700') : ''}`}
            >
              {achievement.title}
            </h3>
            {isUnlocked && (
              <span className="material-symbols-outlined text-yellow-500 text-xl">
                check_circle
              </span>
            )}
          </div>

          <p
            className={`text-sm mt-1 leading-tight ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}
          >
            {achievement.description}
          </p>

          {isUnlocked && (
            <p className="text-[10px] mt-3 uppercase tracking-wider opacity-60 font-semibold">
              Unlocked: {formatDate(achievement.unlockedAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementsModal;
