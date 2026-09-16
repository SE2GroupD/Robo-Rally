import { useState, useEffect } from 'react';
import { fetchPlayerHand, submitProgramRegister } from '../api/gameApi';
import type { CardType } from '../types/CardType';

export function useProgramming(roomId: string, onLockIn?: (registers: CardType[]) => void) {
  const [hand, setHand] = useState<CardType[]>([]);
  const [registers, setRegisters] = useState<(CardType | null)[]>([null, null, null, null, null]);
  const [isLockedIn, setIsLockedIn] = useState(false);

  // New state for the deck counts
  const [drawPileCount, setDrawPileCount] = useState(0);
  const [discardPileCount, setDiscardPileCount] = useState(0);

  useEffect(() => {
    fetchPlayerHand(roomId)
      .then((data) => {
        setHand(data.cards);
        setDrawPileCount(data.drawPileCount);
        setDiscardPileCount(data.discardPileCount);

        // If the backend says we are locked in, restore the UI state
        if (data.isLockedIn) {
          setIsLockedIn(true);

          // Pad with nulls just in case, though it should be exactly 5
          const restoredRegisters = [...data.lockedRegisters];
          while (restoredRegisters.length < 5) {
            restoredRegisters.push(null as any);
          }
          setRegisters(restoredRegisters);
        }
      })
      .catch((err) => console.error(err));
  }, [roomId]);

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
      const lockedRegisters = registers as [CardType, CardType, CardType, CardType, CardType];
      await submitProgramRegister(roomId, {
        registers: lockedRegisters,
      });
      setIsLockedIn(true);
      onLockIn?.(lockedRegisters);
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
    discardPileCount,
    selectCard,
    removeFromRegister,
    clearRegisters,
    lockIn,
  };
}
