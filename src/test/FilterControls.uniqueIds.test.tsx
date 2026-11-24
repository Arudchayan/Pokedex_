import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FilterControls from '../components/layout/FilterControls';
import { renderWithProvider } from './utils';

const filterProps = {
  selectedGeneration: 'all',
  onGenerationChange: vi.fn(),
  selectedTypes: [] as string[],
  onTypeToggle: vi.fn(),
  flavorTextSearch: '',
  onFlavorTextChange: vi.fn(),
  onClearFilters: vi.fn(),
};

const renderTwoInstances = () =>
  renderWithProvider(
    <>
      <FilterControls {...filterProps} />
      <FilterControls {...filterProps} />
    </>
  );

const duplicateIds = (root: HTMLElement): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  root.querySelectorAll<HTMLElement>('[id]').forEach((element) => {
    if (seen.has(element.id)) duplicates.add(element.id);
    seen.add(element.id);
  });

  return [...duplicates];
};

describe('FilterControls instance ids', () => {
  it('keeps ids unique and every label resolvable when two instances mount together', () => {
    const { container } = renderTwoInstances();

    // Mount every collapsible section in both instances so all controls exist.
    for (const name of [/^Flavor text/i, /^Advanced/i]) {
      screen.getAllByRole('button', { name }).forEach((button) => fireEvent.click(button));
    }

    expect(duplicateIds(document.body)).toEqual([]);

    const labelTargets = Array.from(container.querySelectorAll('label[for]')).map((label) =>
      label.getAttribute('for')!
    );
    expect(labelTargets.length).toBeGreaterThan(0);
    labelTargets.forEach((id) => expect(document.getElementById(id)).not.toBeNull());

    const controls = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input[id], select[id]')
    );
    expect(controls.length).toBeGreaterThan(0);

    controls.forEach((control) => {
      const labels = Array.from(container.querySelectorAll('label')).filter(
        (label) => label.getAttribute('for') === control.id
      );
      expect(labels, `${control.tagName.toLowerCase()}#${control.id}`).toHaveLength(1);
    });

    const sectionToggles = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button[aria-expanded][aria-controls]')
    );
    expect(sectionToggles).toHaveLength(8);

    const toggleIds = sectionToggles.map((toggle) => toggle.id);
    expect(toggleIds.every(Boolean)).toBe(true);
    expect(new Set(toggleIds).size).toBe(sectionToggles.length);

    const controlledIds = sectionToggles.map((toggle) => toggle.getAttribute('aria-controls')!);
    expect(new Set(controlledIds).size).toBe(sectionToggles.length);
    controlledIds.forEach((id) => expect(document.getElementById(id)).not.toBeNull());
  });

  it('toggles expanded sections independently in each instance', () => {
    renderTwoInstances();

    const generationToggles = screen.getAllByRole('button', { name: /^Generation/i });
    expect(generationToggles).toHaveLength(2);
    generationToggles.forEach((toggle) => expect(toggle).toHaveAttribute('aria-expanded', 'true'));

    fireEvent.click(generationToggles[0]);

    expect(generationToggles[0]).toHaveAttribute('aria-expanded', 'false');
    expect(generationToggles[1]).toHaveAttribute('aria-expanded', 'true');

    const firstControls = generationToggles[0].getAttribute('aria-controls')!;
    const secondControls = generationToggles[1].getAttribute('aria-controls')!;
    expect(firstControls).not.toBe(secondControls);
    expect(document.getElementById(firstControls)).not.toBeInTheDocument();
    expect(document.getElementById(secondControls)).toBeInTheDocument();
  });
});
