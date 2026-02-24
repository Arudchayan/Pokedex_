import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('renders as button type by default', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('renders with custom type', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });

  describe('Variants', () => {
    it('applies primary variant styles by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-500');
    });

    it('applies secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-slate-700');
    });

    it('applies ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
    });

    it('applies danger variant styles', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-500');
    });
  });

  describe('Sizes', () => {
    it('applies medium size by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2', 'text-sm');
    });

    it('applies small size styles', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-xs');
    });

    it('applies large size styles', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-base');
    });
  });

  describe('Icons', () => {
    const TestIcon = () => <svg data-testid="test-icon" />;

    it('renders icon on the left by default', () => {
      render(<Button icon={<TestIcon />}>With Icon</Button>);
      const button = screen.getByRole('button');
      const icon = screen.getByTestId('test-icon');
      expect(button).toContainElement(icon);

      // Icon should come before text
      const buttonHTML = button.innerHTML;
      const iconIndex = buttonHTML.indexOf('test-icon');
      const textIndex = buttonHTML.indexOf('With Icon');
      expect(iconIndex).toBeLessThan(textIndex);
    });

    it('renders icon on the right when specified', () => {
      render(
        <Button icon={<TestIcon />} iconPosition="right">
          With Icon
        </Button>
      );
      const button = screen.getByRole('button');
      const icon = screen.getByTestId('test-icon');
      expect(button).toContainElement(icon);

      // Icon should come after text
      const buttonHTML = button.innerHTML;
      const iconIndex = buttonHTML.indexOf('test-icon');
      const textIndex = buttonHTML.indexOf('With Icon');
      expect(iconIndex).toBeGreaterThan(textIndex);
    });

    it('renders icon-only button without text', () => {
      render(<Button icon={<TestIcon />} aria-label="Icon button" />);
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveAccessibleName('Icon button');
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when loading prop is true', () => {
      render(<Button loading>Loading</Button>);
      const spinner = screen.getByRole('status', { name: /loading/i });
      expect(spinner).toBeInTheDocument();
    });

    it('disables button when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('sets aria-busy when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('hides icon when loading', () => {
      const TestIcon = () => <svg data-testid="test-icon" />;
      render(
        <Button loading icon={<TestIcon />}>
          Loading
        </Button>
      );
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });

    it('shows spinner instead of icon when loading', () => {
      const TestIcon = () => <svg data-testid="test-icon" />;
      render(
        <Button loading icon={<TestIcon />}>
          Loading
        </Button>
      );
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('sets aria-disabled when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );
      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('applies disabled opacity styles', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Full Width', () => {
    it('applies full width styles when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>);
      expect(screen.getByRole('button')).toHaveClass('w-full');
    });

    it('does not apply full width by default', () => {
      render(<Button>Normal Width</Button>);
      expect(screen.getByRole('button')).not.toHaveClass('w-full');
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button loading onClick={handleClick}>
          Loading
        </Button>
      );
      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('can be focused with keyboard', async () => {
      const user = userEvent.setup();
      render(<Button>Focus me</Button>);

      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();
    });

    it('can be activated with Enter key', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Press Enter</Button>);
      await user.tab();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be activated with Space key', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Press Space</Button>);
      await user.tab();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper role', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('supports aria-label for icon-only buttons', () => {
      const TestIcon = () => <svg data-testid="test-icon" />;
      render(<Button icon={<TestIcon />} aria-label="Add item" />);
      expect(screen.getByRole('button')).toHaveAccessibleName('Add item');
    });

    it('applies focus-visible styles', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2'
      );
    });

    it('has proper contrast for focus ring', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('focus-visible:ring-primary-500');
    });
  });

  describe('Forward Ref', () => {
    it('forwards ref to button element', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Button</Button>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('Custom Props', () => {
    it('passes through additional HTML attributes', () => {
      render(
        <Button data-testid="custom-button" id="my-button">
          Custom Props
        </Button>
      );
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('id', 'my-button');
    });

    it('merges custom className with base classes', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('inline-flex'); // base class
    });
  });
});
