import { render, screen } from '@testing-library/react';
import { Background } from '../../shared/components/background/Background';

describe('Background', () => {
  it('renders children', () => {
    render(<Background img="/factory.png">Menu content</Background>);

    expect(screen.getByText('Menu content')).toBeInTheDocument();
  });

  it('applies background image from img', () => {
    const { container } = render(<Background img="/factory.png">Menu content</Background>);

    expect(container.firstElementChild).toHaveStyle({
      backgroundImage: 'url(/factory.png)',
    });
  });

  it('includes the scrim overlay', () => {
    render(<Background img="/factory.png">Menu content</Background>);

    expect(document.querySelector('.bg-scrim')).toBeInTheDocument();
  });

  it('applies caller className', () => {
    const { container } = render(
      <Background className="custom-background" img="/factory.png">
        Menu content
      </Background>,
    );

    expect(container.firstElementChild).toHaveClass('custom-background');
  });
});
