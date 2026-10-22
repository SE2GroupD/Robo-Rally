import { useState } from 'react';
import { roomStartBlockReason } from '../data/roomReadiness';
import { startRoom, setRoomVisibility, selectRobot, updateRoomSetup, RoomRequestError } from '../api/gameApi';
import type { useRoomSession } from './useRoomSession';

export function useRoomSetup(session: ReturnType<typeof useRoomSession>) {
  const { room, runAction, setError } = session;
  const [setupError, setSetupError] = useState('');
  const isHost = room.playerId === room.hostPlayerId;
  const selectedAvatarId = room.players.find((player) => player.playerId === room.playerId)?.avatarId ?? null;
  const takenAvatarIds = room.players
    .filter((player) => player.playerId !== room.playerId && player.avatarId !== null)
    .map((player) => player.avatarId as number);
  const startBlockReason = roomStartBlockReason(room.players);
  const start = () => {
    if (!isHost || startBlockReason) return;
    return runAction(
      () => startRoom(room),
      () => setError('Could not start. Please try again.'),
    );
  };
  const changeVisibility = (publicRoom: boolean) => {
    if (publicRoom === Boolean(room.publicRoom)) return;
    return runAction(
      () => setRoomVisibility(room, publicRoom),
      () => setError('Could not change room visibility. Please try again.'),
    );
  };
  const chooseRobot = (avatarId: number) =>
    runAction(
      () => selectRobot(room, avatarId),
      (cause) => {
        setError(
          cause instanceof RoomRequestError && cause.status === 409
            ? 'That robot has already been selected.'
            : 'Could not select robot. Please try again.',
        );
      },
    );
  const updateSetup = (
    action: 'map' | 'start-tile',
    value: { mapId: string } | { mapId: string; position: { x: number; y: number } | null },
  ) => {
    setSetupError('');
    return runAction(
      () => updateRoomSetup(room, action, value),
      (cause) => {
        setSetupError(
          cause instanceof RoomRequestError && cause.status === 409
            ? 'The tile is taken or the setup changed. Choose an available tile after the room refreshes.'
            : 'Could not update your selection. Please try again.',
        );
      },
    );
  };
  return {
    isHost,
    selectedAvatarId,
    takenAvatarIds,
    setupError,
    startBlockReason,
    start,
    changeVisibility,
    chooseRobot,
    updateSetup,
  };
}
