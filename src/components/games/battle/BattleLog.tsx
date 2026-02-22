import React, { useEffect, useRef } from 'react';
import { usePokemon } from '../../../context/PokemonContext';

interface Props {
    logs: string[];
}

const BattleLog: React.FC<Props> = ({ logs }) => {
    const { theme } = usePokemon();
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className={`w-full h-32 overflow-y-auto p-4 rounded-xl border font-mono text-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
            {logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
            ))}
            <div ref={endRef} />
        </div>
    );
};

export default BattleLog;
