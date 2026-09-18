import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../foundation/components/button/Button';
import { neon } from '../../lib/neon';

export function VerifyEmailForm() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleVerify = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      // Pass the code inside the query object as the token parameter
      const { error } = await neon.emailOtp.verifyEmail({
        email,
        otp: code,
      });
      if (error) throw error;

      setSuccessMsg('Email verified successfully! Redirecting...');
      setTimeout(() => navigate('/menu'), 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Invalid or expired code.');
    }
  };

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-4 text-left">
      <p className="text-sm text-slate-300">Please enter the verification code sent to your email address.</p>

      <div>
        <label htmlFor="verify-email" className="mb-1 block text-sm font-bold text-slate-300">
          Email Address
        </label>
        <input
          id="verify-email"
          type="email"
          required
          className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white focus:border-robot-orange focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="verify-code" className="mb-1 block text-sm font-bold text-slate-300">
          Verification Code
        </label>
        <input
          id="verify-code"
          type="text"
          required
          placeholder="Enter 6-digit code"
          className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white focus:border-robot-orange focus:outline-none"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>

      {errorMsg && <p className="text-sm font-bold text-red-500">{errorMsg}</p>}
      {successMsg && <p className="text-sm font-bold text-green-500">{successMsg}</p>}

      <Button type="submit" className="mt-2 w-full" size="large" variant="primary">
        Verify Email
      </Button>

      <div className="mt-2 text-center">
        <button
          type="button"
          className="cursor-pointer border-none bg-transparent text-sm text-slate-400 underline hover:text-white"
          onClick={() => navigate('/login')}
        >
          Back to Login
        </button>
      </div>
    </form>
  );
}
