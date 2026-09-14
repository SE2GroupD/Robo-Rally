import { type PlayerHandDto } from '../types/PlayerHandDto';
import { type ProgramRegisterDto } from '../types/ProgramRegisterDto';
import { neon } from '../../lib/neon';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper function to extract the token safely
async function getValidToken(): Promise<string> {
  const sessionResponse = await neon.getSession();

  // We rely strictly on the defined TypeScript schema now
  const token = sessionResponse.data?.session?.token;

  if (!token) {
    console.error('Auth token is missing! Session payload:', sessionResponse);
    throw new Error('User is not authenticated or token is missing');
  }

  return token;
}

export async function fetchPlayerHand(roomId: string, playerId: string): Promise<PlayerHandDto> {
  const token = await getValidToken();

  const response = await fetch(`${API_BASE_URL}/game/${roomId}/player/${playerId}/hand`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch hand');
  return response.json();
}

export async function submitProgramRegister(roomId: string, payload: ProgramRegisterDto): Promise<void> {
  const token = await getValidToken();

  const response = await fetch(`${API_BASE_URL}/game/${roomId}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Failed to submit registers');
}
