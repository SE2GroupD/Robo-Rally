package com.example.demo.game;

import com.example.demo.model.CardType;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ProgrammingDeck {

    private List<CardType> drawPile;
    private List<CardType> discardPile;
    private List<CardType> currentHand;
    private boolean lockedIn;
    private List<CardType> lockedRegisters;

    public ProgrammingDeck() {
        this.drawPile = new ArrayList<>();
        this.discardPile = new ArrayList<>();
        this.currentHand = new ArrayList<>();
        this.lockedRegisters = new ArrayList<>();
        this.lockedIn = false;
        initializeStandardDeck();
    }

    private void initializeStandardDeck() {
        addCards(CardType.MOVE_1, 4);
        addCards(CardType.MOVE_2, 3);
        addCards(CardType.MOVE_3, 2);
        addCards(CardType.BACK_UP, 2);
        addCards(CardType.TURN_LEFT, 3);
        addCards(CardType.TURN_RIGHT, 3);
        addCards(CardType.U_TURN, 1);
        addCards(CardType.POWER_UP, 1);
        addCards(CardType.AGAIN, 1);

        Collections.shuffle(this.drawPile);
    }

    private void addCards(CardType type, int count) {
        for (int i = 0; i < count; i++) {
            drawPile.add(type);
        }
    }

    public List<CardType> drawCards(int amount) {
        currentHand.clear();
        lockedRegisters.clear();
        lockedIn = false;

        for (int i = 0; i < amount; i++) {
            if (drawPile.isEmpty()) {
                reshuffleDiscardIntoDraw();
            }

            if (!drawPile.isEmpty()) {
                currentHand.add(drawPile.remove(0));
            }
        }
        return new ArrayList<>(currentHand);
    }

    public void addDamageCard(CardType damageType) {
        discardPile.add(damageType);
    }

    public void discardRemainingHand(List<CardType> playedCards) {
        // 1. Create a temporary working copy to validate against
        List<CardType> remainingToDiscard = new ArrayList<>(currentHand);

        // 2. Validate every submitted card
        for (CardType playedCard : playedCards) {
            // .remove(Object) returns false if the item was not in the list
            boolean wasInHand = remainingToDiscard.remove(playedCard);

            if (!wasInHand) {
                // If a card is missing, reject the entire submission immediately.
                // No state changes (like lockedRegisters or discardPile) occur.
                throw new IllegalArgumentException("Invalid submission: Card " + playedCard
                        + " is not in the hand or was submitted too many times.");
            }
        }

        // 3. The submission is cryptographically and logically valid. Commit state
        // changes.
        this.lockedRegisters = new ArrayList<>(playedCards);
        discardPile.addAll(remainingToDiscard);
        currentHand.clear();
        lockedIn = true;
    }

    public void discardPlayedCards(List<CardType> executedCards) {
        discardPile.addAll(executedCards);
    }

    private void reshuffleDiscardIntoDraw() {
        drawPile.addAll(discardPile);
        discardPile.clear();
        Collections.shuffle(drawPile);
    }

    public void prepareForNextRound() {
        discardPile.addAll(lockedRegisters);
        lockedRegisters.clear();
        lockedIn = false;
    }

    // Getters
    public List<CardType> getCurrentHand() {
        return currentHand;
    }

    public int getDrawPileSize() {
        return drawPile.size();
    }

    public int getDiscardPileSize() {
        return discardPile.size();
    }

    public List<CardType> getLockedRegisters() {
        return lockedRegisters;
    }

    public boolean isLockedIn() {
        return lockedIn;
    }
}