import React, { useEffect, useRef, useState } from 'react';
import { PokemonListItem } from '../../types';
import { exportToShowdown, importFromShowdown } from '../../utils/teamExport';
import { usePokemon } from '../../context/PokemonContext';
import { usePokemonStore } from '../../store/usePokemonStore';
import { useToast } from '../../context/ToastContext';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';
import Modal from '../base/Modal';

interface TeamExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: PokemonListItem[];
}

const TeamExportModal: React.FC<TeamExportModalProps> = ({ isOpen, onClose, team }) => {
  const { masterPokemonList, theme } = usePokemon();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [exportText] = useState(exportToShowdown(team));
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportText);
    addToast('Copied to clipboard!', 'success');
  };

  const handleImport = () => {
    // SECURITY: Prevent DoS with large payloads
    if (importText.length > MAX_INPUT_LENGTH) {
      addToast('Input data too large.', 'error');
      return;
    }

    const importedTeam = importFromShowdown(importText, masterPokemonList);

    if (importedTeam.length === 0) {
      addToast('No valid Pokemon found in the text.', 'error');
      return;
    }

    // We need to replace the current team or merge?
    // "Import" usually implies replacing or adding.
    // Let's Replace for simplicity as "Load Team", or maybe append?
    // Given the capacity limit (6), replacing is safer or we fill up to 6.

    // Let's try to fill up to 6.
    // Actually, let's just dispatch SET_TEAM for the whole list (up to 6)

    const finalTeam = importedTeam.slice(0, 6);
    usePokemonStore.getState().setTeam(finalTeam);
    addToast(`Successfully imported ${finalTeam.length} Pokemon!`, 'success');
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Team" size="md">
      <div className="flex gap-2 mb-4 border-b border-slate-700">
        <button
          className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'export' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => setActiveTab('export')}
        >
          Export
        </button>
        <button
          className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'import' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => setActiveTab('import')}
        >
          Import
        </button>
      </div>

      {activeTab === 'export' ? (
        <div className="space-y-4">
          <p id="export-modal-desc" className="text-sm text-slate-400">
            Copy this text to share your team or use it in Pokemon Showdown.
          </p>
          <textarea
            readOnly
            value={exportText}
            className={`w-full h-48 p-3 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'dark' ? 'bg-black/30 text-slate-300' : 'bg-slate-100 text-slate-800'}`}
          />
          <button
            onClick={handleCopy}
            className="w-full py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold transition-colors"
          >
            Copy to Clipboard
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p id="export-modal-desc" className="text-sm text-slate-400">
            Paste a team (Showdown format) here to load it.
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            maxLength={MAX_INPUT_LENGTH}
            placeholder={`Pikachu @ Light Ball
Ability: Static
EVs: 252 Atk / 252 Spe
- Thunderbolt
- Quick Attack`}
            className={`w-full h-48 p-3 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 ${theme === 'dark' ? 'bg-black/30 text-slate-300' : 'bg-slate-100 text-slate-800'}`}
          />
          <button
            onClick={handleImport}
            disabled={!importText.trim()}
            className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-bold transition-colors"
          >
            Import Team
          </button>
        </div>
      )}
    </Modal>
  );
};

export default TeamExportModal;
