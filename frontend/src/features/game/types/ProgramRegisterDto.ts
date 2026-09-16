import { type CardType } from './CardType';

// What the frontend sends to the backend when the player locks in
export interface ProgramRegisterDto {
  playerId: string;
  // One to five selected cards in register order, without empty slots.
  registers: CardType[];
}
