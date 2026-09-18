export interface LoginRequestDto {
  email: string;
  passwordHash: string;
}

export interface PlayerSessionDto {
  playerId: string;
  username: string;
  token: string;
}
