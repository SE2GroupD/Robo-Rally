import { render, screen } from '@testing-library/react';
import registerBackground from '../../assets/register.png';
import { RegisterSlot } from '../../foundation/components/register-slot/RegisterSlot';

describe('RegisterSlot', () => {
  it('uses the register image as the background', () => {
    render(
      <RegisterSlot>
        <article>Move 1</article>
      </RegisterSlot>,
    );

    const slot = screen.getByText('Move 1').parentElement;
    expect(slot).toHaveStyle({ backgroundImage: `url(${registerBackground})` });
  });

  it('contains exactly one card child', () => {
    render(
      <RegisterSlot>
        <article>Move 1</article>
      </RegisterSlot>,
    );

    expect(screen.getByText('Move 1')).toBeInTheDocument();
  });
});
