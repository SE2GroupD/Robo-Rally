import { type PlayerHandDto } from '../types/PlayerHandDto';
import { type ProgramRegisterDto } from '../types/ProgramRegisterDto';
import { neon } from '../../../lib/neon';

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

export interface CreatedRoom {
  gameId: string;
  roomCode: string;
  playerId: string;
  hostPlayerId: string;
  status: 'WAITING' | 'STARTED';
  players: { playerId: string; playerName: string }[];
}

// Proposed join response; align this contract with the room backend when implemented.
export interface JoinedRoom {
  gameId: string;
  roomCode: string;
  playerId: string;
  hostPlayerId: string;
  status: 'WAITING' | 'STARTED';
  players: { playerId: string; playerName: string }[];
}

export async function joinRoom(roomCode: string, playerName: string): Promise<JoinedRoom> {
  if (!API_BASE_URL) throw new Error('Room service is unavailable. Please try again later.');

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/games/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: roomCode.trim(), playerName }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error('Could not reach the room service. Please try again.');
  }

  if (response.status === 400) throw new Error('Check your room code and try again.');
  if (response.status === 404) throw new Error('Could not find that room. Check the code with your host.');
  if (response.status === 409) throw new Error('This room is not accepting players.');
  if (!response.ok) throw new Error('Could not join the room. Please try again.');

  const room = await response.json();
  if (
    !room ||
    typeof room.gameId !== 'string' ||
    !room.gameId ||
    typeof room.roomCode !== 'string' ||
    !room.roomCode ||
    typeof room.playerId !== 'string' ||
    !room.playerId ||
    typeof room.hostPlayerId !== 'string' ||
    !room.hostPlayerId ||
    room.status !== 'WAITING' ||
    !Array.isArray(room.players) ||
    !room.players.every(
      (player: JoinedRoom['players'][number]) =>
        player && typeof player.playerId === 'string' && typeof player.playerName === 'string',
    ) ||
    !room.players.some((player: JoinedRoom['players'][number]) => player.playerId === room.playerId) ||
    !room.players.some((player: JoinedRoom['players'][number]) => player.playerId === room.hostPlayerId)
  ) {
    throw new Error('The room service returned an unexpected response.');
  }
  return room;
}

export async function fetchPlayerHand(roomId: string): Promise<PlayerHandDto> {
  const token = await getValidToken();

  const response = await fetch(`${API_BASE_URL}/game/${roomId}/hand`, {
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
