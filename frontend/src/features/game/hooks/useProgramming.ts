import { useState, useEffect, useRef } from 'react';
import { fetchPlayerHand, submitProgramRegister } from '../api/gameApi';
import type { CardType } from '../types/CardType';

interface SelectedCard {
  card: CardType;
  handIndex: number;
}

function emptySelection() {
  return {
    hand: Array<CardType | null>(9).fill(null),
    registers: Array<SelectedCard | null>(5).fill(null),
  };
}

export function useProgramming(roomId: string, onLockIn?: (registers: CardType[]) => void) {
  const [selection, setSelection] = useState(emptySelection);
  const [isLockedIn, setIsLockedIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionPending = useRef(false);
  const [drawPileCount, setDrawPileCount] = useState(0);
  const [discardPileCount, setDiscardPileCount] = useState(0);

  useEffect(() => {
    let active = true;
    fetchPlayerHand(roomId)
      .then((data) => {
        if (!active) return;

        // 1. Sync the locked-in status from the backend
        setIsLockedIn(data.isLockedIn);

        // 2. Reconstruct the hand from the backend
        const newHand = Array.from({ length: 9 }, (_, index) => data.cards[index] ?? null);

        // 3. Reconstruct the registers if the player previously locked them in
        const newRegisters = Array.from({ length: 5 }, (_, index) => {
          const card = data.lockedRegisters[index];
          // We set handIndex to -1 because locked cards cannot be returned to the hand anyway
          return card ? { card, handIndex: -1 } : null;
        });

        setSelection({
          hand: newHand,
          registers: newRegisters,
        });

        setDrawPileCount(data.drawPileCount);
        setDiscardPileCount(data.discardPileCount);
      })
      .catch((err) => {
        if (active) console.error(err);
      });
    return () => {
      active = false;
    };
  }, [roomId]);

  const placeCardInRegister = (handIndex: number) => {
    if (isLockedIn || submissionPending.current) return;
    setSelection((current) => {
      const card = current.hand[handIndex];
      const registerIndex = current.registers.findIndex((slot) => slot === null);
      if (!card || registerIndex === -1) return current;
      const hand = [...current.hand];
      const registers = [...current.registers];
      hand[handIndex] = null;
      registers[registerIndex] = { card, handIndex };
      return { hand, registers };
    });
  };

  const returnCardToHand = (registerIndex: number) => {
    if (isLockedIn || submissionPending.current) return;
    setSelection((current) => {
      const selected = current.registers[registerIndex];
      if (!selected) return current;
      const hand = [...current.hand];
      const registers = [...current.registers];
      hand[selected.handIndex] = selected.card;
      registers[registerIndex] = null;
      return { hand, registers };
    });
  };

  const clearProgram = () => {
    if (isLockedIn || submissionPending.current) return;
    setSelection((current) => {
      const hand = [...current.hand];
      current.registers.forEach((selected) => {
        if (selected) hand[selected.handIndex] = selected.card;
      });
      return { hand, registers: emptySelection().registers };
    });
  };

  const submitProgram = async () => {
    if (isLockedIn || submissionPending.current) return;
    const cards = selection.registers.flatMap((slot) => (slot ? [slot.card] : []));
    if (cards.length === 0) return;
    submissionPending.current = true;
    setIsSubmitting(true);
    try {
      await submitProgramRegister(roomId, { registers: cards });
    } catch (err) {
      console.error(err);
      console.warn('Failed to lock in registers.');
      return;
    } finally {
      submissionPending.current = false;
      setIsSubmitting(false);
    }
    setIsLockedIn(true);
    onLockIn?.(cards);
  };

  return {
    hand: selection.hand,
    registers: selection.registers.map((slot) => slot?.card ?? null),
    isLockedIn,
    isSubmitting,
    drawPileCount,
    discardPileCount,
    placeCardInRegister,
    returnCardToHand,
    clearProgram,
    submitProgram,
  };
}
