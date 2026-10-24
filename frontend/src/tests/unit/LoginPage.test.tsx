import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from '../../features/auth/pages/LoginPage';

const { signInEmail, navigate } = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('../../features/auth/lib/neon', () => ({
  neon: { signIn: { email: signInEmail } },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

beforeEach(() => {
  signInEmail.mockReset();
  navigate.mockReset();
});

async function enterCredentials(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Email Address'), 'pilot@example.com');
  await user.type(screen.getByLabelText('Password'), 'test-password');
}

describe('LoginPage', () => {
  it('renders the required email and password fields', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText('Email Address')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Email Address')).toBeRequired();
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Password')).toBeRequired();
    expect(screen.getByRole('button', { name: 'Log In' })).toHaveAttribute('type', 'submit');
  });

  it('lets the user enter credentials without submitting them', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await enterCredentials(user);

    expect(screen.getByLabelText('Email Address')).toHaveValue('pilot@example.com');
    expect(screen.getByLabelText('Password')).toHaveValue('test-password');
    expect(signInEmail).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('submits the credentials and navigates to the main menu after success', async () => {
    signInEmail.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginPage />);

    await enterCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Log In' }));

    expect(signInEmail).toHaveBeenCalledExactlyOnceWith({ email: 'pilot@example.com', password: 'test-password' });
    await waitFor(() => expect(navigate).toHaveBeenCalledExactlyOnceWith('/main-menu'));
  });

  it('shows an authentication error without navigating', async () => {
    signInEmail.mockResolvedValue({ error: { message: 'Incorrect email or password' } });
    const user = userEvent.setup();
    render(<LoginPage />);

    await enterCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Log In' }));

    expect(await screen.findByText('Incorrect email or password')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows the fallback error when authentication fails without a message', async () => {
    signInEmail.mockRejectedValue({});
    const user = userEvent.setup();
    render(<LoginPage />);

    await enterCredentials(user);
    await user.click(screen.getByRole('button', { name: 'Log In' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('navigates to registration when the user selects the registration action', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Need an account? Register here' }));

    expect(navigate).toHaveBeenCalledExactlyOnceWith('/register');
    expect(signInEmail).not.toHaveBeenCalled();
  });
});
