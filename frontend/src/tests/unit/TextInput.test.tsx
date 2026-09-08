import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextInput } from '../../foundation/components/text-input/TextInput';

describe('TextInput', () => {
  it('renders a label connected to the input', () => {
    render(<TextInput label="Email" name="email" />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('forwards native input props', () => {
    render(
      <TextInput
        label="Email"
        name="email"
        placeholder="pilot@factory.com"
        required
        type="email"
        value="pilot@factory.com"
        readOnly
      />,
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'pilot@factory.com');
    expect(input).toBeRequired();
    expect(input).toHaveValue('pilot@factory.com');
  });

  it('calls onChange when typed into', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<TextInput label="Email" name="email" onChange={handleChange} />);
    await user.type(screen.getByLabelText('Email'), 'pilot');

    expect(handleChange).toHaveBeenCalled();
  });

  it('applies custom className to the input', () => {
    render(<TextInput className="custom-input" label="Email" name="email" />);

    expect(screen.getByLabelText('Email')).toHaveClass('custom-input');
  });
});
