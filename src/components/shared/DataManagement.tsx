import React, { useState } from 'react';
import { usePokemon } from '../../context/PokemonContext';
import { usePokemonStore } from '../../store/usePokemonStore';
import { useToast } from '../../context/ToastContext';
import { useAchievements } from '../../context/AchievementContext';
import { buildPersistenceData, isPersistenceData } from '../../utils/persistenceSchema';
import {
  validateTeamMember,
  getSavedTeamList,
  saveTeamList,
  validateSavedTeam,
  SavedTeam,
} from '../../utils/teamStorage';
import { importFromShowdown } from '../../utils/teamExport';
import { saveFavorites } from '../../utils/favorites';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';
import { compressTeam } from '../../utils/urlCompression';
import Modal from '../base/Modal';

interface DataManagementProps {
  onClose: () => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ onClose }) => {
  const { theme, teamPokemon: team, favorites, masterPokemonList } = usePokemon();
  const { addToast } = useToast();
  const { unlockAchievement } = useAchievements();
  const [importData, setImportData] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [isImportingBackup, setIsImportingBackup] = useState(false);
  const [isImportingShowdown, setIsImportingShowdown] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    teamMembers: number;
    favoritesAdded: number;
    savedTeamsAdded: number;
  } | null>(null);

  // Showdown Import State
  const [showdownImportText, setShowdownImportText] = useState('');
  const [importTeamName, setImportTeamName] = useState('Imported Team');

  const handleGenerateLink = () => {
    try {
      if (team.length === 0) {
        addToast('Team is empty. Add Pokemon to share.', 'error');
        return;
      }
      const compressed = compressTeam(team);
      const url = new URL(window.location.href);
      url.searchParams.set('team_data', compressed);
      url.searchParams.delete('team'); // clean up simple id list
      const finalUrl = url.toString();
      setShareLink(finalUrl);

      navigator.clipboard.writeText(finalUrl);
      addToast('Link generated and copied to clipboard!', 'success');
    } catch (e) {
      addToast('Failed to generate link.', 'error');
    }
  };

  const handleExport = () => {
    const savedTeams = getSavedTeamList();
    const data = buildPersistenceData({ team, favorites, savedTeams, theme });
    const json = JSON.stringify(data, null, 2);

    // Create download link
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pokedex_data_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();

    addToast('Data exported successfully!', 'success');
  };

  const handleImport = () => {
    if (isImportingBackup) return;

    // SECURITY: Prevent DoS with large payloads
    if (importData.length > MAX_INPUT_LENGTH) {
      addToast('Input data too large.', 'error');
      return;
    }

    setIsImportingBackup(true);
    setImportSummary(null);

    try {
      const data = JSON.parse(importData);

      if (!isPersistenceData(data)) {
        addToast('Invalid JSON data.', 'error');
        setIsImportingBackup(false);
        return;
      }

      let restoredTeamCount = 0;

      if (data.team && Array.isArray(data.team)) {
        // SECURITY: Batch update team to prevent multiple storage writes
        const validTeam = data.team
          .map((p: any) => validateTeamMember(p))
          .filter((p: any) => p !== null);

        // setTeam handles slicing to capacity and saving to storage
        usePokemonStore.getState().setTeam(validTeam);
        restoredTeamCount = validTeam.length;
      }

      let favoritesAdded = 0;
      if (data.favorites && Array.isArray(data.favorites)) {
        // SECURITY: Batch update favorites to prevent DoS via storage thrashing
        // Instead of dispatching N actions (N writes), we calculate the final set and write once.
        const newFavorites = new Set(favorites);
        let hasChanges = false;

        data.favorites.forEach((id: any) => {
          const numId = Number(id);
          if (!isNaN(numId) && Number.isSafeInteger(numId) && !newFavorites.has(numId)) {
            newFavorites.add(numId);
            hasChanges = true;
            favoritesAdded += 1;
          }
        });

        if (hasChanges) {
          saveFavorites(newFavorites);
          usePokemonStore.getState().setFavorites(newFavorites);
        }
      }

      if (data.savedTeams && Array.isArray(data.savedTeams)) {
        const currentSavedTeams = getSavedTeamList();
        const existingIds = new Set(currentSavedTeams.map((t) => t.id));
        const importedTeams: SavedTeam[] = [];

        data.savedTeams.forEach((teamData: any) => {
          const validTeam = validateSavedTeam(teamData);
          if (validTeam) {
            // ID Collision Check: If exists, generate new ID
            if (existingIds.has(validTeam.id)) {
              validTeam.id = crypto.randomUUID();
            }
            importedTeams.push(validTeam);
          }
        });

        if (importedTeams.length > 0) {
          saveTeamList([...currentSavedTeams, ...importedTeams]);
        }

        setImportSummary({
          teamMembers: restoredTeamCount,
          favoritesAdded,
          savedTeamsAdded: importedTeams.length,
        });
      } else {
        setImportSummary({
          teamMembers: restoredTeamCount,
          favoritesAdded,
          savedTeamsAdded: 0,
        });
      }

      unlockAchievement('data_hoarder');
      addToast('Data imported successfully! (Team, Favorites & Saved Teams updated)', 'success');
    } catch (e) {
      addToast('Invalid JSON data.', 'error');
      setImportSummary(null);
    } finally {
      setIsImportingBackup(false);
    }
  };

  const handleShowdownImport = () => {
    if (isImportingShowdown) return;

    if (showdownImportText.length > MAX_INPUT_LENGTH) {
      addToast('Input data too large.', 'error');
      return;
    }

    if (!showdownImportText.trim()) {
      addToast('Please paste a team first.', 'error');
      return;
    }

    setIsImportingShowdown(true);

    try {
      const importedTeam = importFromShowdown(showdownImportText, masterPokemonList);

      if (importedTeam.length === 0) {
        addToast('No valid Pokemon found in text.', 'error');
        return;
      }

      // Create SavedTeam
      const normalizedName = importTeamName.trim();
      const newSavedTeam: SavedTeam = {
        id: crypto.randomUUID(),
        name: normalizedName || `Imported Team ${new Date().toLocaleDateString()}`,
        team: importedTeam.slice(0, 6), // Enforce capacity limit for saved teams too
        updatedAt: Date.now(),
      };

      // Save
      const currentSavedTeams = getSavedTeamList();
      saveTeamList([...currentSavedTeams, newSavedTeam]);

      unlockAchievement('data_hoarder');
      addToast(`Successfully saved "${newSavedTeam.name}" to My Teams!`, 'success');
      setShowdownImportText('');
      setImportTeamName('Imported Team');
    } catch (e) {
      console.error(e);
      addToast('Failed to import team.', 'error');
    } finally {
      setIsImportingShowdown(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Data Management" size="md">
      <div className="grid gap-8">
        {/* Share Link */}
        <div
          className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
        >
          <h3 className="text-lg font-bold mb-2">Share Team Link</h3>
          <p className="text-sm opacity-70 mb-4">
            Generate a unique URL for your current team to share with others.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleGenerateLink}
              disabled={team.length === 0}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-lg font-bold transition-colors"
            >
              Generate Link
            </button>

            {shareLink && (
              <div className="relative">
                <textarea
                  readOnly
                  value={shareLink}
                  onClick={(e) => e.currentTarget.select()}
                  className={`w-full h-20 p-3 rounded-lg border text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'dark' ? 'bg-black/30 border-white/20 text-slate-300' : 'bg-white border-slate-300 text-slate-600'}`}
                />
                <div className="absolute bottom-2 right-2 text-[10px] opacity-50 pointer-events-none">
                  Auto-copied to clipboard
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export */}
        <div
          className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
        >
          <h3 className="text-lg font-bold mb-2">Backup Data (JSON)</h3>
          <p className="text-sm opacity-70 mb-4">
            Download your current Team, Favorites, and Saved Teams as a JSON file.
          </p>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold transition-colors"
          >
            Download JSON
          </button>
        </div>

        {/* Import JSON */}
        <div
          className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
        >
          <h3 className="text-lg font-bold mb-2">Import Backup (JSON)</h3>
          <p className="text-sm opacity-70 mb-4">
            Paste your full backup JSON here to restore everything.
          </p>
          <label htmlFor="import-data" className="sr-only">
            Paste JSON Data
          </label>
          <textarea
            id="import-data"
            value={importData}
            onChange={(e) => {
              if (e.target.value.length <= MAX_INPUT_LENGTH) {
                setImportData(e.target.value);
                setImportSummary(null);
              }
            }}
            maxLength={MAX_INPUT_LENGTH}
            className={`w-full h-32 p-3 rounded-lg border text-sm font-mono mb-3 ${theme === 'dark' ? 'bg-black/30 border-white/20 text-white' : 'bg-white border-slate-300'}`}
            placeholder="Paste JSON here..."
          />
          <button
            onClick={handleImport}
            disabled={!importData || isImportingBackup}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImportingBackup ? 'Restoring...' : 'Restore Backup'}
          </button>
          {importSummary && (
            <p className="mt-3 text-xs opacity-80" role="status" aria-live="polite">
              Restored {importSummary.teamMembers} team members, added{' '}
              {importSummary.favoritesAdded} favorites, and imported {importSummary.savedTeamsAdded}{' '}
              saved teams.
            </p>
          )}
        </div>

        {/* Import Showdown Team */}
        <div
          className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
        >
          <h3 className="text-lg font-bold mb-2">Import Showdown Team</h3>
          <p className="text-sm opacity-70 mb-4">
            Paste a Showdown team export to add it to your Saved Teams.
          </p>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="import-team-name"
                className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-70"
              >
                Team Name
              </label>
              <input
                id="import-team-name"
                type="text"
                value={importTeamName}
                onChange={(e) => setImportTeamName(e.target.value)}
                maxLength={50}
                className={`w-full p-2 rounded-lg border ${theme === 'dark' ? 'bg-black/30 border-white/20 text-white' : 'bg-white border-slate-300'}`}
                placeholder="My Awesome Team"
              />
            </div>

            <div>
              <label htmlFor="import-showdown" className="sr-only">
                Paste Showdown Text
              </label>
              <textarea
                id="import-showdown"
                value={showdownImportText}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_INPUT_LENGTH) {
                    setShowdownImportText(e.target.value);
                  }
                }}
                maxLength={MAX_INPUT_LENGTH}
                className={`w-full h-32 p-3 rounded-lg border text-sm font-mono ${theme === 'dark' ? 'bg-black/30 border-white/20 text-white' : 'bg-white border-slate-300'}`}
                placeholder={`Pikachu @ Light Ball\nAbility: Static\nEVs: 252 Atk / 252 Spe\n...`}
              />
            </div>

            <button
              onClick={handleShowdownImport}
              disabled={!showdownImportText.trim() || isImportingShowdown}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImportingShowdown ? 'Saving...' : 'Save to My Teams'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DataManagement;
