/**
 * Card and Badge Component Examples
 *
 * This file demonstrates all the usage patterns for the Card and Badge components.
 * Use this as a reference for implementing these components in your features.
 */

import React, { useState } from 'react';
import { Card } from './Card';
import { Badge } from './Badge';

export const CardExamples: React.FC = () => {
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold text-white">Card Component Examples</h1>

      {/* Basic Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Basic Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="elevated">
            <h3 className="text-lg font-bold text-white mb-2">Elevated Card</h3>
            <p className="text-slate-300">Default variant with shadow and backdrop blur</p>
          </Card>

          <Card variant="outlined">
            <h3 className="text-lg font-bold text-white mb-2">Outlined Card</h3>
            <p className="text-slate-300">Transparent with border</p>
          </Card>

          <Card variant="filled">
            <h3 className="text-lg font-bold text-white mb-2">Filled Card</h3>
            <p className="text-slate-300">Solid background color</p>
          </Card>
        </div>
      </section>

      {/* Padding Sizes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Padding Sizes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="sm">
            <p className="text-slate-300">Small padding (p-3)</p>
          </Card>

          <Card padding="md">
            <p className="text-slate-300">Medium padding (p-4)</p>
          </Card>

          <Card padding="lg">
            <p className="text-slate-300">Large padding (p-6)</p>
          </Card>
        </div>
      </section>

      {/* Interactive Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Interactive Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card interactive onClick={() => alert('Card clicked!')}>
            <h3 className="text-lg font-bold text-white mb-2">Click Me!</h3>
            <p className="text-slate-300">
              Interactive cards have hover effects and are keyboard accessible
            </p>
          </Card>

          <Card variant="outlined" interactive onClick={() => alert('Another click!')}>
            <h3 className="text-lg font-bold text-white mb-2">Or Click Me!</h3>
            <p className="text-slate-300">Try hovering or pressing Enter/Space when focused</p>
          </Card>
        </div>
      </section>

      {/* Composition Pattern */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Composition Pattern</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card variant="elevated" padding="lg">
            <Card.Header>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Pikachu</h3>
                <span className="text-sm text-slate-400">#0025</span>
              </div>
            </Card.Header>

            <Card.Body>
              <p className="text-slate-300 mb-3">The Electric Mouse Pokemon</p>
              <div className="flex gap-2">
                <Badge variant="solid" color="#F8D030">
                  Electric
                </Badge>
              </div>
            </Card.Body>

            <Card.Footer>
              <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 transition-colors">
                Add to Team
              </button>
            </Card.Footer>
          </Card>

          <Card variant="outlined" padding="md">
            <Card.Header>
              <h3 className="text-xl font-bold text-white">Team Analysis</h3>
            </Card.Header>

            <Card.Body>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span>Offensive Coverage</span>
                  <span className="font-semibold text-green-400">Excellent</span>
                </div>
                <div className="flex justify-between">
                  <span>Defensive Coverage</span>
                  <span className="font-semibold text-yellow-400">Good</span>
                </div>
                <div className="flex justify-between">
                  <span>Type Balance</span>
                  <span className="font-semibold text-blue-400">Average</span>
                </div>
              </div>
            </Card.Body>

            <Card.Footer>
              <p className="text-xs text-slate-400">Last updated: Just now</p>
            </Card.Footer>
          </Card>
        </div>
      </section>
    </div>
  );
};

export const BadgeExamples: React.FC = () => {
  const [filters, setFilters] = useState(['Fire Type', 'Generation 1', 'Legendary']);

  const removeFilter = (filter: string) => {
    setFilters(filters.filter((f) => f !== filter));
  };

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold text-white">Badge Component Examples</h1>

      {/* Basic Badges */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Basic Badges</h2>
        <div className="flex flex-wrap gap-3">
          <Badge variant="solid">Solid</Badge>
          <Badge variant="soft">Soft</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      {/* Sizes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Sizes</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
          <Badge size="lg">Large</Badge>
        </div>
      </section>

      {/* Custom Colors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Custom Colors</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-400 mb-2">Solid Variant</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="solid" color="#F08030">
                Fire
              </Badge>
              <Badge variant="solid" color="#6890F0">
                Water
              </Badge>
              <Badge variant="solid" color="#78C850">
                Grass
              </Badge>
              <Badge variant="solid" color="#F8D030">
                Electric
              </Badge>
              <Badge variant="solid" color="#F85888">
                Psychic
              </Badge>
              <Badge variant="solid" color="#705898">
                Ghost
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-2">Soft Variant</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="soft" color="#F08030">
                Fire
              </Badge>
              <Badge variant="soft" color="#6890F0">
                Water
              </Badge>
              <Badge variant="soft" color="#78C850">
                Grass
              </Badge>
              <Badge variant="soft" color="#F8D030">
                Electric
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-2">Outline Variant</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" color="#F08030">
                Fire
              </Badge>
              <Badge variant="outline" color="#6890F0">
                Water
              </Badge>
              <Badge variant="outline" color="#78C850">
                Grass
              </Badge>
              <Badge variant="outline" color="#F8D030">
                Electric
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Status Badges */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Status Badges</h2>
        <div className="flex flex-wrap gap-3">
          <Badge variant="solid" color="#10b981" size="sm">
            Active
          </Badge>
          <Badge variant="soft" color="#f59e0b" size="sm">
            Pending
          </Badge>
          <Badge variant="outline" color="#ef4444" size="sm">
            Inactive
          </Badge>
          <Badge variant="solid" color="#8b5cf6" size="sm">
            Legendary
          </Badge>
          <Badge variant="soft" color="#3b82f6" size="sm">
            New
          </Badge>
        </div>
      </section>

      {/* Removable Badges (Filter Chips) */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Removable Badges</h2>
        <p className="text-slate-400 text-sm">Click the × to remove filters</p>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Badge key={filter} variant="soft" removable onRemove={() => removeFilter(filter)}>
              {filter}
            </Badge>
          ))}
          {filters.length === 0 && <p className="text-slate-400 text-sm">No active filters</p>}
        </div>
        {filters.length > 0 && (
          <button
            onClick={() => setFilters([])}
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            Clear all filters
          </button>
        )}
      </section>

      {/* Practical Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Practical Examples</h2>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-400 mb-2">Pokemon Card Header</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">Charizard</span>
                <Badge variant="soft" color="#f59e0b" size="sm">
                  BST 534
                </Badge>
              </div>
              <Badge variant="solid" color="#8b5cf6" size="sm">
                Legendary
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-2">Pokemon Types</p>
            <div className="flex gap-2">
              <Badge variant="solid" color="#F08030">
                Fire
              </Badge>
              <Badge variant="solid" color="#A890F0">
                Flying
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-2">Team Stats</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" size="sm">
                6/6 Pokemon
              </Badge>
              <Badge variant="soft" color="#10b981" size="sm">
                Good Coverage
              </Badge>
              <Badge variant="soft" color="#f59e0b" size="sm">
                3 Weaknesses
              </Badge>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Combined demo component
export const BaseComponentsDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cards' | 'badges'>('cards');

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Tab Navigation */}
      <div className="border-b border-white/10 p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'cards'
                ? 'bg-primary-600 text-white'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Card Examples
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'badges'
                ? 'bg-primary-600 text-white'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Badge Examples
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'cards' ? <CardExamples /> : <BadgeExamples />}
    </div>
  );
};

export default BaseComponentsDemo;
