import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from './Card';

describe('Card Component', () => {
  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(<Card>Test content</Card>);
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('applies elevated variant classes by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white/80', 'dark:bg-black/20', 'shadow-lg');
    });

    it('applies outlined variant classes', () => {
      const { container } = render(<Card variant="outlined">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-transparent', 'border-2');
    });

    it('applies filled variant classes', () => {
      const { container } = render(<Card variant="filled">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-slate-100', 'dark:bg-slate-900/50');
    });
  });

  describe('Padding', () => {
    it('applies medium padding by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-4');
    });

    it('applies small padding', () => {
      const { container } = render(<Card padding="sm">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-3');
    });

    it('applies large padding', () => {
      const { container } = render(<Card padding="lg">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-6');
    });
  });

  describe('Interactive mode', () => {
    it('adds interactive classes when interactive is true', () => {
      const { container } = render(<Card interactive>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('cursor-pointer', 'hover:scale-[1.02]');
    });

    it('sets tabIndex to 0 when interactive', () => {
      const { container } = render(<Card interactive>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('sets role to button when interactive', () => {
      const { container } = render(<Card interactive>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('role', 'button');
    });

    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Card interactive onClick={handleClick}>
          Content
        </Card>
      );
      const card = screen.getByRole('button');
      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick on Enter key press', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Card interactive onClick={handleClick}>
          Content
        </Card>
      );
      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Composition pattern', () => {
    it('renders Card.Header correctly', () => {
      render(
        <Card>
          <Card.Header>Header content</Card.Header>
        </Card>
      );
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('renders Card.Body correctly', () => {
      render(
        <Card>
          <Card.Body>Body content</Card.Body>
        </Card>
      );
      expect(screen.getByText('Body content')).toBeInTheDocument();
    });

    it('renders Card.Footer correctly', () => {
      render(
        <Card>
          <Card.Footer>Footer content</Card.Footer>
        </Card>
      );
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('renders all composition parts together', () => {
      render(
        <Card>
          <Card.Header>Header</Card.Header>
          <Card.Body>Body</Card.Body>
          <Card.Footer>Footer</Card.Footer>
        </Card>
      );
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Body')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });

  describe('Custom props', () => {
    it('applies custom className', () => {
      const { container } = render(
        <Card className="custom-class">Content</Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });

    it('forwards additional props', () => {
      const { container } = render(
        <Card data-testid="test-card">Content</Card>
      );
      expect(container.querySelector('[data-testid="test-card"]')).toBeInTheDocument();
    });
  });

  describe('Ref forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = vi.fn();
      render(<Card ref={ref}>Content</Card>);
      expect(ref).toHaveBeenCalled();
    });
  });
});
