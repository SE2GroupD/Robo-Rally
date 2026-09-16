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

    // playerId is completely removed; the backend handles identity securely via JWT
    fetchPlayerHand(roomId)
      .then((data) => {
        if (!active) return;

        setDrawPileCount(data.drawPileCount);
        setDiscardPileCount(data.discardPileCount);

        if (data.isLockedIn) {
          setIsLockedIn(true);

          // Map the restored backend string array into the new SelectedCard state shape
          const restoredRegisters = data.lockedRegisters.map((card: CardType, idx: number) => ({
            card,
            handIndex: idx, // Mock index, as they can't be returned to the hand anyway once locked
          }));

          while (restoredRegisters.length < 5) {
            restoredRegisters.push(null as any);
          }

          setSelection({
            hand: Array(9).fill(null),
            registers: restoredRegisters,
          });
        } else {
          setSelection({
            ...emptySelection(),
            hand: Array.from({ length: 9 }, (_, index) => data.cards[index] ?? null),
          });
        }
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
      // playerId removed from payload
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
