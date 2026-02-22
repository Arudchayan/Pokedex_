/**
 * Button Component Usage Examples
 * 
 * This file demonstrates all the features and use cases of the Button component.
 * Use these examples as a reference for implementing buttons throughout the app.
 */

import React from 'react';
import { Button } from './Button';

// Example icons (replace with your actual icon library)
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

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

export function ButtonExamples() {
  return (
    <div className="p-8 space-y-12 bg-slate-900 text-white">
      {/* Variants */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Variants</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Button</Button>
        </div>
      </section>

      {/* Sizes */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Sizes</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small Button</Button>
          <Button size="md">Medium Button</Button>
          <Button size="lg">Large Button</Button>
        </div>
      </section>

      {/* With Icons - Left Position */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Icons (Left Position)</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" icon={<PlusIcon />} iconPosition="left">
            Add to Team
          </Button>
          <Button variant="secondary" icon={<SearchIcon />} iconPosition="left">
            Search
          </Button>
          <Button variant="danger" icon={<TrashIcon />} iconPosition="left">
            Delete
          </Button>
        </div>
      </section>

      {/* With Icons - Right Position */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Icons (Right Position)</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" icon={<DownloadIcon />} iconPosition="right">
            Download
          </Button>
          <Button variant="secondary" icon={<SearchIcon />} iconPosition="right">
            Search
          </Button>
        </div>
      </section>

      {/* Icon Only */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Icon Only (No Text)</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" icon={<PlusIcon />} aria-label="Add" />
          <Button variant="secondary" icon={<SearchIcon />} aria-label="Search" />
          <Button variant="danger" icon={<TrashIcon />} aria-label="Delete" />
        </div>
      </section>

      {/* Loading States */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Loading States</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" loading>
            Loading...
          </Button>
          <Button variant="secondary" loading>
            Saving
          </Button>
          <Button variant="danger" loading>
            Deleting
          </Button>
          <Button variant="primary" loading size="sm">
            Small Loading
          </Button>
          <Button variant="primary" loading size="lg">
            Large Loading
          </Button>
        </div>
      </section>

      {/* Disabled States */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Disabled States</h2>
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
      <section>
        <h2 className="text-2xl font-bold mb-4">Full Width</h2>
        <div className="space-y-3 max-w-md">
          <Button variant="primary" fullWidth>
            Full Width Primary
          </Button>
          <Button variant="secondary" fullWidth icon={<PlusIcon />}>
            Full Width with Icon
          </Button>
          <Button variant="danger" fullWidth loading>
            Full Width Loading
          </Button>
        </div>
      </section>

      {/* Real-world Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Real-world Examples</h2>
        
        {/* Pokemon Card Actions */}
        <div className="space-y-6">
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Pokemon Card Actions</h3>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" icon={<PlusIcon />} fullWidth>
                Add to Team
              </Button>
              <Button variant="ghost" size="sm" icon={<SearchIcon />}>
                Details
              </Button>
            </div>
          </div>

          {/* Team Builder Actions */}
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Team Builder Actions</h3>
            <div className="flex gap-2">
              <Button variant="secondary" icon={<DownloadIcon />} iconPosition="left">
                Export Team
              </Button>
              <Button variant="danger" icon={<TrashIcon />} iconPosition="left">
                Clear Team
              </Button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Form Actions</h3>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost">Cancel</Button>
              <Button variant="primary" loading>
                Saving...
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Size Combinations */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Size Combinations with Icons</h2>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm text-slate-400 w-16">Small:</span>
            <Button variant="primary" size="sm" icon={<PlusIcon />}>
              Add
            </Button>
            <Button variant="primary" size="sm" icon={<PlusIcon />} loading>
              Adding...
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm text-slate-400 w-16">Medium:</span>
            <Button variant="primary" size="md" icon={<PlusIcon />}>
              Add
            </Button>
            <Button variant="primary" size="md" icon={<PlusIcon />} loading>
              Adding...
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm text-slate-400 w-16">Large:</span>
            <Button variant="primary" size="lg" icon={<PlusIcon />}>
              Add
            </Button>
            <Button variant="primary" size="lg" icon={<PlusIcon />} loading>
              Adding...
            </Button>
          </div>
        </div>
      </section>

      {/* Accessibility Features */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Accessibility Features</h2>
        <div className="bg-slate-800/50 p-4 rounded-lg space-y-3">
          <div>
            <h3 className="font-semibold mb-2">✓ Keyboard Navigation</h3>
            <p className="text-sm text-slate-400">All buttons are keyboard accessible with Tab key</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">✓ Focus Visible Styles</h3>
            <p className="text-sm text-slate-400">Clear focus rings for keyboard navigation</p>
            <Button variant="primary" className="mt-2">
              Tab to me and see the focus ring
            </Button>
          </div>
          <div>
            <h3 className="font-semibold mb-2">✓ ARIA Attributes</h3>
            <p className="text-sm text-slate-400">Proper aria-busy, aria-disabled, and aria-label support</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">✓ Screen Reader Support</h3>
            <p className="text-sm text-slate-400">Loading states and icon-only buttons have proper labels</p>
          </div>
        </div>
      </section>
    </div>
  );
}
