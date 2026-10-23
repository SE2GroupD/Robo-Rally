import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../foundation/components/button/Button';
import { neon } from '../lib/neon';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendReset = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await neon.forgetPassword.emailOtp({ email });
      if (error) throw error;
      // Updated to clean root path
      navigate('/reset-password', { state: { email } });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send reset code');
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSendReset} className="flex flex-col gap-4 text-left">
        <div>
          <label htmlFor="forgot-email" className="mb-1 block text-sm font-bold text-slate-300">
            Email Address
          </label>
          <input
            id="forgot-email"
            type="email"
            required
            className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white focus:border-robot-orange focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {errorMsg && <p className="text-sm font-bold text-red-500">{errorMsg}</p>}

        <Button type="submit" className="mt-2 w-full" size="large" variant="primary">
          {isLoading ? 'Sending...' : 'Send Reset Code'}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          className="cursor-pointer border-none bg-transparent text-sm text-slate-400 underline hover:text-white"
          onClick={() => navigate('/login')}
        >
          Back to Login
        </button>
      </div>
    </>
  );
}
