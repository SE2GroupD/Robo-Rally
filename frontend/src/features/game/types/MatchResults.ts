export interface RaceStanding {
  playerId: string;
  playerName: string;
  avatarId: number | null;
  completedCheckpoints: number;
  rank: number;
}

export interface MatchResults {
  winnerId: string;
  courseName: string;
  round: number;
  totalCheckpoints: number;
  standings: RaceStanding[];
}
