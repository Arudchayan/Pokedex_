import React, { memo, useCallback, useEffect, useRef } from 'react';
import { TeamMember } from '../../types';
import { exportTeamToClipboard } from '../../utils/teamExport';
import { compressTeam } from '../../utils/urlCompression';
import { TIMEOUT_DELAYS } from '../../constants';

interface TeamBuilderActionsProps {
  team: TeamMember[];
  theme: 'dark' | 'light';
  isCyberpunk: boolean;
  copyStatus: 'idle' | 'success' | 'error';
  shareLinkStatus: 'idle' | 'success' | 'error';
  onCopyStatusChange: (status: 'idle' | 'success' | 'error') => void;
  onShareLinkStatusChange: (status: 'idle' | 'success' | 'error') => void;
  onShowExport: () => void;
  onShowSavedTeams: () => void;
  onShowTrainerCard: () => void;
  onShowAnalytics: () => void;
  showAnalytics: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onRandomize: () => void;
  hasFilteredPokemon: boolean;
}

const TeamBuilderActions: React.FC<TeamBuilderActionsProps> = memo(
  ({
    team,
    theme,
    isCyberpunk,
    copyStatus,
    shareLinkStatus,
    onCopyStatusChange,
    onShareLinkStatusChange,
    onShowExport,
    onShowSavedTeams,
    onShowTrainerCard,
    onShowAnalytics,
    showAnalytics,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onClear,
    onRandomize,
    hasFilteredPokemon,
  }) => {
    const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const shareTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      return () => {
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current);
      };
    }, []);

    const handleCopyTeam = useCallback(async () => {
      try {
        const success = await exportTeamToClipboard(team);
        onCopyStatusChange(success ? 'success' : 'error');
      } catch {
        onCopyStatusChange('error');
      }
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(
        () => onCopyStatusChange('idle'),
        TIMEOUT_DELAYS.STATUS_MESSAGE
      );
    }, [team, onCopyStatusChange]);

    const handleShareLink = useCallback(async () => {
      try {
        const compressed = compressTeam(team);
        const url = new URL(window.location.href);
        url.searchParams.set('team_data', compressed);
        url.searchParams.delete('team');

        await navigator.clipboard.writeText(url.toString());
        onShareLinkStatusChange('success');
      } catch (e) {
        onShareLinkStatusChange('error');
      }
      if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current);
      shareTimeoutRef.current = setTimeout(
        () => onShareLinkStatusChange('idle'),
        TIMEOUT_DELAYS.STATUS_MESSAGE
      );
    }, [team, onShareLinkStatusChange]);

    const getCopyButtonStyles = (status: 'idle' | 'success' | 'error') => {
      if (status === 'success') {
        return 'bg-green-500/20 text-green-500 border-green-500/50';
      }
      if (status === 'error') {
        return 'bg-red-500/20 text-red-500 border-red-500/50';
      }
      return theme === 'dark'
        ? 'border-white/10 bg-white/5 text-blue-300 hover:bg-white/10 focus:ring-white/30'
        : 'border-slate-200 bg-slate-100 text-blue-600 hover:bg-slate-200 focus:ring-slate-300';
    };

    return (
      <div className="flex gap-2 flex-wrap justify-end">
        <div className="flex gap-1 mr-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-40 ${
              theme === 'dark'
                ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 focus:ring-white/30 disabled:hover:bg-white/5'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus:ring-slate-300 disabled:hover:bg-slate-50'
            }`}
            title="Undo"
            aria-label="Undo last action"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-40 ${
              theme === 'dark'
                ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 focus:ring-white/30 disabled:hover:bg-white/5'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus:ring-slate-300 disabled:hover:bg-slate-50'
            }`}
            title="Redo"
            aria-label="Redo last action"
          >
            ↷
          </button>
        </div>
        <button
          type="button"
          onClick={onShowAnalytics}
          className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-2 ${
            showAnalytics
              ? theme === 'dark'
                ? 'border-blue-400/50 bg-blue-500/20 text-blue-300'
                : 'border-blue-400/50 bg-blue-100 text-blue-700'
              : theme === 'dark'
                ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 focus:ring-white/30'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus:ring-slate-300'
          }`}
          title="Toggle Analytics"
          aria-label="Toggle team analytics"
          aria-pressed={showAnalytics}
        >
          📊
        </button>
        <button
          type="button"
          onClick={onShowTrainerCard}
          className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-2 ${
            theme === 'dark'
              ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 focus:ring-white/30'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus:ring-slate-300'
          }`}
          title="Trainer Card"
          aria-label="Show trainer card"
        >
          🎴
        </button>
        <button
          type="button"
          onClick={onShowSavedTeams}
          className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-2 ${
            theme === 'dark'
              ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 focus:ring-white/30'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus:ring-slate-300'
          }`}
          title="Saved Teams"
          aria-label="Show saved teams"
        >
          💾
        </button>
        <button
          type="button"
          onClick={handleCopyTeam}
          className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-2 ${getCopyButtonStyles(copyStatus)}`}
          title="Copy to Clipboard"
          aria-label="Copy team to clipboard"
        >
          {copyStatus === 'success' ? '✓' : copyStatus === 'error' ? '✗' : '📋'}
        </button>
        <button
          type="button"
          onClick={handleShareLink}
          className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-2 ${
            shareLinkStatus === 'success'
              ? 'bg-green-500/20 text-green-500 border-green-500/50'
              : shareLinkStatus === 'error'
                ? 'bg-red-500/20 text-red-500 border-red-500/50'
                : theme === 'dark'
                  ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 focus:ring-white/30'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus:ring-slate-300'
          }`}
          title="Share Link"
          aria-label="Share team link"
        >
          {shareLinkStatus === 'success' ? '✓' : shareLinkStatus === 'error' ? '✗' : '🔗'}
        </button>
        <button
          type="button"
          onClick={onShowExport}
          className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-2 ${
            theme === 'dark'
              ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 focus:ring-white/30'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus:ring-slate-300'
          }`}
          title="Export Team"
          aria-label="Export team"
        >
          ⬇
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={team.length === 0}
          className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-40 ${
            theme === 'dark'
              ? 'border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 focus:ring-red-400/50 disabled:hover:bg-red-500/10'
              : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-300 disabled:hover:bg-red-50'
          }`}
          title="Clear Team"
          aria-label="Clear team"
        >
          🗑
        </button>
        <button
          type="button"
          onClick={onRandomize}
          disabled={!hasFilteredPokemon}
          className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-40 ${
            theme === 'dark'
              ? 'border-purple-400/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 focus:ring-purple-400/50 disabled:hover:bg-purple-500/10'
              : 'border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100 focus:ring-purple-300 disabled:hover:bg-purple-50'
          }`}
          title="Randomize Team"
          aria-label="Randomize team"
        >
          🎲
        </button>
      </div>
    );
  }
);

TeamBuilderActions.displayName = 'TeamBuilderActions';

export default TeamBuilderActions;
