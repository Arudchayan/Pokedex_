import React, { useMemo } from 'react';
import { Evolution } from '../../types';
import { usePokemon } from '../../context/PokemonContext';

interface EvolutionGraphProps {
  chain: Evolution[];
  onSelectPokemon: (id: number) => void;
  onOpenItemDex?: (search?: string) => void;
}

interface TreeNode {
  data: Evolution;
  children: TreeNode[];
}

// Transform flat list to tree
const buildTree = (flatList: Evolution[]): TreeNode[] => {
  const idMap: Record<number, TreeNode> = {};
  const roots: TreeNode[] = [];

  // Initialize nodes
  flatList.forEach((evo) => {
    idMap[evo.id] = { data: evo, children: [] };
  });

  // Build hierarchy
  flatList.forEach((evo) => {
    if (evo.evolvesFromId && idMap[evo.evolvesFromId]) {
      idMap[evo.evolvesFromId].children.push(idMap[evo.id]);
    } else {
      roots.push(idMap[evo.id]);
    }
  });

  return roots;
};

// --- Components ---

const TriggerLabel: React.FC<{
    evo: Evolution;
    theme: 'dark' | 'light';
    direction: 'vertical' | 'horizontal';
    onOpenItemDex?: (search?: string) => void;
}> = ({
  evo,
  theme,
  direction,
  onOpenItemDex
}) => {
  const elements = [];
  if (evo.minLevel) elements.push(<span key="lvl">Lvl {evo.minLevel}</span>);
  if (evo.trigger === 'trade') elements.push(<span key="trade">Trade</span>);
  if (evo.item) {
      elements.push(
          <button
              key="item"
              onClick={() => onOpenItemDex?.(evo.item)}
              className="hover:text-primary-400 hover:underline cursor-pointer"
          >
              {evo.item}
          </button>
      );
  }
  if (evo.heldItem) {
      elements.push(
          <span key="held">
              Hold{' '}
              <button
                  onClick={() => onOpenItemDex?.(evo.heldItem)}
                  className="hover:text-primary-400 hover:underline cursor-pointer"
              >
                  {evo.heldItem}
              </button>
          </span>
      );
  }
  if (evo.minHappiness) elements.push(<span key="happy">Happy</span>);
  if (evo.knownMove) elements.push(<span key="move">Knows {evo.knownMove}</span>);
  if (evo.timeOfDay) elements.push(<span key="time">{evo.timeOfDay}</span>);
  if (evo.location) elements.push(<span key="loc">{evo.location}</span>);
  if (elements.length === 0 && evo.trigger) elements.push(<span key="trig">{evo.trigger}</span>);

  return (
    <div
      className={`absolute z-10 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap border shadow-sm flex items-center gap-1
        ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}
        ${direction === 'horizontal'
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'}
      `}
    >
      {elements.map((el, i) => (
          <React.Fragment key={i}>
              {i > 0 && <span>, </span>}
              {el}
          </React.Fragment>
      ))}
      {/* Arrow Icon */}
      <span className="ml-1 opacity-50">{direction === 'horizontal' ? '→' : '↓'}</span>
    </div>
  );
};

const PokemonNode: React.FC<{
  evo: Evolution;
  onSelect: (id: number) => void;
  theme: 'dark' | 'light';
}> = ({ evo, onSelect, theme }) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(evo.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(evo.id);
        }
      }}
      className={`
        relative group flex flex-col items-center justify-center
        w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0
        rounded-2xl cursor-pointer transition-all duration-300
        border-2 outline-none focus:ring-4 focus:ring-primary-500/50
        ${
          theme === 'dark'
            ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-700 hover:border-primary-400'
            : 'bg-white border-slate-200 hover:border-primary-400 hover:shadow-lg'
        }
      `}
    >
      <div className="w-16 h-16 relative mb-1">
        <img
          src={evo.imageUrl}
          alt={evo.name}
          className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      <div className="text-center px-1 w-full">
        <p className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
          {evo.name}
        </p>
      </div>
    </div>
  );
};

// --- Recursive Tree Renderers ---

const ResponsiveGraphNode: React.FC<{
    node: TreeNode,
    onSelect: (id: number) => void,
    onOpenItemDex?: (search?: string) => void,
    theme: 'dark' | 'light',
    isRoot?: boolean,
    index?: number,
    totalSiblings?: number
}> = ({ node, onSelect, onOpenItemDex, theme, isRoot = false, index = 0, totalSiblings = 1 }) => {

    return (
        <li className={`flex ${isRoot ? 'items-center' : ''} ${isRoot ? 'py-0' : 'py-2 relative items-center'}`}>

             {/* Vertical Line Connector Logic (Spine for siblings) */}
             {!isRoot && totalSiblings > 1 && (
                 <div className={`absolute -left-[1px] w-0.5 ${theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'}`}
                    style={{
                        height: '100%',
                        top: index === 0 ? '50%' : '0',
                        // Cut off the bottom half of the last child
                        maxHeight: index === totalSiblings - 1 ? '50%' : '100%'
                    }}
                 />
              )}

            <div className="flex flex-row items-center">

                {/* Connector to Parent (if not root) */}
                {!isRoot && (
                     <div className="w-12 sm:w-16 relative flex items-center justify-center">
                        <div className={`h-0.5 w-full ${theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
                        <TriggerLabel evo={node.data} theme={theme} direction="horizontal" onOpenItemDex={onOpenItemDex} />
                     </div>
                )}

                <PokemonNode evo={node.data} onSelect={onSelect} theme={theme} />

                {/* Children */}
                {node.children.length > 0 && (
                    <div className="flex flex-row items-center">
                         {/* Line from Current Node to Branch Hub */}
                         <div className={`w-8 sm:w-12 h-0.5 ${theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'}`}></div>

                         {/* Children List */}
                         <ul className="flex flex-col justify-center pl-0 relative">
                             {/* Vertical Spine (Left border of UL logic replaced by per-child lines) */}

                             {node.children.map((child, idx) => (
                                 <ResponsiveGraphNode
                                    key={child.data.id}
                                    node={child}
                                    onSelect={onSelect}
                                    onOpenItemDex={onOpenItemDex}
                                    theme={theme}
                                    index={idx}
                                    totalSiblings={node.children.length}
                                 />
                             ))}
                         </ul>
                    </div>
                )}
            </div>
        </li>
    );
};


const EvolutionGraph: React.FC<EvolutionGraphProps> = ({ chain, onSelectPokemon, onOpenItemDex }) => {
  const { theme } = usePokemon();
  const roots = useMemo(() => buildTree(chain), [chain]);

  if (!chain || chain.length === 0) return null;

  return (
    <div className={`w-full overflow-x-auto p-4 rounded-xl ${theme === 'dark' ? 'bg-black/20' : 'bg-slate-50/50'}`}>
        <div className="min-w-max flex flex-col items-center justify-center">
            <ul className="flex flex-col gap-8">
                {roots.map(root => (
                    <ResponsiveGraphNode
                        key={root.data.id}
                        node={root}
                        onSelect={onSelectPokemon}
                        onOpenItemDex={onOpenItemDex}
                        theme={theme}
                        isRoot
                    />
                ))}
            </ul>
        </div>

        <div className={`text-center mt-4 text-xs italic ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
           Scroll to see more forms &rarr;
        </div>
    </div>
  );
};

export default EvolutionGraph;
