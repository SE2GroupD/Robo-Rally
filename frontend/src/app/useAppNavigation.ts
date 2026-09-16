import { useState } from 'react';
import type { LoginRequestDto } from '../features/auth/types/auth';

type AppView = 'front-page' | 'login' | 'register' | 'main-menu' | 'game';

export function useAppNavigation() {
  const [view, setView] = useState<AppView>('front-page');
  const [playerInfo, setPlayerInfo] = useState<{ username: string; email?: string } | null>(null);

  const handleLogin = (dto: LoginRequestDto) => {
    setPlayerInfo({
      username: dto.email.split('@')[0],
      email: dto.email,
    });
  };

  const handleGuestLogin = () => {
    const randomGuestNumber = Math.floor(Math.random() * 9000) + 1000;
    setPlayerInfo({ username: `Guest_${randomGuestNumber}` });
  };

  const logout = () => {
    setPlayerInfo(null);
    setView('front-page');
  };
  return { view, setView, playerInfo, handleLogin, handleGuestLogin, logout };
}
