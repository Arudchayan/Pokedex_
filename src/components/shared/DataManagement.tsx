import React, { useEffect, useRef, useState } from 'react';
import { usePokemon } from '../../context/PokemonContext';
import { usePokemonStore } from '../../store/usePokemonStore';
import { useToast } from '../../context/ToastContext';
import { useAchievements } from '../../context/AchievementContext';
import {
  buildPersistenceData,
  parsePersistenceBackup,
  PersistenceRestorePayload,
} from '../../utils/persistenceSchema';
import { SavedTeam } from '../../utils/teamStorage';
import { importFromShowdown } from '../../utils/teamExport';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';
import { compressTeam } from '../../utils/urlCompression';
import Modal from '../base/Modal';

interface DataManagementProps {
  onClose: () => void;
}

const formatBackupDate = (timestamp: string): string =>
  new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const formatCount = (count: number, singular: string): string =>
  `${count} ${singular}${count === 1 ? '' : 's'}`;

const DataManagement: React.FC<DataManagementProps> = ({ onClose }) => {
  const { theme, teamPokemon: team, favorites, masterPokemonList } = usePokemon();
  const { addToast } = useToast();
  const { unlockAchievement } = useAchievements();
  const [importData, setImportData] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [isImportingShowdown, setIsImportingShowdown] = useState(false);
  const [parsedBackup, setParsedBackup] = useState<PersistenceRestorePayload | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    teamMembers: number;
    favorites: number;
    savedTeams: number;
  } | null>(null);

  const restoreButtonRef = useRef<HTMLButtonElement>(null);
  const confirmPanelRef = useRef<HTMLDivElement>(null);
  const confirmTitleRef = useRef<HTMLHeadingElement>(null);
  const successRef = useRef<HTMLParagraphElement>(null);

  // Showdown Import State
  const [showdownImportText, setShowdownImportText] = useState('');
  const [importTeamName, setImportTeamName] = useState('Imported Team');

  useEffect(() => {
    if (!isConfirmingRestore) return;
    confirmTitleRef.current?.focus();
    confirmPanelRef.current?.scrollIntoView?.({ block: 'center' });
  }, [isConfirmingRestore]);

  useEffect(() => {
    if (importSummary) {
      successRef.current?.focus();
    }
  }, [importSummary]);

  const handleGenerateLink = async () => {
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

      try {
        await navigator.clipboard.writeText(finalUrl);
        addToast('Link generated and copied to clipboard!', 'success');
      } catch {
        addToast('Link generated. Copy it manually from the box below.', 'info');
      }
    } catch (_e) {
      addToast('Failed to generate link.', 'error');
    }
  };

  const handleExport = () => {
    const savedTeams = usePokemonStore.getState().savedTeams;
    const data = buildPersistenceData({ team, favorites, savedTeams, theme });
    const json = JSON.stringify(data, null, 2);

    // Create download link
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pokedex_data_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    addToast('Data exported successfully!', 'success');
  };

  const handleBackupInputChange = (value: string) => {
    if (value.length > MAX_INPUT_LENGTH) return;

    setImportData(value);
    setImportSummary(null);
    setIsConfirmingRestore(false);

    const result = parsePersistenceBackup(value);
    if (result.ok) {
      setParsedBackup(result.backup);
      setBackupError(null);
    } else {
      setParsedBackup(null);
      setBackupError(value.trim() ? result.error : null);
    }
  };

  const handleReviewRestore = () => {
    if (!parsedBackup) return;
    setImportSummary(null);
    setIsConfirmingRestore(true);
  };

  const handleCancelRestore = () => {
    setIsConfirmingRestore(false);
    restoreButtonRef.current?.focus();
  };

  const handleConfirmRestore = () => {
    if (!parsedBackup) return;

    // Validation completed before this point; every write below is a synchronous
    // in-memory store update, so a malformed backup never reaches application state.
    const store = usePokemonStore.getState();
    store.setTeam(parsedBackup.team);
    store.setFavorites(new Set(parsedBackup.favorites));
    store.setSavedTeams(parsedBackup.savedTeams);
    store.setTheme(parsedBackup.theme);

    setImportSummary({
      teamMembers: parsedBackup.team.length,
      favorites: parsedBackup.favorites.length,
      savedTeams: parsedBackup.savedTeams.length,
    });
    setParsedBackup(null);
    setBackupError(null);
    setImportData('');
    setIsConfirmingRestore(false);

    unlockAchievement('data_hoarder');
    addToast('Backup restored. Your previous data was replaced.', 'success');
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

      // Save into Zustand-persisted savedTeams (single source of truth)
      usePokemonStore.getState().saveTeamEntry(newSavedTeam);

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
            Paste a full backup JSON file to replace your current data. You can review what will be
            restored before anything changes.
          </p>
          <label htmlFor="import-data" className="sr-only">
            Paste JSON Data
          </label>
          <textarea
            id="import-data"
            value={importData}
            onChange={(e) => handleBackupInputChange(e.target.value)}
            maxLength={MAX_INPUT_LENGTH}
            aria-invalid={backupError ? true : undefined}
            aria-describedby={backupError ? 'import-data-error' : undefined}
            className={`w-full h-32 p-3 rounded-lg border text-sm font-mono mb-3 ${
              backupError
                ? 'border-red-500/70'
                : theme === 'dark'
                  ? 'border-white/20'
                  : 'border-slate-300'
            } ${theme === 'dark' ? 'bg-black/30 text-white' : 'bg-white'}`}
            placeholder="Paste JSON here..."
          />
          {backupError && (
            <p
              id="import-data-error"
              role="alert"
              className="mb-3 text-sm font-medium text-red-600 dark:text-red-400"
            >
              {backupError}
            </p>
          )}
          <button
            ref={restoreButtonRef}
            onClick={handleReviewRestore}
            disabled={!parsedBackup || isConfirmingRestore}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Restore Backup
          </button>

          {isConfirmingRestore && parsedBackup && (
            <div
              ref={confirmPanelRef}
              role="alertdialog"
              aria-labelledby="restore-confirm-title"
              aria-describedby="restore-confirm-warning"
              className={`mt-4 rounded-xl border p-4 ${
                theme === 'dark'
                  ? 'border-amber-500/40 bg-amber-500/10'
                  : 'border-amber-300 bg-amber-50'
              }`}
            >
              <h4
                id="restore-confirm-title"
                ref={confirmTitleRef}
                tabIndex={-1}
                className="text-base font-bold mb-2 focus:outline-none"
              >
                Confirm restore
              </h4>
              <p
                id="restore-confirm-warning"
                className="text-sm font-medium mb-3 text-amber-800 dark:text-amber-200"
              >
                Restoring replaces your current team, favorites, saved teams, and theme. This cannot
                be undone.
              </p>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                <div className="flex items-center justify-between gap-2">
                  <dt className="opacity-70">Team members</dt>
                  <dd className="font-bold">{parsedBackup.team.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="opacity-70">Favorites</dt>
                  <dd className="font-bold">{parsedBackup.favorites.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="opacity-70">Saved teams</dt>
                  <dd className="font-bold">{parsedBackup.savedTeams.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="opacity-70">Theme</dt>
                  <dd className="font-bold capitalize">{parsedBackup.theme}</dd>
                </div>
              </dl>

              <p className="text-xs opacity-70 mb-4">
                Backup created {formatBackupDate(parsedBackup.timestamp)}.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleConfirmRestore}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-colors"
                >
                  Confirm Restore
                </button>
                <button
                  onClick={handleCancelRestore}
                  className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                    theme === 'dark'
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  className="text-sm font-semibold underline underline-offset-2 hover:opacity-80"
                >
                  Download current data first
                </button>
              </div>
            </div>
          )}

          {importSummary && (
            <p
              ref={successRef}
              role="status"
              tabIndex={-1}
              className="mt-3 text-sm font-medium text-green-700 dark:text-green-400 focus:outline-none"
            >
              Restored {formatCount(importSummary.teamMembers, 'team member')},{' '}
              {formatCount(importSummary.favorites, 'favorite')}, and{' '}
              {formatCount(importSummary.savedTeams, 'saved team')}.
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
