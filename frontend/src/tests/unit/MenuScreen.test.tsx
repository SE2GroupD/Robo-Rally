import { render, screen } from '@testing-library/react';
import { MenuScreen } from '../../shared/components/menu-screen/MenuScreen';

describe('MenuScreen', () => {
  it('renders title and subtitle when provided', () => {
    render(
      <MenuScreen img="/factory.png" subtitle="Robot Battle Command" title="Robo Rally">
        Start
      </MenuScreen>,
    );

    expect(screen.getByRole('heading', { name: 'Robo Rally' })).toBeInTheDocument();
    expect(screen.getByText('Robot Battle Command')).toBeInTheDocument();
  });

  it('does not render heading content when title and subtitle are omitted', () => {
    render(<MenuScreen img="/factory.png">Start</MenuScreen>);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('renders children inside the panel', () => {
    render(
      <MenuScreen img="/factory.png" title="Main Menu">
        <button type="button">Start Game</button>
      </MenuScreen>,
    );

    expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
  });

  it('passes image to Background', () => {
    render(<MenuScreen img="/factory.png">Start</MenuScreen>);

    expect(screen.getByText('Start').closest('.bg-factory-bg')).toHaveStyle({
      backgroundImage: 'url(/factory.png)',
    });
  });

  it('applies optional screen and panel class names', () => {
    render(
      <MenuScreen className="custom-screen" img="/factory.png" panelClassName="custom-panel">
        Start
      </MenuScreen>,
    );

    expect(screen.getByText('Start').closest('.custom-screen')).toBeInTheDocument();
    expect(screen.getByText('Start').closest('.custom-panel')).toBeInTheDocument();
  });
});
