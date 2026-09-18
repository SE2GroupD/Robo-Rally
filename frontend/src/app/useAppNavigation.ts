import { startTransition, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LoginRequestDto } from '../features/auth/types/auth';

interface PlayerInfo {
  username: string;
  email?: string;
}

export const PILOT_SESSION_KEY = 'robo-rally.pilot.v1';

function restorePilot(): PlayerInfo | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(PILOT_SESSION_KEY) ?? 'null');
    if (
      typeof value !== 'object' ||
      value === null ||
      !('username' in value) ||
      typeof value.username !== 'string' ||
      !value.username.trim() ||
      ('email' in value && typeof value.email !== 'string')
    ) {
      return null;
    }
    return { username: value.username, ...('email' in value ? { email: value.email as string } : {}) };
  } catch {
    return null;
  }
}

export function useAppNavigation() {
  const navigate = useNavigate();
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(restorePilot);

  const enterMenu = (pilot: PlayerInfo) => {
    try {
      sessionStorage.setItem(PILOT_SESSION_KEY, JSON.stringify(pilot));
    } catch {
      // Storage may be disabled. The pilot can still play until the next reload.
    }
    startTransition(() => {
      setPlayerInfo(pilot);
      navigate('/main-menu', { replace: true });
    });
  };

  const handleLogin = (dto: LoginRequestDto) => {
    enterMenu({ username: dto.email.split('@')[0], email: dto.email });
  };

  const handleGuestLogin = () => {
    const randomGuestNumber = Math.floor(Math.random() * 9000) + 1000;
    enterMenu({ username: `Guest_${randomGuestNumber}` });
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(PILOT_SESSION_KEY);
    } catch {
      // Clear the in-memory session even when browser storage is unavailable.
    }
    startTransition(() => {
      setPlayerInfo(null);
      navigate('/', { replace: true });
    });
  };
  return { navigate, playerInfo, handleLogin, handleGuestLogin, logout };
}
