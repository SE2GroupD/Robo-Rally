import { type BoardStateDto } from '../types/GameStateDto';
import { type PlayerHandDto } from '../types/PlayerHandDto';
import { type ProgramRegisterDto } from '../types/ProgramRegisterDto';
import { createAuthClient } from '@neondatabase/neon-js/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL);

// Helper function to extract the token safely
async function getValidToken(): Promise<string> {
  const sessionResponse = await authClient.getSession();

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

export async function createRoom(playerName: string): Promise<CreatedRoom> {
  if (!API_BASE_URL) throw new Error('Room service is unavailable. Please try again later.');

  const token = await getValidToken();

  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/games`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ playerName }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error('Could not create the room. Please try again.');

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
    room.hostPlayerId !== room.playerId ||
    room.status !== 'WAITING' ||
    !Array.isArray(room.players) ||
    !room.players.every(
      (player: CreatedRoom['players'][number]) =>
        player && typeof player.playerId === 'string' && typeof player.playerName === 'string',
    ) ||
    !room.players.some((player: CreatedRoom['players'][number]) => player.playerId === room.playerId)
  ) {
    throw new Error('The room service returned an unexpected response.');
  }
  return room;
}

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

  const token = await getValidToken();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/games/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
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

export interface PublicRoom {
  gameId: string;
  roomName: string;
  hostPlayerName: string;
  playerCount: number;
  maxPlayers: number;
}

function validateRoom(room: unknown, playerId?: string): room is JoinedRoom {
  return Boolean(
    room &&
    typeof room === 'object' &&
    'gameId' in room &&
    typeof room.gameId === 'string' &&
    room.gameId &&
    'roomCode' in room &&
    typeof room.roomCode === 'string' &&
    room.roomCode &&
    'playerId' in room &&
    typeof room.playerId === 'string' &&
    room.playerId &&
    'hostPlayerId' in room &&
    typeof room.hostPlayerId === 'string' &&
    room.hostPlayerId &&
    (!playerId || room.playerId === playerId) &&
    'status' in room &&
    room.status === 'WAITING' &&
    'players' in room &&
    Array.isArray(room.players) &&
    room.players.every(
      (player: JoinedRoom['players'][number]) =>
        player && typeof player.playerId === 'string' && typeof player.playerName === 'string',
    ) &&
    room.players.some((player: JoinedRoom['players'][number]) => player.playerId === room.playerId) &&
    room.players.some((player: JoinedRoom['players'][number]) => player.playerId === room.hostPlayerId),
  );
}

function publicRoomError(status: number): Error {
  if (status === 400) return new Error('Check the room details and try again.');
  if (status === 404) return new Error('That public room is no longer available.');
  if (status === 409) return new Error('This room is full or has already started.');
  return new Error('The public room request could not be completed. Please try again.');
}

export async function listPublicRooms(signal?: AbortSignal): Promise<PublicRoom[]> {
  if (!API_BASE_URL) throw new Error('Room service is unavailable. Please try again later.');

  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/public/rooms`, {
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Could not load public rooms. Please try again.');

  const rooms = await response.json();
  if (
    !Array.isArray(rooms) ||
    !rooms.every(
      (room) =>
        room &&
        typeof room.gameId === 'string' &&
        typeof room.roomName === 'string' &&
        typeof room.hostPlayerName === 'string' &&
        Number.isInteger(room.playerCount) &&
        Number.isInteger(room.maxPlayers) &&
        room.playerCount >= 1 &&
        room.maxPlayers >= room.playerCount,
    )
  ) {
    throw new Error('The room service returned an unexpected response.');
  }
  return rooms;
}

export async function createPublicRoom(roomName: string, playerName: string): Promise<CreatedRoom> {
  if (!API_BASE_URL) throw new Error('Room service is unavailable. Please try again later.');

  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/games/public`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ roomName: roomName.trim(), playerName }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw publicRoomError(response.status);

  const room = await response.json();
  if (!validateRoom(room)) throw new Error('The room service returned an unexpected response.');
  return room;
}

export async function joinPublicRoom(gameId: string, playerName: string): Promise<JoinedRoom> {
  if (!API_BASE_URL) throw new Error('Room service is unavailable. Please try again later.');

  const token = await getValidToken();
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/games/public/${encodeURIComponent(gameId)}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ playerName }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw publicRoomError(response.status);

  const room = await response.json();
  if (!validateRoom(room)) throw new Error('The room service returned an unexpected response.');
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

  const response = await fetch(`${API_BASE_URL}/game/${roomId}/registers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Failed to submit registers');
}

export class RoomRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function roomRequest(room: JoinedRoom, action?: 'start' | 'leave', signal?: AbortSignal): Promise<Response> {
  if (!API_BASE_URL) throw new Error('Room service is unavailable.');

  const token = await getValidToken();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (action) {
    headers['Content-Type'] = 'application/json';
  }

  const base = `${API_BASE_URL.replace(/\/$/, '')}/games/${encodeURIComponent(room.gameId)}`;
  const url = action ? `${base}/${action}` : `${base}?playerId=${encodeURIComponent(room.playerId)}`;
  const response = await fetch(url, {
    method: action ? 'POST' : 'GET',
    headers,
    body: action ? JSON.stringify({ playerId: room.playerId }) : undefined,
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new RoomRequestError('Room request failed.', response.status);
  return response;
}

async function readRoom(response: Response, expected: JoinedRoom): Promise<JoinedRoom> {
  const room = await response.json();
  if (
    !room ||
    room.gameId !== expected.gameId ||
    room.playerId !== expected.playerId ||
    room.hostPlayerId !== expected.hostPlayerId ||
    room.roomCode !== expected.roomCode ||
    !['WAITING', 'STARTED'].includes(room.status) ||
    !Array.isArray(room.players) ||
    !room.players.every(
      (player: JoinedRoom['players'][number]) =>
        player && typeof player.playerId === 'string' && typeof player.playerName === 'string',
    ) ||
    !room.players.some((player: JoinedRoom['players'][number]) => player.playerId === room.playerId)
  ) {
    throw new Error('Unexpected room response.');
  }
  return room;
}

export async function fetchRoom(room: JoinedRoom, signal: AbortSignal): Promise<JoinedRoom> {
  return readRoom(await roomRequest(room, undefined, signal), room);
}

export async function startRoom(room: JoinedRoom): Promise<JoinedRoom> {
  return readRoom(await roomRequest(room, 'start'), room);
}

export async function leaveRoom(room: JoinedRoom): Promise<void> {
  await roomRequest(room, 'leave');
}

export async function fetchBoardState(gameId: string, signal?: AbortSignal): Promise<BoardStateDto> {
  const token = await getValidToken();

  const response = await fetch(`${API_BASE_URL}/game/${encodeURIComponent(gameId)}/state`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!response.ok) throw new RoomRequestError('Board state request failed.', response.status);
  return response.json();
}
