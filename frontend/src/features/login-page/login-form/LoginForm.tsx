import { useState, type FormEvent } from 'react';
import { Button } from '../../../foundation/components/button/Button';
import { TextInput } from '../../../foundation/components/text-input/TextInput';
import type { LoginRequestDto } from '../types';

interface LoginFormProps {
  onLogin: (dto: LoginRequestDto) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!email || !password) {
      setError('Enter pilot email and password.');
      return;
    }

    setError('');
    onLogin({
      email,
      passwordHash: password,
    });
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleLoginSubmit}>
      <TextInput
        label="Email"
        name="email"
        onChange={(event) => {
          setEmail(event.target.value);
          setError('');
        }}
        placeholder="pilot@factory.com"
        required
        type="email"
        value={email}
      />

      <TextInput
        label="Password"
        name="password"
        onChange={(event) => {
          setPassword(event.target.value);
          setError('');
        }}
        placeholder="••••••••"
        required
        type="password"
        value={password}
      />

      {error ? (
        <p aria-live="polite" className="m-0 text-sm font-bold text-hazard">
          {error}
        </p>
      ) : null}

      <Button className="mt-2 w-full" size="large" type="submit">
        Log In
      </Button>
    </form>
  );
}
