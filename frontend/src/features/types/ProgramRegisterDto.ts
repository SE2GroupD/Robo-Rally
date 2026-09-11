import { type CardType } from './CardType';

// What the frontend sends to the backend when the player locks in
export interface ProgramRegisterDto {
  playerId: string;
  // Strictly enforce an array of exactly 5 cards (or null if empty/timer ran out)
  registers: [CardType | null, CardType | null, CardType | null, CardType | null, CardType | null];
}
