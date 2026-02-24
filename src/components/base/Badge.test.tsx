import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge } from './Badge';

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(<Badge>Test badge</Badge>);
      expect(screen.getByText('Test badge')).toBeInTheDocument();
    });

    it('applies solid variant classes by default', () => {
      const { container } = render(<Badge>Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-primary-500', 'text-white');
    });

    it('applies soft variant classes', () => {
      const { container } = render(<Badge variant="soft">Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-primary-500/20', 'text-primary-400');
    });

    it('applies outline variant classes', () => {
      const { container } = render(<Badge variant="outline">Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-transparent', 'border', 'text-primary-500');
    });
  });

  describe('Sizes', () => {
    it('applies medium size by default', () => {
      const { container } = render(<Badge>Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('px-3', 'py-1', 'text-xs');
    });

    it('applies small size classes', () => {
      const { container } = render(<Badge size="sm">Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('px-2', 'py-0.5', 'text-[10px]');
    });

    it('applies large size classes', () => {
      const { container } = render(<Badge size="lg">Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('px-4', 'py-1.5', 'text-sm');
    });
  });

  describe('Custom colors', () => {
    it('applies custom color with solid variant', () => {
      const { container } = render(
        <Badge variant="solid" color="#F08030">
          Fire
        </Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({ backgroundColor: '#F08030' });
    });

    it('applies custom color with soft variant', () => {
      const { container } = render(
        <Badge variant="soft" color="#6890F0">
          Water
        </Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({
        backgroundColor: '#6890F020',
        color: '#6890F0',
      });
    });

    it('applies custom color with outline variant', () => {
      const { container } = render(
        <Badge variant="outline" color="#78C850">
          Grass
        </Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({
        // In JSDOM, computed transparent is represented as rgba(0, 0, 0, 0).
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: '#78C850',
        color: '#78C850',
      });
    });
  });

  describe('Removable functionality', () => {
    it('does not show remove button by default', () => {
      render(<Badge>Badge</Badge>);
      expect(screen.queryByLabelText('Remove badge')).not.toBeInTheDocument();
    });

    it('shows remove button when removable is true', () => {
      render(<Badge removable>Badge</Badge>);
      expect(screen.getByLabelText('Remove badge')).toBeInTheDocument();
    });

    it('calls onRemove when remove button is clicked', async () => {
      const user = userEvent.setup();
      const handleRemove = vi.fn();
      render(
        <Badge removable onRemove={handleRemove}>
          Badge
        </Badge>
      );
      const removeButton = screen.getByLabelText('Remove badge');
      await user.click(removeButton);
      expect(handleRemove).toHaveBeenCalledTimes(1);
    });

    it('stops event propagation when remove button is clicked', async () => {
      const user = userEvent.setup();
      const handleRemove = vi.fn();
      const handleBadgeClick = vi.fn();
      render(
        <Badge removable onRemove={handleRemove} onClick={handleBadgeClick}>
          Badge
        </Badge>
      );
      const removeButton = screen.getByLabelText('Remove badge');
      await user.click(removeButton);
      expect(handleRemove).toHaveBeenCalledTimes(1);
      expect(handleBadgeClick).not.toHaveBeenCalled();
    });

    it('applies different button sizes based on badge size', () => {
      const { rerender } = render(
        <Badge removable size="sm">
          Small
        </Badge>
      );
      let button = screen.getByLabelText('Remove badge');
      expect(button).toHaveClass('w-3', 'h-3');

      rerender(
        <Badge removable size="md">
          Medium
        </Badge>
      );
      button = screen.getByLabelText('Remove badge');
      expect(button).toHaveClass('w-3.5', 'h-3.5');

      rerender(
        <Badge removable size="lg">
          Large
        </Badge>
      );
      button = screen.getByLabelText('Remove badge');
      expect(button).toHaveClass('w-4', 'h-4');
    });
  });

  describe('Contrast color calculation', () => {
    it('uses light text on dark backgrounds', () => {
      const { container } = render(
        <Badge variant="solid" color="#1f2937">
          Dark
        </Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({ color: '#ffffff' });
    });

    it('uses dark text on light backgrounds', () => {
      const { container } = render(
        <Badge variant="solid" color="#f8d030">
          Light
        </Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({ color: '#1f2937' });
    });
  });

  describe('Custom props', () => {
    it('applies custom className', () => {
      const { container } = render(<Badge className="custom-class">Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('custom-class');
    });

    it('forwards additional props', () => {
      const { container } = render(<Badge data-testid="test-badge">Badge</Badge>);
      expect(container.querySelector('[data-testid="test-badge"]')).toBeInTheDocument();
    });
  });

  describe('Ref forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = vi.fn();
      render(<Badge ref={ref}>Badge</Badge>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('remove button has proper aria-label', () => {
      render(<Badge removable>Badge</Badge>);
      expect(screen.getByLabelText('Remove badge')).toBeInTheDocument();
    });

    it('remove button is keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleRemove = vi.fn();
      render(
        <Badge removable onRemove={handleRemove}>
          Badge
        </Badge>
      );
      const removeButton = screen.getByLabelText('Remove badge');
      removeButton.focus();
      await user.keyboard('{Enter}');
      expect(handleRemove).toHaveBeenCalledTimes(1);
    });

    it('remove button has focus ring classes', () => {
      render(<Badge removable>Badge</Badge>);
      const removeButton = screen.getByLabelText('Remove badge');
      expect(removeButton).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-primary-500'
      );
    });
  });
});
