import React, { useState, useEffect, memo, useRef } from 'react';
import { TeamMember } from '../../types';
import { sanitizeString } from '../../utils/securityUtils';
import { TIMEOUT_DELAYS } from '../../constants';
import { usePokemonStore } from '../../store/usePokemonStore';
import type { SavedTeamEntry } from '../../store/pokemonStoreTypes';
import Modal from '../base/Modal';

const MAX_TEAM_NAME_LENGTH = 30;

interface SavedTeamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTeam: TeamMember[];
  onLoadTeam: (team: TeamMember[]) => void;
  theme: 'dark' | 'light';
}

const SavedTeamsModal: React.FC<SavedTeamsModalProps> = memo(({
  isOpen,
  onClose,
  currentTeam,
  onLoadTeam,
  theme,
}) => {
  // Read from Zustand store — single source of truth
  const savedTeams = usePokemonStore((s) => s.savedTeams);
  const saveTeamEntry = usePokemonStore((s) => s.saveTeamEntry);
  const deleteSavedTeam = usePokemonStore((s) => s.deleteSavedTeam);

  const [newTeamName, setNewTeamName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const deleteConfirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewTeamName('');
      setError(null);
      setDeleteConfirmationId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (deleteConfirmTimeoutRef.current) clearTimeout(deleteConfirmTimeoutRef.current);
    };
  }, []);

  const handleSaveCurrentTeam = () => {
    const trimmedName = newTeamName.trim();
    if (!trimmedName) {
      setError('Please enter a team name.');
      return;
    }

    // SECURITY: Validate input length
    if (trimmedName.length > MAX_TEAM_NAME_LENGTH) {
      setError(`Team name must be ${MAX_TEAM_NAME_LENGTH} characters or less.`);
      return;
    }

    if (currentTeam.length === 0) {
        setError('Cannot save an empty team.');
        return;
    }

    // SECURITY: Sanitize input to prevent stored XSS or injection
    const sanitizedName = sanitizeString(trimmedName);

    const newTeam: SavedTeamEntry = {
      id: crypto.randomUUID(),
      name: sanitizedName,
      team: currentTeam,
      updatedAt: Date.now(),
    };

    // Dispatch to Zustand store — persisted automatically
    saveTeamEntry(newTeam);
    setNewTeamName('');
    setError(null);
  };

  const handleDeleteTeam = (id: string) => {
    // Dispatch to Zustand store — persisted automatically
    deleteSavedTeam(id);
  };

  const handleDeleteClick = (id: string) => {
    if (deleteConfirmationId === id) {
      handleDeleteTeam(id);
      setDeleteConfirmationId(null);
    } else {
      setDeleteConfirmationId(id);
      // Auto-reset confirmation after 3 seconds
      if (deleteConfirmTimeoutRef.current) clearTimeout(deleteConfirmTimeoutRef.current);
      deleteConfirmTimeoutRef.current = setTimeout(
        () => setDeleteConfirmationId((current) => (current === id ? null : current)),
        TIMEOUT_DELAYS.DELETE_CONFIRMATION
      );
    }
  };

  const handleLoad = (team: TeamMember[]) => {
      onLoadTeam(team);
      onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Saved Teams" size="md">
        <div>

            {/* Save Current Team Section */}
            <div className={`mb-6 p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className="text-sm font-bold uppercase tracking-wide mb-3">Save Current Team</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="e.g., Rain Dance Team"
                        maxLength={MAX_TEAM_NAME_LENGTH}
                        aria-label="New team name"
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            theme === 'dark'
                                ? 'bg-black/20 border-white/10 placeholder-slate-500'
                                : 'bg-white border-slate-300 placeholder-slate-400'
                        }`}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveCurrentTeam()}
                    />
                    <button
                        onClick={handleSaveCurrentTeam}
                        className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={currentTeam.length === 0}
                    >
                        Save
                    </button>
                </div>
                {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
                {currentTeam.length === 0 && <p className="mt-2 text-xs opacity-60">Add Pokemon to your team to save it.</p>}
            </div>

            {/* Saved Teams List */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wide">Your Library</h3>
                {savedTeams.length === 0 ? (
                    <div className={`text-center py-8 rounded-xl border border-dashed ${theme === 'dark' ? 'border-white/10 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
                        No saved teams yet.
                    </div>
                ) : (
                    savedTeams.map((saved) => (
                        <div key={saved.id} className={`group flex flex-col gap-2 rounded-xl border p-3 transition-all ${
                            theme === 'dark'
                                ? 'border-white/10 bg-white/5 hover:border-primary-500/50'
                                : 'border-slate-200 bg-white hover:border-primary-300'
                        }`}>
                            <div className="flex items-center justify-between">
                                <span className="font-bold truncate">{saved.name}</span>
                                <span className={`text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {new Date(saved.updatedAt).toLocaleDateString()}
                                </span>
                            </div>

                            {/* Team Preview Icons */}
                            <div className="flex gap-1 h-8">
                                {saved.team.map((member) => (
                                    <img
                                        key={member.id}
                                        src={member.imageUrl}
                                        alt={member.name}
                                        className="h-8 w-8 object-contain pixelated"
                                        loading="lazy"
                                    />
                                ))}
                                {Array.from({ length: 6 - saved.team.length }).map((_, i) => (
                                    <div key={i} className={`h-8 w-8 rounded-full border border-dashed flex items-center justify-center ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                                        <span className="text-[8px] opacity-30">•</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 mt-2 pt-2 border-t border-dashed border-opacity-20 border-gray-400">
                                <button
                                    type="button"
                                    onClick={() => handleLoad(saved.team)}
                                    className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                        theme === 'dark'
                                            ? 'bg-primary-500/20 text-primary-300 hover:bg-primary-500/30'
                                            : 'bg-primary-300/10 text-primary-600 hover:bg-primary-300/20'
                                    }`}
                                >
                                    Load
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteClick(saved.id)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                        deleteConfirmationId === saved.id
                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                            : theme === 'dark'
                                                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                                    }`}
                                    aria-label={deleteConfirmationId === saved.id ? "Confirm deletion" : "Delete team"}
                                >
                                    {deleteConfirmationId === saved.id ? "Confirm?" : "Delete"}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </Modal>
  );
});

SavedTeamsModal.displayName = 'SavedTeamsModal';

export default SavedTeamsModal;
