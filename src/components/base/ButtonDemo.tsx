/**
 * Button Component Demo
 * 
 * Quick visual demo of the Button component.
 * Use this to test the component during development.
 * 
 * To use: Import this component in your App.tsx or create a dedicated demo route.
 */

import React, { useState } from 'react';
import { Button } from './Button';

// Simple SVG icons for demo
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

export function ButtonDemo() {
  const [isLoading, setIsLoading] = useState(false);

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Button Component Demo</h1>
          <p className="text-slate-400">Production-ready button component for Pokedex app</p>
        </div>

        {/* Variants */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Variants</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => console.log('Primary clicked')}>
              Primary Button
            </Button>
            <Button variant="secondary" onClick={() => console.log('Secondary clicked')}>
              Secondary Button
            </Button>
            <Button variant="ghost" onClick={() => console.log('Ghost clicked')}>
              Ghost Button
            </Button>
            <Button variant="danger" onClick={() => console.log('Danger clicked')}>
              Danger Button
            </Button>
          </div>
        </section>

        {/* Sizes */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Sizes</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="primary">Small</Button>
            <Button size="md" variant="primary">Medium</Button>
            <Button size="lg" variant="primary">Large</Button>
          </div>
        </section>

        {/* With Icons */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">With Icons</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" icon={<PlusIcon />}>
              Add to Team
            </Button>
            <Button variant="secondary" icon={<SearchIcon />} iconPosition="left">
              Search
            </Button>
            <Button variant="danger" icon={<TrashIcon />} iconPosition="right">
              Delete
            </Button>
            <Button variant="ghost" icon={<SearchIcon />} aria-label="Search" />
          </div>
        </section>

        {/* Loading States */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Loading States</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" loading>
              Loading...
            </Button>
            <Button variant="secondary" loading>
              Processing
            </Button>
            <Button variant="danger" loading>
              Deleting
            </Button>
            <Button variant="primary" onClick={simulateLoading} loading={isLoading}>
              {isLoading ? 'Saving...' : 'Click to Simulate'}
            </Button>
          </div>
        </section>

        {/* Disabled States */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Disabled States</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" disabled>
              Disabled Primary
            </Button>
            <Button variant="secondary" disabled>
              Disabled Secondary
            </Button>
            <Button variant="danger" disabled>
              Disabled Danger
            </Button>
          </div>
        </section>

        {/* Full Width */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Full Width</h2>
          <div className="space-y-3 max-w-md">
            <Button variant="primary" fullWidth>
              Full Width Button
            </Button>
            <Button variant="secondary" fullWidth icon={<PlusIcon />}>
              With Icon
            </Button>
            <Button variant="danger" fullWidth loading>
              Loading Full Width
            </Button>
          </div>
        </section>

        {/* Real-world Example */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Real-world Example: Pokemon Card</h2>
          <div className="bg-slate-800/50 rounded-xl p-6 max-w-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 bg-slate-700 rounded-lg flex items-center justify-center text-4xl">
                🔥
              </div>
              <div>
                <p className="text-sm text-slate-400">#004</p>
                <h3 className="text-xl font-bold">Charmander</h3>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs bg-orange-500 px-2 py-0.5 rounded">Fire</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Button variant="primary" fullWidth icon={<PlusIcon />}>
                Add to Team
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" icon={<SearchIcon />} fullWidth>
                  View Details
                </Button>
                <Button variant="danger" size="sm" icon={<TrashIcon />}>
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Keyboard Navigation Info */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Accessibility Test</h2>
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h3 className="font-semibold mb-3">Try Keyboard Navigation:</h3>
            <ul className="space-y-2 text-sm text-slate-300 mb-4">
              <li>• Press <kbd className="px-2 py-1 bg-slate-700 rounded">Tab</kbd> to navigate</li>
              <li>• Press <kbd className="px-2 py-1 bg-slate-700 rounded">Enter</kbd> or <kbd className="px-2 py-1 bg-slate-700 rounded">Space</kbd> to activate</li>
              <li>• Notice the focus ring (appears only on keyboard focus)</li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">First Button</Button>
              <Button variant="secondary">Second Button</Button>
              <Button variant="ghost">Third Button</Button>
              <Button variant="danger">Fourth Button</Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="pt-8 border-t border-slate-700">
          <p className="text-sm text-slate-400">
            ✅ All features implemented: Variants, Sizes, Icons, Loading, Disabled, Full Width, Accessibility
          </p>
        </div>
      </div>
    </div>
  );
}

export default ButtonDemo;
