import { type PlayerHandDto } from '../types/PlayerHandDto';
import { type ProgramRegisterDto } from '../types/ProgramRegisterDto';
import { neon } from '../../lib/neon';

// Vite exposes env variables via import.meta.env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchPlayerHand(roomId: string, playerId: string): Promise<PlayerHandDto> {
  // 1. Grab the active session directly from the neon client
  const sessionResponse = await neon.getSession();
  const token = sessionResponse.data?.session?.token;

  const response = await fetch(`${API_BASE_URL}/game/${roomId}/player/${playerId}/hand`, {
    headers: {
      // 2. Attach it to the Authorization header
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch hand');
  return response.json();
}

export async function submitProgramRegister(roomId: string, payload: ProgramRegisterDto): Promise<void> {
  // Grab the active session token for the POST request as well
  const sessionResponse = await neon.getSession();
  const token = sessionResponse.data?.session?.token;

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
