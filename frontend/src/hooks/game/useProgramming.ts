import { useState, useEffect } from 'react';
import { fetchPlayerHand, submitProgramRegister } from '../../features/api/gameApi';
import type { CardType } from '../../features/types/CardType';

export function useProgramming(roomId: string, playerId: string) {
  const [hand, setHand] = useState<CardType[]>([]);
  const [registers, setRegisters] = useState<(CardType | null)[]>([null, null, null, null, null]);
  const [isLockedIn, setIsLockedIn] = useState(false);

  // New state for the deck counts
  const [drawPileCount, setDrawPileCount] = useState(0);
  const [discardPileCount, setDiscardPileCount] = useState(0);

  useEffect(() => {
    fetchPlayerHand(roomId, playerId)
      .then((data) => {
        setHand(data.cards);
        setDrawPileCount(data.drawPileCount);
        setDiscardPileCount(data.discardPileCount);
      })
      .catch((err) => console.error(err));
  }, [roomId, playerId]);

  const selectCard = (card: CardType, indexInHand: number) => {
    if (isLockedIn) return;
    const emptyIndex = registers.findIndex((r) => r === null);
    if (emptyIndex === -1) return; // Registers are full

    const newRegisters = [...registers];
    newRegisters[emptyIndex] = card;
    setRegisters(newRegisters);

    const newHand = [...hand];
    newHand.splice(indexInHand, 1);
    setHand(newHand);
  };

  const removeFromRegister = (card: CardType, indexInRegister: number) => {
    if (isLockedIn || card === null) return;
    const newRegisters = [...registers];
    newRegisters[indexInRegister] = null;
    setRegisters(newRegisters);
    setHand([...hand, card]);
  };

  const clearRegisters = () => {
    if (isLockedIn) return;
    const cardsToReturn = registers.filter((c): c is CardType => c !== null);
    setHand([...hand, ...cardsToReturn]);
    setRegisters([null, null, null, null, null]);
  };

  const lockIn = async () => {
    if (registers.includes(null)) {
      console.warn('You must fill all 5 registers before locking in!');
      return;
    }
    try {
      await submitProgramRegister(roomId, {
        playerId,
        registers: registers as [CardType, CardType, CardType, CardType, CardType],
      });
      setIsLockedIn(true);
    } catch (err) {
      console.error(err);
      console.warn('Failed to lock in registers.');
    }
  };

  return {
    hand,
    registers,
    isLockedIn,
    drawPileCount,
    discardPileCount, // Export the new state
    selectCard,
    removeFromRegister,
    clearRegisters,
    lockIn,
  };
}
