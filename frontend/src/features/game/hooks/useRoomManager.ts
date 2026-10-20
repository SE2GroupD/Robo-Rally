import { useCallback, useEffect, useRef, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { createRoom, leaveRoom, startRoom, type CreatedRoom, type JoinedRoom } from '../api/gameApi';

interface UseRoomManagerOptions {
  username?: string;
  pathname: string;
  navigate: NavigateFunction;
}

const ROOM_ROUTES = ['/game', '/host-battle', '/join-battle'];

type ActiveRoom = CreatedRoom | JoinedRoom;

export function useRoomManager({ username, pathname, navigate }: UseRoomManagerOptions) {
  const [hostRoom, setHostRoom] = useState<CreatedRoom | null>(null);
  const [joinedRoom, setJoinedRoom] = useState<JoinedRoom | null>(null);
  const [soloRoom, setSoloRoom] = useState<JoinedRoom | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isStartingSolo, setIsStartingSolo] = useState(false);
  const [roomError, setRoomError] = useState('');
  const [soloError, setSoloError] = useState('');
  const creatingRoom = useRef(false);
  const startingSolo = useRef(false);
  const leavingRoom = useRef(false);
  const previousPathname = useRef(pathname);

  const activeRoom: ActiveRoom | null = soloRoom || hostRoom || joinedRoom;

  const clearRooms = useCallback(() => {
    setHostRoom(null);
    setJoinedRoom(null);
    setSoloRoom(null);
    setRoomError('');
    setSoloError('');
  }, []);

  useEffect(() => {
    const isRoomRoute = ROOM_ROUTES.includes(pathname);
    const wasOnRoomRoute = ROOM_ROUTES.includes(previousPathname.current);
    previousPathname.current = pathname;

    if (!activeRoom || isRoomRoute || !wasOnRoomRoute || leavingRoom.current) return;

    leavingRoom.current = true;
    void leaveRoom(activeRoom)
      .catch(() => {
        // Navigating away should not trap a player on the old route if cleanup fails.
      })
      .finally(() => {
        clearRooms();
        leavingRoom.current = false;
      });
  }, [activeRoom, pathname, clearRooms]);

  useEffect(() => {
    if (!activeRoom) return;

    const leaveOnUnload = () => {
      void leaveRoom(activeRoom, { keepalive: true }).catch(() => {});
    };

    window.addEventListener('pagehide', leaveOnUnload);
    return () => window.removeEventListener('pagehide', leaveOnUnload);
  }, [activeRoom]);

  async function startSoloGame() {
    if (!username || startingSolo.current) return;
    navigate('/game');
    if (soloRoom) return;

    startingSolo.current = true;
    setIsStartingSolo(true);
    setSoloError('');
    let created: CreatedRoom | null = null;

    try {
      created = await createRoom(username, true);
      setSoloRoom(await startRoom(created));
    } catch {
      if (created) void leaveRoom(created).catch(() => {});
      setSoloError('Could not start the game. Please try again.');
    } finally {
      startingSolo.current = false;
      setIsStartingSolo(false);
    }
  }

  async function hostBattle() {
    if (!username || creatingRoom.current) return;
    navigate('/host-battle');
    if (hostRoom) return;

    creatingRoom.current = true;
    setIsCreatingRoom(true);
    setRoomError('');
    try {
      setHostRoom(await createRoom(username));
    } catch {
      setRoomError('Could not create a room. Please try again.');
    } finally {
      creatingRoom.current = false;
      setIsCreatingRoom(false);
    }
  }

  function returnToMenu() {
    clearRooms();
    navigate('/main-menu');
  }

  async function leaveActiveRoom() {
    if (activeRoom) await leaveRoom(activeRoom).catch(() => {});
    clearRooms();
  }

  function hostPublicRoom(room: CreatedRoom) {
    setHostRoom(room);
    navigate('/host-battle');
  }

  function joinPublicRoom(room: JoinedRoom) {
    setJoinedRoom(room);
    navigate('/join-battle');
  }

  return {
    activeRoom,
    hostRoom,
    joinedRoom,
    isCreatingRoom,
    isStartingSolo,
    roomError,
    soloError,
    setHostRoom,
    setJoinedRoom,
    startSoloGame,
    hostBattle,
    returnToMenu,
    leaveActiveRoom,
    hostPublicRoom,
    joinPublicRoom,
  };
}
