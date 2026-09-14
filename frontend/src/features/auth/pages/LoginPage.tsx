import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../foundation/components/button/Button';
import { neon } from '../../../lib/neon';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      const { error } = await neon.signIn.email({ email, password });
      if (error) throw error;
      navigate('/menu');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials');
    }
  };

  return (
    <>
      <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
        <div>
          <label htmlFor="login-email" className="mb-1 block text-sm font-bold text-slate-300">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            required
            className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white focus:border-robot-orange focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="mb-1 block text-sm font-bold text-slate-300">
              Password
            </label>
            <button
              type="button"
              className="cursor-pointer border-none bg-transparent p-0 text-xs text-slate-400 hover:text-white"
              onClick={() => navigate('/forgot-password')}
            >
              Forgot your password?
            </button>
          </div>
          <input
            id="login-password"
            type="password"
            required
            className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white focus:border-robot-orange focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {errorMsg && <p className="text-sm font-bold text-red-500">{errorMsg}</p>}

        <Button type="submit" className="mt-2 w-full" size="large" variant="primary">
          Log In
        </Button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          className="cursor-pointer border-none bg-transparent text-sm text-slate-400 underline hover:text-white"
          onClick={() => navigate('/register')}
        >
          Need an account? Register here
        </button>
      </div>
    </>
  );
}
