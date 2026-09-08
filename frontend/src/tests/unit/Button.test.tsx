import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../foundation/components/button/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Start Game</Button>);

    expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
  });

  it('defaults to a button type', () => {
    render(<Button>Start Game</Button>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('supports submit type', () => {
    render(<Button type="submit">Log In</Button>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('supports reset type', () => {
    render(<Button type="reset">Reset</Button>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Start Game</Button>);
    await user.click(screen.getByRole('button', { name: 'Start Game' }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('blocks clicks when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button disabled onClick={handleClick}>
        Start Game
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: 'Start Game' }));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies primary variant and medium size by default', () => {
    render(<Button>Start Game</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-metal');
    expect(button).toHaveClass('px-4');
  });

  it('applies secondary variant and large size', () => {
    render(
      <Button size="large" variant="secondary">
        Play as Guest
      </Button>,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-transparent');
    expect(button).toHaveClass('px-05');
  });
});
