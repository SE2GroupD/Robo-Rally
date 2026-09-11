import { type PlayerHandDto } from '../types/PlayerHandDto';
import { type ProgramRegisterDto } from '../types/ProgramRegisterDto';

// Vite exposes env variables via import.meta.env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchPlayerHand(roomId: string, playerId: string): Promise<PlayerHandDto> {
  const response = await fetch(`${API_BASE_URL}/game/${roomId}/player/${playerId}/hand`);
  if (!response.ok) throw new Error('Failed to fetch hand');
  return response.json();
}

export async function submitProgramRegister(roomId: string, payload: ProgramRegisterDto): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/game/${roomId}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Failed to submit registers');
}
