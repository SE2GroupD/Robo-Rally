import { rankRacePlayers } from './raceStandings';
import type { JoinedRoom } from '../api/gameApi';
import type { BoardStateDto } from '../types/GameStateDto';
import type { MatchResults } from '../types/MatchResults';

export function createMatchResults(state: BoardStateDto, players: JoinedRoom['players']): MatchResults | null {
  if (!state.winner) return null;
  const winnerId = state.winner.playerId;
  const standings = rankRacePlayers(players, state.checkpointProgress, winnerId);
  return {
    winnerId,
    courseName: state.layout?.name ?? 'Robo Rally',
    round: state.lastResolution?.round ?? state.round,
    totalCheckpoints: state.totalCheckpoints,
    standings,
  };
}
