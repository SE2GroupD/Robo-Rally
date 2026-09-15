import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../foundation/components/button/Button';
import { neon } from '../../lib/neon';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      const { error } = await neon.signUp.email({
        email,
        password,
        name: email.split('@')[0],
      });
      if (error) throw error;

      // Redirect to the verification screen, passing email as a query param
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    }
  };

  return (
    <>
      <form onSubmit={handleRegister} className="flex flex-col gap-4 text-left">
        <div>
          <label htmlFor="register-email" className="mb-1 block text-sm font-bold text-slate-300">
            Email Address
          </label>
          <input
            id="register-email"
            type="email"
            required
            className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white focus:border-robot-orange focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="register-password" className="mb-1 block text-sm font-bold text-slate-300">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            required
            className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white focus:border-robot-orange focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {errorMsg && <p className="text-sm font-bold text-red-500">{errorMsg}</p>}

        <Button type="submit" className="mt-2 w-full" size="large" variant="primary">
          Register
        </Button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          className="cursor-pointer border-none bg-transparent text-sm text-slate-400 underline hover:text-white"
          onClick={() => navigate('/login')}
        >
          Already have an account? Log In
        </button>
      </div>
    </>
  );
}
