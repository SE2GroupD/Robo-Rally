import { type CardType } from './CardType';

// What the frontend sends to the backend when the player locks in
export interface ProgramRegisterDto {
  // One to five selected cards in register order, without empty slots.
  registers: CardType[];
}
