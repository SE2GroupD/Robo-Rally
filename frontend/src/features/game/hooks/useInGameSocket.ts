import { useEffect, useState } from 'react';
import { useGlobalSocket } from '../../../app/WebSocketProvider';

export function useInGameSocket(gameId: string | undefined, currentPlayerId: string, currentRound: number | undefined) {
  const [readinessState, setReadinessState] = useState<Record<string, boolean>>({});
  const client = useGlobalSocket();

  // Clear readiness state when a new round starts
  useEffect(() => {
    setReadinessState({});
  }, [currentRound]);

  useEffect(() => {
    if (!gameId || !client?.connected) return;

    const subscription = client.subscribe(`/topic/game/${gameId}/ready-status`, (message) => {
      const event = JSON.parse(message.body);
      setReadinessState((prev) => ({ ...prev, [event.playerId]: event.isReady }));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [gameId, client]);

  const sendReadyStatus = (isReady: boolean) => {
    if (client?.connected && gameId) {
      client.publish({
        destination: `/app/game/${gameId}/player-ready`,
        body: JSON.stringify({ playerId: currentPlayerId, isReady }),
      });
      setReadinessState(prev => ({...prev, [currentPlayerId]: isReady}));
    }
  };

  return { readinessState, sendReadyStatus };
}