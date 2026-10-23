import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../../foundation/components/button/Button';
import { neon } from '../lib/neon';

export function ResetPasswordForm() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract email passed from ForgotPasswordForm state, fallback to empty string if accessed directly
  const email = (location.state as { email?: string })?.email || '';

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      const { error } = await neon.emailOtp.resetPassword({
        email,
        otp,
        password: newPassword,
      });
      if (error) throw error;
      navigate('/menu');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired code');
    }
  };

  return (
    <>
      <p className="mb-4 text-sm font-bold text-green-500 text-center">Reset code deployed to your inbox!</p>

      <form onSubmit={handleReset} className="flex flex-col gap-4 text-left">
        <div>
          <label htmlFor="reset-email" className="mb-1 block text-sm font-bold text-slate-300">
            Email Address
          </label>
          <input
            id="reset-email"
            type="email"
            disabled
            className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-slate-500 focus:outline-none opacity-50"
            value={email}
          />
        </div>

        <div>
          <label htmlFor="reset-otp" className="mb-1 block text-sm font-bold text-slate-300">
            Recovery Code (OTP)
          </label>
          <input
            id="reset-otp"
            type="text"
            required
            className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white focus:border-robot-orange focus:outline-none"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
          />
        </div>

        <div>
          <label htmlFor="reset-new-password" className="mb-1 block text-sm font-bold text-slate-300">
            New Password
          </label>
          <input
            id="reset-new-password"
            type="password"
            required
            className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white focus:border-robot-orange focus:outline-none"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        {errorMsg && <p className="text-sm font-bold text-red-500">{errorMsg}</p>}

        <Button type="submit" className="mt-2 w-full" size="large" variant="primary">
          Set New Password
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
