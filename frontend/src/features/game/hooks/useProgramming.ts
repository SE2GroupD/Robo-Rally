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

/**
 * `round` is the round being programmed (null = not ready, e.g. a replay is
 * playing). The hand is refetched whenever it changes, which is how a new
 * hand appears after each round resolves.
 */
export function useProgramming(roomId: string, round: number | null) {
  const [selection, setSelection] = useState(emptySelection);
  const [isLockedIn, setIsLockedIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionPending = useRef(false);
  const [drawPileCount, setDrawPileCount] = useState(0);
  const [discardPileCount, setDiscardPileCount] = useState(0);

  useEffect(() => {
    if (round === null) return;
    let active = true;
    fetchPlayerHand(roomId)
      .then((data) => {
        if (!active) return;
        setIsLockedIn(data.isLockedIn);
        const newHand = Array.from({ length: 9 }, (_, index) => data.cards[index] ?? null);
        const newRegisters = Array.from({ length: 5 }, (_, index) => {
          const card = data.lockedRegisters[index];
          // handIndex -1: locked cards can't be returned to the hand anyway
          return card ? { card, handIndex: -1 } : null;
        });
        setSelection({ hand: newHand, registers: newRegisters });
        setDrawPileCount(data.drawPileCount);
        setDiscardPileCount(data.discardPileCount);
      })
      .catch((err) => {
        if (active) console.error(err);
      });
    return () => {
      active = false;
    };
  }, [roomId, round]);

  const locked = isLockedIn || round === null;

  const placeCardInRegister = (handIndex: number) => {
    if (locked || submissionPending.current) return;
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
    if (locked || submissionPending.current) return;
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
    if (locked || submissionPending.current) return;
    setSelection((current) => {
      const hand = [...current.hand];
      current.registers.forEach((selected) => {
        if (selected) hand[selected.handIndex] = selected.card;
      });
      return { hand, registers: emptySelection().registers };
    });
  };

  const submitProgram = async () => {
    if (locked || submissionPending.current) return;
    const cards = selection.registers.flatMap((slot) => (slot ? [slot.card] : []));
    if (cards.length !== 5) return;
    submissionPending.current = true;
    setIsSubmitting(true);
    try {
      await submitProgramRegister(roomId, { registers: cards });
      setIsLockedIn(true); // the server decides when the round resolves; the poll picks it up
    } catch (err) {
      console.error(err);
      console.warn('Failed to lock in registers.');
    } finally {
      submissionPending.current = false;
      setIsSubmitting(false);
    }
  };

  return {
    hand: selection.hand,
    registers: selection.registers.map((slot) => slot?.card ?? null),
    isLockedIn: locked,
    isSubmitting,
    drawPileCount,
    discardPileCount,
    placeCardInRegister,
    returnCardToHand,
    clearProgram,
    submitProgram,
  };
}
