import { type PlayerHandDto } from '../types/PlayerHandDto';
import { type ProgramRegisterDto } from '../types/ProgramRegisterDto';

// Vite exposes env variables via import.meta.env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface CreatedRoom {
  gameId: string;
  roomCode: string;
  playerId: string;
  hostPlayerId: string;
  status: 'WAITING';
  players: { playerId: string; playerName: string }[];
}

export async function createRoom(playerName: string): Promise<CreatedRoom> {
  if (!API_BASE_URL) throw new Error('Room service is unavailable. Please try again later.');

  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error('Could not create the room. Please try again.');

  const room = await response.json();
  if (
    !room ||
    typeof room.gameId !== 'string' || !room.gameId ||
    typeof room.roomCode !== 'string' || !room.roomCode ||
    typeof room.playerId !== 'string' || !room.playerId ||
    typeof room.hostPlayerId !== 'string' ||
    room.hostPlayerId !== room.playerId ||
    room.status !== 'WAITING' ||
    !Array.isArray(room.players) ||
    !room.players.every((player: CreatedRoom['players'][number]) =>
      player && typeof player.playerId === 'string' && typeof player.playerName === 'string') ||
    !room.players.some((player: CreatedRoom['players'][number]) => player.playerId === room.playerId)
  ) {
    throw new Error('The room service returned an unexpected response.');
  }
  return room;
}

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
