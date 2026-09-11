import { type CardType } from './CardType';

export interface PlayerHandDto {
  playerId: string;
  cards: CardType[];
  drawPileCount: number;
  discardPileCount: number;
}
